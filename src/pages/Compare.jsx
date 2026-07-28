import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import CompareColumn from "@/components/compare/CompareColumn";

export default function Compare() {
  const [left, setLeft] = useState(null);
  const [right, setRight] = useState(null);

  const { data: matches = [] } = useQuery({
    queryKey: ["matches"],
    queryFn: () => base44.entities.Match.list("-created_date", 50),
  });
  const { data: events = [] } = useQuery({
    queryKey: ["all-events"],
    queryFn: () => base44.entities.BlindspotEvent.list("-created_date", 500),
  });

  const forMatch = (id) => events.filter((e) => e.match_id === id);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Split Screen</p>
        <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">Compare two matches</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Put two games side by side — blindspot zones, scan quality and the worst moments from each,
          so you can see whether the fixes actually landed.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <CompareColumn
          matches={matches}
          matchId={left}
          onMatch={setLeft}
          match={matches.find((m) => m.id === left)}
          events={forMatch(left)}
        />
        <CompareColumn
          matches={matches}
          matchId={right}
          onMatch={setRight}
          match={matches.find((m) => m.id === right)}
          events={forMatch(right)}
        />
      </div>
    </div>
  );
}