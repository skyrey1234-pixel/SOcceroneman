# SOcceroneman Vision Worker

This service is the **external computer-vision layer** for SOcceroneman. It receives an authenticated match-analysis request from a Base44 backend function, analyzes a short video asynchronously, and returns normalized evidence candidates through a signed callback.

> **This is a coach-review evidence tool, not a tactical truth engine.** The pilot detects body-pose keypoints, derives normalized player boxes, tracks those boxes across sampled frames, and calculates a camera-plane head-direction proxy from the nose and shoulders. It does not know a player’s identity, team, exact field of view, or tactical intent from generic broadcast footage. Every returned event remains pending until a coach approves it.

## What it supports now

| Capability | Pilot behavior |
|---|---|
| **Real pose inference** | Uses the Apache-2.0 MediaPipe Pose Landmarker, a real keypoint model, rather than asking an LLM to invent boxes. |
| **Bounding boxes** | Generates normalized boxes for the tracked player and nearby visual context, which the Base44 app can overlay on uploaded/direct video. |
| **Timestamped evidence** | Returns an evidence window and timestamp for every candidate so the app can seek to it. |
| **Async jobs** | Accepts the job immediately and processes it in a single worker thread to prevent the small CPU machine from being overloaded. |
| **Coach safety** | Labels all results as candidates and returns a clear provenance note. The app keeps them out of drills, reports, and opponent patterns until approval. |

## Intentional limits

The initial worker is deliberately limited to **15-minute clips at 1 sample per second** and one concurrent job. It is a proof-of-concept for uploaded clips, not a full-match or real-time processing cluster. Broadcast footage with tiny, occluded players can produce weak pose detections. For a full-match commercial product, preserve this API contract but move the engine to GPU-backed infrastructure and evaluate it on annotated soccer footage.

YouTube is accepted only when `yt-dlp` can access a public video. The worker follows the availability rules of the source platform and does not bypass access controls. The Base44 UI can deep-link to YouTube timestamps, but it does not draw visual boxes across a cross-origin YouTube iframe. Base44-uploaded direct video can display boxes as an overlay.

## Request and callback contract

Base44 calls `POST /v1/jobs` with a Bearer provider token:

```json
{
  "job_id": "base44-vision-analysis-id",
  "match": {
    "id": "match-id",
    "title": "U15 vs Example FC",
    "footage_url": "https://...",
    "footage_type": "file",
    "camera_type": "broadcast"
  },
  "callback_url": "https://your-base44-app/functions/vision-callback",
  "callback_secret": "shared-secret-stored-server-side"
}
```

The worker posts either a `complete` payload with normalized event boxes or a `failed` payload to the callback. It never sends the source footage back and deletes temporary source files and result artifacts after processing.

## Local development

Use Python 3.11 where possible. Install FFmpeg and `yt-dlp` if YouTube pilot support is needed.

```bash
cd vision-worker
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Set the variables in .env, then export them or use a process manager that reads the file.
set -a && . ./.env && set +a
python app.py
```

Verify the service without exposing operational details:

```bash
curl http://127.0.0.1:8123/healthz
```

## Cloud Computer deployment

The service should be installed on a persistent machine only after you have a secure public HTTPS reverse-proxy route. Bind the Python process to `127.0.0.1`; do not open port 8123 through UFW.

```bash
sudo useradd --system --create-home --shell /usr/sbin/nologin vision
sudo mkdir -p /opt/socceroneman /var/lib/socceroneman-vision
sudo cp -R vision-worker /opt/socceroneman/vision-worker
sudo chown -R vision:vision /opt/socceroneman/vision-worker /var/lib/socceroneman-vision
sudo -u vision python3 -m venv /opt/socceroneman/vision-worker/.venv
sudo -u vision /opt/socceroneman/vision-worker/.venv/bin/pip install -r /opt/socceroneman/vision-worker/requirements.txt
sudo install -m 600 vision-worker/.env.example /etc/socceroneman-vision.env
sudoedit /etc/socceroneman-vision.env
sudo install -m 644 vision-worker/deploy/socceroneman-vision.service /etc/systemd/system/socceroneman-vision.service
sudo systemctl daemon-reload
sudo systemctl enable --now socceroneman-vision
```

Once the service is healthy, use an existing authenticated HTTPS reverse proxy to route a narrow path such as `/socceroneman-vision/` to `http://127.0.0.1:8123/`. The proxy should enforce the same Bearer token or at minimum forward it untouched. Do not expose an unprotected service or a raw unauthenticated port.

## Required Base44 configuration

Set these **server-side secrets** in Base44 before clicking “Run computer-vision analysis”:

| Secret | Purpose |
|---|---|
| `VISION_PROVIDER_URL` | Public HTTPS worker endpoint, for example `https://api.example.com/socceroneman-vision/v1/jobs`. |
| `VISION_PROVIDER_TOKEN` | Long random Bearer token that matches the worker’s `VISION_PROVIDER_TOKEN`. |
| `VISION_CALLBACK_SECRET` | Independent long random secret sent only from the Base44 job function to the worker and returned as the signed callback header. |

Set the worker’s `VISION_CALLBACK_ALLOWED_HOSTS` to the exact Base44 hostname used by the callback. Set `VISION_ALLOWED_HOSTS` to the exact Base44 file-storage host for direct videos. Do not leave allowlists open after pilot testing.

## Production hardening checklist

The host must use HTTPS, an authenticated endpoint, strict host allowlists, disk/time limits, single-job concurrency on the pilot server, and automatic restart through systemd. Verify every new dependency’s model and distribution license before a public commercial release. The current worker’s MediaPipe code is Apache-2.0; a future soccer-specific model has its own license and must be reviewed separately.

## Architecture references

- [MediaPipe Pose Landmarker Python guide](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/python)
- [MediaPipe source and Apache-2.0 license](https://github.com/google-ai-edge/mediapipe)
- [MMPose source and Apache-2.0 license](https://github.com/open-mmlab/mmpose)
- [RTMPose paper](https://arxiv.org/abs/2303.07399)
