import React, { useRef, useState } from "react";
import { PITCH_W, PITCH_H, effectiveFov } from "@/lib/blindspot";
import PitchMarkings from "./PitchMarkings";

function fovCone(p, fovDeg, radius = 26) {
  const half = (fovDeg / 2) * (Math.PI / 180);
  const a = (p.facing * Math.PI) / 180;
  const x1 = p.x + radius * Math.cos(a - half);
  const y1 = p.y + radius * Math.sin(a - half);
  const x2 = p.x + radius * Math.cos(a + half);
  const y2 = p.y + radius * Math.sin(a + half);
  const largeArc = fovDeg > 180 ? 1 : 0;
  return `M ${p.x} ${p.y} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
}

export default function TacticalPitch({ players, ball, blindspots, selectedId, onSelect, onMove }) {
  const svgRef = useRef(null);
  const [dragId, setDragId] = useState(null);

  const toPitch = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    return {
      x: Math.min(PITCH_W, Math.max(0, ((e.clientX - r.left) / r.width) * PITCH_W)),
      y: Math.min(PITCH_H, Math.max(0, ((e.clientY - r.top) / r.height) * PITCH_H)),
    };
  };

  const handleMove = (e) => {
    if (!dragId) return;
    const pos = toPitch(e);
    onMove(dragId, pos);
  };

  const missedIds = new Set(blindspots.map((b) => b.targetId));
  const selected = players.find((p) => p.id === selectedId);

  return (
    <svg
      ref={svgRef}
      viewBox={`-2 -2 ${PITCH_W + 4} ${PITCH_H + 4}`}
      className="w-full rounded-2xl touch-none select-none"
      onPointerMove={handleMove}
      onPointerUp={() => setDragId(null)}
      onPointerLeave={() => setDragId(null)}
    >
      <defs>
        <linearGradient id="turf" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0d2b1d" />
          <stop offset="100%" stopColor="#071a12" />
        </linearGradient>
      </defs>
      <PitchMarkings />

      {selected && (
        <>
          <path d={fovCone(selected, 190)} fill="rgba(255,255,255,0.06)" />
          <path d={fovCone(selected, effectiveFov(selected.scan_quality))} fill="rgba(74,222,128,0.18)" />
        </>
      )}

      {blindspots.slice(0, 12).map((b, i) => {
        const o = players.find((p) => p.id === b.observerId);
        const t = players.find((p) => p.id === b.targetId);
        if (!o || !t) return null;
        return (
          <line
            key={i}
            x1={o.x}
            y1={o.y}
            x2={t.x}
            y2={t.y}
            stroke="rgba(248,113,113,0.5)"
            strokeWidth="0.25"
            strokeDasharray="1 1"
          />
        );
      })}

      {ball && <circle cx={ball.x} cy={ball.y} r="0.9" fill="#fbbf24" stroke="#000" strokeWidth="0.15" />}

      {players.map((p) => {
        const isSel = p.id === selectedId;
        const missed = missedIds.has(p.id);
        const a = (p.facing * Math.PI) / 180;
        return (
          <g
            key={p.id}
            className="cursor-grab"
            onPointerDown={(e) => {
              e.preventDefault();
              onSelect(p.id);
              setDragId(p.id);
            }}
          >
            <circle
              cx={p.x}
              cy={p.y}
              r={isSel ? 2.4 : 1.9}
              fill={p.team === "home" ? "#38bdf8" : "#f472b6"}
              stroke={missed ? "#f87171" : isSel ? "#ffffff" : "rgba(0,0,0,0.5)"}
              strokeWidth={missed || isSel ? 0.45 : 0.2}
            />
            <line
              x1={p.x}
              y1={p.y}
              x2={p.x + 3.2 * Math.cos(a)}
              y2={p.y + 3.2 * Math.sin(a)}
              stroke="rgba(255,255,255,0.8)"
              strokeWidth="0.3"
            />
            <text
              x={p.x}
              y={p.y + 0.6}
              textAnchor="middle"
              fontSize="1.7"
              fill="#04140c"
              fontWeight="700"
              pointerEvents="none"
            >
              {p.number}
            </text>
          </g>
        );
      })}
    </svg>
  );
}