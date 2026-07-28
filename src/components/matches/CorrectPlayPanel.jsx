import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ChalkboardPlay from "@/components/pitch/ChalkboardPlay";
import MatchVideoPlayer from "./MatchVideoPlayer";
import { generateSubPlay } from "@/lib/subplay";
import { formatClock, timestampOf } from "./BlindspotMoment";
import { Loader2, Wand2, Film } from "lucide-react";

export default function CorrectPlayPanel({ event, match }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [showClip, setShowClip] = useState(false);

  const { data: plays = [], isLoading } = useQuery({
    queryKey: ["subplay", event.id],
    queryFn: () => base44.entities.SubPlay.filter({ event_id: event.id }),
  });
  const play = plays[0];

  const ts = timestampOf(event);
  const start = Math.max(0, ts - 4);
  const end = ts + 6;

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
    <div className="space-y-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-heading text-sm text-emerald-300">{play.headline}</p>
        <div className="flex items-center gap-3">
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
            Clip {formatClock(start)} – {formatClock(end)}
          </span>
          {match && (
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => setShowClip((s) => !s)}
            >
              <Film className="mr-2 h-3.5 w-3.5" /> {showClip ? "Hide footage" : "Watch footage"}
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="0">
        <TabsList className="grid w-full grid-cols-3">
          {options.map((o, i) => (
            <TabsTrigger key={i} value={String(i)} className="truncate text-xs">
              Option {i + 1}
            </TabsTrigger>
          ))}
        </TabsList>
        {options.map((o, i) => (
          <TabsContent key={i} value={String(i)} className="pt-4">
            <div className={`grid gap-4 ${showClip ? "lg:grid-cols-2" : ""}`}>
              <div className="space-y-3">
                <div>
                  <p className="font-heading text-sm">{o.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{o.rationale}</p>
                </div>
                <ChalkboardPlay
                  option={o}
                  mistakeNumbers={[event.observer_player]}
                  startLabel={formatClock(start)}
                  endLabel={formatClock(end)}
                />
                <p className="text-xs text-emerald-300">{o.outcome}</p>
              </div>
              {showClip && match && (
                <div className="space-y-2">
                  <MatchVideoPlayer match={match} seekSeconds={start} />
                  <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                    Footage cued to the moment the play begins
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}