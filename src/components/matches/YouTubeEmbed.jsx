import React, { useEffect, useRef, useState } from "react";
import { ExternalLink } from "lucide-react";

function loadApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!window.__ytApiPromise) {
    window.__ytApiPromise = new Promise((resolve) => {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        prev?.();
        resolve(window.YT);
      };
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    });
  }
  return window.__ytApiPromise;
}

export default function YouTubeEmbed({ videoId, seekSeconds }) {
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadApi().then((YT) => {
      if (cancelled || !hostRef.current) return;
      playerRef.current = new YT.Player(hostRef.current, {
        videoId,
        playerVars: { playsinline: 1, rel: 0, modestbranding: 1 },
        events: { onReady: () => setReady(true) },
      });
    });
    return () => {
      cancelled = true;
      playerRef.current?.destroy?.();
      playerRef.current = null;
    };
  }, [videoId]);

  useEffect(() => {
    if (ready && seekSeconds != null && playerRef.current) {
      playerRef.current.seekTo(seekSeconds, true);
      playerRef.current.playVideo();
    }
  }, [ready, seekSeconds]);

  return (
    <div className="space-y-2">
      <div className="aspect-video w-full overflow-hidden rounded-3xl border border-border/60 bg-black">
        <div ref={hostRef} className="h-full w-full" />
      </div>
      <a
        href={`https://www.youtube.com/watch?v=${videoId}${
          seekSeconds != null ? `&t=${Math.round(seekSeconds)}s` : ""
        }`}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        {seekSeconds != null
          ? `Open on YouTube at ${Math.floor(seekSeconds / 60)}:${String(
              Math.round(seekSeconds) % 60
            ).padStart(2, "0")}`
          : "Open on YouTube"}
      </a>
    </div>
  );
}