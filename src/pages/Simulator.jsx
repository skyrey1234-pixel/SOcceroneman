import React, { useMemo, useState } from "react";
import TacticalPitch from "@/components/pitch/TacticalPitch";
import PlayerInspector from "@/components/pitch/PlayerInspector";
import BlindspotFeed from "@/components/pitch/BlindspotFeed";
import CorrectPlaySpotlight from "@/components/pitch/CorrectPlaySpotlight";
import SimulatorHud from "@/components/pitch/SimulatorHud";
import ContextDrawer from "@/components/pitch/ContextDrawer";
import SimulatorStage from "@/components/pitch/SimulatorStage";
import AngleSwitcher from "@/components/timemachine/AngleSwitcher";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { computeBeliefStates, allBlindspots, defaultFormation, effectiveFov } from "@/lib/blindspot";
import { RotateCcw, EyeOff } from "lucide-react";

export default function Simulator() {
  const [players, setPlayers] = useState(defaultFormation);
  const [ball, setBall] = useState({ x: 42, y: 34 });
  const [selectedId, setSelectedId] = useState("home-6");
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [angle, setAngle] = useState("top");

  const beliefs = useMemo(() => computeBeliefStates(players, ball), [players, ball]);
  const blindspots = useMemo(() => allBlindspots(beliefs), [beliefs]);
  const selectedBelief = beliefs.find((b) => b.observer.id === selectedId);

  const nearestThreat = useMemo(() => {
    const own = selectedBelief?.blindspots || [];
    if (!own.length) return null;
    return Math.min(...own.map((b) => b.distance));
  }, [selectedBelief]);

  const move = (id, pos) =>
    setPlayers((ps) => ps.map((p) => (p.id === id ? { ...p, ...pos } : p)));
  const patch = (data) =>
    setPlayers((ps) => ps.map((p) => (p.id === selectedId ? { ...p, ...data } : p)));

  const headsDown = () =>
    setPlayers((ps) => ps.map((p) => ({ ...p, scan_quality: 0.22 })));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-400">Live pitch</p>
          <h1 className="mt-2 font-display text-3xl tracking-tight text-pretty sm:text-4xl">
            Belief-state simulator
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Drag players anywhere, turn their heads, and drop their scan quality — the engine recomputes
            what each player <em>could</em> see versus what they <em>do</em> see, frame by frame.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="cursor-pointer rounded-full" onClick={headsDown}>
            <EyeOff className="mr-2 h-4 w-4" aria-hidden="true" /> Heads Down
          </Button>
          <Button
            variant="outline"
            className="cursor-pointer rounded-full"
            onClick={() => {
              setPlayers(defaultFormation());
              setBall({ x: 42, y: 34 });
            }}
          >
            <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" /> Reset
          </Button>
          {!drawerOpen && <ContextDrawer open={false} onOpenChange={setDrawerOpen} />}
        </div>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="min-w-0 flex-1">
          <div className="mb-3 flex justify-end">
            <AngleSwitcher
              value={angle}
              onChange={setAngle}
              observerNumber={selectedBelief?.observer?.number}
            />
          </div>
          <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-black/40">
            {angle === "top" ? (
              <TacticalPitch
                players={players}
                ball={ball}
                blindspots={blindspots}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onMove={move}
              />
            ) : (
              <SimulatorStage
                angle={angle}
                players={players}
                ball={ball}
                selectedId={selectedId}
                blindspots={blindspots}
              />
            )}
            <SimulatorHud
              belief={selectedBelief}
              blindspotCount={blindspots.length}
              fovDegrees={selectedBelief ? effectiveFov(selectedBelief.observer.scan_quality) : 0}
              nearestThreat={nearestThreat}
            />
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex flex-wrap gap-3 bg-gradient-to-t from-black/75 to-transparent px-4 pb-3 pt-8 text-[11px] uppercase tracking-widest text-white/75">
              <span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-sky-400" /> Home</span>
              <span className="flex items-center gap-2"><i className="h-2 w-2 rounded-full bg-red-500" /> Away</span>
              <span className="flex items-center gap-2"><i className="h-2 w-4 rounded bg-emerald-500/50" /> Perceived FOV</span>
              <span className="flex items-center gap-2"><i className="h-2 w-4 rounded bg-white/20" /> Geometric FOV</span>
            </div>
          </div>
        </div>

        <ContextDrawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <Tabs defaultValue="inspector">
            <TabsList className="w-full">
              <TabsTrigger value="inspector" className="flex-1 cursor-pointer">Player</TabsTrigger>
              <TabsTrigger value="blindspots" className="flex-1 cursor-pointer">
                Blindspots ({blindspots.length})
              </TabsTrigger>
              <TabsTrigger value="plays" className="flex-1 cursor-pointer">Plays</TabsTrigger>
            </TabsList>

            <TabsContent value="inspector" className="mt-4">
              <PlayerInspector player={selectedBelief?.observer} belief={selectedBelief} onChange={patch} />
            </TabsContent>

            <TabsContent value="blindspots" className="mt-4">
              <BlindspotFeed blindspots={blindspots} onFocus={setSelectedId} />
            </TabsContent>

            <TabsContent value="plays" className="mt-4">
              <CorrectPlaySpotlight />
            </TabsContent>
          </Tabs>
        </ContextDrawer>
      </div>
    </div>
  );
}