import React from "react";
import { AlertTriangle } from "lucide-react";

export default function BlindspotFeed({ blindspots, onFocus }) {
  if (!blindspots.length) {
    return (
      <p className="text-sm text-muted-foreground">
        No blindspots right now — every visible player is being tracked.
      </p>
    );
  }
  return (
    <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
      {blindspots.slice(0, 20).map((b, i) => (
        <button
          key={i}
          onClick={() => onFocus?.(b.observerId)}
          className="w-full text-left rounded-xl border border-border/60 bg-card/60 p-3 transition-colors hover:border-red-400/50"
        >
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-red-400" />
            <div className="min-w-0">
              <p className="text-sm leading-snug">{b.feedback}</p>
              <p className="mt-1 text-[11px] uppercase tracking-widest text-muted-foreground">
                Severity {Math.round(b.severity * 100)}% · {b.distance.toFixed(1)}m ·{" "}
                {Math.round(b.angle)}°
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}