import { base44 } from "@/api/base44Client";

export * from "./timeMachineReplay.js";

export async function loadTimeMachineReplay(eventId) {
  if (!eventId) throw new Error("A blindspot event is required for Time Machine.");
  const result = await base44.functions.invoke("get-time-machine-replay", { eventId });
  if (result?.error) throw new Error(result.error);
  return result;
}
