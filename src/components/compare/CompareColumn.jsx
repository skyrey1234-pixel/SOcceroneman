import React from "react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import ScanHeatmap from "@/components/players/ScanHeatmap";
import { formatClock, timestampOf } from "@/components/matches/BlindspotMoment";

function Stat({ label, value }) {
  return (
    <div className="rounded-xl border border-border/60 py-3 text-center">
      <p className="font-display text-lg">{value}</p>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
    </div>
  );
}

export default function CompareColumn({ matches, matchId, onMatch, match, events }) {
  const avg = (fn) => (events.length ? events.reduce((s, e) => s + (fn(e) || 0), 0) / events.length : 0);

  return (
    <div className="space-y-5 rounded-3xl border border-border/60 bg-card/40 p-6">
      <Select value={matchId || ""} onValueChange={onMatch}>
        <SelectTrigger><SelectValue placeholder="Choose a match" /></SelectTrigger>
        <SelectContent>
          {matches.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.title}{m.opponent ? ` vs ${m.opponent}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {!match ? (
        <p className="py-16 text-center text-sm text-muted-foreground">Nothing selected.</p>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Blindspots" value={events.length} />
            <Stat label="Avg scan" value={avg((e) => e.scan_quality).toFixed(2)} />
            <Stat label="Avg sev" value={`${Math.round(avg((e) => e.severity) * 100)}%`} />
          </div>

          <div>
            <p className="mb-2 text-[11px] uppercase tracking-widest text-muted-foreground">
              Blindspot zones
            </p>
            <ScanHeatmap events={events} />
          </div>

          {match.summary && (
            <p className="text-xs leading-relaxed text-muted-foreground">{match.summary}</p>
          )}

          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
              Worst moments
            </p>
            {[...events]
              .sort((a, b) => (b.severity || 0) - (a.severity || 0))
              .slice(0, 5)
              .map((e) => (
                <div key={e.id} className="rounded-xl border border-border/60 p-3 text-xs leading-relaxed">
                  <span className="text-emerald-300">{formatClock(timestampOf(e))}</span> · #
                  {e.observer_player} missed #{e.missed_player} —{" "}
                  <span className="text-muted-foreground">{e.feedback}</span>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}