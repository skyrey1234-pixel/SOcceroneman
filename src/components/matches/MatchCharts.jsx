import React from "react";
import {
  ResponsiveContainer, ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar,
} from "recharts";

const axis = { stroke: "rgba(255,255,255,0.35)", fontSize: 11 };
const tooltipStyle = {
  background: "#0b1f16",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: 12,
  fontSize: 12,
};

export default function MatchCharts({ events }) {
  const timeline = events.map((e) => ({
    minute: Math.round(e.minute || 0),
    severity: Math.round((e.severity || 0) * 100),
    player: e.observer_player,
  }));

  const perPlayer = Object.values(
    events.reduce((acc, e) => {
      const k = e.observer_player ?? "?";
      acc[k] = acc[k] || { player: `#${k}`, count: 0 };
      acc[k].count += 1;
      return acc;
    }, {})
  ).sort((a, b) => b.count - a.count);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-3xl border border-border/60 bg-card/40 p-6">
        <h3 className="mb-4 font-heading text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Severity over the match
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <ScatterChart margin={{ top: 6, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" />
            <XAxis type="number" dataKey="minute" name="Minute" domain={[0, 95]} {...axis} />
            <YAxis type="number" dataKey="severity" name="Severity" domain={[0, 100]} {...axis} />
            <Tooltip contentStyle={tooltipStyle} />
            <Scatter data={timeline} fill="#f87171" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-3xl border border-border/60 bg-card/40 p-6">
        <h3 className="mb-4 font-heading text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Blindspots by player
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={perPlayer} margin={{ top: 6, right: 8, bottom: 0, left: -20 }}>
            <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
            <XAxis dataKey="player" {...axis} />
            <YAxis allowDecimals={false} {...axis} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="count" fill="#34d399" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}