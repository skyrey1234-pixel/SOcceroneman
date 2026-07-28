import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import PlayAnimation from "@/components/pitch/PlayAnimation";
import { generateSubPlay } from "@/lib/subplay";
import { Loader2, Wand2 } from "lucide-react";

export default function CorrectPlayPanel({ event, match }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const { data: plays = [], isLoading } = useQuery({
    queryKey: ["subplay", event.id],
    queryFn: () => base44.entities.SubPlay.filter({ event_id: event.id }),
  });
  const play = plays[0];

  const generate = async () => {
    setBusy(true);
    await generateSubPlay(event, match);
    await qc.invalidateQueries({ queryKey: ["subplay", event.id] });
    setBusy(false);
  };

  if (isLoading) return <p className="text-xs text-muted-foreground">Loading play…</p>;

  if (!play) {
    return (
      <Button size="sm" variant="outline" className="rounded-full" onClick={generate} disabled={busy}>
        {busy ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Wand2 className="mr-2 h-3.5 w-3.5" />}
        {busy ? "Drawing the correct play…" : "Show the correct play"}
      </Button>
    );
  }

  const options = play.options || [];

  return (
    <div className="space-y-3 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
      <p className="font-heading text-sm text-emerald-300">{play.headline}</p>
      <Tabs defaultValue="0">
        <TabsList className="grid w-full grid-cols-3">
          {options.map((o, i) => (
            <TabsTrigger key={i} value={String(i)} className="truncate text-xs">
              Option {i + 1}
            </TabsTrigger>
          ))}
        </TabsList>
        {options.map((o, i) => (
          <TabsContent key={i} value={String(i)} className="space-y-3 pt-4">
            <div>
              <p className="font-heading text-sm">{o.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{o.rationale}</p>
            </div>
            <PlayAnimation option={o} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}