import React from "react";
import { Link, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import ScanHeatmap from "@/components/players/ScanHeatmap";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft } from "lucide-react";

export default function PlayerProfile() {
  const { number } = useParams();
  const num = Number(number);

  const { data: events = [], isLoading } = useQuery({
    queryKey: ["all-events"],
    queryFn: () => base44.entities.BlindspotEvent.list("-created_date", 500),
  });

  const mine = events.filter((e) => e.observer_player === num);
  const avg = (fn) => (mine.length ? mine.reduce((s, e) => s + (fn(e) || 0), 0) / mine.length : 0);

  const phases = Object.entries(
    mine.reduce((acc, e) => {
      const k = (e.phase || "unknown").replace(/_/g, " ");
      acc[k] = (acc[k] || 0) + 1;
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
          {num}
        </div>
        <div>
          <h1 className="font-display text-3xl tracking-tight">Player #{num}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {mine.length} logged blindspots · avg scan {avg((e) => e.scan_quality).toFixed(2)} · avg severity{" "}
            {Math.round(avg((e) => e.severity) * 100)}%
          </p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading profile…</p>
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
                {phases.length === 0 && (
                  <p className="text-sm text-muted-foreground">No phase data yet.</p>
                )}
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
                {mine.slice(0, 6).map((e) => (
                  <li key={e.id} className="border-l-2 border-emerald-400/40 pl-3">
                    <span className="text-foreground">{Math.round(e.minute || 0)}'</span> {e.feedback}
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