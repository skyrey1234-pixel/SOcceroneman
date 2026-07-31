import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { captureBaseline, progressSnapshot, percentage } from "@/lib/playerMetrics";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Goal,
  SkipForward,
} from "lucide-react";

function MetricTrend({ label, baseline, retest, inverted = false }) {
  if (baseline == null || retest == null) return null;
  const delta = retest - baseline;
  const improved = inverted ? delta < -0.01 : delta > 0.01;
  const flat = Math.abs(delta) <= 0.01;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-display text-lg">{percentage(retest)}</span>
        {!flat && (
          <span className={`flex items-center text-xs ${improved ? "text-emerald-400" : "text-amber-400"}`}>
            {improved ? <ArrowUpRight className="mr-0.5 h-3 w-3" /> : <ArrowDownRight className="mr-0.5 h-3 w-3" />}
            {percentage(Math.abs(delta))}
          </span>
        )}
      </div>
    </div>
  );
}

function dateAfterDays(startDate, days) {
  const value = new Date(`${startDate}T12:00:00`);
  value.setDate(value.getDate() + days);
  return value.toISOString().slice(0, 10);
}

function sessionPlan(startDate) {
  // Two deliberately spaced sessions per week: day 0/3, 7/10, 14/17, 21/24.
  return Array.from({ length: 8 }, (_, index) => ({
    week_number: Math.floor(index / 2) + 1,
    session_number: index + 1,
    scheduled_date: dateAfterDays(startDate, Math.floor(index / 2) * 7 + (index % 2 ? 3 : 0)),
  }));
}

export default function TrainingBlockManager({ playerNumber, activeBlock, latestCompletedBlock, allEvents, onBlockCreated }) {
  const qc = useQueryClient();
  const [starting, setStarting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [updatingSessionId, setUpdatingSessionId] = useState(null);

  const { data: sessions = [] } = useQuery({
    queryKey: ["training-sessions", activeBlock?.id],
    queryFn: () => activeBlock ? base44.entities.TrainingSession.filter({ training_block_id: activeBlock.id }, "session_number") : [],
    enabled: !!activeBlock?.id,
  });

  const completedSessions = useMemo(
    () => sessions.filter((session) => session.status === "complete"),
    [sessions]
  );
  const unresolvedSessions = useMemo(
    () => sessions.filter((session) => session.status === "scheduled"),
    [sessions]
  );

  const invalidateBlock = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["training-blocks", playerNumber] }),
      qc.invalidateQueries({ queryKey: ["training-sessions", activeBlock?.id] }),
    ]);
  };

  const startNewBlock = async (focusTitle) => {
    setStarting(true);
    try {
      const baseline = captureBaseline(allEvents);
      const sourceMatchIds = [...new Set(allEvents.map((event) => event.match_id).filter(Boolean))];
      const coach = await base44.auth.me().catch(() => null);
      const createdBy = coach?.id || coach?.email || "coach";
      const startDate = new Date().toISOString().slice(0, 10);
      const plan = sessionPlan(startDate);
      const block = await base44.entities.TrainingBlock.create({
        player_number: playerNumber,
        title: `${focusTitle} Block`,
        focus: focusTitle,
        status: "active",
        start_date: startDate,
        end_date: dateAfterDays(startDate, 27),
        duration_weeks: 4,
        sessions_planned: plan.length,
        sessions_completed: 0,
        baseline,
        baseline_event_ids: allEvents.map((event) => event.id),
        source_match_ids: sourceMatchIds,
        created_by: createdBy,
      });

      await base44.entities.TrainingSession.bulkCreate(
        plan.map((session) => ({
          ...session,
          training_block_id: block.id,
          player_number: playerNumber,
          status: "scheduled",
          drill_ids: [],
          created_by: createdBy,
        }))
      );
      toast({
        title: "4-week block started",
        description: `Baseline captured at ${percentage(baseline.avg_scan_quality)} scan quality. Eight sessions are now scheduled.`,
      });
      await invalidateBlock();
      if (onBlockCreated) onBlockCreated(block);
    } catch (error) {
      toast({ variant: "destructive", title: "Could not start block", description: error?.message || "Please try again." });
    } finally {
      setStarting(false);
    }
  };

  const updateSession = async (session, nextStatus) => {
    if (!activeBlock) return;
    setUpdatingSessionId(session.id);
    try {
      const completedAt = nextStatus === "complete" ? new Date().toISOString() : null;
      await base44.entities.TrainingSession.update(session.id, {
        status: nextStatus,
        completed_at: completedAt,
        completion_score: nextStatus === "complete" ? 100 : undefined,
      });
      const nextCompleted = sessions.filter((item) => item.status === "complete" && item.id !== session.id).length + (nextStatus === "complete" ? 1 : 0);
      await base44.entities.TrainingBlock.update(activeBlock.id, { sessions_completed: nextCompleted });
      toast({
        title: nextStatus === "complete" ? "Session logged" : "Session skipped",
        description: nextStatus === "complete" ? "Training execution is now part of the player’s progress record." : "The session remains visible but will not count as completed work.",
      });
      await invalidateBlock();
    } catch (error) {
      toast({ variant: "destructive", title: "Session was not updated", description: error?.message || "Please try again." });
    } finally {
      setUpdatingSessionId(null);
    }
  };

  const completeBlock = async () => {
    if (!activeBlock) return;
    if (sessions.length && unresolvedSessions.length) {
      toast({
        variant: "destructive",
        title: "Finish the session log first",
        description: `${unresolvedSessions.length} planned session${unresolvedSessions.length === 1 ? " is" : "s are"} still unlogged. Mark each complete or skipped before the retest.`,
      });
      return;
    }
    if (sessions.length && completedSessions.length < Math.ceil((activeBlock.sessions_planned || 8) / 2)) {
      toast({
        variant: "destructive",
        title: "Not enough completed sessions",
        description: "Complete at least half of the planned training sessions before closing the block and claiming a progress comparison.",
      });
      return;
    }
    setCompleting(true);
    try {
      const retest = captureBaseline(allEvents);
      await base44.entities.TrainingBlock.update(activeBlock.id, {
        status: "complete",
        retest,
        sessions_completed: completedSessions.length,
        completed_at: new Date().toISOString(),
      });
      toast({ title: "Training block completed", description: "The before-and-after player snapshot is now saved for review." });
      await invalidateBlock();
    } catch (error) {
      toast({ variant: "destructive", title: "Could not complete block", description: error?.message || "Please try again." });
    } finally {
      setCompleting(false);
    }
  };

  if (!activeBlock) {
    const latestProgress = latestCompletedBlock?.retest
      ? progressSnapshot(latestCompletedBlock.baseline, latestCompletedBlock.retest)
      : null;
    return (
      <>
        {latestCompletedBlock && (
          <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-300">Latest completed block</p>
                <h3 className="mt-1 font-display text-lg">{latestCompletedBlock.title}</h3>
              </div>
              <Badge variant="secondary" className="bg-emerald-400/10 text-emerald-300">Progress record saved</Badge>
            </div>
            {latestProgress?.comparison_ready ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <MetricTrend label="Scan Quality" baseline={latestCompletedBlock.baseline?.avg_scan_quality} retest={latestCompletedBlock.retest?.avg_scan_quality} />
                <MetricTrend label="Severity" inverted baseline={latestCompletedBlock.baseline?.avg_severity} retest={latestCompletedBlock.retest?.avg_severity} />
                <MetricTrend label="Blind-side Share" inverted baseline={latestCompletedBlock.baseline?.behind_share} retest={latestCompletedBlock.retest?.behind_share} />
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">The block is complete, but review fresh approved match evidence to make its before-and-after comparison meaningful.</p>
            )}
          </div>
        )}
        <div className="rounded-3xl border border-dashed border-emerald-400/30 bg-emerald-400/5 p-6 text-center">
        <Goal className="mx-auto mb-3 h-8 w-8 text-emerald-400/60" />
        <h3 className="font-heading text-sm uppercase tracking-[0.2em] text-emerald-300">Measurable Progress</h3>
        <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-emerald-100/70">
          Turn isolated drills into a 4-week development block. We capture the coach-approved baseline now, schedule eight sessions, then compare the player again after the work is done.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button size="sm" variant="outline" onClick={() => startNewBlock("Scanning Habit")} disabled={starting} className="rounded-full border-emerald-400/30 hover:bg-emerald-400/10">
            Start Scanning Block
          </Button>
          <Button size="sm" variant="outline" onClick={() => startNewBlock("Body Orientation")} disabled={starting} className="rounded-full border-emerald-400/30 hover:bg-emerald-400/10">
            Start Orientation Block
          </Button>
        </div>
        </div>
      </>
    );
  }

  const progress = progressSnapshot(activeBlock.baseline, activeBlock.retest || captureBaseline(allEvents));
  const isComplete = activeBlock.status === "complete";
  const executionLabel = sessions.length ? `${completedSessions.length}/${activeBlock.sessions_planned || sessions.length} sessions complete` : "Scheduling legacy block";

  return (
    <div className="rounded-3xl border border-border/60 bg-card/40 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-emerald-400/10 text-emerald-400 hover:bg-emerald-400/10">
              {isComplete ? "Completed Block" : "Active Block"}
            </Badge>
            {activeBlock.start_date && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" /> {activeBlock.start_date}
              </span>
            )}
          </div>
          <h3 className="mt-3 font-display text-xl">{activeBlock.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{executionLabel}</p>
        </div>
        {!isComplete && (
          <Button size="sm" onClick={completeBlock} disabled={completing} className="rounded-full">
            <CheckCircle2 className="mr-2 h-4 w-4" /> Finish & Snapshot
          </Button>
        )}
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-3">
        <div className="rounded-2xl bg-background/50 p-4">
          <MetricTrend label="Scan Quality" baseline={activeBlock.baseline?.avg_scan_quality} retest={activeBlock.retest?.avg_scan_quality || progress?.avg_scan_quality} />
        </div>
        <div className="rounded-2xl bg-background/50 p-4">
          <MetricTrend label="Severity" inverted baseline={activeBlock.baseline?.avg_severity} retest={activeBlock.retest?.avg_severity || progress?.avg_severity} />
        </div>
        <div className="rounded-2xl bg-background/50 p-4">
          <MetricTrend label="Blind-side Share" inverted baseline={activeBlock.baseline?.behind_share} retest={activeBlock.retest?.behind_share || progress?.behind_share} />
        </div>
      </div>

      {!isComplete && sessions.length > 0 && (
        <div className="mt-6 rounded-2xl border border-border/60 bg-background/30 p-4">
          <div className="mb-3 flex items-center gap-2">
            <Activity className="h-4 w-4 text-emerald-300" />
            <h4 className="font-heading text-xs uppercase tracking-[0.2em] text-muted-foreground">Session execution</h4>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {sessions.map((session) => {
              const done = session.status === "complete";
              const skipped = session.status === "skipped";
              const busy = updatingSessionId === session.id;
              return (
                <div key={session.id} className="flex items-center justify-between gap-2 rounded-xl border border-border/50 px-3 py-2 text-xs">
                  <div className="min-w-0">
                    <p className="font-medium">Week {session.week_number} · Session {session.session_number}</p>
                    <p className="mt-0.5 text-muted-foreground">{session.scheduled_date || "Date to schedule"}</p>
                  </div>
                  {done || skipped ? (
                    <Badge variant="secondary" className={done ? "bg-emerald-400/10 text-emerald-300" : "bg-muted text-muted-foreground"}>
                      {done ? "Completed" : "Skipped"}
                    </Badge>
                  ) : (
                    <div className="flex shrink-0 gap-1">
                      <Button size="sm" className="h-7 rounded-full px-2 text-[10px]" disabled={busy} onClick={() => updateSession(session, "complete")}>
                        <CheckCircle2 className="mr-1 h-3 w-3" /> Done
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 rounded-full px-2 text-[10px]" disabled={busy} onClick={() => updateSession(session, "skipped")}>
                        <SkipForward className="mr-1 h-3 w-3" /> Skip
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!isComplete && progress?.comparison_ready === false && (
        <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" /> Log the planned sessions and review fresh matches after the baseline to make the before-and-after comparison meaningful.
        </p>
      )}
      {isComplete && (
        <p className="mt-4 flex items-center gap-2 text-xs text-emerald-200/80">
          <ChevronRight className="h-3.5 w-3.5" /> This block is now a historical progress record. Start a new block for the player’s next development focus.
        </p>
      )}
    </div>
  );
}
