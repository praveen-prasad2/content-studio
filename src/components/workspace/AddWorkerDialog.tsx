"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { WorkerRole } from "@/types";
import { ROLE_TEMPLATES } from "@/data/workers";
import { useWorkspaceStore } from "@/store/workspace-store";
import { Avatar } from "@/components/shared/Avatar";
import { ColorPicker } from "@/components/shared/ColorPicker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/fields";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn, withAlpha } from "@/lib/utils";

const START = "__start__";

export function AddWorkerDialog() {
  const open = useWorkspaceStore((s) => s.addWorkerOpen);
  const setOpen = useWorkspaceStore((s) => s.setAddWorkerOpen);
  const workers = useWorkspaceStore((s) => s.workers);
  const addWorker = useWorkspaceStore((s) => s.addWorker);

  const [role, setRole] = useState<WorkerRole>("custom");
  const [name, setName] = useState(ROLE_TEMPLATES.custom.defaultName);
  const [color, setColor] = useState(ROLE_TEMPLATES.custom.accentColor);
  const [after, setAfter] = useState<string>(START);

  useEffect(() => {
    if (open) setAfter(workers[workers.length - 1]?.id ?? START);
    // Only reset the position when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const chooseTemplate = (r: WorkerRole) => {
    const t = ROLE_TEMPLATES[r];
    setRole(r);
    setName(t.defaultName);
    setColor(t.accentColor);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    addWorker({ role, name, accentColor: color, afterId: after === START ? null : after });
    toast.success(`${name || ROLE_TEMPLATES[role].defaultName} joined the team`);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>Add a worker</DialogTitle>
            <DialogDescription>Pick a template, name them, and choose where they sit in the pipeline.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label>Template</Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Worker template">
                {Object.values(ROLE_TEMPLATES).map((t) => {
                  const selected = role === t.role;
                  return (
                    <button
                      key={t.role}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => chooseTemplate(t.role)}
                      className={cn(
                        "flex flex-col items-start gap-1.5 rounded-xl border p-2.5 text-left transition-[background-color,border-color,transform] active:scale-[0.97]",
                        selected ? "border-transparent" : "border-white/[0.08] hover:bg-white/[0.04]",
                      )}
                      style={selected ? { background: withAlpha(t.accentColor, 0.14), boxShadow: `0 0 0 1.5px ${t.accentColor}` } : undefined}
                    >
                      <Avatar src={t.avatar} name={t.defaultName} accent={t.accentColor} size={28} />
                      <span className="text-xs font-semibold">{t.title}</span>
                      <span className="line-clamp-2 text-[10.5px] leading-snug text-muted">{t.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="aw-name">Name</Label>
                <Input id="aw-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Position</Label>
                <Select value={after} onValueChange={setAfter}>
                  <SelectTrigger aria-label="Position in pipeline">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={START}>At the start</SelectItem>
                    {workers.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        After {w.name} ({w.title})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Color</Label>
              <ColorPicker value={color} onChange={setColor} />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Add worker
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
