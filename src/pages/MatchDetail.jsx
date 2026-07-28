import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import MatchVideoPlayer from "@/components/matches/MatchVideoPlayer";
import MatchCharts from "@/components/matches/MatchCharts";
import BlindspotMoment from "@/components/matches/BlindspotMoment";
import { runAnalysis } from "@/lib/analyze";
import { downloadCsv } from "@/lib/exportCsv";
import { ArrowLeft, Loader2, Sparkles, Download } from "lucide-react";

export default function MatchDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [running, setRunning] = useState(false);
  const [seek, setSeek] = useState(null);
  const [minSeverity, setMinSeverity] = useState("0");
  const [playerFilter, setPlayerFilter] = useState("all");

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
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["match", id] }),
      qc.invalidateQueries({ queryKey: ["events", id] }),
      qc.invalidateQueries({ queryKey: ["all-events"] }),
    ]);
    setRunning(false);
  };

  const playerNumbers = [...new Set(events.map((e) => e.observer_player))].sort((a, b) => a - b);
  const filtered = events.filter(
    (e) =>
      (e.severity || 0) >= Number(minSeverity) &&
      (playerFilter === "all" || String(e.observer_player) === playerFilter)
  );

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
        <div className="flex gap-2">
          {events.length > 0 && (
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() =>
                downloadCsv(
                  `${match.title.replace(/\s+/g, "_")}_blindspots.csv`,
                  events.map((e) => ({
                    minute: e.minute, observer: e.observer_player, missed: e.missed_player,
                    severity: e.severity, distance_m: e.distance_m, angle_deg: e.angle_deg,
                    scan_quality: e.scan_quality, feedback: e.feedback,
                  }))
                )
              }
            >
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          )}
          <Button onClick={analyze} disabled={running} className="rounded-full">
            {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {match.status === "complete" ? "Re-run analysis" : "Run analysis"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {stats.map(([label, val]) => (
          <div key={label} className="rounded-2xl border border-border/60 bg-card/40 p-5">
            <p className="font-display text-2xl">{val}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <MatchVideoPlayer match={match} seekSeconds={seek} />

      {match.summary && (
        <section className="rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-6">
          <h2 className="mb-3 font-heading text-sm uppercase tracking-[0.25em] text-emerald-300">
            Coaching summary
          </h2>
          <p className="text-sm leading-relaxed text-foreground/90">{match.summary}</p>
        </section>
      )}

      {events.length > 0 && <MatchCharts events={events} />}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-sm uppercase tracking-[0.25em] text-muted-foreground">
            Key blindspot moments
          </h2>
          {events.length > 0 && (
            <div className="flex gap-2">
              <Select value={playerFilter} onValueChange={setPlayerFilter}>
                <SelectTrigger className="w-[140px] rounded-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All players</SelectItem>
                  {playerNumbers.map((n) => (
                    <SelectItem key={n} value={String(n)}>Player #{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={minSeverity} onValueChange={setMinSeverity}>
                <SelectTrigger className="w-[150px] rounded-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any severity</SelectItem>
                  <SelectItem value="0.5">50%+ severity</SelectItem>
                  <SelectItem value="0.75">Critical only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {events.length === 0
              ? "Run the analysis to surface the moments where players missed what they could have seen."
              : "No moments match these filters."}
          </p>
        ) : (
          filtered.map((e) => <BlindspotMoment key={e.id} event={e} onPlay={setSeek} />)
        )}
      </section>
    </div>
  );
}