import React, { useMemo, useState } from "react";
import TacticalPitch from "@/components/pitch/TacticalPitch";
import PlayerInspector from "@/components/pitch/PlayerInspector";
import BlindspotFeed from "@/components/pitch/BlindspotFeed";
import { Button } from "@/components/ui/button";
import { computeBeliefStates, allBlindspots, defaultFormation } from "@/lib/blindspot";
import { RotateCcw, EyeOff } from "lucide-react";

export default function Simulator() {
  const [players, setPlayers] = useState(defaultFormation);
  const [ball, setBall] = useState({ x: 42, y: 34 });
  const [selectedId, setSelectedId] = useState("home-6");

  const beliefs = useMemo(() => computeBeliefStates(players, ball), [players, ball]);
  const blindspots = useMemo(() => allBlindspots(beliefs), [beliefs]);
  const selectedBelief = beliefs.find((b) => b.observer.id === selectedId);

  const move = (id, pos) =>
    setPlayers((ps) => ps.map((p) => (p.id === id ? { ...p, ...pos } : p)));
  const patch = (data) =>
    setPlayers((ps) => ps.map((p) => (p.id === selectedId ? { ...p, ...data } : p)));

  const headsDown = () =>
    setPlayers((ps) => ps.map((p) => ({ ...p, scan_quality: 0.22 })));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Live pitch</p>
          <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
            Belief-state simulator
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Drag players anywhere, turn their heads, and drop their scan quality — the engine recomputes
            what each player <em>could</em> see versus what they <em>do</em> see, frame by frame.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="rounded-full" onClick={headsDown}>
            <EyeOff className="mr-2 h-4 w-4" /> Heads down
          </Button>
          <Button
            variant="outline"
            className="rounded-full"
            onClick={() => {
              setPlayers(defaultFormation());
              setBall({ x: 42, y: 34 });
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" /> Reset
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="rounded-3xl border border-border/60 bg-card/40 p-4">
          <TacticalPitch
            players={players}
            ball={ball}
            blindspots={blindspots}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onMove={move}
          />
          <div className="mt-4 flex flex-wrap gap-4 px-2 text-[11px] uppercase tracking-widest text-muted-foreground">
            <span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-sky-400" /> Home</span>
            <span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-pink-400" /> Away</span>
            <span className="flex items-center gap-2"><i className="h-2 w-4 rounded bg-emerald-400/40" /> Perceived FOV</span>
            <span className="flex items-center gap-2"><i className="h-2 w-4 rounded bg-white/10" /> Geometric FOV</span>
          </div>
        </div>

        <div className="space-y-6">
          <section className="rounded-3xl border border-border/60 bg-card/40 p-6">
            <h2 className="mb-5 font-heading text-sm uppercase tracking-[0.25em] text-muted-foreground">
              Player belief state
            </h2>
            <PlayerInspector player={selectedBelief?.observer} belief={selectedBelief} onChange={patch} />
          </section>
          <section className="rounded-3xl border border-border/60 bg-card/40 p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="font-heading text-sm uppercase tracking-[0.25em] text-muted-foreground">
                Blindspots
              </h2>
              <span className="font-display text-2xl text-red-300">{blindspots.length}</span>
            </div>
            <BlindspotFeed blindspots={blindspots} onFocus={setSelectedId} />
          </section>
        </div>
      </div>
    </div>
  );
}