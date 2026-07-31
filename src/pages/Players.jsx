import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import PlayerProfileCard from "@/components/players/PlayerProfileCard";
import { isApprovedEvent } from "@/lib/review";
import { Users } from "lucide-react";

export default function Players() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["all-events"],
    queryFn: () => base44.entities.BlindspotEvent.list("-created_date", 500),
  });

  const approvedEvents = events.filter(isApprovedEvent);
  const profiles = Object.values(
    approvedEvents.reduce((acc, event) => {
      const playerNumber = event.observer_player;
      if (playerNumber == null) return acc;
      acc[playerNumber] = acc[playerNumber] || { number: playerNumber, events: [], matches: new Set() };
      acc[playerNumber].events.push(event);
      acc[playerNumber].matches.add(event.match_id);
      return acc;
    }, {})
  )
    .map((profile) => ({
      number: profile.number,
      count: profile.events.length,
      matches: profile.matches.size,
      avgSeverity: profile.events.reduce((sum, event) => sum + (event.severity || 0), 0) / profile.events.length,
      avgScan:
        profile.events.reduce((sum, event) => sum + (event.scan_quality || 0), 0) / profile.events.length || 0,
      behindShare:
        profile.events.filter((event) => Math.abs(event.angle_deg || 0) > 100).length / profile.events.length,
      worst: profile.events.slice().sort((a, b) => (b.severity || 0) - (a.severity || 0))[0],
    }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Squad</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">Scanning profiles</h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Coach-approved blindspot habits aggregated across reviewed matches — who scans, who locks on
          the ball, and who keeps getting beaten behind the shoulder.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading profiles…</p>
      ) : profiles.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/60 p-16 text-center">
          <Users className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
          <p className="font-heading">No coach-approved profiles yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Review a match and approve the blindspot moments you trust to build player profiles.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {profiles.map((profile) => <PlayerProfileCard key={profile.number} profile={profile} />)}
        </div>
      )}
    </div>
  );
}
