import { base44 } from "@/api/base44Client";
import { isApprovedEvent } from "@/lib/review";

export async function generateOpponentPatterns(opponentName) {
  if (!opponentName || typeof opponentName !== "string") throw new Error("Opponent name is required.");

  const allMatches = await base44.entities.Match.filter({ opponent: opponentName });
  if (!allMatches.length) throw new Error("No matches recorded against this opponent.");

  const matchIds = allMatches.map((m) => m.id);
  const allEvents = await base44.entities.BlindspotEvent.list("-created_date", 500);
  const opponentEvents = allEvents.filter((e) => matchIds.includes(e.match_id) && isApprovedEvent(e));

  if (opponentEvents.length < 5) {
    throw new Error("Not enough coach-approved blindspot evidence to find patterns. Review more matches against this opponent first.");
  }

  const result = await base44.integrations.Core.InvokeLLM({
    prompt: `You are a tactical soccer analyst. Review this list of coach-approved blindspot events recorded against the opponent "${opponentName}".
    
    Events:
    ${JSON.stringify(opponentEvents.map((e) => ({
      phase: e.phase,
      severity: e.severity,
      distance: e.distance_m,
      scan: e.scan_quality,
      feedback: e.feedback,
      what_went_wrong: e.what_went_wrong,
    })), null, 2)}
    
    Identify 2 to 4 distinct, recurring tactical patterns where this opponent successfully exploits our blindspots or forces awareness errors.
    For each pattern, provide a clear label, a summary, the phase of play, the primary pitch zone (e.g., "Left half-space", "Defensive third"), and a confidence score from 0 to 1 based on how strong the evidence is.`,
    response_json_schema: {
      type: "object",
      properties: {
        patterns: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              summary: { type: "string" },
              phase: { type: "string" },
              zone: { type: "string" },
              confidence: { type: "number" },
            },
          },
        },
      },
    },
  });

  const patterns = result.patterns || [];
  if (!patterns.length) throw new Error("No clear patterns emerged from the current evidence.");

  const savedPatterns = await Promise.all(
    patterns.map((p) =>
      base44.entities.OpponentPattern.create({
        opponent: opponentName,
        label: p.label,
        summary: p.summary,
        phase: p.phase,
        zone: p.zone,
        sample_size: opponentEvents.length,
        match_count: matchIds.length,
        avg_severity: opponentEvents.reduce((sum, e) => sum + (e.severity || 0), 0) / opponentEvents.length,
        confidence: p.confidence,
        event_ids: opponentEvents.map((e) => e.id),
        match_ids: matchIds,
        review_status: "pending",
        generated_at: new Date().toISOString(),
      })
    )
  );

  return savedPatterns;
}
