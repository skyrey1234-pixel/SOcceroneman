import { createClientFromRequest } from "npm:@base44/sdk";

function newShareToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function dateAfterDays(days: number) {
  const value = new Date();
  value.setDate(value.getDate() + days);
  return value.toISOString();
}

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const input = await req.json();
    const playerNumber = Number(input?.playerNumber);
    const expiresInDays = Math.min(365, Math.max(1, Number(input?.expiresInDays) || 30));

    if (!Number.isInteger(playerNumber) || playerNumber < 0 || playerNumber > 99) {
      return Response.json({ error: "A valid player number is required." }, { status: 400 });
    }

    // Capture an immutable, access-controlled match scope at link creation. The public endpoint
    // uses this list rather than a player number alone, preventing unrelated coaches’ #7 data
    // from ever being mixed into the same bearer report.
    const accessibleMatches = await base44.entities.Match.list("-created_date", 500);
    const scopeMatchIds = accessibleMatches
      .map((match: Record<string, unknown>) => typeof match.id === "string" ? match.id : "")
      .filter(Boolean);

    const token = newShareToken();
    const share = await base44.asServiceRole.entities.PlayerReportShare.create({
      player_number: playerNumber,
      token,
      status: "active",
      expires_at: dateAfterDays(expiresInDays),
      include_drills: input?.includeDrills !== false,
      include_progress: input?.includeProgress !== false,
      created_by: user.id || user.email || "coach",
      scope_match_ids: scopeMatchIds,
    });

    return Response.json({
      shareId: share.id,
      token,
      expiresAt: share.expires_at,
      playerNumber,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not create a player report link." },
      { status: 500 }
    );
  }
}
