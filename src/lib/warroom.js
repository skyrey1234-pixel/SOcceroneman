import { base44 } from "@/api/base44Client";

const schema = {
  type: "object",
  properties: {
    their_shape: { type: "string" },
    threat_level: { type: "number" },
    summary: { type: "string" },
    predicted_responses: {
      type: "array",
      items: {
        type: "object",
        properties: {
          trigger: { type: "string" },
          their_move: { type: "string" },
          likelihood: { type: "number" },
          danger: { type: "number" },
          our_counter: { type: "string" },
          counter_play: {
            type: "object",
            properties: {
              start_label: { type: "string" },
              end_label: { type: "string" },
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
    },
    exploitable_zones: {
      type: "array",
      items: {
        type: "object",
        properties: {
          zone: { type: "string" },
          why: { type: "string" },
          instruction: { type: "string" },
        },
      },
    },
    key_players_to_track: { type: "array", items: { type: "string" } },
  },
};

// Predicts how a real opponent would respond to our shape, using their tactical history.
export async function simulateAdversary({ opponent, our_formation, our_approach }) {
  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `You are an opposition analyst running a live war-room simulation.

Opponent: ${opponent}
Our formation: ${our_formation}
Our intended approach: ${our_approach || "not specified"}

Using ${opponent}'s real-world tactical history (their manager's principles, press height, build-up shape,
transition habits, set-piece routines and recent results), predict how they would respond to our shape.
Return: their likely out-of-possession shape, an overall threat level 0-1, 5-7 predicted responses
(each with the trigger that causes it, what they do, likelihood 0-1, danger 0-1, and our counter),
3-4 exploitable zones with a concrete instruction for our players, the key players we must track,
and a 4-sentence war-room summary a head coach can read in 20 seconds.

For EVERY predicted response also return counter_play: an animated chalkboard diagram of our counter on a
105m x 68m pitch (x 0-105 attacking right, y 0-68). Include 6-8 movements mixing team "home" (us, marked O)
and team "away" (them, marked X), each with number, short role (e.g. "RB", "6", "LW"), from {x,y} and to {x,y},
plus a ball pass from {x,y} to {x,y} that shows the key transfer, and short start_label/end_label
describing the moment the play begins and ends.`,
    add_context_from_internet: true,
    model: "gemini_3_1_pro",
    response_json_schema: schema,
  });

  return base44.entities.OpponentPlan.create({
    opponent,
    our_formation,
    our_approach,
    ...res,
  });
}