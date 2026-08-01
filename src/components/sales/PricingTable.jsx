import React from "react";
import { Check } from "lucide-react";
import { PRICING } from "@/lib/salesDeck";

export default function PricingTable() {
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {PRICING.map((p) => (
        <div
          key={p.tier}
          className={`rounded-2xl border p-5 ${
            p.popular ? "border-emerald-400/60 bg-emerald-400/5" : "border-border/60 bg-card/40"
          }`}
        >
          <div className="flex items-baseline justify-between">
            <p className="font-display text-xl">{p.tier}</p>
            {p.popular && (
              <span className="rounded-full bg-emerald-400/15 px-2 py-0.5 text-[10px] uppercase tracking-widest text-emerald-300">
                Most sold
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{p.who}</p>

          <div className="mt-4 flex items-end gap-1">
            <span className="font-display text-3xl">${p.monthly}</span>
            <span className="pb-1 text-xs text-muted-foreground">/ month</span>
          </div>
          <div className="mt-2 rounded-lg border border-border/60 px-3 py-2">
            <p className="text-sm">
              <span className="font-display text-lg">${p.season.toLocaleString()}</span>
              <span className="text-xs text-muted-foreground"> / season</span>
            </p>
            <p className="text-[11px] text-emerald-300">{p.seasonNote}</p>
          </div>

          <ul className="mt-4 space-y-2">
            {p.includes.map((i) => (
              <li key={i} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                <span>{i}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}