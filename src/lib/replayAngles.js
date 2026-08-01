import { PITCH_W, PITCH_H } from "@/components/timemachine/FifaPitch";

export const REPLAY_ANGLES = [
  { id: "top", label: "Top-down", hint: "Tactical overhead" },
  { id: "endzone", label: "Endzone", hint: "Behind the goal" },
  { id: "pov", label: "Player view", hint: "Through the observer's eyes" },
];

// Perspective stage canvas (16:9-ish), separate from pitch metres.
export const STAGE_W = 100;
export const STAGE_H = 56;
const HORIZON = STAGE_H * 0.3;

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function depthToStage(t) {
  // t: 0 = closest to camera, 1 = farthest. Non-linear so near play reads bigger.
  const d = clamp(t, 0, 1);
  return {
    y: HORIZON + (STAGE_H - HORIZON) * Math.pow(1 - d, 1.5),
    scale: 0.5 + 1.3 * Math.pow(1 - d, 1.4),
    spread: 1 - 0.72 * d,
  };
}

function projectEndzone(point) {
  const t = clamp(point.x / PITCH_W, 0, 1);
  const { y, scale, spread } = depthToStage(t);
  const lateral = (point.y - PITCH_H / 2) / (PITCH_H / 2);
  return {
    visible: true,
    x: STAGE_W / 2 + lateral * (STAGE_W * 0.46) * spread,
    y,
    scale,
  };
}

function projectPov(point, camera, facingRad) {
  const dx = point.x - camera.x;
  const dy = point.y - camera.y;
  const forward = dx * Math.cos(facingRad) + dy * Math.sin(facingRad);
  const lateral = -dx * Math.sin(facingRad) + dy * Math.cos(facingRad);

  if (forward < 2) {
    return { visible: false, side: lateral >= 0 ? "right" : "left", behind: true };
  }

  const t = clamp(forward / 45, 0, 1);
  const { y, scale } = depthToStage(t);
  const x = STAGE_W / 2 + (lateral / forward) * (STAGE_W * 0.5);
  if (x < -6 || x > STAGE_W + 6) {
    return { visible: false, side: lateral >= 0 ? "right" : "left", behind: false };
  }
  return { visible: true, x, y, scale };
}

/**
 * Projects a pitch point (metres) into the perspective stage for a given angle.
 * `top` is handled directly by the overhead SVG and is not projected here.
 */
export function projectPoint(angle, point, camera, facingRad = 0) {
  if (angle === "pov") return projectPov(point, camera, facingRad);
  return projectEndzone(point);
}

export function angleFromTo(from, to) {
  return Math.atan2(to.y - from.y, to.x - from.x);
}