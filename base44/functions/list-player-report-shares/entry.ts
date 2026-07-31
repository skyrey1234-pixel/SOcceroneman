import { createClientFromRequest } from "npm:@base44/sdk";

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const input = await req.json().catch(() => ({}));
    const playerNumber = Number(input?.playerNumber);
    if (!Number.isInteger(playerNumber) || playerNumber < 0 || playerNumber > 99) {
      return Response.json({ error: "A valid player number is required." }, { status: 400 });
    }

    const owner = user.id || user.email || "coach";
    const allShares = await base44.asServiceRole.entities.PlayerReportShare.filter(
      { player_number: playerNumber },
      "-created_date"
    );
    const shares = allShares
      .filter((share: Record<string, unknown>) => share.created_by === owner)
      .slice(0, 20)
      .map((share: Record<string, unknown>) => ({
        id: share.id,
        token: share.token,
        status: share.status,
        expires_at: share.expires_at || null,
        created_date: share.created_date || null,
        last_accessed_at: share.last_accessed_at || null,
      }));

    return Response.json({ shares });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not load player report links." },
      { status: 500 }
    );
  }
}
