import React from "react";
import { Eye, Radar, ShieldAlert, Timer } from "lucide-react";

const PRIMARY = "rounded-xl border border-white/10 bg-black/55 px-3 py-2 backdrop-blur-md";

function Stat({ label, value, tone = "text-white", icon: Icon }) {
  return (
    <div className={PRIMARY}>
      <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.18em] text-white/60">
        {Icon ? <Icon className="h-3 w-3" aria-hidden="true" /> : null}
        {label}
      </p>
      <p className={`font-display text-xl leading-tight tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}

/**
 * Glass HUD that floats over the pitch.
 * Primary row: who is on the ball, their scan score, nearest missed threat.
 * Secondary row: phase-style context (blindspot count, effective vision).
 */
export default function SimulatorHud({ belief, blindspotCount, fovDegrees, nearestThreat }) {
  const player = belief?.observer;
  const scan = player ? player.scan_quality : null;
  const scanTone = scan == null ? "text-white" : scan >= 0.6 ? "text-emerald-400" : scan >= 0.4 ? "text-amber-400" : "text-red-400";

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex flex-wrap items-start justify-between gap-2 p-3 sm:p-4">
      <div className="flex flex-wrap gap-2">
        <Stat
          label="Active player"
          icon={Eye}
          value={player ? `#${player.number}` : "—"}
          tone={player?.team === "away" ? "text-red-400" : "text-sky-300"}
        />
        <Stat
          label="Scan score"
          icon={Radar}
          value={scan == null ? "—" : scan.toFixed(2)}
          tone={scanTone}
        />
        <Stat
          label="Nearest threat"
          icon={ShieldAlert}
          value={nearestThreat == null ? "None" : `${nearestThreat.toFixed(1)}m`}
          tone={nearestThreat == null ? "text-emerald-400" : "text-red-400"}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <div className={`${PRIMARY} flex items-center gap-2`}>
          <Timer className="h-3.5 w-3.5 text-white/60" aria-hidden="true" />
          <span className="text-[11px] uppercase tracking-[0.16em] text-white/70">Live frame</span>
        </div>
        <div className={`${PRIMARY} flex items-center gap-2`}>
          <span className="text-[11px] uppercase tracking-[0.16em] text-white/70">Vision</span>
          <span className="font-display text-sm tabular-nums text-emerald-400">{Math.round(fovDegrees || 0)}°</span>
        </div>
        <div className={`${PRIMARY} flex items-center gap-2`}>
          <span className="text-[11px] uppercase tracking-[0.16em] text-white/70">Blindspots</span>
          <span className={`font-display text-sm tabular-nums ${blindspotCount ? "text-red-400" : "text-emerald-400"}`}>
            {blindspotCount}
          </span>
        </div>
      </div>
    </div>
  );
}