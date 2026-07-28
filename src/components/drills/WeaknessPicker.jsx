import React from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Dumbbell } from "lucide-react";

export default function WeaknessPicker({
  players, player, onPlayer, weaknesses, weakness, onWeakness, onGenerate, running,
}) {
  return (
    <div className="space-y-5 rounded-3xl border border-border/60 bg-card/40 p-6">
      <div className="grid gap-2">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Player</p>
        <Select value={player ? String(player) : ""} onValueChange={(v) => onPlayer(Number(v))}>
          <SelectTrigger><SelectValue placeholder="Choose a player" /></SelectTrigger>
          <SelectContent>
            {players.map((n) => (
              <SelectItem key={n} value={String(n)}>Player #{n}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
          Detected weaknesses — pick one to train
        </p>
        {weaknesses.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Select a player with logged blindspots to see weaknesses.
          </p>
        )}
        {weaknesses.map((w) => (
          <button
            key={w.key}
            onClick={() => onWeakness(w.key)}
            className={`w-full rounded-2xl border p-3 text-left transition-colors ${
              weakness === w.key
                ? "border-emerald-400/60 bg-emerald-400/10"
                : "border-border/60 hover:border-emerald-400/30"
            }`}
          >
            <div className="mb-1.5 flex justify-between gap-3 text-xs">
              <span>{w.key}</span>
              <span className="text-muted-foreground">{Math.round(w.score * 100)}%</span>
            </div>
            <Progress value={w.score * 100} className="h-1" />
          </button>
        ))}
      </div>

      <Button
        className="w-full rounded-full"
        disabled={!player || !weakness || running}
        onClick={onGenerate}
      >
        {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Dumbbell className="mr-2 h-4 w-4" />}
        {running ? "Designing drills…" : "Build training drills"}
      </Button>
    </div>
  );
}