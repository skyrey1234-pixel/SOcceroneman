import React, { useEffect, useMemo, useRef, useState } from "react";
import { Crosshair, Video } from "lucide-react";
import { youtubeId } from "@/lib/video";
import { evidenceWindow, formatVideoTimestamp, hasVisualAnnotation } from "@/lib/evidence";
import YouTubeEmbed from "./YouTubeEmbed";

function OverlayBox({ box, label, tone = "emerald" }) {
  if (!box) return null;
  const toneClasses = tone === "amber"
    ? "border-amber-300 bg-amber-300/10 text-amber-100"
    : "border-emerald-300 bg-emerald-300/10 text-emerald-100";

  return (
    <div
      className={`absolute border-2 shadow-[0_0_0_1px_rgba(0,0,0,0.35)] ${toneClasses}`}
      style={{
        left: `${box.x * 100}%`,
        top: `${box.y * 100}%`,
        width: `${box.width * 100}%`,
        height: `${box.height * 100}%`,
      }}
    >
      <span className={`absolute -top-6 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium ${toneClasses}`}>
        {label}
      </span>
    </div>
  );
}

function EvidenceLegend({ event, nativeOverlay = false }) {
  if (!event) return null;
  const window = evidenceWindow(event);
  return (
    <div className="mt-3 flex flex-wrap items-start gap-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-xs">
      <Crosshair className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-emerald-100">
          Evidence selected · {formatVideoTimestamp(event.timestamp_seconds ?? window.start)}
        </p>
        <p className="mt-0.5 leading-relaxed text-muted-foreground">
          {nativeOverlay && hasVisualAnnotation(event)
            ? "Green is the vision-tracked player. Amber is nearby visual context, not a verified missed runner."
            : "This evidence links to the right footage moment. Coach review is still required before it becomes a development finding."}
        </p>
      </div>
    </div>
  );
}

export default function MatchVideoPlayer({ match, seekSeconds, selectedEvidence = null }) {
  const videoRef = useRef(null);
  const [currentTime, setCurrentTime] = useState(0);
  const ytId = youtubeId(match.youtube_url || "");
  const evidenceRange = useMemo(
    () => (selectedEvidence ? evidenceWindow(selectedEvidence) : null),
    [selectedEvidence]
  );
  const annotationIsActive = Boolean(
    selectedEvidence &&
      hasVisualAnnotation(selectedEvidence) &&
      evidenceRange &&
      currentTime >= evidenceRange.start - 0.25 &&
      currentTime <= evidenceRange.end + 0.25
  );

  useEffect(() => {
    if (!ytId && videoRef.current && seekSeconds != null) {
      videoRef.current.currentTime = seekSeconds;
      videoRef.current.play?.().catch(() => undefined);
    }
  }, [seekSeconds, ytId]);

  if (ytId) {
    return (
      <section>
        <YouTubeEmbed videoId={ytId} seekSeconds={seekSeconds} />
        <EvidenceLegend event={selectedEvidence} />
        {selectedEvidence && hasVisualAnnotation(selectedEvidence) && (
          <p className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
            <Video className="h-3.5 w-3.5" />
            YouTube plays the selected timestamp, but its cross-origin iframe prevents on-frame overlays. Open a direct uploaded video to view boxes in-app.
          </p>
        )}
      </section>
    );
  }

  if (match.video_url) {
    return (
      <section>
        <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-black">
          <video
            ref={videoRef}
            src={match.video_url}
            controls
            onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
            onLoadedMetadata={(event) => setCurrentTime(event.currentTarget.currentTime || 0)}
            className="block w-full"
          />
          {annotationIsActive && (
            <div className="pointer-events-none absolute inset-0" aria-label="Computer-vision evidence overlay">
              <OverlayBox box={selectedEvidence.observer_box} label="Tracked player" />
              <OverlayBox box={selectedEvidence.missed_player_box} label="Nearby context" tone="amber" />
            </div>
          )}
        </div>
        <EvidenceLegend event={selectedEvidence} nativeOverlay />
      </section>
    );
  }

  return (
    <div className="rounded-3xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
      No footage attached to this match yet.
    </div>
  );
}
