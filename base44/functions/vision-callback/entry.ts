import { createClientFromRequest } from "npm:@base44/sdk";
import { secrets } from "base44:runtime";

const numberOr = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp = (value: unknown, min: number, max: number, fallback = min) =>
  Math.max(min, Math.min(max, numberOr(value, fallback)));

const REPLAY_SCHEMA_VERSION = "socceroneman.time-machine.v2";
const MAX_REPLAY_FRAMES = 80;

function normalizedBox(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const box = value as Record<string, unknown>;
  const x = numberOr(box.x, NaN);
  const y = numberOr(box.y, NaN);
  const width = numberOr(box.width, NaN);
  const height = numberOr(box.height, NaN);
  if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return null;
  const normalizedX = clamp(x, 0, 1);
  const normalizedY = clamp(y, 0, 1);
  const normalizedWidth = clamp(width, 0, 1 - normalizedX);
  const normalizedHeight = clamp(height, 0, 1 - normalizedY);
  if (normalizedWidth <= 0 || normalizedHeight <= 0) return null;
  return {
    x: normalizedX,
    y: normalizedY,
    width: normalizedWidth,
    height: normalizedHeight,
  };
}

function normalizedReplayFrame(value: unknown, start: number, end: number) {
  if (!value || typeof value !== "object") return null;
  const frame = value as Record<string, unknown>;
  const observerBox = normalizedBox(frame.observer_box);
  const contextBox = normalizedBox(frame.context_box ?? frame.missed_player_box);
  if (!observerBox && !contextBox) return null;

  return {
    timestamp_seconds: clamp(frame.timestamp_seconds, start, end, start),
    track_id: typeof frame.track_id === "string" ? frame.track_id.slice(0, 120) : "",
    observer_box: observerBox || undefined,
    context_box: contextBox || undefined,
    head_direction_proxy: clamp(frame.head_direction_proxy, -1.5, 1.5, 0),
    observer_confidence: clamp(frame.observer_confidence, 0, 1, 0),
  };
}

export default async function (req: Request): Promise<Response> {
  try {
    const expectedSecret = secrets.get("VISION_CALLBACK_SECRET");
    const presentedSecret = req.headers.get("x-socceroneman-vision-secret") || "";
    if (!expectedSecret || presentedSecret !== expectedSecret) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    const payload = await req.json();
    const analysisId = typeof payload?.job_id === "string" ? payload.job_id : "";
    if (!analysisId) return Response.json({ error: "job_id is required." }, { status: 400 });

    const analysis = await base44.asServiceRole.entities.VisionAnalysis.get(analysisId);
    if (!analysis) return Response.json({ error: "Unknown analysis job." }, { status: 404 });
    if (analysis.status === "complete") return Response.json({ ok: true, idempotent: true });

    const match = await base44.asServiceRole.entities.Match.get(analysis.match_id);
    if (!match) return Response.json({ error: "Linked match not found." }, { status: 404 });

    if (payload.status === "failed") {
      const message = typeof payload.error === "string" ? payload.error.slice(0, 500) : "The vision worker could not process this footage.";
      await base44.asServiceRole.entities.VisionAnalysis.update(analysis.id, {
        status: "failed",
        error: message,
        completed_at: new Date().toISOString(),
      });
      await base44.asServiceRole.entities.Match.update(match.id, {
        vision_status: "failed",
        vision_error: message,
      });
      return Response.json({ ok: true, status: "failed" });
    }

    if (payload.status !== "complete") {
      await base44.asServiceRole.entities.VisionAnalysis.update(analysis.id, { status: "processing" });
      await base44.asServiceRole.entities.Match.update(match.id, { vision_status: "processing" });
      return Response.json({ ok: true, status: "processing" });
    }

    const inputEvents = Array.isArray(payload.events) ? payload.events.slice(0, 100) : [];
    const preparedEvents = inputEvents.map((raw: unknown) => {
      const event = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
      const timestamp = Math.max(0, numberOr(event.timestamp_seconds));
      const evidenceStart = Math.max(0, numberOr(event.evidence_start_seconds, timestamp - 4));
      const evidenceEnd = Math.max(timestamp, numberOr(event.evidence_end_seconds, timestamp + 6));
      const rawReplayFrames = Array.isArray(event.replay_frames)
        ? event.replay_frames.slice(0, MAX_REPLAY_FRAMES)
        : [];
      const replayFrames = rawReplayFrames
        .map((frame: unknown) => normalizedReplayFrame(frame, evidenceStart, evidenceEnd))
        .filter((frame): frame is NonNullable<ReturnType<typeof normalizedReplayFrame>> => frame !== null)
        .sort((a, b) => a.timestamp_seconds - b.timestamp_seconds);
      const decisionFrame = replayFrames.length
        ? replayFrames.reduce((nearest, frame) =>
            Math.abs(frame.timestamp_seconds - timestamp) < Math.abs(nearest.timestamp_seconds - timestamp)
              ? frame
              : nearest
          , replayFrames[0])
        : null;
      const observerBox = normalizedBox(event.observer_box) || decisionFrame?.observer_box || null;
      const missedBox = normalizedBox(event.missed_player_box) || decisionFrame?.context_box || null;
      const sourceConfidence = clamp(event.confidence ?? event.evidence_confidence, 0, 1, 0.5);
      const replayStatus = replayFrames.length >= 2
        ? "tracked"
        : replayFrames.length || observerBox || missedBox
          ? "keyframe"
          : "unavailable";

      return {
        match_id: match.id,
        minute: Math.floor(timestamp / 60),
        second: Math.floor(timestamp % 60),
        timestamp_seconds: timestamp,
        observer_player: Number.isFinite(Number(event.observer_player)) ? Number(event.observer_player) : undefined,
        missed_player: Number.isFinite(Number(event.missed_player)) ? Number(event.missed_player) : undefined,
        severity: clamp(event.severity, 0, 1, 0.5),
        distance_m: Math.max(0, numberOr(event.distance_m)),
        angle_deg: clamp(event.angle_deg, -180, 180, 0),
        scan_quality: clamp(event.scan_quality, 0, 1, 0.5),
        pitch_x: clamp(event.pitch_x, 0, 105, 52.5),
        pitch_y: clamp(event.pitch_y, 0, 68, 34),
        phase: typeof event.phase === "string" ? event.phase : "progression",
        what_went_right: typeof event.what_went_right === "string" ? event.what_went_right : "",
        what_went_wrong: typeof event.what_went_wrong === "string" ? event.what_went_wrong : "A potential awareness gap was detected by the vision worker.",
        feedback: typeof event.feedback === "string" ? event.feedback : "Coach review required: verify the video evidence before using this finding.",
        evidence_source: "computer_vision",
        evidence_confidence: sourceConfidence,
        evidence_start_seconds: evidenceStart,
        evidence_end_seconds: evidenceEnd,
        evidence_note: typeof event.evidence_note === "string" ? event.evidence_note.slice(0, 800) : "Measured by the configured vision worker; coach review required.",
        evidence_thumbnail_url: typeof event.evidence_thumbnail_url === "string" ? event.evidence_thumbnail_url : "",
        annotation_state: observerBox || missedBox ? "verified" : "none",
        observer_box: observerBox || undefined,
        missed_player_box: missedBox || undefined,
        replay_schema_version: REPLAY_SCHEMA_VERSION,
        replay_status: replayStatus,
        replay_keyframe_seconds: clamp(event.replay_keyframe_seconds, evidenceStart, evidenceEnd, timestamp),
        replay_sample_fps: clamp(event.replay_sample_fps ?? payload.sample_fps, 0, 30, 0),
        replay_note: typeof event.replay_note === "string"
          ? event.replay_note.slice(0, 800)
          : "Replay overlays are measured camera-plane evidence. Secondary boxes are visual context, not verified tactical roles.",
        replay_frames: replayFrames,
        vision_analysis_id: analysis.id,
        vision_track_id: typeof event.vision_track_id === "string" ? event.vision_track_id : "",
        review_status: "pending",
      };
    });

    if (preparedEvents.length) {
      await base44.asServiceRole.entities.BlindspotEvent.bulkCreate(preparedEvents);
    }

    const eventsWithReplay = preparedEvents.filter((event) => event.replay_status !== "unavailable").length;
    const replayFramesCreated = preparedEvents.reduce(
      (total, event) => total + (Array.isArray(event.replay_frames) ? event.replay_frames.length : 0),
      0
    );
    const completedAt = new Date().toISOString();
    await base44.asServiceRole.entities.VisionAnalysis.update(analysis.id, {
      status: "complete",
      model_name: typeof payload.model_name === "string" ? payload.model_name : "unknown",
      model_version: typeof payload.model_version === "string" ? payload.model_version : "",
      sample_fps: numberOr(payload.sample_fps),
      video_duration_seconds: numberOr(payload.video_duration_seconds),
      overall_confidence: clamp(payload.overall_confidence, 0, 1, 0),
      events_created: preparedEvents.length,
      replay_schema_version: REPLAY_SCHEMA_VERSION,
      events_with_replay: eventsWithReplay,
      replay_frames_created: replayFramesCreated,
      result_url: typeof payload.result_url === "string" ? payload.result_url : "",
      result_hash: typeof payload.result_hash === "string" ? payload.result_hash : "",
      completed_at: completedAt,
      error: "",
    });
    await base44.asServiceRole.entities.Match.update(match.id, {
      vision_status: "complete",
      vision_completed_at: completedAt,
      vision_error: "",
      video_duration_seconds: numberOr(payload.video_duration_seconds),
    });

    return Response.json({
      ok: true,
      status: "complete",
      eventsCreated: preparedEvents.length,
      eventsWithReplay,
      replayFramesCreated,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not process the vision callback." },
      { status: 500 }
    );
  }
}
