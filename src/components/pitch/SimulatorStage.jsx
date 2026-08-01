import React from "react";
import PerspectiveStage from "@/components/timemachine/PerspectiveStage";

/**
 * Renders the live simulator scene from a virtual camera (endzone or selected player POV).
 * Reuses the Time Machine projection so both views share one geometry model.
 */
export default function SimulatorStage({ angle, players, ball, selectedId, blindspots }) {
  const observer = players.find((p) => p.id === selectedId);
  const missedIds = new Set(
    (blindspots || []).filter((b) => b.observerId === selectedId).map((b) => b.targetId)
  );

  const tokens = players
    .filter((p) => !(angle === "pov" && p.id === selectedId))
    .map((p) => ({
      id: p.id,
      x: p.x,
      y: p.y,
      label: p.number,
      isOpponent: p.team === "away",
      highlight: missedIds.has(p.id),
      name: missedIds.has(p.id) ? "UNSEEN" : undefined,
    }));

  return (
    <PerspectiveStage
      angle={angle}
      camera={angle === "pov" && observer ? observer : { x: 0, y: 34 }}
      facing={((observer?.facing || 0) * Math.PI) / 180}
      tokens={tokens}
      lines={[]}
      ball={ball}
    />
  );
}