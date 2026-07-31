import { createClientFromRequest } from "npm:@base44/sdk";

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const input = await req.json();
    const shareId = typeof input?.shareId === "string" ? input.shareId : "";
    if (!shareId) return Response.json({ error: "A player report link is required." }, { status: 400 });

    const share = await base44.asServiceRole.entities.PlayerReportShare.get(shareId);
    const owner = user.id || user.email || "coach";
    if (!share || share.created_by !== owner) {
      return Response.json({ error: "This player report link is unavailable." }, { status: 404 });
    }

    await base44.asServiceRole.entities.PlayerReportShare.update(share.id, { status: "revoked" });
    return Response.json({ ok: true, id: share.id, status: "revoked" });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not revoke the player report link." },
      { status: 500 }
    );
  }
}
