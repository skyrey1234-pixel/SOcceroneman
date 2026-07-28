import React, { useEffect, useRef } from "react";
import { youtubeId } from "@/lib/video";

export default function MatchVideoPlayer({ match, seekSeconds }) {
  const videoRef = useRef(null);
  const ytId = youtubeId(match.youtube_url || "");

  useEffect(() => {
    if (!ytId && videoRef.current && seekSeconds != null) {
      videoRef.current.currentTime = seekSeconds;
      videoRef.current.play?.();
    }
  }, [seekSeconds, ytId]);

  if (ytId) {
    const start = Math.max(0, Math.round(seekSeconds || 0));
    return (
      <div className="aspect-video w-full overflow-hidden rounded-3xl border border-border/60">
        <iframe
          key={start}
          title={match.title}
          src={`https://www.youtube.com/embed/${ytId}?start=${start}${seekSeconds != null ? "&autoplay=1" : ""}`}
          allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="h-full w-full"
        />
      </div>
    );
  }

  if (match.video_url) {
    return (
      <video
        ref={videoRef}
        src={match.video_url}
        controls
        className="w-full rounded-3xl border border-border/60"
      />
    );
  }

  return (
    <div className="rounded-3xl border border-dashed border-border/60 p-10 text-center text-sm text-muted-foreground">
      No footage attached to this match yet.
    </div>
  );
}