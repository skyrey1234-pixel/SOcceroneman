import React from "react";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { effectiveFov } from "@/lib/blindspot";

export default function PlayerInspector({ player, belief, onChange }) {
  if (!player) {
    return (
      <p className="text-sm text-muted-foreground">
        Tap a player on the pitch to inspect their belief state.
      </p>
    );
  }
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-full grid place-items-center font-bold text-slate-900"
          style={{ background: player.team === "home" ? "#38bdf8" : "#ef4444" }}
        >
          {player.number}
        </div>
        <div>
          <p className="font-heading text-sm">{player.team === "home" ? "Home" : "Away"} · #{player.number}</p>
          <p className="text-xs text-muted-foreground">
            {player.x.toFixed(1)}m, {player.y.toFixed(1)}m · facing {Math.round(player.facing)}°
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs uppercase tracking-widest text-muted-foreground">
          <span>Facing</span>
          <span>{Math.round(player.facing)}°</span>
        </div>
        <Slider
          value={[player.facing]}
          min={-180}
          max={180}
          step={1}
          onValueChange={([v]) => onChange({ facing: v })}
        />
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-xs uppercase tracking-widest text-muted-foreground">
          <span>Scan quality</span>
          <span>{player.scan_quality.toFixed(2)}</span>
        </div>
        <Slider
          value={[player.scan_quality * 100]}
          min={10}
          max={100}
          step={1}
          onValueChange={([v]) => onChange({ scan_quality: v / 100 })}
        />
        <p className="text-xs text-muted-foreground">
          Effective field of view {Math.round(effectiveFov(player.scan_quality))}°
        </p>
      </div>

      {belief && (
        <div className="grid grid-cols-3 gap-2 text-center">
          {[
            ["Could see", belief.geometric.length],
            ["Does see", belief.perceived.length],
            ["Missed", belief.blindspots.length],
          ].map(([label, val]) => (
            <div key={label} className="rounded-xl border border-border/60 py-3">
              <p className="font-display text-xl">{val}</p>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      )}

      <Badge variant={belief?.ballVisible ? "default" : "destructive"}>
        Ball {belief?.ballVisible ? "visible" : "not visible"}
      </Badge>
    </div>
  );
}