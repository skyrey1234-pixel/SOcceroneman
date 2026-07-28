import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import MatchCard from "@/components/matches/MatchCard";
import UploadMatchDialog from "@/components/matches/UploadMatchDialog";
import { Film } from "lucide-react";

export default function Matches() {
  const qc = useQueryClient();
  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["matches"],
    queryFn: () => base44.entities.Match.list("-created_date"),
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Library</p>
          <h1 className="mt-2 font-display text-3xl tracking-tight sm:text-4xl">Matches</h1>
        </div>
        <UploadMatchDialog onCreated={() => qc.invalidateQueries({ queryKey: ["matches"] })} />
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading matches…</p>
      ) : matches.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border/60 p-16 text-center">
          <Film className="mx-auto mb-4 h-8 w-8 text-muted-foreground" />
          <p className="font-heading">No footage yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a match to generate its scanning and blindspot report.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {matches.map((m) => (
            <MatchCard key={m.id} match={m} />
          ))}
        </div>
      )}
    </div>
  );
}