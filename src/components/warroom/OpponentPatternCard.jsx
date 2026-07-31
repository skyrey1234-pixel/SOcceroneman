import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { REVIEW_STATUS, reviewStatusLabel, isPendingReview, isDismissedEvent, isApprovedEvent } from "@/lib/review";
import { Check, Clock3, MapPin, Target, X } from "lucide-react";

export default function OpponentPatternCard({ pattern }) {
  const qc = useQueryClient();
  const [reviewing, setReviewing] = useState(false);

  const pending = isPendingReview(pattern);
  const approved = isApprovedEvent(pattern);
  const dismissed = isDismissedEvent(pattern);

  const statusClass = approved
    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
    : dismissed
      ? "border-border/60 bg-muted/40 text-muted-foreground"
      : "border-amber-400/30 bg-amber-400/10 text-amber-200";

  const handleReview = async (status) => {
    setReviewing(true);
    try {
      const user = await base44.auth.me().catch(() => null);
      await base44.entities.OpponentPattern.update(pattern.id, {
        review_status: status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id || user?.email || "coach",
      });
      await qc.invalidateQueries({ queryKey: ["opponent-patterns"] });
      toast({ title: "Pattern review saved", description: `This pattern is now marked as ${status}.` });
    } catch (error) {
      toast({ variant: "destructive", title: "Could not save review", description: error?.message });
    } finally {
      setReviewing(false);
    }
  };

  return (
    <div className={`space-y-4 rounded-3xl border bg-card/40 p-6 transition-colors ${dismissed ? "opacity-60" : "border-border/60"}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Badge variant="outline" className="mb-3 bg-background/50">
            {Math.round((pattern.confidence || 0) * 100)}% Confidence
          </Badge>
          <h3 className="font-display text-xl">{pattern.label}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{pattern.summary}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {pattern.zone}</span>
        <span className="flex items-center gap-1.5"><Target className="h-3.5 w-3.5" /> {pattern.phase?.replace(/_/g, " ")}</span>
        <span className="flex items-center gap-1.5">Based on {pattern.sample_size} approved moments across {pattern.match_count} matches</span>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-4">
        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider ${statusClass}`}>
          {approved ? <Check className="h-3 w-3" /> : dismissed ? <X className="h-3 w-3" /> : <Clock3 className="h-3 w-3" />}
          {reviewStatusLabel(pattern)}
        </span>

        {pending && (
          <div className="flex items-center gap-2">
            <Button size="sm" className="h-8 rounded-full bg-emerald-400 px-3 text-xs text-emerald-950 hover:bg-emerald-300" disabled={reviewing} onClick={() => handleReview(REVIEW_STATUS.APPROVED)}>
              <Check className="mr-1 h-3.5 w-3.5" /> Approve pattern
            </Button>
            <Button size="sm" variant="outline" className="h-8 rounded-full px-3 text-xs" disabled={reviewing} onClick={() => handleReview(REVIEW_STATUS.DISMISSED)}>
              <X className="mr-1 h-3.5 w-3.5" /> Dismiss
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
