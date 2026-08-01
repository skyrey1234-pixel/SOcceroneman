import React from "react";
import { STAGE_W, STAGE_H, projectPoint } from "@/lib/replayAngles";

function StageGround() {
  return (
    <>
      <defs>
        <linearGradient id="tm-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06121b" />
          <stop offset="100%" stopColor="#0f2b33" />
        </linearGradient>
        <linearGradient id="tm-turf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1d5b33" />
          <stop offset="100%" stopColor="#2f8b4c" />
        </linearGradient>
      </defs>
      <rect x="0" y="0" width={STAGE_W} height={STAGE_H} fill="url(#tm-sky)" />
      <path d={`M0 ${STAGE_H} L${STAGE_W} ${STAGE_H} L${STAGE_W} ${STAGE_H * 0.3} L0 ${STAGE_H * 0.3} Z`} fill="url(#tm-turf)" />
      {[0.34, 0.42, 0.54, 0.72, 0.95].map((t) => (
        <line
          key={t}
          x1={0}
          x2={STAGE_W}
          y1={STAGE_H * t}
          y2={STAGE_H * t}
          stroke="#ffffff"
          strokeOpacity="0.09"
          strokeWidth="0.25"
        />
      ))}
      {[-1, -0.5, 0, 0.5, 1].map((k) => (
        <line
          key={k}
          x1={STAGE_W / 2 + k * STAGE_W * 0.06}
          y1={STAGE_H * 0.3}
          x2={STAGE_W / 2 + k * STAGE_W * 0.58}
          y2={STAGE_H}
          stroke="#ffffff"
          strokeOpacity="0.08"
          strokeWidth="0.25"
        />
      ))}
    </>
  );
}

function StageToken({ point, label, name, isOpponent, highlight }) {
  const r = 1.6 * point.scale;
  return (
    <g>
      <ellipse cx={point.x} cy={point.y + r * 0.9} rx={r * 1.1} ry={r * 0.35} fill="#000" opacity="0.35" />
      <circle
        cx={point.x}
        cy={point.y}
        r={r}
        fill={isOpponent ? "#dc2626" : "#38bdf8"}
        stroke={highlight ? "#22c55e" : "#0b1418"}
        strokeWidth={highlight ? r * 0.28 : r * 0.14}
      />
      {label !== "" && label != null && (
        <text
          x={point.x}
          y={point.y + r * 0.36}
          textAnchor="middle"
          fill="#ffffff"
          fontSize={r * 1.05}
          fontWeight="700"
        >
          {label}
        </text>
      )}
      {name && (
        <text
          x={point.x}
          y={point.y - r * 1.5}
          textAnchor="middle"
          fill={highlight ? "#4ade80" : "#e2e8f0"}
          fontSize={Math.max(1.4, r * 0.75)}
          fontWeight="600"
        >
          {name}
        </text>
      )}
    </g>
  );
}

function OffscreenMarker({ side, label }) {
  const x = side === "right" ? STAGE_W - 6 : 6;
  return (
    <g>
      <rect x={x - 5} y={STAGE_H * 0.44} width="10" height="5" rx="2.2" fill="#0b1418" opacity="0.85" />
      <text x={x} y={STAGE_H * 0.478} textAnchor="middle" fill="#facc15" fontSize="2.4" fontWeight="700">
        {label} {side === "right" ? "→" : "←"}
      </text>
    </g>
  );
}

/**
 * Renders the same reconstructed moment from a virtual camera (endzone or player POV).
 * Points come in as pitch metres and are projected into the perspective stage.
 */
export default function PerspectiveStage({ angle, camera, facing, tokens, lines, ball }) {
  const project = (point) => projectPoint(angle, point, camera, facing);

  return (
    <svg viewBox={`0 0 ${STAGE_W} ${STAGE_H}`} className="block h-auto w-full">
      <StageGround />

      {lines.map((line, i) => {
        const from = project(line.from);
        const to = project(line.to);
        if (!from.visible || !to.visible) return null;
        return (
          <line
            key={i}
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={line.color}
            strokeWidth={line.width || 0.5}
            strokeDasharray={line.dashed ? "1.6 1.2" : undefined}
            strokeLinecap="round"
          />
        );
      })}

      {ball && (() => {
        const point = project(ball);
        if (!point.visible) return null;
        return <circle cx={point.x} cy={point.y} r={Math.max(0.5, 0.9 * point.scale)} fill="#ffffff" />;
      })()}

      {tokens.map((token) => {
        const point = project(token);
        if (!point.visible) {
          return point.behind || point.side ? (
            <OffscreenMarker key={token.id} side={point.side} label={token.label !== "" && token.label != null ? `#${token.label}` : "•"} />
          ) : null;
        }
        return <StageToken key={token.id} point={point} {...token} />;
      })}
    </svg>
  );
}