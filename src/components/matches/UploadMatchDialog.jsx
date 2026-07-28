import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import FileDropzone from "./FileDropzone";
import { youtubeId, youtubeThumb } from "@/lib/video";
import { Plus, Loader2, Youtube } from "lucide-react";

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

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const ytValid = !!youtubeId(form.youtube_url);
  const canSave = form.title && (tab === "file" ? true : ytValid);

  const submit = async () => {
    setSaving(true);
    let video_url;
    if (tab === "file" && file) {
      const res = await base44.integrations.Core.UploadFile({ file });
      video_url = res.file_url;
    }
    const match = await base44.entities.Match.create({
      ...form,
      youtube_url: tab === "youtube" ? form.youtube_url : undefined,
      video_url,
      status: "queued",
    });
    setSaving(false);
    setOpen(false);
    setForm(EMPTY);
    setFile(null);
    onCreated?.(match);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full">
          <Plus className="mr-2 h-4 w-4" /> Add footage
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading">Add match footage</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="file">Upload video</TabsTrigger>
            <TabsTrigger value="youtube">YouTube link</TabsTrigger>
          </TabsList>
          <TabsContent value="file" className="pt-4">
            <FileDropzone file={file} onFile={setFile} />
          </TabsContent>
          <TabsContent value="youtube" className="space-y-3 pt-4">
            <div className="grid gap-2">
              <Label>YouTube URL</Label>
              <Input
                value={form.youtube_url}
                onChange={set("youtube_url")}
                placeholder="https://www.youtube.com/watch?v=…"
              />
            </div>
            {ytValid ? (
              <img
                src={youtubeThumb(form.youtube_url)}
                alt="Video preview"
                className="w-full rounded-2xl border border-border/60"
              />
            ) : (
              form.youtube_url && (
                <p className="flex items-center gap-2 text-xs text-red-300">
                  <Youtube className="h-4 w-4" /> That doesn't look like a YouTube link.
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
                onValueChange={(v) => setForm((f) => ({ ...f, camera_type: v }))}
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

        <DialogFooter>
          <Button onClick={submit} disabled={saving || !canSave} className="rounded-full">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save match
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}