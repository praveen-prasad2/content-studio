"use client";

import { useRef, useState } from "react";
import { Download, RotateCcw, Upload } from "lucide-react";
import { toast } from "sonner";
import type { SimulationSpeed } from "@/types";
import { useWorkspaceStore } from "@/store/workspace-store";
import { PageContainer } from "@/components/layout/AppShell";
import { ColorPicker } from "@/components/shared/ColorPicker";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input, Label } from "@/components/ui/fields";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/primitives";
import { downloadWorkspace, importWorkspaceFile } from "@/lib/workspace-file";

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <section className="glass-card grid gap-4 p-5 md:grid-cols-[260px_1fr] md:gap-8 md:p-6">
      <div>
        <h2 className="text-sm font-semibold">{title}</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="text-sm">{label}</div>
        {hint && <div className="text-xs text-muted">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const s = useWorkspaceStore();
  const [name, setName] = useState(s.workspaceName);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <PageContainer className="max-w-[960px] space-y-5">
      <div>
        <p className="section-label">Workspace</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Settings</h1>
      </div>

      <Section title="General" description="How your workspace appears across the app.">
        <div className="space-y-1.5">
          <Label htmlFor="ws-name">Workspace name</Label>
          <div className="flex gap-2">
            <Input id="ws-name" value={name} onChange={(e) => setName(e.target.value)} />
            <Button
              onClick={() => {
                s.setWorkspaceName(name);
                toast.success("Workspace renamed");
              }}
              disabled={name.trim() === s.workspaceName}
            >
              Save
            </Button>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Theme accent</Label>
          <p className="text-xs text-muted">Used for focus rings, active navigation and highlights.</p>
          <ColorPicker value={s.themeAccent} onChange={s.setThemeAccent} label="Theme accent" />
        </div>
      </Section>

      <Section title="Simulation" description="The simulation makes workers progress on their own so the workspace feels alive.">
        <Row label="Simulation running" hint="Pause everything without changing worker status.">
          <Switch checked={s.simulation.enabled} onCheckedChange={s.setSimulationEnabled} aria-label="Simulation running" />
        </Row>
        <Row label="Start simulation on load" hint="Otherwise the workspace opens paused.">
          <Switch
            checked={s.defaults.simulationOnStart}
            onCheckedChange={(v) => s.setDefaults({ simulationOnStart: v })}
            aria-label="Start simulation on load"
          />
        </Row>
        <Row label="Speed">
          <Select value={String(s.simulation.speed)} onValueChange={(v) => s.setSimulationSpeed(Number(v) as SimulationSpeed)}>
            <SelectTrigger className="w-28" aria-label="Simulation speed">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0.5">0.5x</SelectItem>
              <SelectItem value="1">1x</SelectItem>
              <SelectItem value="2">2x</SelectItem>
            </SelectContent>
          </Select>
        </Row>
        <Row label="Auto-pass for new workers" hint="New workers hand finished reels to the next step automatically.">
          <Switch checked={s.defaults.autoPass} onCheckedChange={(v) => s.setDefaults({ autoPass: v })} aria-label="Auto-pass for new workers" />
        </Row>
      </Section>

      <Section title="Data" description="Everything is stored in this browser. Export a backup or move your workspace to another device.">
        <div className="flex flex-wrap gap-2">
          <Button onClick={downloadWorkspace}>
            <Download /> Export JSON
          </Button>
          <Button onClick={() => fileRef.current?.click()}>
            <Upload /> Import JSON
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            aria-label="Import workspace file"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) await importWorkspaceFile(file);
              e.target.value = "";
            }}
          />
        </div>
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-4">
          <Row label="Reset workspace" hint="Restores the default 6 workers, reels and activity.">
            <Button variant="danger" size="sm" onClick={() => setConfirmReset(true)}>
              <RotateCcw /> Reset
            </Button>
          </Row>
        </div>
      </Section>

      <Dialog open={confirmReset} onOpenChange={setConfirmReset}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reset workspace?</DialogTitle>
            <DialogDescription>
              Your workers, reels and activity will be replaced with the defaults. Export first if you want a backup.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                s.resetWorkspace();
                setConfirmReset(false);
                toast.success("Workspace reset to the default team");
              }}
            >
              Reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageContainer>
  );
}
