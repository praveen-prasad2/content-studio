"use client";

import { useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Copy,
  EllipsisVertical,
  Maximize2,
  Minimize2,
  Palette,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import type { Worker } from "@/types";
import { ACCENT_SWATCHES } from "@/data/workers";
import { useWorkspaceStore } from "@/store/workspace-store";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip } from "@/components/ui/primitives";

export function WorkerMenu({ worker, index, total }: { worker: Worker; index: number; total: number }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const store = useWorkspaceStore.getState;

  const handleDelete = () => {
    const removed = store().deleteWorker(worker.id);
    setConfirmOpen(false);
    if (!removed) return;
    toast(`${worker.name} removed from the team`, {
      description: "Their reels went back to the task queue.",
      action: { label: "Undo", onClick: () => store().restoreWorker(removed.worker, removed.index) },
      duration: 6000,
    });
  };

  return (
    <>
      <DropdownMenu>
        <Tooltip content="Worker actions">
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${worker.name}`}>
              <EllipsisVertical />
            </Button>
          </DropdownMenuTrigger>
        </Tooltip>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => store().openWorkerEditor(worker.id)}>
            <Pencil /> Edit worker
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              store().duplicateWorker(worker.id);
              toast.success(`Duplicated ${worker.name}`);
            }}
          >
            <Copy /> Duplicate
          </DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <Palette /> Change color
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="p-2">
              <div className="grid grid-cols-4 gap-2" role="group" aria-label="Accent colors">
                {ACCENT_SWATCHES.map((c) => (
                  <DropdownMenuItem
                    key={c}
                    aria-label={`Set color ${c}`}
                    className="h-7 w-7 justify-center rounded-full p-0 data-[highlighted]:ring-2 data-[highlighted]:ring-white/70"
                    style={{ background: c, outline: worker.accentColor === c ? "2px solid white" : undefined, outlineOffset: 2 }}
                    onSelect={() => store().updateWorker(worker.id, { accentColor: c })}
                  />
                ))}
              </div>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuItem onSelect={() => store().updateWorker(worker.id, { isCollapsed: !worker.isCollapsed })}>
            {worker.isCollapsed ? <Maximize2 /> : <Minimize2 />}
            {worker.isCollapsed ? "Expand card" : "Collapse card"}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => store().togglePause(worker.id)}>
            {worker.status === "paused" ? <Play /> : <Pause />}
            {worker.status === "paused" ? "Resume" : "Pause"}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => store().resetProgress(worker.id)}>
            <RotateCcw /> Reset progress
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={index === 0} onSelect={() => store().moveWorker(worker.id, -1)}>
            <ArrowLeft /> Move left
          </DropdownMenuItem>
          <DropdownMenuItem disabled={index === total - 1} onSelect={() => store().moveWorker(worker.id, 1)}>
            <ArrowRight /> Move right
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onSelect={() => setConfirmOpen(true)}>
            <Trash2 /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remove {worker.name}?</DialogTitle>
            <DialogDescription>
              {worker.name} ({worker.title}) will leave the pipeline. Any reels they hold go back to the task queue. You can
              undo this right after.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              <Trash2 /> Delete worker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
