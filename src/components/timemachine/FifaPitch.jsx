import React from "react";

export const PITCH_W = 105;
export const PITCH_H = 68;

const line = { fill: "none", stroke: "rgba(255,255,255,0.55)", strokeWidth: 0.28 };

/** FIFA/broadcast style turf: mown stripes, soft vignette, crisp white markings. */
export function FifaPitch() {
  const stripes = Array.from({ length: 14 });
  return (
    <g>
      <defs>
        <linearGradient id="tm-turf" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1f7a3d" />
          <stop offset="100%" stopColor="#125c2b" />
        </linearGradient>
        <radialGradient id="tm-vignette" cx="50%" cy="45%" r="75%">
          <stop offset="55%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.45)" />
        </radialGradient>
        <marker id="tm-arrow" markerWidth="4" markerHeight="4" refX="3" refY="2" orient="auto">
          <path d="M0,0 L4,2 L0,4 Z" fill="currentColor" />
        </marker>
      </defs>

      <rect x="0" y="0" width={PITCH_W} height={PITCH_H} fill="url(#tm-turf)" />
      {stripes.map((_, i) =>
        i % 2 === 0 ? (
          <rect
            key={i}
            x={(i * PITCH_W) / stripes.length}
            y="0"
            width={PITCH_W / stripes.length}
            height={PITCH_H}
            fill="rgba(255,255,255,0.045)"
          />
        ) : null
      )}

      <rect x="2" y="2" width={PITCH_W - 4} height={PITCH_H - 4} {...line} />
      <line x1={PITCH_W / 2} y1="2" x2={PITCH_W / 2} y2={PITCH_H - 2} {...line} />
      <circle cx={PITCH_W / 2} cy={PITCH_H / 2} r="9.15" {...line} />
      <circle cx={PITCH_W / 2} cy={PITCH_H / 2} r="0.5" fill="rgba(255,255,255,0.7)" />
      <rect x="2" y={PITCH_H / 2 - 20.16} width="16.5" height="40.32" {...line} />
      <rect x={PITCH_W - 18.5} y={PITCH_H / 2 - 20.16} width="16.5" height="40.32" {...line} />
      <rect x="2" y={PITCH_H / 2 - 9.16} width="5.5" height="18.32" {...line} />
      <rect x={PITCH_W - 7.5} y={PITCH_H / 2 - 9.16} width="5.5" height="18.32" {...line} />
      <circle cx="13" cy={PITCH_H / 2} r="0.5" fill="rgba(255,255,255,0.7)" />
      <circle cx={PITCH_W - 13} cy={PITCH_H / 2} r="0.5" fill="rgba(255,255,255,0.7)" />

      <rect x="0" y="0" width={PITCH_W} height={PITCH_H} fill="url(#tm-vignette)" />
    </g>
  );
}

/** FIFA-style player chip: ground shadow, glossy jersey disc, number + name plate. */
export function FifaToken({ x, y, label, name, isOpponent, highlight }) {
  const base = isOpponent ? "#c2261f" : "#1f6feb";
  const rim = highlight ? "#facc15" : "rgba(255,255,255,0.9)";
  const cx = Math.min(PITCH_W - 3, Math.max(3, x ?? PITCH_W / 2));
  const cy = Math.min(PITCH_H - 3, Math.max(3, y ?? PITCH_H / 2));

  return (
    <g transform={`translate(${cx} ${cy})`}>
      <ellipse cx="0" cy="2.4" rx="2.6" ry="0.9" fill="rgba(0,0,0,0.4)" />
      {highlight && (
        <circle r="4.6" fill="none" stroke="#facc15" strokeWidth="0.32" strokeDasharray="1.4 1" className="animate-pulse" />
      )}
      <circle r="2.5" fill={base} stroke={rim} strokeWidth="0.4" />
      <circle r="2.5" fill="rgba(255,255,255,0.16)" clipPath="none" transform="translate(0 -0.9) scale(1 0.5)" />
      <text
        y="0.8"
        textAnchor="middle"
        fontSize="2.4"
        fontWeight="700"
        fill="#ffffff"
        style={{ paintOrder: "stroke", stroke: "rgba(0,0,0,0.45)", strokeWidth: 0.25 }}
      >
        {label ?? "?"}
      </text>
      {name && (
        <g transform="translate(0 5.6)">
          <rect x="-6" y="-2" width="12" height="3.4" rx="1.7" fill="rgba(0,0,0,0.6)" />
          <text y="0.5" textAnchor="middle" fontSize="1.9" fill="#ffffff" letterSpacing="0.1">
            {name}
          </text>
        </g>
      )}
    </g>
  );
}

/** Broadcast-style pass line with arrowhead. */
export function FifaPassLine({ from, to, color, dashed, width = 0.55 }) {
  return (
    <g color={color}>
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke="rgba(0,0,0,0.45)"
        strokeWidth={width + 0.35}
        strokeLinecap="round"
        strokeDasharray={dashed ? "1.6 1.2" : undefined}
      />
      <line
        x1={from.x}
        y1={from.y}
        x2={to.x}
        y2={to.y}
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        strokeDasharray={dashed ? "1.6 1.2" : undefined}
        markerEnd="url(#tm-arrow)"
      />
    </g>
  );
}