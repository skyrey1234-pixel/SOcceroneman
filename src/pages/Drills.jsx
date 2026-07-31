import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import WeaknessPicker from "@/components/drills/WeaknessPicker";
import DrillCard from "@/components/drills/DrillCard";
import { generateDrills, weaknessesFor } from "@/lib/drills";
import { isApprovedEvent } from "@/lib/review";

export default function Drills() {
  const qc = useQueryClient();
  const [player, setPlayer] = useState(null);
  const [weakness, setWeakness] = useState(null);
  const [running, setRunning] = useState(false);

  const { data: events = [] } = useQuery({
    queryKey: ["all-events"],
    queryFn: () => base44.entities.BlindspotEvent.list("-created_date", 500),
  });
  const { data: drills = [] } = useQuery({
    queryKey: ["drills"],
    queryFn: () => base44.entities.Drill.list("-created_date", 60),
  });

  const approvedEvents = useMemo(() => events.filter(isApprovedEvent), [events]);
  const players = useMemo(
    () =>
      [...new Set(approvedEvents.map((event) => event.observer_player).filter((number) => number != null))].sort(
        (a, b) => a - b
      ),
    [approvedEvents]
  );
  const playerEvents = useMemo(
    () => approvedEvents.filter((event) => event.observer_player === player),
    [approvedEvents, player]
  );
  const weaknesses = useMemo(() => weaknessesFor(playerEvents), [playerEvents]);

  const visibleDrills = player
    ? drills.filter((drill) => drill.player_number === player)
    : drills;

  const run = async () => {
    setRunning(true);
    try {
      await generateDrills({ playerNumber: player, weakness, events: playerEvents });
      await qc.invalidateQueries({ queryKey: ["drills"] });
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Training Lab</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">
          Blindspots → training drills
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Pick a player and the weakness the coach has verified across match review. The engine writes
          session-ready drills, plus exactly where it went wrong and how elite players solve it.
        </p>
      </div>

      {approvedEvents.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/60 p-16 text-center">
          <p className="font-heading">No coach-approved moments yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Review a match and approve the AI findings you trust before generating a player-development plan.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[340px,1fr]">
          <WeaknessPicker
            players={players}
            player={player}
            onPlayer={(number) => { setPlayer(number); setWeakness(null); }}
            weaknesses={weaknesses}
            weakness={weakness}
            onWeakness={setWeakness}
            onGenerate={run}
            running={running}
          />

          <div className="space-y-5">
            {visibleDrills.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border/60 p-16 text-center text-sm text-muted-foreground">
                No drills yet — choose a weakness and build a session.
              </div>
            ) : (
              visibleDrills.map((drill) => <DrillCard key={drill.id} drill={drill} />)
            )}
          </div>
        </div>
      )}
    </div>
  );
}
