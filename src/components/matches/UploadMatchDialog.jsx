import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import FileDropzone from "./FileDropzone";
import { validateMatchVideoFile, verifyYoutubeVideo, youtubeId, youtubeThumb } from "@/lib/video";
import { CheckCircle2, Loader2, Plus, TriangleAlert, Youtube } from "lucide-react";

const EMPTY = {
  title: "", opponent: "", match_date: "", competition: "",
  camera_type: "broadcast", notes: "", youtube_url: "",
};

export default function UploadMatchDialog({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("file");
  const [form, setForm] = useState(EMPTY);
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState("");
  const [submissionError, setSubmissionError] = useState("");
  const [youtubeCheck, setYoutubeCheck] = useState({ status: "idle", message: "", title: "" });

  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  const ytValid = Boolean(youtubeId(form.youtube_url));
  const canSave = Boolean(
    form.title.trim() &&
    (tab === "file" ? file && !fileError : ytValid)
  );

  const reset = () => {
    setForm(EMPTY);
    setFile(null);
    setFileError("");
    setSubmissionError("");
    setYoutubeCheck({ status: "idle", message: "", title: "" });
  };

  const handleOpenChange = (nextOpen) => {
    setOpen(nextOpen);
    if (!nextOpen && !saving) reset();
  };

  const handleFile = (candidate) => {
    setFile(candidate || null);
    const message = validateMatchVideoFile(candidate);
    setFileError(message || "");
    setSubmissionError("");
  };

  const handleYoutubeChange = (event) => {
    set("youtube_url")(event);
    setSubmissionError("");
    setYoutubeCheck({ status: "idle", message: "", title: "" });
  };

  const checkYoutube = async () => {
    setSubmissionError("");
    setYoutubeCheck({ status: "checking", message: "", title: "" });
    const result = await verifyYoutubeVideo(form.youtube_url);
    setYoutubeCheck({
      status: result.ok ? "success" : "error",
      message: result.message || "",
      title: result.title || "",
    });
    return result;
  };

  const submit = async () => {
    setSubmissionError("");

    if (!form.title.trim()) {
      setSubmissionError("Add a match title before saving.");
      return;
    }

    if (tab === "file") {
      const validationError = validateMatchVideoFile(file);
      if (validationError) {
        setFileError(validationError);
        return;
      }
    } else {
      const verification = await checkYoutube();
      if (!verification.ok) return;
    }

    setSaving(true);
    try {
      let videoUrl;
      if (tab === "file" && file) {
        const upload = await base44.integrations.Core.UploadFile({ file });
        videoUrl = upload?.file_url;
        if (!videoUrl) throw new Error("The video upload did not return a usable file URL.");
      }

      const match = await base44.entities.Match.create({
        ...form,
        title: form.title.trim(),
        youtube_url: tab === "youtube" ? form.youtube_url.trim() : undefined,
        video_url: videoUrl,
        status: "queued",
      });

      setOpen(false);
      reset();
      onCreated?.(match);
    } catch (error) {
      setSubmissionError(
        error?.message || "We could not save this match. Check the footage and try again."
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="rounded-full">
          <Plus className="mr-2 h-4 w-4" /> Add footage
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Add match footage</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(nextTab) => { setTab(nextTab); setSubmissionError(""); }} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">Upload video</TabsTrigger>
            <TabsTrigger value="youtube">YouTube link</TabsTrigger>
          </TabsList>
          <TabsContent value="file" className="pt-4">
            <FileDropzone file={file} onFile={handleFile} error={fileError} />
          </TabsContent>
          <TabsContent value="youtube" className="space-y-3 pt-4">
            <div className="grid gap-2">
              <Label>YouTube URL</Label>
              <Input
                value={form.youtube_url}
                onChange={handleYoutubeChange}
                placeholder="https://www.youtube.com/watch?v=…"
              />
            </div>
            {ytValid ? (
              <>
                <img
                  src={youtubeThumb(form.youtube_url)}
                  alt="Video preview"
                  className="w-full rounded-2xl border border-border/60"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" className="rounded-full" onClick={checkYoutube} disabled={youtubeCheck.status === "checking"}>
                    {youtubeCheck.status === "checking" && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                    {youtubeCheck.status === "checking" ? "Checking link…" : "Check video availability"}
                  </Button>
                  {youtubeCheck.status === "success" && (
                    <span className="inline-flex items-center gap-1.5 text-xs text-emerald-300">
                      <CheckCircle2 className="h-4 w-4" /> {youtubeCheck.title || "Video link confirmed"}
                    </span>
                  )}
                </div>
                {youtubeCheck.status === "error" && (
                  <p className="flex gap-2 text-xs leading-relaxed text-red-300">
                    <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {youtubeCheck.message}
                  </p>
                )}
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Use a public or unlisted video with embedding enabled. Private, age-restricted, or region-blocked videos cannot be analyzed reliably.
                </p>
              </>
            ) : (
              form.youtube_url && (
                <p className="flex items-center gap-2 text-xs text-red-300">
                  <Youtube className="h-4 w-4" /> That does not look like a supported YouTube link.
                </p>
              )
            )}
          </TabsContent>
        </Tabs>

        <div className="grid gap-4 pt-4">
          <div className="grid gap-2">
            <Label>Match title</Label>
            <Input value={form.title} onChange={set("title")} placeholder="U18 vs Riverside" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Opponent</Label>
              <Input value={form.opponent} onChange={set("opponent")} />
            </div>
            <div className="grid gap-2">
              <Label>Date</Label>
              <Input type="date" value={form.match_date} onChange={set("match_date")} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Competition</Label>
              <Input value={form.competition} onChange={set("competition")} />
            </div>
            <div className="grid gap-2">
              <Label>Camera</Label>
              <Select
                value={form.camera_type}
                onValueChange={(value) => setForm((current) => ({ ...current, camera_type: value }))}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="broadcast">Broadcast (best)</SelectItem>
                  <SelectItem value="endzone">Endzone</SelectItem>
                  <SelectItem value="phone">Phone recording</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Coach notes</Label>
            <Textarea
              value={form.notes}
              onChange={set("notes")}
              placeholder="Formation, key players, what you want reviewed…"
            />
          </div>
        </div>

        {submissionError && (
          <p className="flex gap-2 rounded-xl border border-red-400/30 bg-red-400/5 p-3 text-xs leading-relaxed text-red-200">
            <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" /> {submissionError}
          </p>
        )}

        <DialogFooter>
          <Button onClick={submit} disabled={saving || !canSave} className="rounded-full">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {saving ? "Saving footage…" : "Save match"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
