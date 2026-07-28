import React from "react";
import { PITCH_W, PITCH_H } from "@/lib/blindspot";

export default function PitchMarkings() {
  const line = { fill: "none", stroke: "rgba(255,255,255,0.22)", strokeWidth: 0.3 };
  return (
    <g>
      <rect x="0" y="0" width={PITCH_W} height={PITCH_H} fill="url(#turf)" />
      <rect x="0" y="0" width={PITCH_W} height={PITCH_H} {...line} />
      <line x1={PITCH_W / 2} y1="0" x2={PITCH_W / 2} y2={PITCH_H} {...line} />
      <circle cx={PITCH_W / 2} cy={PITCH_H / 2} r="9.15" {...line} />
      <circle cx={PITCH_W / 2} cy={PITCH_H / 2} r="0.5" fill="rgba(255,255,255,0.3)" />
      <rect x="0" y={PITCH_H / 2 - 20.15} width="16.5" height="40.3" {...line} />
      <rect x={PITCH_W - 16.5} y={PITCH_H / 2 - 20.15} width="16.5" height="40.3" {...line} />
      <rect x="0" y={PITCH_H / 2 - 9.16} width="5.5" height="18.32" {...line} />
      <rect x={PITCH_W - 5.5} y={PITCH_H / 2 - 9.16} width="5.5" height="18.32" {...line} />
    </g>
  );
}