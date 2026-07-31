"""SOcceroneman Vision Worker.

This is an asynchronous, CPU-safe pilot worker for visual evidence. It uses MediaPipe
Pose Landmarker to derive human pose boxes and a camera-plane head-direction proxy.
It never claims to measure a player's true visual field or tactical intent.
"""

from __future__ import annotations

import hashlib
import ipaddress
import json
import logging
import math
import os
import secrets
import shutil
import socket
import subprocess
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import urlparse
from urllib.request import urlretrieve

import cv2
import mediapipe as mp
import numpy as np
import requests
from fastapi import FastAPI, Header, HTTPException, Request, status
from pydantic import BaseModel, Field, HttpUrl


APP_NAME = "SOcceroneman Vision Worker"
APP_VERSION = "0.1.0-pilot"
ROOT = Path(os.getenv("VISION_WORKER_ROOT", "/var/lib/socceroneman-vision"))
MODEL_DIR = ROOT / "models"
JOB_DIR = ROOT / "jobs"
POSE_MODEL_PATH = MODEL_DIR / "pose_landmarker_lite.task"
POSE_MODEL_URL = os.getenv(
    "VISION_POSE_MODEL_URL",
    "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
)
PROVIDER_TOKEN = os.getenv("VISION_PROVIDER_TOKEN", "")
MAX_DURATION_SECONDS = int(os.getenv("VISION_MAX_DURATION_SECONDS", "900"))
SAMPLE_FPS = float(os.getenv("VISION_SAMPLE_FPS", "1"))
MAX_EVENTS = int(os.getenv("VISION_MAX_EVENTS", "40"))
MAX_DOWNLOAD_BYTES = int(os.getenv("VISION_MAX_DOWNLOAD_BYTES", str(1536 * 1024 * 1024)))
MAX_CONCURRENT_JOBS = int(os.getenv("VISION_MAX_CONCURRENT_JOBS", "1"))
ALLOWED_HOSTS = {host.strip().lower() for host in os.getenv("VISION_ALLOWED_HOSTS", "").split(",") if host.strip()}
CALLBACK_ALLOWED_HOSTS = {
    host.strip().lower()
    for host in os.getenv("VISION_CALLBACK_ALLOWED_HOSTS", "").split(",")
    if host.strip()
}

logging.basicConfig(
    level=os.getenv("VISION_LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
logger = logging.getLogger("socceroneman.vision")

app = FastAPI(title=APP_NAME, version=APP_VERSION, docs_url=None, redoc_url=None)
executor = ThreadPoolExecutor(max_workers=max(1, MAX_CONCURRENT_JOBS), thread_name_prefix="vision-job")
jobs: dict[str, dict[str, Any]] = {}
jobs_lock = threading.Lock()
model_lock = threading.Lock()


class MatchPayload(BaseModel):
    id: str = Field(min_length=1, max_length=160)
    title: str = "Untitled match"
    footage_url: HttpUrl
    footage_type: str = Field(pattern="^(youtube|file)$")
    camera_type: str = "broadcast"


class JobRequest(BaseModel):
    job_id: str = Field(min_length=1, max_length=160)
    match: MatchPayload
    callback_url: HttpUrl
    callback_secret: str = Field(min_length=16, max_length=512)


@dataclass
class TrackSnapshot:
    track_id: str
    box: dict[str, float]
    head_offset: float
    confidence: float
    timestamp: float


def now_iso() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def normalized_box(points: list[tuple[float, float]], width: int, height: int) -> dict[str, float] | None:
    usable = [(x, y) for x, y in points if math.isfinite(x) and math.isfinite(y)]
    if len(usable) < 4 or width <= 0 or height <= 0:
        return None
    xs = [point[0] for point in usable]
    ys = [point[1] for point in usable]
    x1, x2 = max(0.0, min(xs)), min(float(width), max(xs))
    y1, y2 = max(0.0, min(ys)), min(float(height), max(ys))
    if x2 - x1 < 8 or y2 - y1 < 8:
        return None
    padding_x = (x2 - x1) * 0.12
    padding_y = (y2 - y1) * 0.12
    x1 = max(0.0, x1 - padding_x)
    y1 = max(0.0, y1 - padding_y)
    x2 = min(float(width), x2 + padding_x)
    y2 = min(float(height), y2 + padding_y)
    return {
        "x": round(x1 / width, 5),
        "y": round(y1 / height, 5),
        "width": round((x2 - x1) / width, 5),
        "height": round((y2 - y1) / height, 5),
    }


def iou(a: dict[str, float], b: dict[str, float]) -> float:
    ax2, ay2 = a["x"] + a["width"], a["y"] + a["height"]
    bx2, by2 = b["x"] + b["width"], b["y"] + b["height"]
    ix1, iy1 = max(a["x"], b["x"]), max(a["y"], b["y"])
    ix2, iy2 = min(ax2, bx2), min(ay2, by2)
    intersection = max(0.0, ix2 - ix1) * max(0.0, iy2 - iy1)
    union = a["width"] * a["height"] + b["width"] * b["height"] - intersection
    return intersection / union if union > 0 else 0.0


def nearest_context_box(subject: dict[str, float], candidates: list[dict[str, float]]) -> dict[str, float] | None:
    sx = subject["x"] + subject["width"] / 2
    sy = subject["y"] + subject["height"] / 2
    ranked: list[tuple[float, dict[str, float]]] = []
    for box in candidates:
        if box == subject:
            continue
        bx = box["x"] + box["width"] / 2
        by = box["y"] + box["height"] / 2
        ranked.append((((sx - bx) ** 2 + (sy - by) ** 2) ** 0.5, box))
    return min(ranked, default=(None, None), key=lambda item: item[0])[1]


def validate_public_url(value: str, allowed_hosts: set[str], require_https: bool = False) -> None:
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.hostname:
        raise ValueError("Footage and callback URLs must be public HTTP(S) URLs.")
    if require_https and parsed.scheme != "https":
        raise ValueError("The vision callback URL must use HTTPS in production.")
    hostname = parsed.hostname.lower()
    if allowed_hosts and hostname not in allowed_hosts and not any(hostname.endswith(f".{host}") for host in allowed_hosts):
        raise ValueError("The URL host is not allowed by this vision worker.")
    if hostname in {"localhost", "localhost.localdomain"}:
        raise ValueError("Local URLs are not allowed.")
    try:
        answers = socket.getaddrinfo(hostname, None)
        for answer in answers:
            candidate = ipaddress.ip_address(answer[4][0])
            if candidate.is_private or candidate.is_loopback or candidate.is_link_local or candidate.is_reserved:
                raise ValueError("Private-network URLs are not allowed.")
    except socket.gaierror as error:
        raise ValueError("The supplied URL host cannot be resolved.") from error


def ensure_model() -> Path:
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    if POSE_MODEL_PATH.exists() and POSE_MODEL_PATH.stat().st_size > 100_000:
        return POSE_MODEL_PATH
    with model_lock:
        if POSE_MODEL_PATH.exists() and POSE_MODEL_PATH.stat().st_size > 100_000:
            return POSE_MODEL_PATH
        logger.info("Downloading MediaPipe pose model to %s", POSE_MODEL_PATH)
        temporary = POSE_MODEL_PATH.with_suffix(".download")
        urlretrieve(POSE_MODEL_URL, temporary)
        if temporary.stat().st_size < 100_000:
            temporary.unlink(missing_ok=True)
            raise RuntimeError("Downloaded pose model is unexpectedly small.")
        temporary.replace(POSE_MODEL_PATH)
    return POSE_MODEL_PATH


def ffprobe_duration(path: Path) -> float:
    result = subprocess.run(
        [
            "ffprobe", "-v", "error", "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1", str(path),
        ],
        capture_output=True,
        text=True,
        check=False,
        timeout=30,
    )
    if result.returncode != 0:
        raise RuntimeError("The worker could not read the video duration.")
    try:
        duration = float(result.stdout.strip())
    except ValueError as error:
        raise RuntimeError("The worker received a video with no usable duration.") from error
    if not math.isfinite(duration) or duration <= 0:
        raise RuntimeError("The worker received a video with no usable duration.")
    return duration


def download_file(url: str, destination: Path) -> None:
    headers = {"User-Agent": "SOcceroneman-VisionWorker/0.1"}
    with requests.get(url, stream=True, timeout=(10, 90), headers=headers) as response:
        response.raise_for_status()
        expected = int(response.headers.get("content-length") or 0)
        if expected and expected > MAX_DOWNLOAD_BYTES:
            raise RuntimeError("The uploaded video exceeds the worker download limit.")
        total = 0
        with destination.open("wb") as stream:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if not chunk:
                    continue
                total += len(chunk)
                if total > MAX_DOWNLOAD_BYTES:
                    raise RuntimeError("The uploaded video exceeds the worker download limit.")
                stream.write(chunk)
    if destination.stat().st_size < 1_000:
        raise RuntimeError("The downloaded footage is empty or inaccessible.")


def download_youtube(url: str, destination: Path) -> None:
    command = [
        "yt-dlp",
        "--no-playlist",
        "--no-warnings",
        "--restrict-filenames",
        "--max-filesize", f"{MAX_DOWNLOAD_BYTES}",
        "-f", "best[height<=720][ext=mp4]/best[height<=720]/best",
        "-o", str(destination.with_suffix(".%(ext)s")),
        url,
    ]
    result = subprocess.run(command, capture_output=True, text=True, timeout=300, check=False)
    if result.returncode != 0:
        safe_detail = (result.stderr or result.stdout or "yt-dlp failed").strip().splitlines()[-1][:300]
        raise RuntimeError(f"The worker could not retrieve the public YouTube footage: {safe_detail}")
    produced = sorted(destination.parent.glob(f"{destination.stem}.*"), key=lambda p: p.stat().st_mtime, reverse=True)
    produced = [item for item in produced if item.suffix.lower() not in {".part", ".ytdl"}]
    if not produced:
        raise RuntimeError("The YouTube worker did not produce a playable video file.")
    produced[0].replace(destination)


def pose_records(frame_rgb: np.ndarray, landmarker: Any) -> list[dict[str, Any]]:
    height, width = frame_rgb.shape[:2]
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
    # Video timestamp is provided by the caller in `detect_for_video`; this function is called via wrapper.
    raise RuntimeError("pose_records must be called by pose_records_at_time")


def pose_records_at_time(frame_rgb: np.ndarray, timestamp_ms: int, landmarker: Any) -> list[dict[str, Any]]:
    height, width = frame_rgb.shape[:2]
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
    result = landmarker.detect_for_video(mp_image, timestamp_ms)
    records: list[dict[str, Any]] = []
    for landmarks in result.pose_landmarks or []:
        if len(landmarks) <= 12:
            continue
        points = [(landmark.x * width, landmark.y * height) for landmark in landmarks]
        box = normalized_box(points, width, height)
        if not box:
            continue
        nose = landmarks[0]
        left_shoulder = landmarks[11]
        right_shoulder = landmarks[12]
        shoulder_mid_x = (left_shoulder.x + right_shoulder.x) / 2
        shoulder_span = abs(left_shoulder.x - right_shoulder.x)
        if shoulder_span < 0.015:
            continue
        # This is explicitly a 2D camera-plane proxy, not true yaw or field of view.
        head_offset = max(-1.5, min(1.5, (nose.x - shoulder_mid_x) / shoulder_span))
        visibility = [getattr(landmark, "visibility", 0.5) or 0.5 for landmark in landmarks]
        confidence = float(sum(visibility) / len(visibility))
        records.append({"box": box, "head_offset": head_offset, "confidence": confidence})
    return records


def assign_tracks(previous: list[TrackSnapshot], current: list[dict[str, Any]], timestamp: float, next_track: int) -> tuple[list[TrackSnapshot], int]:
    assigned: list[TrackSnapshot] = []
    unmatched_previous = previous[:]
    for record in current:
        best_index, best_score = None, 0.0
        for index, old in enumerate(unmatched_previous):
            score = iou(old.box, record["box"])
            if score > best_score:
                best_index, best_score = index, score
        if best_index is not None and best_score >= 0.18:
            old = unmatched_previous.pop(best_index)
            track_id = old.track_id
        else:
            track_id = f"track-{next_track}"
            next_track += 1
        assigned.append(
            TrackSnapshot(
                track_id=track_id,
                box=record["box"],
                head_offset=float(record["head_offset"]),
                confidence=float(record["confidence"]),
                timestamp=timestamp,
            )
        )
    return assigned, next_track


def make_candidate_event(current: TrackSnapshot, previous: TrackSnapshot, contexts: list[dict[str, float]]) -> dict[str, Any] | None:
    shift = abs(current.head_offset - previous.head_offset)
    # Avoid noisy candidates. This threshold only marks a notable 2D proxy change.
    if shift < 0.55 or current.confidence < 0.35:
        return None
    context = nearest_context_box(current.box, contexts)
    confidence = max(0.35, min(0.8, 0.35 + (current.confidence * 0.35) + min(shift, 1.2) * 0.15))
    proxy_quality = max(0.15, min(0.85, 1 - min(abs(current.head_offset), 1) * 0.5))
    return {
        "timestamp_seconds": round(current.timestamp, 2),
        "evidence_start_seconds": round(max(0, previous.timestamp - 2), 2),
        "evidence_end_seconds": round(current.timestamp + 3, 2),
        "observer_box": current.box,
        "missed_player_box": context,
        "confidence": round(confidence, 3),
        "severity": round(max(0.3, min(0.7, 0.28 + shift * 0.28)), 3),
        "scan_quality": round(proxy_quality, 3),
        "angle_deg": round(max(-90, min(90, current.head_offset * 45)), 1),
        "vision_track_id": current.track_id,
        "phase": "progression",
        "what_went_right": "A pose-based tracking signal is available for coach review.",
        "what_went_wrong": "A notable camera-plane head-direction proxy change was detected. It is not a confirmed tactical blindspot.",
        "feedback": "Computer-vision candidate: review the highlighted tracked player and nearby context before treating this as a coaching finding.",
        "evidence_note": (
            "MediaPipe Pose Landmarker generated a 2D camera-plane head-direction proxy from nose and shoulder keypoints. "
            "The primary box is the tracked player. The secondary box, if shown, is nearby visual context only — not a verified missed runner, teammate, or opponent."
        ),
    }


def analyze_video(video_path: Path) -> dict[str, Any]:
    duration = ffprobe_duration(video_path)
    if duration > MAX_DURATION_SECONDS:
        raise RuntimeError(
            f"This pilot worker accepts footage up to {MAX_DURATION_SECONDS // 60} minutes. Split the match into clips or use the production GPU worker."
        )

    model_path = ensure_model()
    base_options = mp.tasks.BaseOptions(model_asset_path=str(model_path))
    options = mp.tasks.vision.PoseLandmarkerOptions(
        base_options=base_options,
        running_mode=mp.tasks.vision.RunningMode.VIDEO,
        num_poses=22,
        min_pose_detection_confidence=0.45,
        min_pose_presence_confidence=0.45,
        min_tracking_confidence=0.45,
    )

    cap = cv2.VideoCapture(str(video_path))
    if not cap.isOpened():
        raise RuntimeError("The worker could not decode this video file.")
    source_fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT) or 0)
    sample_every = max(1, int(round(source_fps / max(SAMPLE_FPS, 0.1))))

    events: list[dict[str, Any]] = []
    previous_tracks: list[TrackSnapshot] = []
    last_by_track: dict[str, TrackSnapshot] = {}
    emitted_track_times: dict[str, float] = {}
    processed = 0
    frame_index = 0
    next_track = 1
    confidences: list[float] = []

    try:
        with mp.tasks.vision.PoseLandmarker.create_from_options(options) as landmarker:
            while True:
                ok, frame_bgr = cap.read()
                if not ok:
                    break
                if frame_index % sample_every != 0:
                    frame_index += 1
                    continue
                timestamp = frame_index / source_fps
                if timestamp > duration:
                    break
                frame_rgb = cv2.cvtColor(frame_bgr, cv2.COLOR_BGR2RGB)
                records = pose_records_at_time(frame_rgb, int(timestamp * 1000), landmarker)
                current_tracks, next_track = assign_tracks(previous_tracks, records, timestamp, next_track)
                context_boxes = [track.box for track in current_tracks]
                for current in current_tracks:
                    prior = last_by_track.get(current.track_id)
                    last_by_track[current.track_id] = current
                    confidences.append(current.confidence)
                    if not prior or len(events) >= MAX_EVENTS:
                        continue
                    if current.timestamp - emitted_track_times.get(current.track_id, -999) < 8:
                        continue
                    candidate = make_candidate_event(current, prior, context_boxes)
                    if candidate:
                        events.append(candidate)
                        emitted_track_times[current.track_id] = current.timestamp
                previous_tracks = current_tracks
                processed += 1
                frame_index += 1
    finally:
        cap.release()

    confidence = float(sum(confidences) / len(confidences)) if confidences else 0.0
    artifact = {
        "schema": "socceroneman.vision-result.v1",
        "model_name": "MediaPipe Pose Landmarker",
        "model_version": "lite-task",
        "sample_fps": SAMPLE_FPS,
        "source_fps": source_fps,
        "video_duration_seconds": round(duration, 2),
        "source_frame_count": frame_count,
        "sampled_frames": processed,
        "overall_confidence": round(confidence, 3),
        "events": events,
        "scope_note": "Pose boxes and head-direction proxy are computer-vision candidates only; coach review is required.",
    }
    return artifact


def post_callback(callback_url: str, callback_secret: str, body: dict[str, Any]) -> None:
    headers = {
        "Content-Type": "application/json",
        "x-socceroneman-vision-secret": callback_secret,
        "User-Agent": "SOcceroneman-VisionWorker/0.1",
    }
    last_error: Exception | None = None
    for attempt in range(3):
        try:
            response = requests.post(callback_url, headers=headers, json=body, timeout=(10, 60))
            if response.ok:
                return
            last_error = RuntimeError(f"Callback returned HTTP {response.status_code}: {response.text[:200]}")
        except requests.RequestException as error:
            last_error = error
        time.sleep(2 ** attempt)
    raise RuntimeError(f"Could not deliver the vision callback: {last_error}")


def job_state(job_id: str, **updates: Any) -> None:
    with jobs_lock:
        jobs.setdefault(job_id, {}).update(updates)


def process_job(request_data: JobRequest, worker_job_id: str) -> None:
    work_dir = JOB_DIR / worker_job_id
    footage_path = work_dir / "footage.mp4"
    artifact_path = work_dir / "result.json"
    payload = request_data.model_dump(mode="json")
    job_state(worker_job_id, status="processing", started_at=now_iso())
    try:
        work_dir.mkdir(parents=True, exist_ok=False)
        job_state(worker_job_id, progress="downloading footage")
        footage_url = str(request_data.match.footage_url)
        if request_data.match.footage_type == "youtube":
            download_youtube(footage_url, footage_path)
        else:
            download_file(footage_url, footage_path)

        job_state(worker_job_id, progress="running pose analysis")
        result = analyze_video(footage_path)
        artifact_path.write_text(json.dumps(result, separators=(",", ":")), encoding="utf-8")
        result_hash = hashlib.sha256(artifact_path.read_bytes()).hexdigest()
        callback_payload = {
            "job_id": request_data.job_id,
            "status": "complete",
            "model_name": result["model_name"],
            "model_version": result["model_version"],
            "sample_fps": result["sample_fps"],
            "video_duration_seconds": result["video_duration_seconds"],
            "overall_confidence": result["overall_confidence"],
            "events": result["events"],
            "result_hash": result_hash,
        }
        job_state(worker_job_id, progress="sending coach-review candidates")
        post_callback(str(request_data.callback_url), request_data.callback_secret, callback_payload)
        job_state(worker_job_id, status="complete", completed_at=now_iso(), events=len(result["events"]))
    except Exception as error:  # The callback must receive a clear failure state.
        message = str(error)[:500]
        logger.exception("Vision job %s failed", worker_job_id)
        job_state(worker_job_id, status="failed", completed_at=now_iso(), error=message)
        try:
            post_callback(
                str(request_data.callback_url),
                request_data.callback_secret,
                {"job_id": request_data.job_id, "status": "failed", "error": message},
            )
        except Exception:
            logger.exception("Failed to report vision-job failure for %s", worker_job_id)
    finally:
        # Never retain source footage or frame data on this small pilot server.
        shutil.rmtree(work_dir, ignore_errors=True)


def authorize(authorization: str | None) -> None:
    if not PROVIDER_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="VISION_PROVIDER_TOKEN is not configured on the worker.",
        )
    expected = f"Bearer {PROVIDER_TOKEN}"
    if not authorization or not secrets.compare_digest(authorization, expected):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")


@app.get("/healthz")
def health() -> dict[str, Any]:
    return {
        "ok": True,
        "service": APP_NAME,
        "version": APP_VERSION,
        "engine": "MediaPipe Pose Landmarker",
        "configured": bool(PROVIDER_TOKEN),
        "max_duration_seconds": MAX_DURATION_SECONDS,
        "sample_fps": SAMPLE_FPS,
        "active_jobs": sum(1 for job in jobs.values() if job.get("status") in {"queued", "processing"}),
    }


@app.post("/v1/jobs", status_code=status.HTTP_202_ACCEPTED)
def create_job(payload: JobRequest, authorization: str | None = Header(default=None)) -> dict[str, Any]:
    authorize(authorization)
    if not payload.match.footage_url:
        raise HTTPException(status_code=400, detail="A playable video URL is required.")
    try:
        # YouTube URLs are intentionally allowlisted even when file-host configuration is broad.
        if payload.match.footage_type == "youtube":
            validate_public_url(str(payload.match.footage_url), {"youtube.com", "youtu.be", "www.youtube.com", "m.youtube.com"})
        else:
            validate_public_url(str(payload.match.footage_url), ALLOWED_HOSTS)
        validate_public_url(str(payload.callback_url), CALLBACK_ALLOWED_HOSTS, require_https=os.getenv("VISION_ALLOW_HTTP_CALLBACK", "false").lower() != "true")
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error

    worker_job_id = f"vision-{uuid.uuid4().hex}"
    job_state(
        worker_job_id,
        job_id=payload.job_id,
        status="queued",
        queued_at=now_iso(),
        match_id=payload.match.id,
        match_title=payload.match.title[:160],
    )
    executor.submit(process_job, payload, worker_job_id)
    return {"job_id": worker_job_id, "status": "queued", "engine": "mediapipe-pose"}


@app.get("/v1/jobs/{worker_job_id}")
def get_job(worker_job_id: str, authorization: str | None = Header(default=None)) -> dict[str, Any]:
    authorize(authorization)
    with jobs_lock:
        job = jobs.get(worker_job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Unknown job")
    return {"job_id": worker_job_id, **job}


@app.on_event("startup")
def startup() -> None:
    ROOT.mkdir(parents=True, exist_ok=True)
    MODEL_DIR.mkdir(parents=True, exist_ok=True)
    JOB_DIR.mkdir(parents=True, exist_ok=True)
    logger.info("%s %s starting; pilot limits: %ss max, %.2f fps, %s workers", APP_NAME, APP_VERSION, MAX_DURATION_SECONDS, SAMPLE_FPS, MAX_CONCURRENT_JOBS)


@app.on_event("shutdown")
def shutdown() -> None:
    executor.shutdown(wait=False, cancel_futures=True)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=os.getenv("VISION_BIND_HOST", "127.0.0.1"), port=int(os.getenv("VISION_PORT", "8123")))
