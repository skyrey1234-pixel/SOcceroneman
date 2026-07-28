import { base44 } from "@/api/base44Client";

const schema = {
  type: "object",
  properties: {
    headline: { type: "string" },
    options: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          rationale: { type: "string" },
          outcome: { type: "string" },
          ball: {
            type: "object",
            properties: {
              from: { type: "object", properties: { x: { type: "number" }, y: { type: "number" } } },
              to: { type: "object", properties: { x: { type: "number" }, y: { type: "number" } } },
            },
          },
          movements: {
            type: "array",
            items: {
              type: "object",
              properties: {
                number: { type: "number" },
                team: { type: "string", enum: ["home", "away"] },
                role: { type: "string" },
                from: { type: "object", properties: { x: { type: "number" }, y: { type: "number" } } },
                to: { type: "object", properties: { x: { type: "number" }, y: { type: "number" } } },
              },
            },
          },
        },
      },
    },
  },
};

// Generates 3 "what they should have done" movement patterns for a blindspot moment.
export async function generateSubPlay(event, match) {
  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a soccer tactics coach building animated coaching diagrams on a 105m x 68m pitch
(x = 0 own goal line to 105 opponent goal line, y = 0 left touchline to 68 right touchline).

Match: ${match?.title || "match"} vs ${match?.opponent || "opponent"}
Moment: minute ${Math.round(event.minute || 0)}, phase ${event.phase || "open play"}.
Observer #${event.observer_player} failed to see #${event.missed_player} at ${event.distance_m?.toFixed(1)}m,
relative angle ${Math.round(event.angle_deg || 0)}°, scan quality ${event.scan_quality}.
Observer position: x ${event.pitch_x ?? 52}, y ${event.pitch_y ?? 34}.
What happened: ${event.feedback}

Return a headline naming the mistake, then EXACTLY 3 alternative optimal patterns. Each pattern needs
4-6 player movements (include the observer, the missed runner, and 2-4 supporting players; team "home" is
our team, "away" is the opponent), each with realistic from/to pitch coordinates inside the pitch bounds,
a short role label ("holds width", "third-man run"...), plus a ball from/to, a one-sentence rationale and
the likely outcome. Movements must be geometrically coherent with the positions given.`,
    response_json_schema: schema,
  });

  return base44.entities.SubPlay.create({
    event_id: event.id,
    match_id: event.match_id,
    headline: res.headline,
    options: res.options || [],
  });
}