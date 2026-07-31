import React from "react";
import { Link, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import ScanHeatmap from "@/components/players/ScanHeatmap";
import { Progress } from "@/components/ui/progress";
import { isApprovedEvent } from "@/lib/review";
import { ArrowLeft } from "lucide-react";

export default function PlayerProfile() {
  const { number } = useParams();
  const playerNumber = Number(number);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["all-events"],
    queryFn: () => base44.entities.BlindspotEvent.list("-created_date", 500),
  });

  const mine = events.filter((event) => event.observer_player === playerNumber && isApprovedEvent(event));
  const avg = (metric) => (mine.length ? mine.reduce((sum, event) => sum + (metric(event) || 0), 0) / mine.length : 0);

  const phases = Object.entries(
    mine.reduce((acc, event) => {
      const phase = (event.phase || "unknown").replace(/_/g, " ");
      acc[phase] = (acc[phase] || 0) + 1;
      return acc;
    }, {})
  ).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-8">
      <Link to="/players" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All players
      </Link>

      <div className="flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-400/15 font-display text-2xl text-emerald-300">
          {playerNumber}
        </div>
        <div>
          <h1 className="font-display text-3xl tracking-tight">Player #{playerNumber}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mine.length} coach-approved blindspots · avg scan {avg((event) => event.scan_quality).toFixed(2)} · avg severity {" "}
            {Math.round(avg((event) => event.severity) * 100)}%
          </p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading profile…</p>
      ) : mine.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/60 p-16 text-center text-sm text-muted-foreground">
          No coach-approved blindspot evidence has been logged for this player yet.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.3fr,1fr]">
          <section className="rounded-3xl border border-border/60 bg-card/40 p-6">
            <h2 className="mb-4 font-heading text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Claustrophobia map
            </h2>
            <ScanHeatmap events={mine} />
          </section>

          <div className="space-y-6">
            <section className="rounded-3xl border border-border/60 bg-card/40 p-6">
              <h2 className="mb-4 font-heading text-xs uppercase tracking-[0.25em] text-muted-foreground">
                Where it breaks down
              </h2>
              <div className="space-y-3">
                {phases.map(([phase, count]) => (
                  <div key={phase}>
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="capitalize">{phase}</span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <Progress value={(count / mine.length) * 100} className="h-1.5" />
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-3xl border border-border/60 bg-card/40 p-6">
              <h2 className="mb-4 font-heading text-xs uppercase tracking-[0.25em] text-muted-foreground">
                Recurring cues
              </h2>
              <ul className="space-y-3 text-xs leading-relaxed text-muted-foreground">
                {mine.slice(0, 6).map((event) => (
                  <li key={event.id} className="border-l-2 border-emerald-400/40 pl-3">
                    <span className="text-foreground">{Math.round(event.minute || 0)}'</span> {event.feedback}
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
