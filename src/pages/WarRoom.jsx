import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdversaryForm from "@/components/warroom/AdversaryForm";
import AdversaryPlan from "@/components/warroom/AdversaryPlan";
import OpponentPatternCard from "@/components/warroom/OpponentPatternCard";
import { simulateAdversary } from "@/lib/warroom";
import { generateOpponentPatterns } from "@/lib/opponentPattern";
import { featureFlags } from "@/lib/app-params";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { LockKeyhole, Loader2, BrainCircuit } from "lucide-react";

function WarRoomClosed() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 py-16 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-300">
        <LockKeyhole className="h-6 w-6" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Controlled beta</p>
        <h1 className="mt-3 font-display text-3xl tracking-tight sm:text-4xl">War Room is not open yet</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
          SOcceroneman is focusing on trustworthy match review and coach-approved player development first.
          Tactical adversary simulation will return for pilot teams after that core evidence loop is validated.
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        To enable it for an approved pilot, set <code className="rounded bg-muted px-1.5 py-0.5">VITE_WAR_ROOM_BETA=true</code> or add <code className="rounded bg-muted px-1.5 py-0.5">?war_room_beta=true</code>.
      </p>
    </div>
  );
}

function WarRoomExperience() {
  const qc = useQueryClient();
  const [running, setRunning] = useState(false);
  const [patterning, setPatterning] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const { data: plans = [] } = useQuery({
    queryKey: ["opponent-plans"],
    queryFn: () => base44.entities.OpponentPlan.list("-created_date", 20),
  });

  const { data: patterns = [] } = useQuery({
    queryKey: ["opponent-patterns"],
    queryFn: () => base44.entities.OpponentPattern.list("-created_date", 50),
  });

  const active = plans.find((plan) => plan.id === activeId) || plans[0];

  const runPatternAnalysis = async (opponentName) => {
    if (!opponentName) return;
    setPatterning(true);
    try {
      await generateOpponentPatterns(opponentName);
      await qc.invalidateQueries({ queryKey: ["opponent-patterns"] });
      toast({ title: "Pattern analysis complete", description: "Review the evidence-backed patterns before running a full simulation." });
    } catch (error) {
      toast({ variant: "destructive", title: "Could not find patterns", description: error?.message });
    } finally {
      setPatterning(false);
    }
  };

  const run = async (input) => {
    setRunning(true);
    try {
      const plan = await simulateAdversary(input);
      await qc.invalidateQueries({ queryKey: ["opponent-plans"] });
      setActiveId(plan.id);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">War Room · beta</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">Tactical adversary simulation</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Feed in the opponent and your shape. The engine reads their real tactical history and predicts how
          they will respond, trigger by trigger, with a counter for each.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px,1fr]">
        <div className="space-y-4">
          <AdversaryForm onRun={run} running={running} />

          {active?.opponent && (
            <Button
              variant="outline"
              className="w-full rounded-xl border-blue-400/30 bg-blue-400/5 text-blue-300 hover:bg-blue-400/10"
              onClick={() => runPatternAnalysis(active.opponent)}
              disabled={patterning}
            >
              {patterning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
              Analyze verified patterns
            </Button>
          )}
          {plans.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Saved simulations</p>
              {plans.map((plan) => (
                <Button
                  key={plan.id}
                  variant={active?.id === plan.id ? "secondary" : "ghost"}
                  className="w-full justify-start rounded-xl"
                  onClick={() => setActiveId(plan.id)}
                >
                  {plan.opponent} · {plan.our_formation}
                </Button>
              ))}
            </div>
          )}
        </div>

        {active ? (
          <div className="space-y-8">
            {patterns.filter((p) => p.opponent === active.opponent).length > 0 && (
              <section className="space-y-4">
                <h2 className="font-heading text-xs uppercase tracking-[0.25em] text-muted-foreground">Evidence-backed patterns</h2>
                {patterns.filter((p) => p.opponent === active.opponent).map((pattern) => (
                  <OpponentPatternCard key={pattern.id} pattern={pattern} />
                ))}
              </section>
            )}
            <section className="space-y-4">
              <h2 className="font-heading text-xs uppercase tracking-[0.25em] text-muted-foreground">Tactical Simulation</h2>
              <AdversaryPlan plan={active} />
            </section>
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border/60 p-16 text-center text-sm text-muted-foreground">
            Run your first simulation to open the war room.
          </div>
        )}
      </div>
    </div>
  );
}

export default function WarRoom() {
  return featureFlags.warRoom ? <WarRoomExperience /> : <WarRoomClosed />;
}
