import React from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, Users, X, Sparkles } from "lucide-react";

export default function DrillCard({ drill }) {
  return (
    <div className="space-y-4 rounded-3xl border border-border/60 bg-card/40 p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="font-heading text-base">{drill.title}</h3>
        <Badge variant="secondary" className="gap-1">
          <Clock className="h-3 w-3" /> {drill.duration_min} min
        </Badge>
        <Badge variant="secondary" className="gap-1">
          <Users className="h-3 w-3" /> {drill.players_needed}
        </Badge>
      </div>
      <p className="text-sm text-emerald-300">{drill.focus}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Setup</p>
          <p className="mt-1 text-xs leading-relaxed">{drill.setup}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">How it runs</p>
          <p className="mt-1 text-xs leading-relaxed">{drill.how_it_runs}</p>
        </div>
      </div>

      {drill.coaching_points?.length > 0 && (
        <ul className="space-y-1.5 text-xs leading-relaxed text-muted-foreground">
          {drill.coaching_points.map((p, i) => (
            <li key={i} className="border-l-2 border-emerald-400/40 pl-3">{p}</li>
          ))}
        </ul>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-red-400/10 p-4">
          <p className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-red-300">
            <X className="h-3.5 w-3.5" /> Where we messed up
          </p>
          <p className="mt-2 text-xs leading-relaxed">{drill.where_we_messed_up}</p>
        </div>
        <div className="rounded-2xl bg-emerald-400/10 p-4">
          <p className="flex items-center gap-2 text-[11px] uppercase tracking-widest text-emerald-300">
            <Sparkles className="h-3.5 w-3.5" /> How elite players do it
          </p>
          <p className="mt-2 text-xs leading-relaxed">{drill.how_elite_players_do_it}</p>
        </div>
      </div>

      <div className="flex flex-col gap-1 border-t border-border/60 pt-4 text-xs text-muted-foreground">
        <p><span className="text-foreground">Progression: </span>{drill.progression}</p>
        <p><span className="text-foreground">Success metric: </span>{drill.success_metric}</p>
      </div>
    </div>
  );
}