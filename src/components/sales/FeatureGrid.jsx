import React from "react";
import { FEATURES } from "@/lib/salesDeck";

export default function FeatureGrid() {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {FEATURES.map((f) => (
        <div key={f.name} className="rounded-2xl border border-border/60 bg-card/40 p-4">
          <p className="font-heading text-sm">{f.name}</p>
          <p className="mt-0.5 text-xs text-emerald-300">{f.pitch}</p>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{f.detail}</p>
          <p className="mt-3 border-l-2 border-emerald-400/40 pl-3 text-xs italic leading-relaxed text-foreground/80">
            {f.example}
          </p>
        </div>
      ))}
    </div>
  );
}