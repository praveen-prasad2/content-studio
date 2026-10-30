"use client";

import { useDraggable, useDroppable } from "@dnd-kit/core";
import { GripVertical, Plus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useShallow } from "zustand/react/shallow";
import type { Reel } from "@/types";
import { useWorkspaceStore } from "@/store/workspace-store";
import { ReelThumb } from "@/components/shared/ReelThumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import type { ReelDragData } from "@/components/worker-visuals";
import { StageBadge } from "./StageBadge";

function AssignMenu({ reel }: { reel: Reel }) {
  const workers = useWorkspaceStore((s) => s.workers);
  const assignReel = useWorkspaceStore((s) => s.assignReel);
  return (
    <DropdownMenu>
      <Tooltip content="Assign to a worker">
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={`Assign Reel #${reel.number} to a worker`}>
            <UserPlus />
          </Button>
        </DropdownMenuTrigger>
      </Tooltip>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Assign to</DropdownMenuLabel>
        {workers.map((w) => (
          <DropdownMenuItem
            key={w.id}
            onSelect={() => {
              assignReel(reel.id, w.id);
              toast.success(`Reel #${reel.number} → ${w.name}`);
            }}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: w.accentColor }} />
            {w.name} · {w.title}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function QueueItem({ reel, holder }: { reel: Reel; holder?: string }) {
  const data: ReelDragData = { type: "reel", reelId: reel.id, fromWorkerId: reel.workerId };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: `reel:${reel.id}:queue`, data });
  const openReel = useWorkspaceStore((s) => s.openReel);

  return (
    <li
      ref={setNodeRef}
      className={cn(
        "group flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] p-2 transition-[opacity,background-color] hover:bg-white/[0.06]",
        isDragging && "opacity-40",
      )}
    >
      <button
        {...listeners}
        {...attributes}
        aria-label={`Drag Reel #${reel.number} onto a worker. Press space to pick up.`}
        className="flex h-full cursor-grab touch-none items-center rounded-md text-white/25 hover:text-white/60 active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <button
        onClick={() => openReel(reel.id)}
        className="relative aspect-[9/16] w-9 shrink-0 overflow-hidden rounded-md border border-white/10"
        aria-label={`Open Reel #${reel.number}`}
      >
        <ReelThumb src={reel.thumbnail} seed={reel.id} rate={0} />
      </button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[12.5px] font-medium">{reel.title}</p>
        <div className="mt-1 flex items-center gap-1.5 text-[10.5px] text-muted">
          <span className="tabular-nums">#{reel.number}</span>
          <StageBadge stage={reel.stage} />
          {holder && <span className="truncate">· {holder}</span>}
        </div>
      </div>
      <AssignMenu reel={reel} />
    </li>
  );
}

export function TaskQueue() {
  const backlog = useWorkspaceStore(
    useShallow((s) => s.reels.filter((r) => r.workerId === null && !r.completedAt && !r.publishedAt)),
  );
  const queued = useWorkspaceStore(
    useShallow((s) =>
      s.reels.filter((r) => r.workerId && !r.completedAt && !s.workers.some((w) => w.currentReelId === r.id)),
    ),
  );
  const workers = useWorkspaceStore((s) => s.workers);
  const setNewReelOpen = useWorkspaceStore((s) => s.setNewReelOpen);
  const { setNodeRef, isOver, active } = useDroppable({ id: "queue", data: { type: "queue" } });
  const reelOver = isOver && active?.data.current?.type === "reel";

  return (
    <div
      ref={setNodeRef}
      className={cn("space-y-4 rounded-2xl transition-shadow", reelOver && "ring-2 ring-accent/60")}
    >
      <Button variant="secondary" className="w-full" onClick={() => setNewReelOpen(true)}>
        <Plus /> New Reel
      </Button>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h3 className="section-label">Up next</h3>
          <span className="text-[11px] text-muted">{backlog.length}</span>
        </div>
        {backlog.length ? (
          <ul className="space-y-1.5">
            {backlog.map((r) => (
              <QueueItem key={r.id} reel={r} />
            ))}
          </ul>
        ) : (
          <p className="rounded-xl border border-dashed border-white/10 p-4 text-center text-xs text-muted">
            Queue is empty. Research will scout new ideas — or add one yourself.
          </p>
        )}
      </section>

      {queued.length > 0 && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="section-label">Waiting at a worker</h3>
            <span className="text-[11px] text-muted">{queued.length}</span>
          </div>
          <ul className="space-y-1.5">
            {queued.map((r) => (
              <QueueItem key={r.id} reel={r} holder={workers.find((w) => w.id === r.workerId)?.name} />
            ))}
          </ul>
        </section>
      )}

      <p className="text-center text-[11px] text-muted">Drag a reel onto any worker card to assign it. Drop it here to unassign.</p>
    </div>
  );
}
