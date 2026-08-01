import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Presentation, Eye, EyeOff, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SLIDES } from "@/lib/salesDeck";
import DeckSlide from "@/components/sales/DeckSlide";

export default function SalesDeck() {
  const [index, setIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(true);
  const slide = SLIDES[index];

  const go = (delta) => setIndex((i) => Math.min(SLIDES.length - 1, Math.max(0, i + delta)));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Sales enablement</p>
          <h1 className="mt-2 flex items-center gap-2 font-display text-3xl tracking-tight sm:text-4xl">
            <Presentation className="h-7 w-7 text-emerald-300" /> Coach pitch deck
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground">
            Nine slides in pitch order, with presenter notes, a timed demo script, pricing, and objection
            handling. Reps can run this on their own, start to finish.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowNotes((v) => !v)}>
            {showNotes ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
            {showNotes ? "Hide notes" : "Show notes"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {SLIDES.map((s, i) => (
          <button
            key={s.title}
            onClick={() => setIndex(i)}
            className={`rounded-full border px-3 py-1 text-[11px] transition-colors ${
              i === index
                ? "border-emerald-400/60 bg-emerald-400/15 text-emerald-200"
                : "border-border/60 text-muted-foreground hover:border-emerald-400/40"
            }`}
          >
            {i + 1}. {s.eyebrow}
          </button>
        ))}
      </div>

      <DeckSlide slide={slide} />

      {showNotes && slide.notes && (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-5">
          <p className="text-[11px] uppercase tracking-[0.2em] text-amber-300">Presenter notes — don't read aloud</p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/85">{slide.notes}</p>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border/60 pt-4">
        <Button variant="outline" onClick={() => go(-1)} disabled={index === 0}>
          <ChevronLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <span className="font-mono text-xs text-muted-foreground">
          {index + 1} / {SLIDES.length}
        </span>
        <Button onClick={() => go(1)} disabled={index === SLIDES.length - 1}>
          Next <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}