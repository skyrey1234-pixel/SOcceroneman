import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Swords } from "lucide-react";

const FORMATIONS = ["4-3-3", "4-2-3-1", "4-4-2", "3-5-2", "3-4-3", "4-1-4-1", "5-3-2"];

export default function AdversaryForm({ onRun, running }) {
  const [opponent, setOpponent] = useState("");
  const [formation, setFormation] = useState("4-3-3");
  const [approach, setApproach] = useState("");

  return (
    <div className="space-y-4 rounded-3xl border border-border/60 bg-card/40 p-6">
      <div className="grid gap-2">
        <Label>Opponent</Label>
        <Input
          value={opponent}
          onChange={(e) => setOpponent(e.target.value)}
          placeholder="Liverpool, Bayer Leverkusen, Riverside U18…"
        />
      </div>
      <div className="grid gap-2">
        <Label>Our formation</Label>
        <Select value={formation} onValueChange={setFormation}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {FORMATIONS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div className="grid gap-2">
        <Label>Our approach</Label>
        <Textarea
          value={approach}
          onChange={(e) => setApproach(e.target.value)}
          placeholder="High press, invert both full-backs, overload the left half-space…"
        />
      </div>
      <Button
        className="w-full rounded-full"
        disabled={!opponent || running}
        onClick={() => onRun({ opponent, our_formation: formation, our_approach: approach })}
      >
        {running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Swords className="mr-2 h-4 w-4" />}
        {running ? "Simulating the opponent…" : "Run adversary simulation"}
      </Button>
    </div>
  );
}