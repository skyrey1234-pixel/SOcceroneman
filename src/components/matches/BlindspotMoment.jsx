import React from "react";
import { AlertTriangle, Play } from "lucide-react";

export default function BlindspotMoment({ event, onPlay }) {
  const sev = Math.round((event.severity || 0) * 100);
  const tone = sev >= 75 ? "text-red-300" : sev >= 50 ? "text-amber-300" : "text-emerald-300";
  return (
    <div className="flex gap-4 rounded-2xl border border-border/60 bg-card/40 p-5 transition-colors hover:border-emerald-400/40">
      <button
        onClick={() => onPlay(Math.max(0, Math.round((event.minute || 0) * 60) - 5))}
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-400/15 text-emerald-300 hover:bg-emerald-400/25"
        title="Jump to this moment"
      >
        <Play className="h-4 w-4" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">{event.feedback}</p>
        <p className="mt-2 text-[11px] uppercase tracking-widest text-muted-foreground">
          {Math.round(event.minute || 0)}' · #{event.observer_player} missed #{event.missed_player} ·{" "}
          {event.distance_m?.toFixed(1)}m · {Math.round(event.angle_deg || 0)}° · scan{" "}
          {event.scan_quality?.toFixed(2)}
        </p>
      </div>
      <div className={`flex items-center gap-2 ${tone}`}>
        <AlertTriangle className="h-4 w-4" />
        <span className="font-display text-lg">{sev}%</span>
      </div>
    </div>
  );
}