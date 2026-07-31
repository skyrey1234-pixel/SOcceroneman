import { createClientFromRequest } from "npm:@base44/sdk";

const numberOr = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const average = (events: Record<string, unknown>[], key: string) =>
  events.length ? events.reduce((sum, event) => sum + numberOr(event[key]), 0) / events.length : 0;

const behindShare = (events: Record<string, unknown>[]) =>
  events.length
    ? events.filter((event) => Math.abs(numberOr(event.angle_deg)) > 60).length / events.length
    : 0;

const metrics = (events: Record<string, unknown>[]) => ({
  event_count: events.length,
  match_count: new Set(events.map((event) => event.match_id).filter(Boolean)).size,
  avg_scan_quality: average(events, "scan_quality"),
  avg_severity: average(events, "severity"),
  behind_share: behindShare(events),
});

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const input = await req.json();
    const token = typeof input?.token === "string" ? input.token.trim() : "";

    if (token.length < 20) {
      return Response.json({ error: "This player report link is invalid." }, { status: 400 });
    }

    const shares = await base44.asServiceRole.entities.PlayerReportShare.filter({ token });
    const share = shares.find((candidate: Record<string, unknown>) => candidate.status === "active");
    if (!share) return Response.json({ error: "This player report is unavailable." }, { status: 404 });

    const expiresAt = share.expires_at ? new Date(String(share.expires_at)) : null;
    if (expiresAt && !Number.isNaN(expiresAt.getTime()) && expiresAt.getTime() < Date.now()) {
      return Response.json({ error: "This player report link has expired." }, { status: 410 });
    }

    const playerNumber = numberOr(share.player_number, -1);
    const scopeMatchIds = Array.isArray(share.scope_match_ids)
      ? share.scope_match_ids.filter((value: unknown): value is string => typeof value === "string" && value.length > 0)
      : [];
    // Fail closed for legacy links created before immutable match scopes existed.
    if (!scopeMatchIds.length) {
      return Response.json({ error: "This player report was created with an older sharing policy. Ask your coach to create a new secure link." }, { status: 410 });
    }
    const scopeSet = new Set(scopeMatchIds);
    const owner = typeof share.created_by === "string" ? share.created_by : "";
    const allEvents = await base44.asServiceRole.entities.BlindspotEvent.list("-created_date", 500);
    const approvedEvents = allEvents.filter(
      (event: Record<string, unknown>) =>
        scopeSet.has(String(event.match_id || "")) &&
        numberOr(event.observer_player, -1) === playerNumber &&
        event.review_status === "approved"
    );
    const matchIds = [...new Set(approvedEvents.map((event: Record<string, unknown>) => event.match_id).filter(Boolean))];
    const allMatches = await base44.asServiceRole.entities.Match.list("-match_date", 500);
    const matchesById = new Map(
      allMatches
        .filter((match: Record<string, unknown>) => scopeSet.has(String(match.id || "")))
        .map((match: Record<string, unknown>) => [match.id, match])
    );
    const belongsToShareScope = (record: Record<string, unknown>) => {
      const recordScope = Array.isArray(record.source_match_ids)
        ? record.source_match_ids.filter((value: unknown): value is string => typeof value === "string")
        : [];
      return recordScope.some((matchId) => scopeSet.has(matchId)) && (!owner || record.created_by === owner);
    };

    const reportEvents = approvedEvents.slice(0, 24).map((event: Record<string, unknown>) => ({
      id: event.id,
      match_title: matchesById.get(event.match_id)?.title || "Match review",
      match_date: matchesById.get(event.match_id)?.match_date || null,
      minute: event.minute,
      second: event.second,
      timestamp_seconds: event.timestamp_seconds ?? numberOr(event.minute) * 60 + numberOr(event.second),
      severity: event.severity,
      scan_quality: event.scan_quality,
      phase: event.phase,
      feedback: event.feedback,
      what_went_right: event.what_went_right,
      what_went_wrong: event.what_went_wrong,
      evidence_source: event.evidence_source || "ai_draft",
      evidence_confidence: event.evidence_confidence ?? null,
    }));

    let progress = null;
    let drills: Record<string, unknown>[] = [];
    let trainingBlocks: Record<string, unknown>[] = [];

    if (share.include_progress !== false) {
      const blocks = await base44.asServiceRole.entities.TrainingBlock.filter({ player_number: playerNumber }, "-created_date");
      trainingBlocks = blocks.filter(belongsToShareScope).map((block: Record<string, unknown>) => ({
        id: block.id,
        title: block.title,
        focus: block.focus,
        status: block.status,
        start_date: block.start_date,
        end_date: block.end_date,
        duration_weeks: block.duration_weeks,
        sessions_planned: block.sessions_planned,
        sessions_completed: block.sessions_completed,
        baseline: block.baseline || null,
        retest: block.retest || null,
      }));
      progress = trainingBlocks.find((block) => block.status === "active" || block.status === "complete") || null;
    }

    if (share.include_drills !== false) {
      const allDrills = await base44.asServiceRole.entities.Drill.filter({ player_number: playerNumber }, "-created_date");
      drills = allDrills.filter(belongsToShareScope).slice(0, 12).map((drill: Record<string, unknown>) => ({
        id: drill.id,
        title: drill.title,
        focus: drill.focus,
        duration_min: drill.duration_min,
        players_needed: drill.players_needed,
        how_it_runs: drill.how_it_runs,
        coaching_points: drill.coaching_points || [],
        success_metric: drill.success_metric,
        training_block_id: drill.training_block_id || null,
      }));
    }

    await base44.asServiceRole.entities.PlayerReportShare.update(share.id, {
      last_accessed_at: new Date().toISOString(),
    }).catch(() => undefined);

    return Response.json(
      {
        player: { number: playerNumber },
        metrics: metrics(approvedEvents),
        match_count: matchIds.length,
        recent_events: reportEvents,
        progress,
        training_blocks: trainingBlocks,
        drills,
        expires_at: share.expires_at || null,
      },
      {
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
          Pragma: "no-cache",
        },
      }
    );
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not load this player report." },
      { status: 500 }
    );
  }
}
