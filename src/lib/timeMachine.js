import { base44 } from "@/api/base44Client";

export * from "./timeMachineReplay.js";

export async function loadTimeMachineReplay(eventId) {
  if (!eventId) throw new Error("A blindspot event is required for Time Machine.");
  const response = await base44.functions.invoke("get-time-machine-replay", { eventId });
  const result = response?.data ?? response;
  if (result?.error) throw new Error(result.error);
  if (!result?.event) throw new Error("Time Machine evidence was not returned for this moment.");
  return result;
}