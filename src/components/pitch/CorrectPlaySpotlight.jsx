import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import ChalkboardPlay from "./ChalkboardPlay";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

// Replays any generated "correct play" on the chalkboard inside the live pitch view.
export default function CorrectPlaySpotlight() {
  const [playId, setPlayId] = useState(null);
  const [optionIdx, setOptionIdx] = useState(0);

  const { data: plays = [] } = useQuery({
    queryKey: ["subplays"],
    queryFn: () => base44.entities.SubPlay.list("-created_date", 30),
  });

  const play = plays.find((p) => p.id === playId) || plays[0];
  const option = play?.options?.[optionIdx];

  if (plays.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Generate a correct play from a match's blindspot moment and it will replay here.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          value={play?.id || ""}
          onValueChange={(v) => { setPlayId(v); setOptionIdx(0); }}
        >
          <SelectTrigger><SelectValue placeholder="Choose a play" /></SelectTrigger>
          <SelectContent>
            {plays.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.headline || "Correct play"}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(optionIdx)} onValueChange={(v) => setOptionIdx(Number(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {(play?.options || []).map((o, i) => (
              <SelectItem key={i} value={String(i)}>{o.title || `Option ${i + 1}`}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {option && (
        <>
          <p className="text-xs leading-relaxed text-muted-foreground">{option.rationale}</p>
          <ChalkboardPlay option={option} />
          <p className="text-xs text-emerald-300">{option.outcome}</p>
        </>
      )}
    </div>
  );
}