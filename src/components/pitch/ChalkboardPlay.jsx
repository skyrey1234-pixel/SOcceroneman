import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Play, Pause, RotateCcw } from "lucide-react";

const W = 105;
const H = 68;
const DURATION = 3200; // ms for the whole sequence

const cx = (v) => Math.min(W - 2, Math.max(2, v ?? W / 2));
const cy = (v) => Math.min(H - 2, Math.max(2, v ?? H / 2));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

function Chalk() {
  const s = { fill: "none", stroke: "rgba(255,255,255,0.25)", strokeWidth: 0.35 };
  return (
    <g>
      <rect x="0" y="0" width={W} height={H} fill="#08251a" />
      <rect x="1" y="1" width={W - 2} height={H - 2} {...s} />
      <line x1={W / 2} y1="1" x2={W / 2} y2={H - 1} {...s} />
      <circle cx={W / 2} cy={H / 2} r="9.15" {...s} />
      <rect x="1" y={H / 2 - 20.16} width="16.5" height="40.32" {...s} />
      <rect x={W - 17.5} y={H / 2 - 20.16} width="16.5" height="40.32" {...s} />
      <rect x="1" y={H / 2 - 9.16} width="5.5" height="18.32" {...s} />
      <rect x={W - 6.5} y={H / 2 - 9.16} width="5.5" height="18.32" {...s} />
    </g>
  );
}

// O = our players, X = opponents — classic chalkboard notation.
function Marker({ m, t, highlight }) {
  const x = lerp(cx(m.from?.x), cx(m.to?.x), ease(t));
  const y = lerp(cy(m.from?.y), cy(m.to?.y), ease(t));
  const away = m.team === "away";
  const color = highlight ? "#f87171" : away ? "#fca5a5" : "#6ee7b7";

  return (
    <g transform={`translate(${x} ${y})`}>
      {highlight && <circle r="4.4" fill="none" stroke={color} strokeWidth="0.3" strokeDasharray="1 0.8" />}
      {away ? (
        <g stroke={color} strokeWidth="0.7" strokeLinecap="round">
          <line x1="-1.8" y1="-1.8" x2="1.8" y2="1.8" />
          <line x1="1.8" y1="-1.8" x2="-1.8" y2="1.8" />
        </g>
      ) : (
        <circle r="2.1" fill="none" stroke={color} strokeWidth="0.7" />
      )}
      <text y="-3.4" textAnchor="middle" fontSize="2.1" fill={color}>
        {m.number}{m.role ? ` ${m.role}` : ""}
      </text>
    </g>
  );
}

export default function ChalkboardPlay({ option, mistakeNumbers = [], startLabel, endLabel }) {
  const movements = option?.movements || [];
  const ball = option?.ball;
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  const raf = useRef(null);
  const startedAt = useRef(null);

  useEffect(() => {
    setT(0);
    setPlaying(true);
  }, [option]);

  useEffect(() => {
    if (!playing) return;
    startedAt.current = performance.now() - t * DURATION;
    const step = (now) => {
      const next = Math.min(1, (now - startedAt.current) / DURATION);
      setT(next);
      if (next < 1) raf.current = requestAnimationFrame(step);
      else setPlaying(false);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const ballT = Math.max(0, Math.min(1, (t - 0.45) / 0.5));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-widest text-muted-foreground">
        <span>Play starts {startLabel || "—"}</span>
        <span>Ends {endLabel || "—"}</span>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full rounded-2xl border border-border/60">
        <Chalk />

        {movements.map((m, i) => (
          <line
            key={`run-${i}`}
            x1={cx(m.from?.x)}
            y1={cy(m.from?.y)}
            x2={cx(m.to?.x)}
            y2={cy(m.to?.y)}
            stroke={m.team === "away" ? "rgba(252,165,165,0.3)" : "rgba(110,231,183,0.35)"}
            strokeWidth="0.3"
            strokeDasharray="1.4 1"
          />
        ))}

        {ball?.from && ball?.to && (
          <line
            x1={cx(ball.from.x)}
            y1={cy(ball.from.y)}
            x2={cx(ball.to.x)}
            y2={cy(ball.to.y)}
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="0.35"
            strokeDasharray="0.8 0.8"
          />
        )}

        {movements.map((m, i) => (
          <Marker key={i} m={m} t={t} highlight={mistakeNumbers.includes(m.number)} />
        ))}

        {ball?.from && ball?.to && (
          <circle
            r="1.2"
            fill="#ffffff"
            cx={lerp(cx(ball.from.x), cx(ball.to.x), ease(ballT))}
            cy={lerp(cy(ball.from.y), cy(ball.to.y), ease(ballT))}
          />
        )}
      </svg>

      <div className="flex items-center gap-3">
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8 rounded-full"
          onClick={() => setPlaying((p) => !p)}
        >
          {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
        </Button>
        <Slider
          value={[t * 100]}
          max={100}
          step={1}
          onValueChange={([v]) => { setPlaying(false); setT(v / 100); }}
          className="flex-1"
        />
        <Button
          size="icon"
          variant="outline"
          className="h-8 w-8 rounded-full"
          onClick={() => { setT(0); setPlaying(true); }}
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-4 text-[11px] uppercase tracking-widest text-muted-foreground">
        <span className="text-emerald-300">O = us</span>
        <span className="text-red-300">X = them</span>
        <span className="text-red-300">dashed ring = where we messed up</span>
      </div>
    </div>
  );
}