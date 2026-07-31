import React from "react";
import { AlertTriangle, Check, CheckCircle2, Clock3, Play, RotateCcw, X, Video, ScanSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import CorrectPlayPanel from "./CorrectPlayPanel";
import {
  isApprovedEvent,
  isDismissedEvent,
  isPendingReview,
  REVIEW_STATUS,
  reviewStatusLabel,
} from "@/lib/review";
import { formatVideoTimestamp, hasVisualAnnotation } from "@/lib/evidence";

export function timestampOf(event) {
  return Math.max(0, Math.round((event.minute || 0) * 60 + (event.second || 0)));
}

export function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function BlindspotMoment({ event, match, onPlay, onReview, reviewing = false }) {
  const sev = Math.round((event.severity || 0) * 100);
  const tone = sev >= 75 ? "text-red-300" : sev >= 50 ? "text-amber-300" : "text-emerald-300";
  const ts = timestampOf(event);
  const approved = isApprovedEvent(event);
  const dismissed = isDismissedEvent(event);
  const pending = isPendingReview(event);

  const statusClass = approved
    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
    : dismissed
      ? "border-border/60 bg-muted/40 text-muted-foreground"
      : "border-amber-400/30 bg-amber-400/10 text-amber-200";

  return (
    <div className={`space-y-4 rounded-2xl border bg-card/40 p-5 transition-colors hover:border-emerald-400/40 ${dismissed ? "opacity-70" : "border-border/60"}`}>
      <div className="flex gap-4">
        <button
          onClick={() => onPlay?.(event)}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-emerald-400/15 text-emerald-300 hover:bg-emerald-400/25"
          title={`Review evidence at ${formatClock(ts)}`}
        >
          <Play className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-snug">{event.feedback}</p>
          <p className="mt-2 text-[11px] uppercase tracking-widest text-muted-foreground">
            {formatVideoTimestamp(event.timestamp_seconds ?? ts)} · #{event.observer_player} missed #{event.missed_player} · {" "}
            {event.distance_m?.toFixed(1)}m · {Math.round(event.angle_deg || 0)}° · scan {" "}
            {event.scan_quality?.toFixed(2)}
            {event.phase ? ` · ${event.phase.replace(/_/g, " ")}` : ""}
          </p>
        </div>
        <div className={`flex items-center gap-2 ${tone}`}>
          <AlertTriangle className="h-4 w-4" />
          <span className="font-display text-lg">{sev}%</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-y border-border/50 py-3">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider ${statusClass}`}>
            {approved ? <CheckCircle2 className="h-3.5 w-3.5" /> : dismissed ? <X className="h-3.5 w-3.5" /> : <Clock3 className="h-3.5 w-3.5" />}
            {reviewStatusLabel(event)}
          </span>
          {event.evidence_source === "computer_vision" && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-400/30 bg-blue-400/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-blue-300">
              <Video className="h-3 w-3" /> CV Evidence
            </span>
          )}
          {hasVisualAnnotation(event) && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-emerald-300">
              <ScanSearch className="h-3 w-3" /> Visual tracking
            </span>
          )}
        </div>

        {pending && (
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="h-8 rounded-full bg-emerald-400 px-3 text-xs text-emerald-950 hover:bg-emerald-300"
              disabled={reviewing}
              onClick={() => onReview?.(event, REVIEW_STATUS.APPROVED)}
            >
              <Check className="mr-1 h-3.5 w-3.5" /> Approve
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-8 rounded-full px-3 text-xs"
              disabled={reviewing}
              onClick={() => onReview?.(event, REVIEW_STATUS.DISMISSED)}
            >
              <X className="mr-1 h-3.5 w-3.5" /> Dismiss
            </Button>
          </div>
        )}

        {dismissed && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-full px-3 text-xs"
            disabled={reviewing}
            onClick={() => onReview?.(event, REVIEW_STATUS.PENDING)}
          >
            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Restore to review
          </Button>
        )}
      </div>

      {(event.what_went_right || event.what_went_wrong) && (
        <div className="grid gap-2 sm:grid-cols-2">
          {event.what_went_right && (
            <p className="flex gap-2 rounded-xl bg-emerald-400/10 p-3 text-xs leading-relaxed">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
              {event.what_went_right}
            </p>
          )}
          {event.what_went_wrong && (
            <p className="flex gap-2 rounded-xl bg-red-400/10 p-3 text-xs leading-relaxed">
              <X className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-300" />
              {event.what_went_wrong}
            </p>
          )}
        </div>
      )}

      {!dismissed && <CorrectPlayPanel event={event} match={match} />}
    </div>
  );
}
