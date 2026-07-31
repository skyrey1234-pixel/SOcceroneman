import { isApprovedEvent } from "@/lib/review";

const safeNumber = (value, fallback = 0) => (Number.isFinite(Number(value)) ? Number(value) : fallback);

export function average(events, selector) {
  if (!events?.length) return 0;
  return events.reduce((sum, event) => sum + safeNumber(selector(event)), 0) / events.length;
}

export function uniqueMatchIds(events) {
  return [...new Set((events || []).map((event) => event.match_id).filter(Boolean))];
}

export function isBehindEvent(event) {
  return Math.abs(safeNumber(event?.angle_deg)) > 60;
}

export function approvedEventsForPlayer(events, playerNumber) {
  return (events || []).filter(
    (event) => event.observer_player === playerNumber && isApprovedEvent(event)
  );
}

export function playerEvidenceMetrics(events) {
  const evidence = (events || []).filter(isApprovedEvent);
  const eventCount = evidence.length;
  const matchIds = uniqueMatchIds(evidence);

  return {
    event_count: eventCount,
    match_count: matchIds.length,
    avg_scan_quality: average(evidence, (event) => event.scan_quality),
    avg_severity: average(evidence, (event) => event.severity),
    behind_share: eventCount ? evidence.filter(isBehindEvent).length / eventCount : 0,
    match_ids: matchIds,
  };
}

export function captureBaseline(events) {
  return {
    ...playerEvidenceMetrics(events),
    captured_at: new Date().toISOString(),
  };
}

export function progressSnapshot(baseline, retest) {
  if (!baseline || !retest) return null;

  const scanDelta = safeNumber(retest.avg_scan_quality) - safeNumber(baseline.avg_scan_quality);
  const severityDelta = safeNumber(baseline.avg_severity) - safeNumber(retest.avg_severity);
  const behindDelta = safeNumber(baseline.behind_share) - safeNumber(retest.behind_share);
  const eventDelta = safeNumber(baseline.event_count) - safeNumber(retest.event_count);
  const comparisonReady = safeNumber(baseline.match_count) > 0 && safeNumber(retest.match_count) > 0;

  const improvedSignals = [scanDelta > 0.03, severityDelta > 0.03, behindDelta > 0.05].filter(Boolean).length;
  const regressedSignals = [scanDelta < -0.03, severityDelta < -0.03, behindDelta < -0.05].filter(Boolean).length;
  const status = !comparisonReady
    ? "needs_retest"
    : improvedSignals >= 2
      ? "improving"
      : regressedSignals >= 2
        ? "needs_attention"
        : "mixed";

  return {
    scan_delta: scanDelta,
    severity_delta: severityDelta,
    behind_delta: behindDelta,
    event_delta: eventDelta,
    status,
    comparison_ready: comparisonReady,
  };
}

export function percentage(value) {
  return `${Math.round(safeNumber(value) * 100)}%`;
}
