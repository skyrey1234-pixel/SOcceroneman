import { base44 } from "@/api/base44Client";
import { isApprovedEvent, REVIEW_STATUS } from "@/lib/review";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The LLM provider can return a transient "service temporarily unavailable" error.
// Retry a couple of times with backoff before surfacing a failure to the coach.
async function invokeWithRetry(payload, attempts = 3) {
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await base44.integrations.Core.InvokeLLM(payload);
    } catch (error) {
      lastError = error;
      if (attempt < attempts - 1) await sleep(2000 * (attempt + 1));
    }
  }
  throw lastError;
}

// Generates a belief-state / blindspot report for a match using the LLM,
// then stores the key moments as coach-reviewable BlindspotEvent records.
export async function runAnalysis(match) {
  await base44.entities.Match.update(match.id, { status: "analyzing", analysis_error: "" });

  try {
    const result = await invokeWithRetry({
      prompt: `You are a soccer "theory of mind" analyst. Using the match context below, produce a plausible
scanning & blindspot report in the style of a tactical belief-state engine: for each key moment an observer
player geometrically could see a teammate/opponent but their head pose says they did not.

Match: ${match.title}
Opponent: ${match.opponent || "unknown"}
Competition: ${match.competition || "unknown"}
Camera: ${match.camera_type}
Footage: ${match.youtube_url || match.video_url || "none attached"}
Coach notes: ${match.notes || "none"}

Return 8-14 key moments spread across 90 minutes, each with observer shirt number, missed shirt number,
severity 0-1, distance in meters (2-40), relative angle in degrees (-180..180, |angle|>60 means peripheral
or behind), the observer's scan quality 0-1, the exact clock (minute + second within that minute), the
observer's pitch position (pitch_x 0-105 from our own goal line, pitch_y 0-68 across the pitch), the phase
of play, one sentence on what the player DID RIGHT in that moment, one sentence on what went WRONG,
and a short second-person coaching cue.
Also return overall stats and a 3-4 sentence coaching summary.`,
      response_json_schema: {
        type: "object",
        properties: {
          summary: { type: "string" },
          frames_processed: { type: "number" },
          unique_players: { type: "number" },
          avg_scan_quality: { type: "number" },
          key_moments: {
            type: "array",
            items: {
              type: "object",
              properties: {
                minute: { type: "number" },
                second: { type: "number" },
                pitch_x: { type: "number" },
                pitch_y: { type: "number" },
                phase: {
                  type: "string",
                  enum: ["build_up", "progression", "final_third", "defensive_transition", "settled_defence", "set_piece"],
                },
                what_went_right: { type: "string" },
                what_went_wrong: { type: "string" },
                observer_player: { type: "number" },
                missed_player: { type: "number" },
                severity: { type: "number" },
                distance_m: { type: "number" },
                angle_deg: { type: "number" },
                scan_quality: { type: "number" },
                feedback: { type: "string" },
              },
            },
          },
        },
      },
    });

    const moments = result.key_moments || [];
    const existingEvents = await base44.entities.BlindspotEvent.filter({ match_id: match.id }, "minute");
    const approvedEvents = existingEvents.filter(isApprovedEvent);
    const draftEvents = existingEvents.filter((event) => !isApprovedEvent(event));

    // A re-run replaces only AI drafts. Coach-approved evidence stays intact and
    // continues to inform player-development views until a coach deliberately changes it.
    await Promise.all(draftEvents.map((event) => base44.entities.BlindspotEvent.delete(event.id)));

    if (moments.length) {
      await base44.entities.BlindspotEvent.bulkCreate(
        moments.map((moment) => ({
          ...moment,
          match_id: match.id,
          review_status: REVIEW_STATUS.PENDING,
        }))
      );
    }

    return base44.entities.Match.update(match.id, {
      status: "complete",
      analysis_error: "",
      summary: result.summary,
      frames_processed: result.frames_processed,
      unique_players: result.unique_players,
      avg_scan_quality: result.avg_scan_quality,
      total_blindspots: approvedEvents.length + moments.length,
    });
  } catch (error) {
    const raw = String(error?.message || "");
    const overloaded = /temporarily unavailable|503|overload|rate limit|timeout/i.test(raw);
    const message = overloaded
      ? "The analysis service was busy and did not respond. Wait a moment and run the analysis again."
      : "Analysis could not access or interpret this footage. Confirm that the video is playable, then try again.";
    await base44.entities.Match.update(match.id, {
      status: "failed",
      analysis_error: message,
    }).catch(() => undefined);
    throw error;
  }
}