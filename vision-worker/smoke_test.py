"""Local smoke checks for the SOcceroneman vision-worker contract.

This intentionally does not download third-party footage or invoke Base44. It verifies the
worker starts, exposes its health contract, rejects unauthenticated job requests, and keeps
its pose-derived evidence language within the stated coach-review boundary.
"""

from fastapi.testclient import TestClient

import app as worker


def main() -> None:
    client = TestClient(worker.app)
    health = client.get("/healthz")
    assert health.status_code == 200, health.text
    payload = health.json()
    assert payload["ok"] is True
    assert payload["engine"] == "MediaPipe Pose Landmarker"
    assert payload["replay_schema_version"] == worker.REPLAY_SCHEMA_VERSION
    assert payload["max_replay_frames_per_event"] == worker.MAX_REPLAY_FRAMES

    unauthorized = client.post(
        "/v1/jobs",
        json={
            "job_id": "smoke-analysis-id",
            "match": {
                "id": "smoke-match-id",
                "title": "Smoke match",
                "footage_url": "https://example.com/footage.mp4",
                "footage_type": "file",
                "camera_type": "broadcast",
            },
            "callback_url": "https://example.com/functions/vision-callback",
            "callback_secret": "x" * 32,
        },
    )
    assert unauthorized.status_code == 503, unauthorized.text

    previous = worker.TrackSnapshot(
        track_id="track-1",
        box={"x": 0.1, "y": 0.2, "width": 0.2, "height": 0.4},
        head_offset=-0.8,
        confidence=0.8,
        timestamp=10.0,
    )
    current = worker.TrackSnapshot(
        track_id="track-1",
        box={"x": 0.11, "y": 0.2, "width": 0.2, "height": 0.4},
        head_offset=0.25,
        confidence=0.8,
        timestamp=11.0,
    )
    event = worker.make_candidate_event(current, previous, [current.box])
    assert event is not None
    assert event["observer_box"] == current.box
    assert "not a confirmed tactical blindspot" in event["what_went_wrong"]
    assert "review" in event["feedback"].lower()

    context_box = {"x": 0.6, "y": 0.25, "width": 0.16, "height": 0.35}
    timeline = {
        "track-1": [
            previous.as_replay_frame(context_box),
            current.as_replay_frame(context_box),
        ]
    }
    replay_event = worker.attach_replay_frames(event, timeline)
    assert replay_event["replay_schema_version"] == worker.REPLAY_SCHEMA_VERSION
    assert replay_event["replay_status"] == "tracked"
    assert len(replay_event["replay_frames"]) == 2
    assert replay_event["replay_frames"][0]["context_box"] == context_box
    assert "not gaze" in replay_event["replay_note"]

    many_frames = [
        {"timestamp_seconds": float(index), "observer_box": previous.box}
        for index in range(worker.MAX_REPLAY_FRAMES + 15)
    ]
    limited = worker.limited_replay_frames(many_frames)
    assert len(limited) == worker.MAX_REPLAY_FRAMES
    assert limited[0]["timestamp_seconds"] == 0.0
    assert limited[-1]["timestamp_seconds"] == float(len(many_frames) - 1)

    print("Vision worker smoke tests passed.")


if __name__ == "__main__":
    main()
