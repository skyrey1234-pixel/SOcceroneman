import { createClientFromRequest } from "npm:@base44/sdk";
import { secrets } from "base44:runtime";

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { matchId } = await req.json();
    if (!matchId || typeof matchId !== "string") {
      return Response.json({ error: "A match ID is required." }, { status: 400 });
    }

    // Resolve through the caller-scoped client first. Service-role writes below are allowed only
    // after this normal access check succeeds, so one coach cannot queue another coach’s footage.
    const match = await base44.entities.Match.get(matchId);
    if (!match) return Response.json({ error: "Match not found or not available to this account." }, { status: 404 });

    const footageUrl = match.video_url || match.youtube_url;
    if (!footageUrl) {
      return Response.json(
        { error: "Add a playable video file or public YouTube link before requesting computer-vision analysis." },
        { status: 400 }
      );
    }

    const providerUrl = secrets.get("VISION_PROVIDER_URL");
    const providerToken = secrets.get("VISION_PROVIDER_TOKEN");
    const callbackSecret = secrets.get("VISION_CALLBACK_SECRET");

    if (!providerUrl || !callbackSecret) {
      const analysis = await base44.asServiceRole.entities.VisionAnalysis.create({
        match_id: match.id,
        status: "not_configured",
        provider: "external-worker",
        error: "The vision provider is not configured. Add VISION_PROVIDER_URL and VISION_CALLBACK_SECRET in Base44 environment variables.",
        requested_at: new Date().toISOString(),
      });
      await base44.asServiceRole.entities.Match.update(match.id, {
        vision_status: "not_configured",
        vision_analysis_id: analysis.id,
        vision_error: analysis.error,
      });
      return Response.json({
        configured: false,
        analysisId: analysis.id,
        message: analysis.error,
      });
    }

    const analysis = await base44.asServiceRole.entities.VisionAnalysis.create({
      match_id: match.id,
      status: "queued",
      provider: "external-worker",
      requested_at: new Date().toISOString(),
    });

    await base44.asServiceRole.entities.Match.update(match.id, {
      vision_status: "queued",
      vision_analysis_id: analysis.id,
      vision_provider: "external-worker",
      vision_error: "",
      vision_requested_at: new Date().toISOString(),
    });

    const callbackUrl = `${new URL(req.url).origin}/functions/vision-callback`;
    const response = await fetch(providerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(providerToken ? { Authorization: `Bearer ${providerToken}` } : {}),
      },
      body: JSON.stringify({
        job_id: analysis.id,
        match: {
          id: match.id,
          title: match.title,
          footage_url: footageUrl,
          footage_type: match.youtube_url ? "youtube" : "file",
          camera_type: match.camera_type || "broadcast",
        },
        callback_url: callbackUrl,
        callback_secret: callbackSecret,
      }),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      const message = "The vision provider could not accept this footage. Confirm the worker is online and the video URL is accessible to it.";
      await base44.asServiceRole.entities.VisionAnalysis.update(analysis.id, {
        status: "failed",
        error: details ? `${message} (${details.slice(0, 240)})` : message,
      });
      await base44.asServiceRole.entities.Match.update(match.id, {
        vision_status: "failed",
        vision_error: message,
      });
      return Response.json({ error: message }, { status: 502 });
    }

    const providerResult = await response.json().catch(() => ({}));
    const providerJobId = providerResult.job_id || providerResult.jobId || null;
    await base44.asServiceRole.entities.VisionAnalysis.update(analysis.id, {
      status: "processing",
      provider_job_id: providerJobId,
      started_at: new Date().toISOString(),
    });
    await base44.asServiceRole.entities.Match.update(match.id, { vision_status: "processing" });

    return Response.json({ configured: true, analysisId: analysis.id, providerJobId });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Could not start computer-vision analysis." },
      { status: 500 }
    );
  }
}
