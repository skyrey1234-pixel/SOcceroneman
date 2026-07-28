import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Plus, Loader2 } from "lucide-react";

export default function UploadMatchDialog({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "", opponent: "", match_date: "", competition: "",
    camera_type: "broadcast", notes: "",
  });
  const [file, setFile] = useState(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async () => {
    if (!form.title) return;
    setSaving(true);
    let video_url;
    if (file) {
      const res = await base44.integrations.Core.UploadFile({ file });
      video_url = res.file_url;
    }
    const match = await base44.entities.Match.create({ ...form, video_url, status: "queued" });
    setSaving(false);
    setOpen(false);
    setForm({ title: "", opponent: "", match_date: "", competition: "", camera_type: "broadcast", notes: "" });
    setFile(null);
    onCreated?.(match);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full">
          <Plus className="mr-2 h-4 w-4" /> Add match
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">Upload match footage</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-2">
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
            <Label>Video file (optional)</Label>
            <Input type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
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
          <Button onClick={submit} disabled={saving || !form.title} className="rounded-full">
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save match
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}