import React from "react";
import PricingTable from "./PricingTable";
import FeatureGrid from "./FeatureGrid";

export default function DeckSlide({ slide }) {
  return (
    <div className="rounded-3xl border border-border/60 bg-card/30 p-6 sm:p-10">
      <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">{slide.eyebrow}</p>
      <h2
        className={`mt-3 font-display tracking-tight ${
          slide.kind === "cover" ? "text-3xl sm:text-5xl" : "text-2xl sm:text-3xl"
        }`}
      >
        {slide.title}
      </h2>

      {slide.body && (
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-muted-foreground sm:text-base">{slide.body}</p>
      )}

      {slide.bullets && (
        <ul className="mt-6 space-y-3">
          {slide.bullets.map((b, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
              <span className="text-sm leading-relaxed sm:text-base">{b}</span>
            </li>
          ))}
        </ul>
      )}

      {slide.steps && (
        <ol className="mt-6 space-y-2">
          {slide.steps.map((s) => (
            <li key={s.t} className="flex gap-4 rounded-xl border border-border/60 px-4 py-3">
              <span className="w-12 shrink-0 font-mono text-xs text-emerald-300">{s.t}</span>
              <span className="text-sm leading-relaxed">{s.d}</span>
            </li>
          ))}
        </ol>
      )}

      {slide.items && (
        <div className="mt-6 space-y-3">
          {slide.items.map((it) => (
            <div key={it.o} className="rounded-xl border border-border/60 bg-background/40 p-4">
              <p className="text-sm font-semibold text-red-300">{it.o}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                <span className="text-emerald-300">Say: </span>
                {it.a}
              </p>
            </div>
          ))}
        </div>
      )}

      {slide.kind === "features" && (
        <div className="mt-6">
          <FeatureGrid />
        </div>
      )}

      {slide.kind === "pricing" && (
        <div className="mt-6">
          <PricingTable />
          <p className="mt-4 text-xs text-muted-foreground">
            All tiers include unlimited coach-approved reports, Time Machine replay, and email support. Season
            pricing is billed once and covers a 10-month competitive season.
          </p>
        </div>
      )}
    </div>
  );
}