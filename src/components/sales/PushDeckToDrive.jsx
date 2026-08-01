import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { CloudUpload, Loader2, ExternalLink } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { SLIDES, PRICING, FEATURES } from "@/lib/salesDeck";

export default function PushDeckToDrive({ includeNotes }) {
  const [state, setState] = useState({ status: "idle" });

  const push = async () => {
    setState({ status: "loading" });
    try {
      const res = await base44.functions.invoke("pushSalesDeckToDrive", {
        slides: SLIDES,
        pricing: PRICING,
        features: FEATURES,
        includeNotes,
      });
      setState({ status: "done", link: res.data.webViewLink, name: res.data.name });
    } catch (err) {
      setState({ status: "error", message: err?.response?.data?.error || "Upload failed" });
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <Button variant="outline" size="sm" onClick={push} disabled={state.status === "loading"}>
        {state.status === "loading" ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <CloudUpload className="mr-2 h-4 w-4" />
        )}
        {state.status === "loading" ? "Uploading…" : "Save PDF to Drive"}
      </Button>
      {state.status === "done" && (
        <a
          href={state.link}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-emerald-300 hover:underline"
        >
          <ExternalLink className="h-3 w-3" /> Open in Drive
        </a>
      )}
      {state.status === "error" && <span className="text-[11px] text-red-400">{state.message}</span>}
    </div>
  );
}