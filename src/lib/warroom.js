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
and a 4-sentence war-room summary a head coach can read in 20 seconds.`,
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