import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

const pointSchema = {
  type: 'object',
  properties: { x: { type: 'number' }, y: { type: 'number' } },
};

const responseSchema = {
  type: 'object',
  properties: {
    sub_play: {
      type: 'object',
      properties: {
        headline: { type: 'string' },
        options: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              rationale: { type: 'string' },
              outcome: { type: 'string' },
              ball: { type: 'object', properties: { from: pointSchema, to: pointSchema } },
              movements: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    number: { type: 'number' },
                    team: { type: 'string', enum: ['home', 'away'] },
                    role: { type: 'string' },
                    from: pointSchema,
                    to: pointSchema,
                  },
                },
              },
            },
          },
        },
      },
    },
    drill: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        weakness: { type: 'string' },
        focus: { type: 'string' },
        duration_min: { type: 'number' },
        players_needed: { type: 'number' },
        setup: { type: 'string' },
        how_it_runs: { type: 'string' },
        coaching_points: { type: 'array', items: { type: 'string' } },
        where_we_messed_up: { type: 'string' },
        how_elite_players_do_it: { type: 'string' },
        progression: { type: 'string' },
        success_metric: { type: 'string' },
      },
    },
  },
};

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { plan_id, opponent, phase, summary, anchor_event_id, anchor_match_id, observer_player, match_ids } = body;
    if (!anchor_event_id) return Response.json({ error: 'anchor_event_id is required' }, { status: 400 });

    const plan = plan_id ? await base44.asServiceRole.entities.OpponentPlan.get(plan_id) : null;

    const prompt = [
      'You are an elite soccer tactics coach. Pitch coordinates: x 0-105 (our goal at x=0), y 0-68.',
      `Opponent: ${opponent}. Their shape: ${plan?.their_shape || 'unknown'}. Our formation: ${plan?.our_formation || 'unknown'}.`,
      `Evidence of a repeatedly successful opponent pattern: ${summary || phase}`,
      `Phase to counter: ${phase}.`,
      observer_player ? `Our most exposed player is #${observer_player}.` : '',
      'Produce:',
      '1) sub_play: a headline plus 2 concrete counter options. Each option needs a rationale, an expected outcome, ball from/to coordinates, and 3-5 player movements with from/to coordinates and roles.',
      '2) drill: a realistic training drill that fixes this exact weakness, with setup, how it runs, 3-5 coaching points, progression and a measurable success metric.',
    ].filter(Boolean).join('\n');

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: responseSchema,
    });

    const subPlay = await base44.asServiceRole.entities.SubPlay.create({
      event_id: anchor_event_id,
      match_id: anchor_match_id,
      headline: result?.sub_play?.headline || `Counter ${opponent} in ${phase}`,
      options: result?.sub_play?.options || [],
    });

    const drillData = result?.drill || {};
    const drill = await base44.asServiceRole.entities.Drill.create({
      title: drillData.title || `Counter ${opponent}: ${String(phase).replace(/_/g, ' ')}`,
      weakness: drillData.weakness || summary,
      focus: drillData.focus || `Neutralise ${opponent} in ${phase}`,
      duration_min: drillData.duration_min,
      players_needed: drillData.players_needed,
      setup: drillData.setup,
      how_it_runs: drillData.how_it_runs,
      coaching_points: drillData.coaching_points || [],
      where_we_messed_up: drillData.where_we_messed_up || summary,
      how_elite_players_do_it: drillData.how_elite_players_do_it,
      progression: drillData.progression,
      success_metric: drillData.success_metric,
      player_number: observer_player || undefined,
      source_match_ids: match_ids || [],
    });

    const admins = await base44.asServiceRole.entities.User.filter({ role: 'admin' });
    const emailBody = [
      `A recurring pattern from ${opponent} needs your approval.`,
      '',
      summary || '',
      '',
      `Suggested counter play: ${subPlay.headline}`,
      `Suggested drill: ${drill.title}`,
      '',
      'Open the War Room and Drills pages to approve or edit these suggestions.',
    ].join('\n');

    for (const admin of admins) {
      if (!admin.email) continue;
      await base44.asServiceRole.integrations.Core.SendEmail({
        to: admin.email,
        subject: `Approval needed: counter-plan for ${opponent}`,
        body: emailBody,
      });
    }

    return Response.json({
      sub_play_id: subPlay.id,
      drill_id: drill.id,
      alerted: admins.filter((a) => a.email).length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}