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

    print("Vision worker smoke tests passed.")


if __name__ == "__main__":
    main()
