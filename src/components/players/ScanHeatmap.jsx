import React from "react";

const W = 105;
const H = 68;
const COLS = 6;
const ROWS = 4;

// Aggregates blindspot severity into pitch zones to expose "tactically claustrophobic" areas.
export default function ScanHeatmap({ events }) {
  const cells = Array.from({ length: COLS * ROWS }, () => ({ count: 0, severity: 0 }));
  let placed = 0;

  events.forEach((e) => {
    if (e.pitch_x == null || e.pitch_y == null) return;
    const c = Math.min(COLS - 1, Math.floor((e.pitch_x / W) * COLS));
    const r = Math.min(ROWS - 1, Math.floor((e.pitch_y / H) * ROWS));
    const cell = cells[r * COLS + c];
    cell.count += 1;
    cell.severity += e.severity || 0;
    placed += 1;
  });

  const max = Math.max(...cells.map((c) => c.severity), 0.0001);
  const cw = W / COLS;
  const ch = H / ROWS;

  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-2xl border border-border/60">
        <rect x="0" y="0" width={W} height={H} fill="#0d2a1d" />
        {cells.map((cell, i) => {
          const col = i % COLS;
          const row = Math.floor(i / COLS);
          const t = cell.severity / max;
          return (
            <g key={i}>
              <rect
                x={col * cw}
                y={row * ch}
                width={cw}
                height={ch}
                fill={`rgba(248,113,113,${(t * 0.75).toFixed(3)})`}
              />
              {cell.count > 0 && (
                <text
                  x={col * cw + cw / 2}
                  y={row * ch + ch / 2 + 1.2}
                  textAnchor="middle"
                  fontSize="3"
                  fill="rgba(255,255,255,0.75)"
                >
                  {cell.count}
                </text>
              )}
            </g>
          );
        })}
        <g fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.35">
          <rect x="1" y="1" width={W - 2} height={H - 2} />
          <line x1={W / 2} y1="1" x2={W / 2} y2={H - 1} />
          <circle cx={W / 2} cy={H / 2} r="9.15" />
          <rect x="1" y={H / 2 - 20.16} width="16.5" height="40.32" />
          <rect x={W - 17.5} y={H / 2 - 20.16} width="16.5" height="40.32" />
        </g>
      </svg>
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
        {placed
          ? "Darker zones = more severe blindspots. Own goal left, attacking right."
          : "No positional data yet — re-run a match analysis to map zones."}
      </p>
    </div>
  );
}