import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, Film, Radar, Users, Swords, Dumbbell, Columns2, Presentation } from "lucide-react";
import { featureFlags } from "@/lib/app-params";

const nav = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/matches", label: "Matches", icon: Film },
  { to: "/players", label: "Players", icon: Users },
  { to: "/drills", label: "Drills", icon: Dumbbell },
  { to: "/compare", label: "Compare", icon: Columns2 },
  { to: "/war-room", label: "War Room Beta", icon: Swords, feature: "warRoom" },
  { to: "/simulator", label: "Live Pitch", icon: Radar },
  { to: "/sales-deck", label: "Sales Deck", icon: Presentation },
];

export default function AppLayout() {
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-400/15 text-emerald-300">
              <Radar className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <p className="font-display text-base tracking-tight">Soccer AI</p>
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                Blindspot Engine
              </p>
            </div>
          </Link>
          <nav className="flex items-center gap-1">
            {nav.filter((item) => !item.feature || featureFlags[item.feature]).map(({ to, label, icon: Icon }) => {
              const active = pathname === to;
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition-colors ${
                    active
                      ? "bg-emerald-400/15 text-emerald-300"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}