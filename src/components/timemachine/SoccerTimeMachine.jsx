import React, { useEffect, useRef, useState, useMemo } from "react";
import { Play, RotateCcw, Lightbulb, Eye, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { replayWindowForEvent, replayTrustState } from "@/lib/timeMachine";
import { youtubeId } from "@/lib/video";
import TimeMachinePlayer from "./TimeMachinePlayer";
import { FifaPitch, FifaToken, FifaPassLine, PITCH_W, PITCH_H } from "./FifaPitch";

const W = PITCH_W;
const H = PITCH_H;

const RUN_MS = 2000;
const PASS_MS = 800;

const cx = (v) => Math.min(W - 2, Math.max(2, v ?? W / 2));
const cy = (v) => Math.min(H - 2, Math.max(2, v ?? H / 2));
const lerp = (a, b, t) => a + (b - a) * t;
const easeOut = (t) => 1 - Math.pow(1 - t, 3);



export default function SoccerTimeMachine({ event, match }) {
  const [phase, setPhase] = useState("ready"); // ready, running, decision, revealed
  const [progress, setProgress] = useState(0);
  const [passT, setPassT] = useState(0);

  const window = useMemo(() => replayWindowForEvent(event), [event]);
  const trust = useMemo(() => replayTrustState(event), [event]);
  const ytId = useMemo(() => youtubeId(match?.youtube_url || ""), [match?.youtube_url]);
  const hasVideo = Boolean(ytId || match?.video_url);

  const runRaf = useRef(null);
  const passRaf = useRef(null);
  const runStart = useRef(0);
  const passStart = useRef(0);

  const scenario = useMemo(() => {
    // Generate a plausible tactical scenario from the blindspot data
    const angleRad = ((event.angle_deg || 0) * Math.PI) / 180;
    const dist = event.distance_m || 15;

    // Use the recorded observer location when it exists. Older events fall back to a neutral central setup.
    const recordedPosition = {
      x: Number.isFinite(event.pitch_x) ? event.pitch_x : W / 2,
      y: Number.isFinite(event.pitch_y) ? event.pitch_y : H / 2,
    };
    const bhStart = { x: recordedPosition.x - 10, y: recordedPosition.y };
    const bhEnd = recordedPosition;

    // Missed player based on angle and distance
    const missedX = bhEnd.x + Math.cos(angleRad) * dist;
    const missedY = bhEnd.y + Math.sin(angleRad) * dist;

    // Actual pass (usually backward or sideways into pressure if it was a mistake)
    const actualX = bhEnd.x - 10;
    const actualY = bhEnd.y + 10;

    return {
      ballHandler: { start: bhStart, end: bhEnd, number: event.observer_player },
      missed: { pos: { x: missedX, y: missedY }, number: event.missed_player },
      actualPass: { pos: { x: actualX, y: actualY } },
      defenders: [
        { x: bhEnd.x + 5, y: bhEnd.y - 2 },
        { x: actualX + 2, y: actualY - 2 } // Pressure on the actual pass
      ]
    };
  }, [event]);

  const stopRaf = () => {
    cancelAnimationFrame(runRaf.current);
    cancelAnimationFrame(passRaf.current);
  };

  const reset = () => {
    stopRaf();
    setPhase("ready");
    setProgress(0);
    setPassT(0);
  };

  useEffect(() => reset, [event]);

  const runPossession = () => {
    stopRaf();
    setPassT(0);
    setProgress(0);
    setPhase("running");
    runStart.current = 0;

    // The tactical reconstruction always animates, so the replay still works
    // if the video player never becomes ready.
    const duration = hasVideo ? RUN_MS * 2 : RUN_MS;
    const step = (ts) => {
      if (!runStart.current) runStart.current = ts;
      const p = Math.min((ts - runStart.current) / duration, 1);
      setProgress((prev) => Math.max(prev, p));
      if (p < 1) runRaf.current = requestAnimationFrame(step);
      else setPhase((prev) => (prev === "running" ? "decision" : prev));
    };
    runRaf.current = requestAnimationFrame(step);
  };

  const handleVideoProgress = (p) => setProgress(p);
  const handleVideoEnd = () => setPhase("decision");

  const reveal = () => {
    setPhase("revealed");
    setPassT(0);
    passStart.current = 0;

    const step = (ts) => {
      if (!passStart.current) passStart.current = ts;
      const p = Math.min((ts - passStart.current) / PASS_MS, 1);
      setPassT(p);
      if (p < 1) passRaf.current = requestAnimationFrame(step);
    };
    passRaf.current = requestAnimationFrame(step);
  };

  const t = easeOut(progress);
  const bhPos = {
    x: lerp(scenario.ballHandler.start.x, scenario.ballHandler.end.x, phase === "ready" ? 0 : t),
    y: lerp(scenario.ballHandler.start.y, scenario.ballHandler.end.y, phase === "ready" ? 0 : t)
  };

  const showActual = phase === "decision" || phase === "revealed";
  const showReads = phase === "revealed";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-md bg-[#FF7A1A]/10 border border-[#FF7A1A]/30 px-2.5 py-1 text-[11px] font-mono text-[#FF7A1A]">
            <Eye className="h-3 w-3" /> Time Machine
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            Player #{event.observer_player ?? "?"} Decision Review
          </p>
        </div>
        <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-mono border ${
          trust.tone === "emerald" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
          trust.tone === "sky" ? "bg-sky-500/10 text-sky-400 border-sky-500/20" :
          trust.tone === "amber" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
          "bg-slate-500/10 text-slate-400 border-slate-500/20"
        }`}>
          <ShieldAlert className="h-3 w-3" /> {trust.shortLabel}
        </div>
      </div>

      {hasVideo ? (
        <TimeMachinePlayer
          youtubeId={ytId}
          videoUrl={match.video_url}
          event={event}
          evidenceWindow={window}
          phase={phase}
          onPlaybackProgress={handleVideoProgress}
          onPlaybackEnd={handleVideoEnd}
        />
      ) : null}

      <div className="rounded-lg border border-border/70 bg-secondary/30 px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
        <span className="font-semibold text-foreground/90">{trust.label}. </span>
        {trust.description}
        {event.replay_note ? ` ${event.replay_note}` : ""}
      </div>

      <div>
        <p className="mb-2 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
          Tactical reconstruction · approved event geometry
        </p>
        <div className={`relative w-full rounded-xl overflow-hidden border border-border bg-black ${hasVideo ? "opacity-90" : ""}`}>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto block">
          <FifaPitch />

          {/* Actual Pass (Red) */}
          {showActual && (
            <FifaPassLine
              from={{ x: cx(scenario.ballHandler.end.x), y: cy(scenario.ballHandler.end.y) }}
              to={{ x: cx(scenario.actualPass.pos.x), y: cy(scenario.actualPass.pos.y) }}
              color="#ef4444"
              dashed
              width={0.45}
            />
          )}

          {/* Better Read (Green) */}
          {showReads && (
            <FifaPassLine
              from={{ x: cx(scenario.ballHandler.end.x), y: cy(scenario.ballHandler.end.y) }}
              to={{ x: cx(scenario.missed.pos.x), y: cy(scenario.missed.pos.y) }}
              color="#22c55e"
              width={0.6}
            />
          )}

          {/* Ball */}
          {showReads ? (
            <circle
              r="1.2"
              fill="#ffffff"
              cx={lerp(cx(scenario.ballHandler.end.x), cx(scenario.missed.pos.x), easeOut(passT))}
              cy={lerp(cy(scenario.ballHandler.end.y), cy(scenario.missed.pos.y), easeOut(passT))}
            />
          ) : (
            <circle r="1.2" fill="#ffffff" cx={cx(bhPos.x)} cy={cy(bhPos.y)} />
          )}

          {/* Players */}
          <FifaToken
            x={cx(bhPos.x)}
            y={cy(bhPos.y)}
            label={scenario.ballHandler.number}
            name="ON BALL"
            isOpponent={false}
            highlight={false}
          />
          <FifaToken
            x={cx(scenario.missed.pos.x)}
            y={cy(scenario.missed.pos.y)}
            label={scenario.missed.number}
            name={showReads ? "OPEN MAN" : undefined}
            isOpponent={false}
            highlight={showReads}
          />

          {/* Defenders */}
          {scenario.defenders.map((d, i) => (
            <FifaToken key={i} x={cx(d.x)} y={cy(d.y)} label="" isOpponent highlight={false} />
          ))}
        </svg>

          {phase === "decision" && !hasVideo && (
            <div className="absolute bottom-0 inset-x-0 z-20 p-4 bg-gradient-to-t from-black/85 to-transparent">
              <p className="text-sm text-white/90 font-medium text-center animate-in fade-in slide-in-from-bottom-2 duration-500">
                The play develops. You have the ball. What did you miss?
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {phase === "ready" && (
          <Button onClick={runPossession} className="bg-[#FF7A1A] text-black hover:bg-[#ff8c3a]">
            <Play className="mr-2 h-4 w-4 fill-current" /> Run play
          </Button>
        )}
        {phase === "running" && (
          <div className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground">
            <span className="h-2 w-2 rounded-full bg-[#FF7A1A] animate-pulse" /> Reliving it…
          </div>
        )}
        {phase === "decision" && (
          <Button onClick={reveal} className="bg-green-600 text-white hover:bg-green-500 animate-in fade-in">
            <Lightbulb className="mr-2 h-4 w-4" /> Reveal the open man
          </Button>
        )}
        {(phase === "decision" || phase === "revealed") && (
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="mr-2 h-4 w-4" /> Replay
          </Button>
        )}

        {(phase === "running" || phase === "decision" || phase === "revealed") && (
          <div className="flex-1 min-w-[120px] h-1.5 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-[#FF7A1A] rounded-full"
              style={{ width: `${progress * 100}%`, transition: "width 75ms linear" }}
            />
          </div>
        )}
      </div>

      {(phase === "decision" || phase === "revealed") && (
        <div className="grid sm:grid-cols-2 gap-3 animate-in fade-in slide-in-from-bottom-3 duration-500">
          <div className="rounded-lg border border-red-400/40 bg-red-400/5 p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
              <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">What happened</span>
            </div>
            <p className="text-sm font-semibold text-white">The original decision</p>
            <p className="text-xs text-muted-foreground mt-1">
              {event.what_went_wrong || "The approved review identified a better available action."}
            </p>
          </div>

          <div className={`rounded-lg border p-3 transition-all duration-500 ${
            showReads ? "border-green-500/50 bg-green-500/10" : "border-border bg-secondary/40 blur-[2px] opacity-60"
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
              <span className="text-xs font-semibold text-green-400 uppercase tracking-wide">The read</span>
            </div>
            {showReads ? (
              <>
                <p className="text-sm font-semibold text-white">
                  {event.missed_player != null ? `Player #${event.missed_player} was the better option` : "A better option was available"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {Number.isFinite(event.distance_m) ? event.distance_m.toFixed(1) : "—"}m away at {Math.round(event.angle_deg || 0)}°. {event.feedback || "See the far-side option before committing the pass."}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Hit "Reveal the open man" to see it…</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}