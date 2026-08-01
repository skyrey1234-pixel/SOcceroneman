# Time Machine Phase 2

**Author:** Manus AI

**Replay contract:** `socceroneman.time-machine.v2`

Phase 2 joins approved match footage, compact computer-vision tracks, and the existing soccer-specific tactical reconstruction into one decision-training experience. The coach sees the real evidence window first, the footage freezes at the approved decision moment, and the tactical layer then explains the better action.

## System Map

| Layer | Phase 2 responsibility | Failure behavior |
|---|---|---|
| Vision worker | Samples pose tracks, records normalized observer and nearby-context boxes, and attaches a compact frame window to each candidate event. | The event remains usable without replay frames. |
| Vision callback | Authenticates the worker, normalizes and clamps every incoming frame, and persists replay coverage metrics. | Invalid frames are discarded; the candidate remains pending coach review. |
| Replay endpoint | Requires an authenticated user, checks entity access, and refuses to return a replay unless the event is coach-approved. | Returns a closed error instead of exposing unapproved evidence. |
| Time Machine player | Seeks to the evidence start, plays to the approved decision timestamp, freezes, and selects the closest overlay frame from the playback clock. | Falls back to a keyframe or the tactical reconstruction. |
| Tactical layer | Uses approved event geometry to show the original choice and the better read. | Remains available even when footage or tracked boxes are absent. |

The YouTube implementation uses the official IFrame Player API methods for seeking, playback control, and timeline reads; the player is configured with the page origin as recommended in the API documentation.[1]

## Replay Contract

Each `BlindspotEvent` may contain the following optional fields. Existing events remain valid because every Phase 2 field is backward-compatible.

| Field | Purpose |
|---|---|
| `replay_schema_version` | Identifies the replay payload contract. |
| `replay_status` | Reports `unavailable`, `keyframe`, or `tracked`. |
| `replay_keyframe_seconds` | Stores the approved decision-freeze timestamp. |
| `replay_sample_fps` | Records the worker sampling rate. |
| `replay_note` | States the evidence limitation in plain language. |
| `replay_frames` | Stores a compact, sorted set of normalized overlay frames. |

A replay frame may contain `observer_box`, `context_box`, `track_id`, `observer_confidence`, and `head_direction_proxy`. The secondary box is intentionally named **context** because computer vision alone does not prove that the detection is the missed teammate. The head-direction field is a camera-plane landmark proxy; it is not gaze, identity, or tactical intent.

## Trust States

| Interface label | Evidence requirement | Claim boundary |
|---|---|---|
| **Tracked CV replay** | At least two valid replay frames from the vision worker. | The box follows one pose track during the evidence window. |
| **Coach-marked keyframe** | A coach-marked visual annotation without a tracked sequence. | The selected frame is trusted; intervening motion is not inferred. |
| **Verified evidence keyframe** | A visual annotation without a continuous tracked sequence. | The overlay is anchored only to the evidence moment. |
| **Tactical reconstruction** | Approved event geometry without visual boxes. | The pitch view teaches the decision but is not presented as measured player motion. |

## Coach Workflow

The coach approves a blindspot, selects **Enter Time Machine**, and waits for the approval-gated replay payload. **Run play** starts at the beginning of the evidence window and stops on the decision frame. **Reveal the open man** then exposes the approved better option in the video overlay where available and in the tactical reconstruction. **Replay** returns both layers to the evidence start.

Legacy approved events work immediately. Events with a video but no tracked boxes still receive the real-footage freeze plus the labeled tactical reconstruction. New analyses produced by the Phase 2 worker receive tracked overlays automatically.

## Operations

Set `VISION_MAX_REPLAY_FRAMES` to cap the number of persisted frames per event; the default is `32`, while the callback and client independently enforce an upper bound of `80`. Keep `VISION_SAMPLE_FPS` appropriate for the available compute and footage duration. After updating the worker, restart its existing managed service and confirm that `/healthz` reports `socceroneman.time-machine.v2`.

Use the following validation commands before deployment:

```bash
npm test
npm run test:vision
npm run lint
npm run typecheck
npm run build
```

The frontend unit suite verifies frame normalization, sorting, nearest-frame selection, replay windows, trust labels, and fallback behavior. The worker smoke suite verifies the health contract, authorization boundary, compact replay attachment, frame limiting, and language that avoids overstating computer-vision evidence.

## References

[1]: https://developers.google.com/youtube/iframe_api_reference "YouTube IFrame Player API Reference"
