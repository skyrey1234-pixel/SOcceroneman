import React from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import MatchCard from "@/components/matches/MatchCard";
import { Button } from "@/components/ui/button";
import { Radar, AlertTriangle, Eye, Film } from "lucide-react";

export default function Dashboard() {
  const { data: matches = [] } = useQuery({
    queryKey: ["matches"],
    queryFn: () => base44.entities.Match.list("-created_date", 6),
  });

  const totalBlindspots = matches.reduce((s, m) => s + (m.total_blindspots || 0), 0);
  const scans = matches.filter((m) => m.avg_scan_quality);
  const avgScan = scans.length
    ? (scans.reduce((s, m) => s + m.avg_scan_quality, 0) / scans.length).toFixed(2)
    : "—";

  const stats = [
    { label: "Matches analyzed", value: matches.length, icon: Film },
    { label: "Blindspots found", value: totalBlindspots, icon: AlertTriangle },
    { label: "Avg scan quality", value: avgScan, icon: Eye },
  ];

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-gradient-to-br from-emerald-400/10 via-card/40 to-background p-10 sm:p-14">
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Theory of mind engine</p>
        <h1 className="mt-4 max-w-2xl font-display text-4xl leading-[1.05] tracking-tight sm:text-5xl">
          See what your players <span className="text-emerald-300">didn't</span> see.
        </h1>
        <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
          Model every player's field of view, scan quality and belief state — then surface the runners they
          missed and the coaching cue that fixes it.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild className="rounded-full">
            <Link to="/simulator"><Radar className="mr-2 h-4 w-4" /> Open live pitch</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full">
            <Link to="/matches">Review matches</Link>
          </Button>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-2xl border border-border/60 bg-card/40 p-6">
            <Icon className="mb-4 h-5 w-5 text-emerald-300" />
            <p className="font-display text-3xl">{value}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
          </div>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-sm uppercase tracking-[0.25em] text-muted-foreground">
            Recent matches
          </h2>
          <Link to="/matches" className="text-sm text-emerald-300">View all</Link>
        </div>
        {matches.length === 0 ? (
          <p className="text-sm text-muted-foreground">No matches yet — add your first upload.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {matches.map((m) => <MatchCard key={m.id} match={m} />)}
          </div>
        )}
      </section>
    </div>
  );
}