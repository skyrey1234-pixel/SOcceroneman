import React, { useEffect } from "react";
import { Radar } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AuthRedirectNotice({ onRedirect }) {
  useEffect(() => {
    onRedirect();
  }, [onRedirect]);

  return (
    <div className="fixed inset-0 grid place-items-center bg-background px-6 text-center">
      <div className="max-w-sm space-y-4">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-emerald-400/15 text-emerald-300">
          <Radar className="h-6 w-6" />
        </span>
        <h1 className="font-display text-xl tracking-tight">Sending you to sign in…</h1>
        <p className="text-sm text-muted-foreground">
          Your session needs to be refreshed before match data can load. If nothing happens in a few
          seconds, use the button below.
        </p>
        <Button onClick={onRedirect} className="rounded-full">Sign in</Button>
      </div>
    </div>
  );
}