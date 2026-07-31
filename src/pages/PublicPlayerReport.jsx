import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { formatVideoTimestamp } from "@/lib/evidence";
import { percentage } from "@/lib/playerMetrics";
import { AlertCircle, Calendar, Goal, Loader2, ShieldCheck, Video } from "lucide-react";

export default function PublicPlayerReport() {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);

  useEffect(() => {
    async function load() {
      try {
        const result = await base44.functions.invoke("get-player-report", { token });
        if (result?.error) throw new Error(result.error);
        setReport(result);
      } catch (err) {
        setError(err.message || "This report is unavailable.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [token]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="mb-4 h-12 w-12 text-muted-foreground" />
        <h1 className="font-display text-2xl">Report Unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error}</p>
      </div>
    );
  }

  const { player, metrics, recent_events, progress, drills } = report;

  return (
    <div className="mx-auto max-w-3xl space-y-12 p-6 pb-24 pt-12 sm:p-12">
      <header className="text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-emerald-400/15 font-display text-3xl text-emerald-300">
          {player.number}
        </div>
        <h1 className="font-display text-4xl tracking-tight">Development Report</h1>
        <p className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-400" /> Secure read-only access
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-border/60 bg-card/40 p-6 text-center">
          <p className="font-display text-3xl">{percentage(metrics.avg_scan_quality)}</p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Scan Quality</p>
        </div>
        <div className="rounded-3xl border border-border/60 bg-card/40 p-6 text-center">
          <p className="font-display text-3xl">{percentage(metrics.behind_share)}</p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Blind-side misses</p>
        </div>
        <div className="rounded-3xl border border-border/60 bg-card/40 p-6 text-center">
          <p className="font-display text-3xl">{metrics.event_count}</p>
          <p className="mt-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Reviewed moments</p>
        </div>
      </section>

      {progress && (
        <section className="rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-8">
          <div className="flex items-center gap-3">
            <Goal className="h-6 w-6 text-emerald-400" />
            <h2 className="font-display text-2xl">Active Training Block</h2>
          </div>
          <p className="mt-2 text-sm text-emerald-100/70">Focus: {progress.focus}</p>
          <div className="mt-6 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Baseline scan: {percentage(progress.baseline?.avg_scan_quality)}</span>
            <span className="text-emerald-300">Target: +15%</span>
          </div>
        </section>
      )}

      {drills?.length > 0 && (
        <section>
          <h2 className="mb-6 font-heading text-sm uppercase tracking-[0.25em] text-muted-foreground">Assigned Drills</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {drills.map((drill) => (
              <div key={drill.id} className="rounded-3xl border border-border/60 bg-card/40 p-6">
                <h3 className="font-display text-lg">{drill.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{drill.how_it_runs}</p>
                <div className="mt-4 flex gap-2">
                  <span className="inline-flex items-center rounded-full bg-background/50 px-2.5 py-1 text-xs text-muted-foreground">
                    <Calendar className="mr-1.5 h-3 w-3" /> {drill.duration_min} min
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {recent_events?.length > 0 && (
        <section>
          <h2 className="mb-6 font-heading text-sm uppercase tracking-[0.25em] text-muted-foreground">Recent Evidence</h2>
          <div className="space-y-4">
            {recent_events.map((event) => (
              <div key={event.id} className="rounded-3xl border border-border/60 bg-card/40 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-emerald-400">{formatVideoTimestamp(event.timestamp_seconds)}</span>
                      <span className="text-xs text-muted-foreground">{event.match_title}</span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-foreground/90">{event.feedback}</p>
                  </div>
                  {event.evidence_source === "computer_vision" && (
                    <Video className="h-5 w-5 shrink-0 text-muted-foreground/50" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
