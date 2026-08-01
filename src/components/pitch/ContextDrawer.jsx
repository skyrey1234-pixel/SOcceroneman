import React from "react";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Collapsible workspace drawer that holds the simulator's controls and feeds,
 * so the pitch stays the visual focus.
 */
export default function ContextDrawer({ open, onOpenChange, children }) {
  return (
    <>
      {!open && (
        <Button
          variant="outline"
          size="sm"
          className="cursor-pointer rounded-full transition-colors"
          onClick={() => onOpenChange(true)}
          aria-expanded={false}
          aria-label="Open the analysis drawer"
        >
          <PanelRightOpen className="mr-2 h-4 w-4" aria-hidden="true" /> Analysis drawer
        </Button>
      )}

      {open && (
        <aside
          className="flex w-full min-w-0 flex-col gap-4 rounded-3xl border border-border/60 bg-card/40 p-4 lg:w-[360px] lg:shrink-0"
          aria-label="Analysis drawer"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xs uppercase tracking-[0.25em] text-muted-foreground">
              Analysis Drawer
            </h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer"
              onClick={() => onOpenChange(false)}
              aria-label="Collapse the analysis drawer"
            >
              <PanelRightClose className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
          {children}
        </aside>
      )}
    </>
  );
}