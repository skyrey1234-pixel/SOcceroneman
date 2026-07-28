import React, { useEffect, useRef } from "react";
import { youtubeId } from "@/lib/video";
import YouTubeEmbed from "./YouTubeEmbed";

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
    return <YouTubeEmbed videoId={ytId} seekSeconds={seekSeconds} />;
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