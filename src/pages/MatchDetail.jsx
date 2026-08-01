import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import MatchVideoPlayer from "@/components/matches/MatchVideoPlayer";
import MatchCharts from "@/components/matches/MatchCharts";
import BlindspotMoment from "@/components/matches/BlindspotMoment";
import { runAnalysis } from "@/lib/analyze";
import { downloadCsv } from "@/lib/exportCsv";
import { isApprovedEvent, isDismissedEvent, isPendingReview, REVIEW_STATUS } from "@/lib/review";
import { VISION_STATUS, visionStatusLabel, requestVisionAnalysis } from "@/lib/vision";
import { eventTimestampSeconds } from "@/lib/evidence";
import { loadTimeMachineReplay } from "@/lib/timeMachine";
import { ArrowLeft, Download, EyeOff, Loader2, Sparkles, TriangleAlert, Video } from "lucide-react";

export default function MatchDetail() {
  const { id } = useParams();
  const qc = useQueryClient();
  const [running, setRunning] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);
  const [seek, setSeek] = useState(null);
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [minSeverity, setMinSeverity] = useState("0");
  const [playerFilter, setPlayerFilter] = useState("all");
  const [showDismissed, setShowDismissed] = useState(false);
  const [requestingVision, setRequestingVision] = useState(false);

  const { data: match } = useQuery({
    queryKey: ["match", id],
    queryFn: () => base44.entities.Match.get(id),
  });
  const { data: analysisJob } = useQuery({
    queryKey: ["vision-analysis", match?.vision_analysis_id],
    queryFn: () => match?.vision_analysis_id ? base44.entities.VisionAnalysis.get(match.vision_analysis_id) : null,
    enabled: !!match?.vision_analysis_id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "queued" || status === "processing" ? 5000 : false;
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ["events", id],
    queryFn: () => base44.entities.BlindspotEvent.filter({ match_id: id }, "minute"),
  });

  if (!match) return <p className="text-sm text-muted-foreground">Loading match…</p>;

  const approvedEvents = events.filter(isApprovedEvent);
  const dismissedEvents = events.filter(isDismissedEvent);
  const activeEvents = events.filter((event) => !isDismissedEvent(event));
  const pendingEvents = activeEvents.filter(isPendingReview);
  const reviewEvents = showDismissed ? events : activeEvents;

  const analyze = async () => {
    setRunning(true);
    try {
      await runAnalysis(match);
      toast({
        title: "Analysis draft is ready",
        description: "Review and approve the moments you want to use for player development.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Analysis could not be completed",
        description: error?.message || "Check the footage and try again.",
      });
    } finally {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["match", id] }),
        qc.invalidateQueries({ queryKey: ["events", id] }),
        qc.invalidateQueries({ queryKey: ["all-events"] }),
      ]);
      setRunning(false);
    }
  };

  const requestVision = async () => {
    setRequestingVision(true);
    try {
      const result = await requestVisionAnalysis(match.id);
      if (!result.configured) {
        toast({ variant: "destructive", title: "Vision provider not configured", description: result.message });
      } else {
        toast({ title: "Vision analysis queued", description: "The external worker will process the footage and return evidence." });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Could not request vision analysis", description: error?.message });
    } finally {
      await qc.invalidateQueries({ queryKey: ["match", id] });
      setRequestingVision(false);
    }
  };

  const reviewEvent = async (event, reviewStatus) => {
    setReviewingId(event.id);
    try {
      const user = await base44.auth.me().catch(() => null);
      const update = {
        review_status: reviewStatus,
        reviewed_at: new Date().toISOString(),
      };
      if (user?.id || user?.email) update.reviewed_by = user.id || user.email;

      await base44.entities.BlindspotEvent.update(event.id, update);
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["events", id] }),
        qc.invalidateQueries({ queryKey: ["all-events"] }),
      ]);

      const message = reviewStatus === REVIEW_STATUS.APPROVED
        ? "This moment will now inform player profiles, comparisons, and drills."
        : reviewStatus === REVIEW_STATUS.DISMISSED
          ? "This moment will no longer affect development insights."
          : "This moment is back in the review queue.";
      toast({ title: "Coach review saved", description: message });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Review status was not saved",
        description: error?.message || "Please try again.",
      });
    } finally {
      setReviewingId(null);
    }
  };

  const playEvidence = (event) => {
    const timestamp = eventTimestampSeconds(event);
    setSelectedEvidence(event);
    setSeek(Math.max(0, timestamp - 2));
  };

  const loadReplay = async (event) => {
    try {
      const response = await loadTimeMachineReplay(event.id);
      return response.event;
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Could not load Time Machine evidence",
        description: error?.message || "Please try again.",
      });
      return null;
    }
  };

  const playerNumbers = [...new Set(reviewEvents.map((e) => e.observer_player))]
    .filter((number) => number != null)
    .sort((a, b) => a - b);
  const filtered = reviewEvents.filter(
    (event) =>
      (event.severity || 0) >= Number(minSeverity) &&
      (playerFilter === "all" || String(event.observer_player) === playerFilter)
  );

  const stats = [
    ["Frames", match.frames_processed ?? "—"],
    ["Players tracked", match.unique_players ?? "—"],
    ["AI draft moments", activeEvents.length],
    ["Coach approved", approvedEvents.length],
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
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            className="rounded-full"
            onClick={requestVision}
            disabled={requestingVision || match.vision_status === VISION_STATUS.QUEUED || match.vision_status === VISION_STATUS.PROCESSING}
          >
            {requestingVision || match.vision_status === VISION_STATUS.QUEUED || match.vision_status === VISION_STATUS.PROCESSING ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Video className="mr-2 h-4 w-4" />
            )}
            {visionStatusLabel(match.vision_status)}
          </Button>
          {approvedEvents.length > 0 && (
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() =>
                downloadCsv(
                  `${match.title.replace(/\s+/g, "_")}_approved_blindspots.csv`,
                  approvedEvents.map((event) => ({
                    minute: event.minute,
                    observer: event.observer_player,
                    missed: event.missed_player,
                    severity: event.severity,
                    distance_m: event.distance_m,
                    angle_deg: event.angle_deg,
                    scan_quality: event.scan_quality,
                    feedback: event.feedback,
                    review_status: event.review_status,
                  }))
                )
              }
            >
              <Download className="mr-2 h-4 w-4" /> Export approved
            </Button>
          )}
          <Button onClick={analyze} disabled={running} className="rounded-full">
            {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
            {match.status === "complete" ? "Re-run draft analysis" : "Run analysis"}
          </Button>
        </div>
      </div>

      {match.status === "failed" && match.analysis_error && (
        <section className="rounded-3xl border border-red-400/30 bg-red-400/5 p-5 text-sm text-red-100">
          <div className="flex gap-3">
            <TriangleAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-300" />
            <div>
              <p className="font-heading text-xs uppercase tracking-[0.22em] text-red-200">Analysis needs attention</p>
              <p className="mt-2 leading-relaxed text-red-100/85">{match.analysis_error}</p>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-3xl border border-amber-400/25 bg-amber-400/5 p-5 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-heading text-xs uppercase tracking-[0.22em] text-amber-200">Coach review queue</p>
            <p className="mt-2 text-muted-foreground">
              {pendingEvents.length > 0
                ? `${pendingEvents.length} AI-drafted ${pendingEvents.length === 1 ? "moment needs" : "moments need"} your review. Only approved moments feed player profiles, match comparisons, exports, and drills.`
                : "Every active moment has been reviewed. Only coach-approved moments feed player development insights."}
            </p>
          </div>
          <Badge className="border border-amber-400/30 bg-amber-400/10 text-amber-100 hover:bg-amber-400/10">
            {approvedEvents.length} approved · {pendingEvents.length} pending
          </Badge>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-4">
        {stats.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-border/60 bg-card/40 p-5">
            <p className="font-display text-2xl">{value}</p>
            <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      <MatchVideoPlayer match={match} seekSeconds={seek} selectedEvidence={selectedEvidence} />

      {match.summary && (
        <section className="rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-6">
          <h2 className="mb-3 font-heading text-sm uppercase tracking-[0.25em] text-emerald-300">
            AI coaching summary — review required
          </h2>
          <p className="text-sm leading-relaxed text-foreground/90">{match.summary}</p>
        </section>
      )}

      {approvedEvents.length > 0 ? (
        <MatchCharts events={approvedEvents} />
      ) : activeEvents.length > 0 ? (
        <section className="rounded-3xl border border-dashed border-border/60 p-6 text-sm text-muted-foreground">
          Approve at least one moment to unlock evidence-based player charts.
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-sm uppercase tracking-[0.25em] text-muted-foreground">
              Key blindspot moments
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">AI findings are drafts until you approve them.</p>
          </div>
          {events.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {dismissedEvents.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setShowDismissed((value) => !value)}
                >
                  <EyeOff className="mr-1.5 h-3.5 w-3.5" />
                  {showDismissed ? "Hide dismissed" : `Show dismissed (${dismissedEvents.length})`}
                </Button>
              )}
              <Select value={playerFilter} onValueChange={setPlayerFilter}>
                <SelectTrigger className="w-[140px] rounded-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All players</SelectItem>
                  {playerNumbers.map((number) => (
                    <SelectItem key={number} value={String(number)}>Player #{number}</SelectItem>
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
          filtered.map((event) => (
            <BlindspotMoment
              key={event.id}
              event={event}
              match={match}
              onPlay={playEvidence}
              onReview={reviewEvent}
              reviewing={reviewingId === event.id}
              onLoadReplay={loadReplay}
            />
          ))
        )}
      </section>
    </div>
  );
}
