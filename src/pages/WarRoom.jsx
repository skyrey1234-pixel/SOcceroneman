import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import AdversaryForm from "@/components/warroom/AdversaryForm";
import AdversaryPlan from "@/components/warroom/AdversaryPlan";
import { simulateAdversary } from "@/lib/warroom";
import { featureFlags } from "@/lib/app-params";
import { Button } from "@/components/ui/button";
import { LockKeyhole } from "lucide-react";

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
  const [activeId, setActiveId] = useState(null);

  const { data: plans = [] } = useQuery({
    queryKey: ["opponent-plans"],
    queryFn: () => base44.entities.OpponentPlan.list("-created_date", 20),
  });

  const active = plans.find((plan) => plan.id === activeId) || plans[0];

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

export default function WarRoom() {
  return featureFlags.warRoom ? <WarRoomExperience /> : <WarRoomClosed />;
}
