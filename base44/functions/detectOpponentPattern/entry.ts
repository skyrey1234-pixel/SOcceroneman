import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';
import { gatherOpponentEvidence, findSuccessfulPattern, describePattern } from '../../shared/opponentInsights.js';

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const planId = body.plan_id;
    if (!planId) return Response.json({ error: 'plan_id is required' }, { status: 400 });

    const plan = await base44.asServiceRole.entities.OpponentPlan.get(planId);
    if (!plan) return Response.json({ error: 'Plan not found' }, { status: 404 });

    const { events } = await gatherOpponentEvidence(base44, plan.opponent);
    const pattern = findSuccessfulPattern(events);

    if (!pattern) {
      console.log('No successful opponent pattern found for', plan.opponent);
      return Response.json({ found: false, opponent: plan.opponent });
    }

    return Response.json({
      found: true,
      opponent: plan.opponent,
      summary: describePattern(pattern, plan.opponent),
      ...pattern,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}