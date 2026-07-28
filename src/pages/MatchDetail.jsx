import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { runAnalysis } from "@/lib/analyze";
import { ArrowLeft, Loader2, Sparkles, AlertTriangle } from "lucide-react";

export default function MatchDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [running, setRunning] = useState(false);

  const { data: match } = useQuery({
    queryKey: ["match", id],
    queryFn: () => base44.entities.Match.get(id),
  });
  const { data: events = [] } = useQuery({
    queryKey: ["events", id],
    queryFn: () => base44.entities.BlindspotEvent.filter({ match_id: id }, "minute"),
  });

  if (!match) return <p className="text-sm text-muted-foreground">Loading match…</p>;

  const analyze = async () => {
    setRunning(true);
    await runAnalysis(match);
    await qc.invalidateQueries({ queryKey: ["match", id] });
    await qc.invalidateQueries({ queryKey: ["events", id] });
    setRunning(false);
  };

  const stats = [
    ["Frames", match.frames_processed ?? "—"],
    ["Players tracked", match.unique_players ?? "—"],
    ["Blindspots", match.total_blindspots ?? 0],
    ["Avg scan quality", match.avg_scan_quality ? match.avg_scan_quality.toFixed(2) : "—"],
  ];

  return (
    <div className="space-y-8">
      <Link to="/matches" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> All matches
      </Link>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Badge variant="secondary">{match.status}</Badge>
          <h1 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">{match.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {match.opponent ? `vs ${match.opponent} · ` : ""}
            {match.match_date || "no date"} · {match.camera_type} camera
          </p>
        </div>
        <Button onClick={analyze} disabled={running} className="rounded-full">
          {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {match.status === "complete" ? "Re-run analysis" : "Run analysis"}
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {stats.map(([label, val]) => (
          <div key={label} className="rounded-2xl border border-border/60 bg-card/40 p-5">
            <p className="font-display text-2xl">{val}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {match.video_url && (
        <video src={match.video_url} controls className="w-full rounded-3xl border border-border/60" />
      )}

      {match.summary && (
        <section className="rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-6">
          <h2 className="mb-3 font-heading text-sm uppercase tracking-[0.25em] text-emerald-300">
            Coaching summary
          </h2>
          <p className="text-sm leading-relaxed text-foreground/90">{match.summary}</p>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="font-heading text-sm uppercase tracking-[0.25em] text-muted-foreground">
          Key blindspot moments
        </h2>
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Run the analysis to surface the moments where players missed what they could have seen.
          </p>
        ) : (
          events.map((e) => (
            <div key={e.id} className="flex gap-4 rounded-2xl border border-border/60 bg-card/40 p-5">
              <div className="w-14 shrink-0 text-center">
                <p className="font-display text-xl">{Math.round(e.minute)}'</p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug">{e.feedback}</p>
                <p className="mt-2 text-[11px] uppercase tracking-widest text-muted-foreground">
                  #{e.observer_player} missed #{e.missed_player} · {e.distance_m?.toFixed(1)}m ·{" "}
                  {Math.round(e.angle_deg)}° · scan {e.scan_quality?.toFixed(2)}
                </p>
              </div>
              <div className="flex items-center gap-2 text-red-300">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-display text-lg">{Math.round((e.severity || 0) * 100)}%</span>
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  );
}