import { base44 } from "@/api/base44Client";

export const VISION_STATUS = {
  NOT_REQUESTED: "not_requested",
  NOT_CONFIGURED: "not_configured",
  QUEUED: "queued",
  PROCESSING: "processing",
  COMPLETE: "complete",
  FAILED: "failed",
};

export function visionStatusLabel(status) {
  const labels = {
    [VISION_STATUS.NOT_REQUESTED]: "Not requested",
    [VISION_STATUS.NOT_CONFIGURED]: "Setup needed",
    [VISION_STATUS.QUEUED]: "Queued",
    [VISION_STATUS.PROCESSING]: "Processing video",
    [VISION_STATUS.COMPLETE]: "Evidence ready",
    [VISION_STATUS.FAILED]: "Needs attention",
  };
  return labels[status] || "Not requested";
}

export async function requestVisionAnalysis(matchId) {
  const result = await base44.functions.invoke("request-vision-analysis", { matchId });
  if (result?.error) throw new Error(result.error);
  return result;
}
