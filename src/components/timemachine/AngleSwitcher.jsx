import React from "react";
import { REPLAY_ANGLES } from "@/lib/replayAngles";
import { Camera } from "lucide-react";

export default function AngleSwitcher({ value, onChange, observerNumber }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.18em] text-muted-foreground">
        <Camera className="h-3 w-3" aria-hidden="true" /> Angle
      </span>
      {REPLAY_ANGLES.map((angle) => (
        <button
          key={angle.id}
          type="button"
          onClick={() => onChange(angle.id)}
          aria-pressed={value === angle.id}
          title={angle.id === "pov" && observerNumber != null ? `Through #${observerNumber}'s eyes` : angle.hint}
          className={`cursor-pointer rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
            value === angle.id
              ? "border-[#FF7A1A]/60 bg-[#FF7A1A]/15 text-[#FF7A1A]"
              : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
          }`}
        >
          {angle.id === "pov" && observerNumber != null ? `#${observerNumber} view` : angle.label}
        </button>
      ))}
    </div>
  );
}