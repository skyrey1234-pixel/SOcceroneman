import React from "react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, Target, UserSearch } from "lucide-react";

export default function AdversaryPlan({ plan }) {
  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-emerald-400/20 bg-emerald-400/5 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-2xl">{plan.opponent}</h2>
          <Badge variant="secondary">{plan.their_shape}</Badge>
          <Badge>{Math.round((plan.threat_level || 0) * 100)}% threat</Badge>
          <span className="text-xs text-muted-foreground">vs our {plan.our_formation}</span>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-foreground/90">{plan.summary}</p>
      </section>

      <section className="space-y-3">
        <h3 className="flex items-center gap-2 font-heading text-xs uppercase tracking-[0.25em] text-muted-foreground">
          <Shield className="h-4 w-4" /> Predicted responses
        </h3>
        {(plan.predicted_responses || []).map((r, i) => (
          <div key={i} className="rounded-2xl border border-border/60 bg-card/40 p-5">
            <p className="text-[11px] uppercase tracking-widest text-emerald-300">{r.trigger}</p>
            <p className="mt-2 text-sm">{r.their_move}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div>
                <div className="mb-1 flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
                  <span>Likelihood</span><span>{Math.round((r.likelihood || 0) * 100)}%</span>
                </div>
                <Progress value={(r.likelihood || 0) * 100} className="h-1.5" />
              </div>
              <div>
                <div className="mb-1 flex justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
                  <span>Danger</span><span>{Math.round((r.danger || 0) * 100)}%</span>
                </div>
                <Progress value={(r.danger || 0) * 100} className="h-1.5" />
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
              <span className="text-emerald-300">Counter: </span>{r.our_counter}
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-border/60 bg-card/40 p-6">
          <h3 className="mb-4 flex items-center gap-2 font-heading text-xs uppercase tracking-[0.25em] text-muted-foreground">
            <Target className="h-4 w-4" /> Zones to exploit
          </h3>
          <div className="space-y-4">
            {(plan.exploitable_zones || []).map((z, i) => (
              <div key={i}>
                <p className="text-sm font-medium">{z.zone}</p>
                <p className="mt-1 text-xs text-muted-foreground">{z.why}</p>
                <p className="mt-1 text-xs text-emerald-300">{z.instruction}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-3xl border border-border/60 bg-card/40 p-6">
          <h3 className="mb-4 flex items-center gap-2 font-heading text-xs uppercase tracking-[0.25em] text-muted-foreground">
            <UserSearch className="h-4 w-4" /> Track these players
          </h3>
          <ul className="space-y-2 text-sm">
            {(plan.key_players_to_track || []).map((p, i) => (
              <li key={i} className="rounded-xl border border-border/60 px-3 py-2">{p}</li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}