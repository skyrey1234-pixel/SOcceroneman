const numberOr = (value, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);

export function eventTimestampSeconds(event) {
  if (Number.isFinite(Number(event?.timestamp_seconds))) return Number(event.timestamp_seconds);
  return numberOr(event?.minute) * 60 + numberOr(event?.second);
}

export function formatVideoTimestamp(seconds) {
  const total = Math.max(0, Math.floor(numberOr(seconds)));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainder = total % 60;
  return hours
    ? `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`
    : `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export function evidenceWindow(event, leadSeconds = 4, tailSeconds = 6) {
  const timestamp = eventTimestampSeconds(event);
  return {
    timestamp_seconds: timestamp,
    start_seconds: Number.isFinite(Number(event?.evidence_start_seconds))
      ? Number(event.evidence_start_seconds)
      : Math.max(0, timestamp - leadSeconds),
    end_seconds: Number.isFinite(Number(event?.evidence_end_seconds))
      ? Number(event.evidence_end_seconds)
      : timestamp + tailSeconds,
  };
}

export function youtubeTimestampUrl(match, seconds) {
  const source = match?.youtube_url || "";
  if (!source) return null;
  try {
    const url = new URL(source);
    url.searchParams.set("t", String(Math.floor(Math.max(0, numberOr(seconds)))));
    return url.toString();
  } catch {
    return null;
  }
}

export function normalizeBox(box) {
  if (!box || typeof box !== "object") return null;
  const x = numberOr(box.x, NaN);
  const y = numberOr(box.y, NaN);
  const width = numberOr(box.width, NaN);
  const height = numberOr(box.height, NaN);
  if (![x, y, width, height].every(Number.isFinite) || width <= 0 || height <= 0) return null;

  return {
    x: Math.max(0, Math.min(1, x)),
    y: Math.max(0, Math.min(1, y)),
    width: Math.max(0, Math.min(1, width)),
    height: Math.max(0, Math.min(1, height)),
  };
}

export function hasVisualAnnotation(event) {
  return Boolean(normalizeBox(event?.observer_box) || normalizeBox(event?.missed_player_box));
}

export function evidenceSourceLabel(event) {
  const source = event?.evidence_source || "ai_draft";
  if (source === "computer_vision") return "Computer-vision evidence";
  if (source === "coach_marked") return "Coach-marked evidence";
  return "AI coaching draft";
}
