import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { Copy, Link as LinkIcon, Loader2, ShieldCheck, Trash2 } from "lucide-react";

function dateLabel(value) {
  if (!value) return "No expiry set";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Expiry unavailable" : `Expires ${date.toLocaleDateString()}`;
}

export default function PlayerReportShareDialog({ playerNumber, children }) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [loadingShares, setLoadingShares] = useState(false);
  const [revokingId, setRevokingId] = useState(null);
  const [shareUrl, setShareUrl] = useState("");
  const [shares, setShares] = useState([]);

  const urlFor = (token) => `${window.location.origin}/report/${token}`;

  const loadShares = async () => {
    setLoadingShares(true);
    try {
      const result = await base44.functions.invoke("list-player-report-shares", { playerNumber });
      if (result?.error) throw new Error(result.error);
      setShares(result?.shares || []);
    } catch (error) {
      toast({ variant: "destructive", title: "Could not load existing links", description: error?.message || "Please try again." });
    } finally {
      setLoadingShares(false);
    }
  };

  useEffect(() => {
    if (open) loadShares();
  }, [open, playerNumber]);

  const generateLink = async () => {
    setGenerating(true);
    try {
      const result = await base44.functions.invoke("create-player-report-share", {
        playerNumber,
        expiresInDays: 30,
        includeDrills: true,
        includeProgress: true,
      });
      if (result?.error) throw new Error(result.error);
      const url = urlFor(result.token);
      setShareUrl(url);
      await loadShares();
      toast({ title: "Secure player link created", description: "Only approved, coach-scoped evidence will appear in this report." });
    } catch (error) {
      toast({ variant: "destructive", title: "Could not create share link", description: error?.message || "Please try again." });
    } finally {
      setGenerating(false);
    }
  };

  const copyLink = async (url) => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: "The player can open this read-only report on any device." });
    } catch {
      toast({ variant: "destructive", title: "Could not copy link", description: "Select and copy the link manually." });
    }
  };

  const revokeLink = async (shareId) => {
    setRevokingId(shareId);
    try {
      const result = await base44.functions.invoke("revoke-player-report-share", { shareId });
      if (result?.error) throw new Error(result.error);
      setShares((items) => items.map((item) => item.id === shareId ? { ...item, status: "revoked" } : item));
      toast({ title: "Player link revoked", description: "Anyone using it will no longer be able to open the report." });
    } catch (error) {
      toast({ variant: "destructive", title: "Could not revoke link", description: error?.message || "Please try again." });
    } finally {
      setRevokingId(null);
    }
  };

  const handleOpenChange = (newOpen) => {
    setOpen(newOpen);
    if (!newOpen) setTimeout(() => setShareUrl(""), 300);
  };

  const activeShares = shares.filter((share) => share.status === "active");

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Player Report</DialogTitle>
          <DialogDescription>
            Create a secure, read-only link for Player #{playerNumber}. It is scoped to your approved match evidence—not every player with the same shirt number.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          <div className="rounded-2xl border border-border/60 bg-card/40 p-4 text-sm text-muted-foreground">
            <ul className="space-y-2">
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Read-only access: player cannot edit coaching data</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Automatically expires in 30 days</li>
              <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-400" /> Revocable by you at any time</li>
            </ul>
          </div>

          <Button onClick={generateLink} disabled={generating} className="w-full rounded-full">
            {generating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LinkIcon className="mr-2 h-4 w-4" />}
            Generate secure 30-day link
          </Button>

          {shareUrl && (
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/5 p-3">
              <p className="mb-2 text-xs font-medium text-emerald-200">New secure link</p>
              <div className="flex gap-2">
                <Input readOnly value={shareUrl} className="font-mono text-xs" onClick={(event) => event.target.select()} />
                <Button onClick={() => copyLink(shareUrl)} className="shrink-0 rounded-full px-3" aria-label="Copy secure player report link">
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="border-t border-border/60 pt-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <p className="font-heading text-xs uppercase tracking-[0.2em] text-muted-foreground">Your report links</p>
              {loadingShares && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            </div>
            {activeShares.length === 0 && !loadingShares ? (
              <p className="text-xs text-muted-foreground">No active links yet.</p>
            ) : (
              <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                {activeShares.map((share) => {
                  const url = urlFor(share.token);
                  return (
                    <div key={share.id} className="flex items-center gap-2 rounded-xl border border-border/60 p-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="bg-emerald-400/10 text-[10px] text-emerald-300">Active</Badge>
                          <span className="text-[11px] text-muted-foreground">{dateLabel(share.expires_at)}</span>
                        </div>
                        <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">{url}</p>
                      </div>
                      <Button size="sm" variant="ghost" className="h-8 w-8 shrink-0 rounded-full p-0" onClick={() => copyLink(url)} aria-label="Copy report link">
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-8 w-8 shrink-0 rounded-full p-0 text-destructive hover:text-destructive" onClick={() => revokeLink(share.id)} disabled={revokingId === share.id} aria-label="Revoke report link">
                        {revokingId === share.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
