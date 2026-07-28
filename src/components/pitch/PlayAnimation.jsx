import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";

const W = 105;
const H = 68;
const clampX = (v) => Math.min(W - 2, Math.max(2, v ?? W / 2));
const clampY = (v) => Math.min(H - 2, Math.max(2, v ?? H / 2));

function Marking() {
  const s = { fill: "none", stroke: "rgba(255,255,255,0.22)", strokeWidth: 0.4 };
  return (
    <g>
      <rect x="0" y="0" width={W} height={H} fill="#0d2a1d" />
      <rect x="1" y="1" width={W - 2} height={H - 2} {...s} />
      <line x1={W / 2} y1="1" x2={W / 2} y2={H - 1} {...s} />
      <circle cx={W / 2} cy={H / 2} r="9.15" {...s} />
      <rect x="1" y={H / 2 - 20.16} width="16.5" height="40.32" {...s} />
      <rect x={W - 17.5} y={H / 2 - 20.16} width="16.5" height="40.32" {...s} />
    </g>
  );
}

export default function PlayAnimation({ option }) {
  const [run, setRun] = useState(0);
  const movements = option?.movements || [];
  const ball = option?.ball;

  return (
    <div className="space-y-3">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-2xl border border-border/60">
        <Marking />

        {movements.map((m, i) => (
          <g key={`path-${i}`}>
            <line
              x1={clampX(m.from?.x)}
              y1={clampY(m.from?.y)}
              x2={clampX(m.to?.x)}
              y2={clampY(m.to?.y)}
              stroke={m.team === "away" ? "rgba(248,113,113,0.4)" : "rgba(52,211,153,0.5)"}
              strokeWidth="0.35"
              strokeDasharray="1.5 1"
            />
          </g>
        ))}

        {ball?.from && ball?.to && (
          <line
            x1={clampX(ball.from.x)}
            y1={clampY(ball.from.y)}
            x2={clampX(ball.to.x)}
            y2={clampY(ball.to.y)}
            stroke="rgba(255,255,255,0.55)"
            strokeWidth="0.4"
          />
        )}

        {movements.map((m, i) => (
          <motion.g
            key={`${run}-${i}`}
            initial={{ x: clampX(m.from?.x), y: clampY(m.from?.y) }}
            animate={{ x: clampX(m.to?.x), y: clampY(m.to?.y) }}
            transition={{ duration: 2.2, delay: 0.3 + i * 0.12, ease: "easeInOut" }}
          >
            <circle
              r="2.2"
              fill={m.team === "away" ? "#f87171" : "#34d399"}
              stroke="rgba(0,0,0,0.5)"
              strokeWidth="0.3"
            />
            <text
              textAnchor="middle"
              y="0.9"
              fontSize="2.4"
              fill="#06231a"
              fontWeight="700"
            >
              {m.number}
            </text>
            <text textAnchor="middle" y="-3.2" fontSize="1.9" fill="rgba(255,255,255,0.7)">
              {m.role}
            </text>
          </motion.g>
        ))}

        {ball?.from && ball?.to && (
          <motion.circle
            key={`ball-${run}`}
            r="1.3"
            fill="#ffffff"
            initial={{ x: clampX(ball.from.x), y: clampY(ball.from.y) }}
            animate={{ x: clampX(ball.to.x), y: clampY(ball.to.y) }}
            transition={{ duration: 1.4, delay: 1.2, ease: "easeOut" }}
          />
        )}
      </svg>

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">{option?.outcome}</p>
        <Button size="sm" variant="outline" className="rounded-full" onClick={() => setRun((r) => r + 1)}>
          <RotateCcw className="mr-2 h-3.5 w-3.5" /> Replay
        </Button>
      </div>
    </div>
  );
}