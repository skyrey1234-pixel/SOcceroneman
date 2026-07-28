import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import PlayerProfileCard from "@/components/players/PlayerProfileCard";
import { Users } from "lucide-react";

export default function Players() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["all-events"],
    queryFn: () => base44.entities.BlindspotEvent.list("-created_date", 500),
  });

  const profiles = Object.values(
    events.reduce((acc, e) => {
      const k = e.observer_player;
      if (k == null) return acc;
      acc[k] = acc[k] || { number: k, events: [], matches: new Set() };
      acc[k].events.push(e);
      acc[k].matches.add(e.match_id);
      return acc;
    }, {})
  )
    .map((p) => ({
      number: p.number,
      count: p.events.length,
      matches: p.matches.size,
      avgSeverity: p.events.reduce((s, e) => s + (e.severity || 0), 0) / p.events.length,
      avgScan:
        p.events.reduce((s, e) => s + (e.scan_quality || 0), 0) / p.events.length || 0,
      behindShare:
        p.events.filter((e) => Math.abs(e.angle_deg || 0) > 100).length / p.events.length,
      worst: p.events.slice().sort((a, b) => (b.severity || 0) - (a.severity || 0))[0],
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Squad</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">Scanning profiles</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Every player's blindspot habits aggregated across analyzed matches — who scans, who locks on
          the ball, and who keeps getting beaten behind the shoulder.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading profiles…</p>
      ) : profiles.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/60 p-16 text-center">
          <Users className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
          <p className="font-heading">No profiles yet</p>
          <p className="mt-1 text-sm text-muted-foreground">Analyze a match to build player profiles.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {profiles.map((p) => <PlayerProfileCard key={p.number} profile={p} />)}
        </div>
      )}
    </div>
  );
}