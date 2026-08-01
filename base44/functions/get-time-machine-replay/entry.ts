import { createClientFromRequest } from "npm:@base44/sdk";

const numberOr = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp = (value: unknown, min: number, max: number, fallback = min) =>
  Math.max(min, Math.min(max, numberOr(value, fallback)));

function normalizedBox(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const box = value as Record<string, unknown>;
  const x = clamp(box.x, 0, 1, 0);
  const y = clamp(box.y, 0, 1, 0);
  const width = clamp(box.width, 0, 1 - x, 0);
  const height = clamp(box.height, 0, 1 - y, 0);
  if (width <= 0 || height <= 0) return null;
  return { x, y, width, height };
}

function replayFrame(value: unknown, start: number, end: number) {
  if (!value || typeof value !== "object") return null;
  const frame = value as Record<string, unknown>;
  const observerBox = normalizedBox(frame.observer_box);
  const contextBox = normalizedBox(frame.context_box);
  if (!observerBox && !contextBox) return null;

  return {
    timestamp_seconds: clamp(frame.timestamp_seconds, start, end, start),
    track_id: typeof frame.track_id === "string" ? frame.track_id.slice(0, 120) : "",
    observer_box: observerBox,
    context_box: contextBox,
    head_direction_proxy: clamp(frame.head_direction_proxy, -1.5, 1.5, 0),
    observer_confidence: clamp(frame.observer_confidence, 0, 1, 0),
  };
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Authentication required." }, { status: 401 });

    const input = await req.json();
    const eventId = typeof input?.eventId === "string" ? input.eventId.trim() : "";
    if (!eventId) return Response.json({ error: "eventId is required." }, { status: 400 });

    const event = await base44.entities.BlindspotEvent.get(eventId);
    if (!event) return Response.json({ error: "Time Machine evidence was not found." }, { status: 404 });
    if (event.review_status !== "approved") {
      return Response.json(
        { error: "A coach must approve this blindspot before Time Machine evidence can open." },
        { status: 403 }
      );
    }

    const match = await base44.entities.Match.get(event.match_id);
    if (!match) return Response.json({ error: "The linked match is unavailable." }, { status: 404 });

    const timestamp = Math.max(0, numberOr(event.replay_keyframe_seconds, numberOr(event.timestamp_seconds)));
    const start = Math.max(0, numberOr(event.evidence_start_seconds, timestamp - 4));
    const end = Math.max(timestamp, numberOr(event.evidence_end_seconds, timestamp + 6));
    const frames = (Array.isArray(event.replay_frames) ? event.replay_frames : [])
      .slice(0, 80)
      .map((frame: unknown) => replayFrame(frame, start, end))
      .filter((frame): frame is NonNullable<ReturnType<typeof replayFrame>> => frame !== null)
      .sort((a, b) => a.timestamp_seconds - b.timestamp_seconds);

    const response = {
      schema: "socceroneman.time-machine-response.v2",
      match: {
        id: match.id,
        title: match.title || "Match review",
        footage_type: match.footage_type || (match.youtube_url ? "youtube" : "file"),
        video_url: typeof match.video_url === "string" ? match.video_url : "",
        youtube_url: typeof match.youtube_url === "string" ? match.youtube_url : "",
        video_duration_seconds: Math.max(0, numberOr(match.video_duration_seconds)),
      },
      event: {
        id: event.id,
        match_id: event.match_id,
        observer_player: event.observer_player ?? null,
        missed_player: event.missed_player ?? null,
        timestamp_seconds: timestamp,
        evidence_start_seconds: start,
        evidence_end_seconds: end,
        evidence_source: event.evidence_source || "ai_draft",
        evidence_confidence: event.evidence_confidence ?? null,
        evidence_note: event.evidence_note || "",
        annotation_state: event.annotation_state || "none",
        observer_box: normalizedBox(event.observer_box),
        missed_player_box: normalizedBox(event.missed_player_box),
        replay_schema_version: event.replay_schema_version || "",
        replay_status: event.replay_status || (frames.length >= 2 ? "tracked" : frames.length ? "keyframe" : "unavailable"),
        replay_keyframe_seconds: timestamp,
        replay_sample_fps: Math.max(0, numberOr(event.replay_sample_fps)),
        replay_note: event.replay_note || "",
        replay_frames: frames,
        vision_track_id: event.vision_track_id || "",
        pitch_x: event.pitch_x ?? null,
        pitch_y: event.pitch_y ?? null,
        angle_deg: event.angle_deg ?? null,
        distance_m: event.distance_m ?? null,
        phase: event.phase || "progression",
        feedback: event.feedback || "",
        what_went_right: event.what_went_right || "",
        what_went_wrong: event.what_went_wrong || "",
        review_status: "approved",
      },
    };

    return Response.json(response, {
      headers: {
        "Cache-Control": "private, no-store, max-age=0",
        Pragma: "no-cache",
      },
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not load Time Machine evidence." },
      { status: 500 }
    );
  }
}
