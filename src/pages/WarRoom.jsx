import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdversaryForm from "@/components/warroom/AdversaryForm";
import AdversaryPlan from "@/components/warroom/AdversaryPlan";
import { simulateAdversary } from "@/lib/warroom";
import { Button } from "@/components/ui/button";

export default function WarRoom() {
  const qc = useQueryClient();
  const [running, setRunning] = useState(false);
  const [activeId, setActiveId] = useState(null);

  const { data: plans = [] } = useQuery({
    queryKey: ["opponent-plans"],
    queryFn: () => base44.entities.OpponentPlan.list("-created_date", 20),
  });

  const active = plans.find((p) => p.id === activeId) || plans[0];

  const run = async (input) => {
    setRunning(true);
    const plan = await simulateAdversary(input);
    await qc.invalidateQueries({ queryKey: ["opponent-plans"] });
    setActiveId(plan.id);
    setRunning(false);
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">War Room</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">Tactical adversary simulation</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Feed in the opponent and your shape. The engine reads their real tactical history and predicts how
          they'll respond — trigger by trigger — with a counter for each.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px,1fr]">
        <div className="space-y-4">
          <AdversaryForm onRun={run} running={running} />
          {plans.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Saved simulations</p>
              {plans.map((p) => (
                <Button
                  key={p.id}
                  variant={active?.id === p.id ? "secondary" : "ghost"}
                  className="w-full justify-start rounded-xl"
                  onClick={() => setActiveId(p.id)}
                >
                  {p.opponent} · {p.our_formation}
                </Button>
              ))}
            </div>
          )}
        </div>

        {active ? (
          <AdversaryPlan plan={active} />
        ) : (
          <div className="rounded-3xl border border-dashed border-border/60 p-16 text-center text-sm text-muted-foreground">
            Run your first simulation to open the war room.
          </div>
        )}
      </div>
    </div>
  );
}