import React from "react";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";

export default function PlayerProfileCard({ profile }) {
  const grade =
    profile.avgScan >= 0.65 ? ["Strong scanner", "text-emerald-300"]
    : profile.avgScan >= 0.45 ? ["Inconsistent scanner", "text-amber-300"]
    : ["Ball-locked", "text-red-300"];

  return (
    <Link
      to={`/players/${profile.number}`}
      className="block rounded-3xl border border-border/60 bg-card/40 p-6 transition-colors hover:border-emerald-400/40"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-emerald-400/15 font-display text-lg text-emerald-300">
          {profile.number}
        </div>
        <div>
          <p className="font-heading text-sm">Player #{profile.number}</p>
          <p className={`text-xs ${grade[1]}`}>{grade[0]}</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        <div>
          <div className="mb-1 flex justify-between text-[11px] uppercase tracking-widest text-muted-foreground">
            <span>Avg scan quality</span>
            <span>{profile.avgScan.toFixed(2)}</span>
          </div>
          <Progress value={profile.avgScan * 100} className="h-1.5" />
        </div>
        <div>
          <div className="mb-1 flex justify-between text-[11px] uppercase tracking-widest text-muted-foreground">
            <span>Beaten behind shoulder</span>
            <span>{Math.round(profile.behindShare * 100)}%</span>
          </div>
          <Progress value={profile.behindShare * 100} className="h-1.5" />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
        {[
          ["Blindspots", profile.count],
          ["Matches", profile.matches],
          ["Avg sev", `${Math.round(profile.avgSeverity * 100)}%`],
        ].map(([l, v]) => (
          <div key={l} className="rounded-xl border border-border/60 py-3">
            <p className="font-display text-lg">{v}</p>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{l}</p>
          </div>
        ))}
      </div>

      {profile.worst?.feedback && (
        <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
          <span className="text-emerald-300">Worst moment: </span>
          {profile.worst.feedback}
        </p>
      )}
    </Link>
  );
}