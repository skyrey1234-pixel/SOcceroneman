import React from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Eye, AlertTriangle, Calendar } from "lucide-react";
import { youtubeThumb } from "@/lib/video";

export default function MatchCard({ match }) {
  return (
    <Link
      to={`/matches/${match.id}`}
      className="group block rounded-2xl border border-border/60 bg-card/60 p-6 transition-all hover:-translate-y-0.5 hover:border-emerald-400/40"
    >
      {youtubeThumb(match.youtube_url) && (
        <img
          src={youtubeThumb(match.youtube_url)}
          alt=""
          className="mb-5 aspect-video w-full rounded-xl object-cover opacity-80 transition-opacity group-hover:opacity-100"
        />
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="font-heading text-lg tracking-tight">{match.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {match.opponent ? `vs ${match.opponent}` : "Training session"}
            {match.competition ? ` · ${match.competition}` : ""}
          </p>
        </div>
        <Badge variant={match.status === "complete" ? "default" : "secondary"}>{match.status}</Badge>
      </div>
      <div className="mt-6 flex flex-wrap gap-6 text-sm">
        <span className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {match.match_date || "—"}
        </span>
        <span className="flex items-center gap-2 text-red-300">
          <AlertTriangle className="h-4 w-4" />
          {match.total_blindspots ?? 0} blindspots
        </span>
        <span className="flex items-center gap-2 text-emerald-300">
          <Eye className="h-4 w-4" />
          scan {match.avg_scan_quality ? match.avg_scan_quality.toFixed(2) : "—"}
        </span>
      </div>
    </Link>
  );
}