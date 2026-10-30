"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Worker, WorkerRole, WorkerStatus } from "@/types";
import { AVATAR_PRESETS, ROLE_TEMPLATES } from "@/data/workers";
import { useWorkspaceStore } from "@/store/workspace-store";
import { Avatar } from "@/components/shared/Avatar";
import { ColorPicker } from "@/components/shared/ColorPicker";
import { STATUS_LABELS } from "@/components/shared/StatusPill";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/dialog";
import { Input, Label, Textarea } from "@/components/ui/fields";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider, Switch } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";

const EDITABLE: (keyof Worker)[] = [
  "name",
  "title",
  "avatar",
  "accentColor",
  "role",
  "currentTask",
  "notes",
  "speed",
  "status",
  "autoPass",
];

function Field({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

/**
 * Side sheet editor. Edits apply live to the card (preview); Cancel reverts them and
 * Save records a single undo step for the whole edit.
 */
export function WorkerEditor() {
  const editingId = useWorkspaceStore((s) => s.editingWorkerId);
  const worker = useWorkspaceStore((s) => s.workers.find((w) => w.id === s.editingWorkerId));
  const { updateWorker, openWorkerEditor, recordSnapshot } = useWorkspaceStore.getState();

  const original = useRef<{ snapshot: Worker[]; fields: Partial<Worker> } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState("");
  const saved = useRef(false);

  useEffect(() => {
    if (!editingId) return;
    const s = useWorkspaceStore.getState();
    const w = s.workers.find((x) => x.id === editingId);
    if (!w) return;
    const fields: Partial<Worker> = {};
    EDITABLE.forEach((k) => Object.assign(fields, { [k]: w[k] }));
    original.current = { snapshot: s.workers, fields };
    saved.current = false;
    setAvatarUrl(/^https?:/.test(w.avatar) && !AVATAR_PRESETS.includes(w.avatar) ? w.avatar : "");
  }, [editingId]);

  const set = (patch: Partial<Worker>) => editingId && updateWorker(editingId, patch, { record: false });

  const close = (save: boolean) => {
    if (editingId && original.current) {
      if (save) {
        recordSnapshot(original.current.snapshot);
        saved.current = true;
        toast.success("Worker updated");
      } else {
        updateWorker(editingId, original.current.fields, { record: false });
      }
    }
    original.current = null;
    openWorkerEditor(null);
  };

  return (
    <Sheet open={!!worker} onOpenChange={(open) => !open && close(false)}>
      <SheetContent side="right" aria-describedby="worker-editor-desc">
        {worker && (
          <form
            className="flex flex-1 flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
              close(true);
            }}
          >
            <div className="flex items-center gap-3 pr-8">
              <Avatar src={worker.avatar} name={worker.name} accent={worker.accentColor} size={44} />
              <div>
                <SheetTitle className="text-lg font-semibold">Edit {worker.name}</SheetTitle>
                <SheetDescription id="worker-editor-desc" className="text-xs text-muted">
                  Changes preview live on the card.
                </SheetDescription>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Name" htmlFor="we-name">
                <Input id="we-name" value={worker.name} onChange={(e) => set({ name: e.target.value })} required />
              </Field>
              <Field label="Title" htmlFor="we-title">
                <Input id="we-title" value={worker.title} onChange={(e) => set({ title: e.target.value })} />
              </Field>
            </div>

            <Field label="Avatar">
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Avatar presets">
                {AVATAR_PRESETS.map((a) => (
                  <button
                    key={a}
                    type="button"
                    role="radio"
                    aria-checked={worker.avatar === a}
                    aria-label={/^https?:/.test(a) ? `Avatar ${new URL(a).searchParams.get("seed")}` : `Emoji ${a}`}
                    onClick={() => set({ avatar: a })}
                    className={cn(
                      "rounded-full transition-transform active:scale-90",
                      worker.avatar === a && "ring-2 ring-white ring-offset-2 ring-offset-[#0f0f16]",
                    )}
                  >
                    <Avatar src={a} name={worker.name} accent={worker.accentColor} size={36} />
                  </button>
                ))}
              </div>
              <Input
                aria-label="Avatar image URL"
                placeholder="…or paste an image URL / emoji"
                value={avatarUrl}
                onChange={(e) => {
                  setAvatarUrl(e.target.value);
                  if (e.target.value.trim()) set({ avatar: e.target.value.trim() });
                }}
              />
            </Field>

            <Field label="Accent color">
              <ColorPicker value={worker.accentColor} onChange={(accentColor) => set({ accentColor })} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Role">
                <Select value={worker.role} onValueChange={(v) => set({ role: v as WorkerRole })}>
                  <SelectTrigger aria-label="Role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ROLE_TEMPLATES).map((t) => (
                      <SelectItem key={t.role} value={t.role}>
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Status">
                <Select value={worker.status} onValueChange={(v) => set({ status: v as WorkerStatus })}>
                  <SelectTrigger aria-label="Status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STATUS_LABELS) as WorkerStatus[]).map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field label="Current task" htmlFor="we-task">
              <Input id="we-task" value={worker.currentTask} onChange={(e) => set({ currentTask: e.target.value })} />
            </Field>

            <Field label="Notes" htmlFor="we-notes">
              <Textarea id="we-notes" value={worker.notes} placeholder="Tone of voice, brand rules, anything this worker should know…" onChange={(e) => set({ notes: e.target.value })} />
            </Field>

            <Field label={`Speed · ${worker.speed}/5`}>
              <Slider
                min={1}
                max={5}
                step={1}
                value={[worker.speed]}
                onValueChange={([speed]) => set({ speed })}
                rangeColor={worker.accentColor}
                thumbLabel="Worker speed"
              />
            </Field>

            <label className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-white/[0.03] p-3">
              <span>
                <span className="block text-sm font-medium">Auto pass reel to next worker</span>
                <span className="block text-xs text-muted">When off, finished reels wait here until you pass them on.</span>
              </span>
              <Switch checked={worker.autoPass} onCheckedChange={(autoPass) => set({ autoPass })} aria-label="Auto pass reel to next worker" />
            </label>

            <div className="mt-auto flex gap-2 pt-2">
              <Button type="button" variant="ghost" className="flex-1" onClick={() => close(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="flex-1">
                Save changes
              </Button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
