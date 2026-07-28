import { base44 } from "@/api/base44Client";

// Turns a player's recurring blindspot weakness into concrete training-ground drills.
export async function generateDrills({ playerNumber, weakness, events }) {
  const evidence = events
    .slice(0, 10)
    .map(
      (e) =>
        `min ${Math.round(e.minute || 0)} · missed #${e.missed_player} at ${e.distance_m?.toFixed(
          1
        )}m / ${Math.round(e.angle_deg || 0)}° · scan ${e.scan_quality?.toFixed(2)} · phase ${
          e.phase || "unknown"
        } · ${e.feedback || ""}`
    )
    .join("\n");

  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `You are an elite football (soccer) individual-development coach.

Player: shirt #${playerNumber}
Diagnosed weakness: ${weakness}

Evidence from video analysis of their scanning blindspots:
${evidence || "No specific events logged; use the weakness description."}

Design 3 training-ground drills that directly fix this weakness (perception, scanning, body
orientation, blindspot awareness). For each drill give: title, one-line focus, duration in minutes,
number of players needed, physical setup (cones/areas/dimensions in meters), how it runs step by
step, 3-4 coaching points, exactly where THIS player messed up in the match evidence
(where_we_messed_up, concrete and specific), how elite players handle the same situation
(how_elite_players_do_it — reference real professional habits like pre-scanning before receiving,
open body shape, shoulder checks on the blind side), a progression to make it harder, and a
measurable success metric.`,
    add_context_from_internet: true,
    model: "gemini_3_flash",
    response_json_schema: {
      type: "object",
      properties: {
        drills: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              focus: { type: "string" },
              duration_min: { type: "number" },
              players_needed: { type: "number" },
              setup: { type: "string" },
              how_it_runs: { type: "string" },
              coaching_points: { type: "array", items: { type: "string" } },
              where_we_messed_up: { type: "string" },
              how_elite_players_do_it: { type: "string" },
              progression: { type: "string" },
              success_metric: { type: "string" },
            },
          },
        },
      },
    },
  });

  const drills = (res.drills || []).map((d) => ({
    ...d,
    player_number: playerNumber,
    weakness,
  }));

  return drills.length ? base44.entities.Drill.bulkCreate(drills) : [];
}

// Derives candidate weaknesses from a player's logged blindspot events.
export function weaknessesFor(events) {
  if (!events.length) return [];
  const avg = (fn) => events.reduce((s, e) => s + (fn(e) || 0), 0) / events.length;
  const share = (fn) => events.filter(fn).length / events.length;

  const list = [
    {
      key: "Ball-locked — scans too rarely before receiving",
      score: 1 - avg((e) => e.scan_quality),
    },
    {
      key: "Beaten on the blind side (behind the shoulder)",
      score: share((e) => Math.abs(e.angle_deg || 0) > 100),
    },
    {
      key: "Misses close-range runners inside 10 metres",
      score: share((e) => (e.distance_m || 99) < 10),
    },
    {
      key: "Loses picture during defensive transitions",
      score: share((e) => e.phase === "defensive_transition"),
    },
    {
      key: "Poor body orientation in build-up",
      score: share((e) => e.phase === "build_up"),
    },
    {
      key: "Switches off in the final third",
      score: share((e) => e.phase === "final_third"),
    },
  ];

  return list.filter((w) => w.score > 0.05).sort((a, b) => b.score - a.score);
}