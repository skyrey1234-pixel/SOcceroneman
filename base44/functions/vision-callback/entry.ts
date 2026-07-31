import { createClientFromRequest } from "npm:@base44/sdk";
import { secrets } from "base44:runtime";

const numberOr = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp = (value: unknown, min: number, max: number, fallback = min) =>
  Math.max(min, Math.min(max, numberOr(value, fallback)));

function normalizedBox(value: unknown) {
  if (!value || typeof value !== "object") return null;
  const box = value as Record<string, unknown>;
  const x = numberOr(box.x, NaN);
  const y = numberOr(box.y, NaN);
  const width = numberOr(box.width, NaN);
  const height = numberOr(box.height, NaN);
  if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return null;
  return {
    x: clamp(x, 0, 1),
    y: clamp(y, 0, 1),
    width: clamp(width, 0, 1),
    height: clamp(height, 0, 1),
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
      const observerBox = normalizedBox(event.observer_box);
      const missedBox = normalizedBox(event.missed_player_box);
      const sourceConfidence = clamp(event.confidence ?? event.evidence_confidence, 0, 1, 0.5);

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
        evidence_start_seconds: Math.max(0, numberOr(event.evidence_start_seconds, timestamp - 4)),
        evidence_end_seconds: Math.max(timestamp, numberOr(event.evidence_end_seconds, timestamp + 6)),
        evidence_note: typeof event.evidence_note === "string" ? event.evidence_note.slice(0, 800) : "Measured by the configured vision worker; coach review required.",
        evidence_thumbnail_url: typeof event.evidence_thumbnail_url === "string" ? event.evidence_thumbnail_url : "",
        annotation_state: observerBox || missedBox ? "verified" : "none",
        observer_box: observerBox || undefined,
        missed_player_box: missedBox || undefined,
        vision_analysis_id: analysis.id,
        vision_track_id: typeof event.vision_track_id === "string" ? event.vision_track_id : "",
        review_status: "pending",
      };
    });

    if (preparedEvents.length) {
      await base44.asServiceRole.entities.BlindspotEvent.bulkCreate(preparedEvents);
    }

    const completedAt = new Date().toISOString();
    await base44.asServiceRole.entities.VisionAnalysis.update(analysis.id, {
      status: "complete",
      model_name: typeof payload.model_name === "string" ? payload.model_name : "unknown",
      model_version: typeof payload.model_version === "string" ? payload.model_version : "",
      sample_fps: numberOr(payload.sample_fps),
      video_duration_seconds: numberOr(payload.video_duration_seconds),
      overall_confidence: clamp(payload.overall_confidence, 0, 1, 0),
      events_created: preparedEvents.length,
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

    return Response.json({ ok: true, status: "complete", eventsCreated: preparedEvents.length });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not process the vision callback." },
      { status: 500 }
    );
  }
}
