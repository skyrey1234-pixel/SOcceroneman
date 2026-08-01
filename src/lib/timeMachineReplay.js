import {
  eventTimestampSeconds,
  evidenceWindow,
  hasVisualAnnotation,
  normalizeBox,
} from "./evidence.js";

export const REPLAY_STATUS = {
  UNAVAILABLE: "unavailable",
  KEYFRAME: "keyframe",
  TRACKED: "tracked",
};

export const REPLAY_MODE = {
  TRACKED: "tracked",
  KEYFRAME: "keyframe",
  RECONSTRUCTION: "reconstruction",
};

const numberOr = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const clamp = (value, min, max, fallback = min) =>
  Math.max(min, Math.min(max, numberOr(value, fallback)));

export function normalizeReplayFrame(frame) {
  if (!frame || typeof frame !== "object") return null;
  const timestamp = numberOr(frame.timestamp_seconds, NaN);
  const observerBox = normalizeBox(frame.observer_box);
  const contextBox = normalizeBox(frame.context_box || frame.missed_player_box);
  if (!Number.isFinite(timestamp) || (!observerBox && !contextBox)) return null;

  return {
    timestamp_seconds: Math.max(0, timestamp),
    track_id: typeof frame.track_id === "string" ? frame.track_id : "",
    observer_box: observerBox,
    context_box: contextBox,
    head_direction_proxy: clamp(frame.head_direction_proxy, -1.5, 1.5, 0),
    observer_confidence: clamp(frame.observer_confidence, 0, 1, 0),
  };
}

export function replayFramesForEvent(event) {
  const frames = Array.isArray(event?.replay_frames)
    ? event.replay_frames.map(normalizeReplayFrame).filter(Boolean)
    : [];

  return frames
    .sort((a, b) => a.timestamp_seconds - b.timestamp_seconds)
    .slice(0, 80);
}

export function replayDecisionTimestamp(event) {
  const explicit = numberOr(event?.replay_keyframe_seconds, NaN);
  return Number.isFinite(explicit) ? Math.max(0, explicit) : eventTimestampSeconds(event);
}

export function replayWindowForEvent(event) {
  const evidence = evidenceWindow(event);
  const frames = replayFramesForEvent(event);
  if (!frames.length) return evidence;

  return {
    timestamp_seconds: replayDecisionTimestamp(event),
    start_seconds: Math.max(0, Math.min(evidence.start_seconds, frames[0].timestamp_seconds)),
    end_seconds: Math.max(
      replayDecisionTimestamp(event),
      evidence.end_seconds,
      frames[frames.length - 1].timestamp_seconds
    ),
  };
}

export function replayModeForEvent(event) {
  const frames = replayFramesForEvent(event);
  if (event?.replay_status === REPLAY_STATUS.TRACKED && frames.length >= 2) {
    return REPLAY_MODE.TRACKED;
  }
  if (frames.length || hasVisualAnnotation(event)) return REPLAY_MODE.KEYFRAME;
  return REPLAY_MODE.RECONSTRUCTION;
}

export function nearestReplayFrame(event, seconds) {
  const frames = replayFramesForEvent(event);
  if (!frames.length) {
    if (!hasVisualAnnotation(event)) return null;
    return normalizeReplayFrame({
      timestamp_seconds: replayDecisionTimestamp(event),
      track_id: event?.vision_track_id,
      observer_box: event?.observer_box,
      context_box: event?.missed_player_box,
      observer_confidence: event?.evidence_confidence,
    });
  }

  const target = numberOr(seconds, replayDecisionTimestamp(event));
  return frames.reduce((nearest, frame) =>
    Math.abs(frame.timestamp_seconds - target) < Math.abs(nearest.timestamp_seconds - target)
      ? frame
      : nearest
  );
}

export function replayTrustState(event) {
  const mode = replayModeForEvent(event);
  const source = event?.evidence_source || "ai_draft";

  if (mode === REPLAY_MODE.TRACKED && source === "computer_vision") {
    return {
      mode,
      label: "Tracked CV replay",
      shortLabel: "CV tracked",
      description:
        "Boxes follow the tracked player through the evidence window. Head direction is a camera-plane proxy, not gaze or tactical intent.",
      tone: "emerald",
    };
  }

  if (mode === REPLAY_MODE.KEYFRAME && source === "coach_marked") {
    return {
      mode,
      label: "Coach-marked keyframe",
      shortLabel: "Coach marked",
      description:
        "The coach selected this frame and visual context. Motion between frames is not computer-vision tracked.",
      tone: "sky",
    };
  }

  if (mode === REPLAY_MODE.KEYFRAME) {
    return {
      mode,
      label: "Verified evidence keyframe",
      shortLabel: "Keyframe",
      description:
        "The overlay is anchored to the approved evidence frame. It does not claim continuous tracking outside that moment.",
      tone: "amber",
    };
  }

  return {
    mode,
    label: "Tactical reconstruction",
    shortLabel: "Reconstruction",
    description:
      "This view is reconstructed from approved event geometry because tracked video boxes are not available.",
    tone: "slate",
  };
}

export function replayCoverage(event) {
  const frames = replayFramesForEvent(event);
  if (!frames.length) return { frameCount: 0, seconds: 0, sampleFps: 0 };
  const seconds = Math.max(0, frames[frames.length - 1].timestamp_seconds - frames[0].timestamp_seconds);
  return {
    frameCount: frames.length,
    seconds,
    sampleFps: Math.max(0, numberOr(event?.replay_sample_fps)),
  };
}
