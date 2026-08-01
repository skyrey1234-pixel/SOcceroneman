import React, { useEffect, useRef, useState } from "react";
import { nearestReplayFrame } from "@/lib/timeMachine";

function loadApi() {
  const ytWindow = /** @type {any} */ (window);
  if (ytWindow.YT?.Player) return Promise.resolve(ytWindow.YT);
  if (!ytWindow.__ytApiPromise) {
    ytWindow.__ytApiPromise = new Promise((resolve) => {
      const previousReady = ytWindow.onYouTubeIframeAPIReady;
      ytWindow.onYouTubeIframeAPIReady = () => {
        previousReady?.();
        resolve(ytWindow.YT);
      };
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(script);
    });
  }
  return ytWindow.__ytApiPromise;
}

export default function TimeMachinePlayer({
  youtubeId,
  videoUrl,
  event,
  evidenceWindow,
  phase,
  onPlaybackProgress,
  onPlaybackEnd,
  className = "",
}) {
  const youtubeHostRef = useRef(null);
  const youtubePlayerRef = useRef(null);
  const videoRef = useRef(null);
  const animationRef = useRef(null);
  const progressCallbackRef = useRef(onPlaybackProgress);
  const endCallbackRef = useRef(onPlaybackEnd);
  const [ready, setReady] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(null);
  const isYouTube = Boolean(youtubeId);

  useEffect(() => {
    progressCallbackRef.current = onPlaybackProgress;
    endCallbackRef.current = onPlaybackEnd;
  }, [onPlaybackProgress, onPlaybackEnd]);

  useEffect(() => {
    if (!isYouTube) return;
    let cancelled = false;
    setReady(false);

    loadApi().then((YT) => {
      if (cancelled || !youtubeHostRef.current) return;
      youtubePlayerRef.current = new YT.Player(youtubeHostRef.current, {
        videoId: youtubeId,
        playerVars: {
          playsinline: 1,
          rel: 0,
          modestbranding: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: () => setReady(true),
        },
      });
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(animationRef.current);
      youtubePlayerRef.current?.destroy?.();
      youtubePlayerRef.current = null;
    };
  }, [isYouTube, youtubeId]);

  useEffect(() => {
    if (!ready || !evidenceWindow) return;
    const player = youtubePlayerRef.current;
    const video = videoRef.current;

    const currentTime = () => {
      if (isYouTube) return Number(player?.getCurrentTime?.()) || 0;
      return Number(video?.currentTime) || 0;
    };
    const seek = (seconds) => {
      if (isYouTube) player?.seekTo?.(seconds, true);
      else if (video) video.currentTime = seconds;
    };
    const pause = () => {
      if (isYouTube) player?.pauseVideo?.();
      else video?.pause?.();
    };
    const play = () => {
      if (isYouTube) player?.playVideo?.();
      else video?.play?.().catch(() => undefined);
    };

    cancelAnimationFrame(animationRef.current);

    if (phase === "ready") {
      seek(evidenceWindow.start_seconds);
      pause();
      progressCallbackRef.current?.(0);
      setCurrentFrame(nearestReplayFrame(event, evidenceWindow.start_seconds));
      return undefined;
    }

    if (phase === "decision" || phase === "revealed") {
      pause();
      seek(evidenceWindow.timestamp_seconds);
      progressCallbackRef.current?.(1);
      setCurrentFrame(nearestReplayFrame(event, evidenceWindow.timestamp_seconds));
      return undefined;
    }

    if (phase !== "running") return undefined;

    seek(evidenceWindow.start_seconds);
    play();
    const startedAt = performance.now();
    const runDuration = Math.max(0.25, evidenceWindow.timestamp_seconds - evidenceWindow.start_seconds);

    const poll = (nowMs) => {
      const mediaTime = currentTime();
      const estimatedTime = evidenceWindow.start_seconds + (nowMs - startedAt) / 1000;
      const timelineTime = Math.max(mediaTime, Math.min(estimatedTime, evidenceWindow.timestamp_seconds));
      const progress = Math.max(0, Math.min(1, (timelineTime - evidenceWindow.start_seconds) / runDuration));
      progressCallbackRef.current?.(progress);
      setCurrentFrame(nearestReplayFrame(event, timelineTime));

      if (timelineTime >= evidenceWindow.timestamp_seconds - 0.03) {
        pause();
        seek(evidenceWindow.timestamp_seconds);
        progressCallbackRef.current?.(1);
        setCurrentFrame(nearestReplayFrame(event, evidenceWindow.timestamp_seconds));
        endCallbackRef.current?.();
        return;
      }

      animationRef.current = requestAnimationFrame(poll);
    };

    animationRef.current = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(animationRef.current);
  }, [ready, isYouTube, phase, evidenceWindow, event]);

  if (!youtubeId && !videoUrl) {
    return (
      <div className={`aspect-video w-full rounded-xl border border-dashed border-border bg-black grid place-items-center ${className}`}>
        <p className="text-sm text-muted-foreground">Video evidence is unavailable. Tactical reconstruction remains active.</p>
      </div>
    );
  }

  const revealContext = phase === "revealed";

  return (
    <div className={`relative aspect-video w-full overflow-hidden rounded-xl border border-border bg-black ${className}`}>
      {isYouTube ? (
        <div className="absolute inset-0 pointer-events-none [&>iframe]:h-full [&>iframe]:w-full">
          <div ref={youtubeHostRef} className="h-full w-full" />
        </div>
      ) : (
        <video
          ref={videoRef}
          src={videoUrl}
          playsInline
          preload="metadata"
          onLoadedMetadata={() => setReady(true)}
          className="absolute inset-0 h-full w-full object-contain pointer-events-none"
        />
      )}

      {currentFrame && (
        <div className="pointer-events-none absolute inset-0" aria-label="Time Machine evidence overlay">
          {currentFrame.observer_box && (
            <div
              className="absolute rounded-sm border-[2.5px] border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.55)] transition-all duration-75"
              style={{
                left: `${currentFrame.observer_box.x * 100}%`,
                top: `${currentFrame.observer_box.y * 100}%`,
                width: `${currentFrame.observer_box.width * 100}%`,
                height: `${currentFrame.observer_box.height * 100}%`,
              }}
            >
              <span className="absolute -top-6 left-0 rounded bg-emerald-400 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-950 whitespace-nowrap">
                Tracked player
              </span>
              {Math.abs(currentFrame.head_direction_proxy || 0) > 0.05 && (
                <div
                  className="absolute -top-4 left-1/2 h-3 w-0.5 origin-bottom bg-emerald-400 transition-transform duration-75"
                  style={{ transform: `translateX(-50%) rotate(${currentFrame.head_direction_proxy * 45}deg)` }}
                />
              )}
            </div>
          )}

          {currentFrame.context_box && (
            <div
              className={`absolute rounded-sm border-[2.5px] transition-all duration-200 ${
                revealContext
                  ? "border-green-400 shadow-[0_0_14px_rgba(74,222,128,0.8)]"
                  : "border-sky-400/70 shadow-[0_0_6px_rgba(56,189,248,0.35)]"
              }`}
              style={{
                left: `${currentFrame.context_box.x * 100}%`,
                top: `${currentFrame.context_box.y * 100}%`,
                width: `${currentFrame.context_box.width * 100}%`,
                height: `${currentFrame.context_box.height * 100}%`,
              }}
            >
              <span className={`absolute -top-6 left-0 rounded px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap ${
                revealContext ? "bg-green-400 text-green-950" : "bg-sky-400/80 text-sky-950"
              }`}>
                {revealContext ? "Better option" : "Nearby context"}
              </span>
            </div>
          )}

          {(currentFrame.observer_confidence || 0) > 0 && (
            <div className="absolute bottom-3 right-3 rounded border border-white/10 bg-black/65 px-2 py-1 font-mono text-[10px] text-white/80 backdrop-blur-sm">
              CV {(currentFrame.observer_confidence * 100).toFixed(0)}%
            </div>
          )}
        </div>
      )}

      {phase === "decision" && (
        <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/95 via-black/60 to-transparent p-5">
          <p className="text-center text-[15px] font-medium text-white animate-in fade-in slide-in-from-bottom-2 duration-500">
            Freeze the picture. What is the next best action?
          </p>
        </div>
      )}
    </div>
  );
}
