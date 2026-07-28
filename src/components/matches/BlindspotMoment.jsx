import React from "react";
import { AlertTriangle, Play, Check, X } from "lucide-react";
import CorrectPlayPanel from "./CorrectPlayPanel";

export function timestampOf(event) {
  return Math.max(0, Math.round((event.minute || 0) * 60 + (event.second || 0)));
}

export function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function BlindspotMoment({ event, match, onPlay }) {
  const sev = Math.round((event.severity || 0) * 100);
  const tone = sev >= 75 ? "text-red-300" : sev >= 50 ? "text-amber-300" : "text-emerald-300";
  const ts = timestampOf(event);

  return (
    <div className="space-y-4 rounded-2xl border border-border/60 bg-card/40 p-5 transition-colors hover:border-emerald-400/40">
      <div className="flex gap-4">
        <button
          onClick={() => onPlay(Math.max(0, ts - 5))}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-400/15 text-emerald-300 hover:bg-emerald-400/25"
          title={`Jump to ${formatClock(ts)}`}
        >
          <Play className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug">{event.feedback}</p>
          <p className="mt-2 text-[11px] uppercase tracking-widest text-muted-foreground">
            {formatClock(ts)} · #{event.observer_player} missed #{event.missed_player} ·{" "}
            {event.distance_m?.toFixed(1)}m · {Math.round(event.angle_deg || 0)}° · scan{" "}
            {event.scan_quality?.toFixed(2)}
            {event.phase ? ` · ${event.phase.replace(/_/g, " ")}` : ""}
          </p>
        </div>
        <div className={`flex items-center gap-2 ${tone}`}>
          <AlertTriangle className="h-4 w-4" />
          <span className="font-display text-lg">{sev}%</span>
        </div>
      </div>

      {(event.what_went_right || event.what_went_wrong) && (
        <div className="grid gap-2 sm:grid-cols-2">
          {event.what_went_right && (
            <p className="flex gap-2 rounded-xl bg-emerald-400/10 p-3 text-xs leading-relaxed">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
              {event.what_went_right}
            </p>
          )}
          {event.what_went_wrong && (
            <p className="flex gap-2 rounded-xl bg-red-400/10 p-3 text-xs leading-relaxed">
              <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-300" />
              {event.what_went_wrong}
            </p>
          )}
        </div>
      )}

      <CorrectPlayPanel event={event} match={match} />
    </div>
  );
}