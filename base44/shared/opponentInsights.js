// Shared helpers for cross-referencing an OpponentPlan against real match evidence.

export async function gatherOpponentEvidence(base44, opponent) {
  const matches = await base44.asServiceRole.entities.Match.filter({ opponent });
  const matchIds = matches.map((m) => m.id);
  let events = [];
  for (const id of matchIds) {
    const rows = await base44.asServiceRole.entities.BlindspotEvent.filter({ match_id: id });
    events = events.concat(rows);
  }
  return { matches, matchIds, events };
}

// A pattern counts as "successful for the opponent" when the same game phase
// keeps producing repeated, high-severity blindspots that a coach has not dismissed.
export function findSuccessfulPattern(events) {
  const usable = events.filter(
    (e) => e.review_status !== "dismissed" && (e.severity || 0) > 0
  );

  const groups = {};
  for (const e of usable) {
    const key = e.phase || "unknown";
    if (!groups[key]) groups[key] = [];
    groups[key].push(e);
  }

  let best = null;
  for (const phase of Object.keys(groups)) {
    const rows = groups[phase];
    const avg = rows.reduce((s, r) => s + (r.severity || 0), 0) / rows.length;
    if (rows.length < 2 || avg < 5) continue;
    if (!best || avg > best.avg_severity) {
      best = {
        phase,
        avg_severity: Math.round(avg * 10) / 10,
        occurrences: rows.length,
        rows,
      };
    }
  }

  if (!best) return null;

  const anchor = best.rows
    .slice()
    .sort((a, b) => (b.severity || 0) - (a.severity || 0))[0];

  return {
    phase: best.phase,
    avg_severity: best.avg_severity,
    occurrences: best.occurrences,
    anchor_event_id: anchor.id,
    anchor_match_id: anchor.match_id,
    observer_player: anchor.observer_player || null,
    missed_player: anchor.missed_player || null,
    match_ids: Array.from(new Set(best.rows.map((r) => r.match_id))),
  };
}

export function describePattern(pattern, opponent) {
  return (
    `Opponent "${opponent}" repeatedly succeeded during the ${String(pattern.phase).replace(/_/g, " ")} phase: ` +
    `${pattern.occurrences} unresolved blindspot moments across ${pattern.match_ids.length} match(es), ` +
    `average severity ${pattern.avg_severity}/10` +
    (pattern.observer_player ? `, most often around our #${pattern.observer_player}` : "") +
    "."
  );
}