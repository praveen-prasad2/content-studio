"use client";

import { memo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, GripVertical, Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import type { Worker } from "@/types";
import { selectReel, selectWorker, useWorkspaceStore } from "@/store/workspace-store";
import { WORKER_VISUALS } from "@/components/worker-visuals";
import { Avatar } from "@/components/shared/Avatar";
import { InlineEdit } from "@/components/shared/InlineEdit";
import { StatusPill, TypingDots } from "@/components/shared/StatusPill";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/primitives";
import { cn, withAlpha } from "@/lib/utils";
import { WorkerMenu } from "./WorkerMenu";

export type WorkerDragData = { type: "worker"; workerId: string };

type WorkerCardProps = {
  workerId: string;
  index: number;
  total: number;
  layout: "pipeline" | "grid";
};

function AvatarRing({ worker }: { worker: Worker }) {
  const working = worker.status === "working";
  return (
    <span className="relative inline-flex h-11 w-11 shrink-0 items-center justify-center">
      <span
        className={cn("motion-loop absolute inset-0 rounded-full", working && "motion-safe:animate-spin-slow")}
        style={{
          background: working
            ? `conic-gradient(from 0deg, ${worker.accentColor}, transparent 35%, ${worker.accentColor} 70%, transparent)`
            : withAlpha(worker.accentColor, 0.5),
        }}
      />
      <span className="absolute inset-[2px] rounded-full bg-[#0f0f16]" />
      <Avatar src={worker.avatar} name={worker.name} accent={worker.accentColor} size={36} className="relative" />
    </span>
  );
}

function ProgressBar({ worker }: { worker: Worker }) {
  return (
    <div
      className="relative h-1.5 overflow-hidden rounded-full bg-white/[0.07]"
      role="progressbar"
      aria-label={`${worker.name} progress`}
      aria-valuenow={Math.round(worker.progress)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="absolute inset-0 origin-left rounded-full transition-transform duration-700 ease-out"
        style={{
          transform: `scaleX(${worker.progress / 100})`,
          background: `linear-gradient(90deg, ${withAlpha(worker.accentColor, 0.7)}, ${worker.accentColor})`,
          boxShadow: `0 0 12px ${withAlpha(worker.accentColor, 0.6)}`,
        }}
      />
      {worker.status === "working" && (
        <div className="motion-loop absolute inset-0 overflow-hidden">
          <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-white/45 to-transparent motion-safe:animate-shine" />
        </div>
      )}
    </div>
  );
}

function WorkerCardInner({ workerId, index, total, layout }: WorkerCardProps) {
  const worker = useWorkspaceStore(selectWorker(workerId));
  const reel = useWorkspaceStore(selectReel(worker?.currentReelId));
  const queueCount = useWorkspaceStore(
    (s) => s.reels.filter((r) => r.workerId === workerId && r.id !== worker?.currentReelId && !r.completedAt).length,
  );
  const { updateWorker, togglePause, skipWorker, retryWorker, openReel } = useWorkspaceStore.getState();

  const data: WorkerDragData = { type: "worker", workerId };
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging, isOver, active } =
    useSortable({ id: workerId, data });

  if (!worker) return null;

  const reelOver = isOver && active?.data.current?.type === "reel";
  const Visual = WORKER_VISUALS[worker.role];
  const paused = worker.status === "paused";
  const parked = worker.status === "done" && !!worker.currentReelId && !worker.autoPass;

  const dragTransform = CSS.Translate.toString(transform);
  const style: React.CSSProperties = {
    transform: isDragging ? `${dragTransform ?? ""} scale(1.03) rotate(2deg)` : dragTransform,
    transition,
    zIndex: isDragging ? 40 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("relative", layout === "pipeline" ? "w-full md:w-[320px]" : "w-full")}
    >
      <motion.article
        aria-label={`${worker.name}, ${worker.title} worker, ${worker.status}`}
        animate={worker.status === "error" ? { x: [0, -5, 5, -3, 3, 0] } : { x: 0 }}
        whileHover={isDragging ? undefined : { y: -2 }}
        transition={{ x: { duration: 0.45 }, y: { type: "spring", stiffness: 400, damping: 30 } }}
        className={cn(
          "glass-card group flex flex-col gap-3 p-4 transition-[box-shadow,filter,opacity] duration-300",
          paused && "opacity-75 grayscale-[0.7]",
          isDragging && "shadow-[0_30px_60px_-20px_rgba(0,0,0,0.9)]",
        )}
        style={{
          boxShadow: reelOver
            ? `0 0 0 2px ${worker.accentColor}, 0 0 40px -6px ${withAlpha(worker.accentColor, 0.7)}`
            : worker.status === "working"
              ? `inset 0 1px 0 0 rgba(255,255,255,0.06), 0 20px 50px -30px ${withAlpha(worker.accentColor, 0.6)}`
              : undefined,
        }}
      >
        {/* Accent glow along the top edge */}
        <div
          className="pointer-events-none absolute inset-x-6 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${withAlpha(worker.accentColor, 0.8)}, transparent)` }}
        />

        {/* Header */}
        <header className="flex items-center gap-2.5">
          <Tooltip content="Drag to reorder (or focus and press space)">
            <button
              ref={setActivatorNodeRef}
              {...attributes}
              {...listeners}
              aria-label={`Reorder ${worker.name}. Press space to pick up, arrow keys to move.`}
              className="-ml-1.5 flex h-8 w-5 cursor-grab touch-none items-center justify-center rounded-md text-white/30 transition-colors hover:bg-white/[0.06] hover:text-white/70 active:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          </Tooltip>
          <AvatarRing worker={worker} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold leading-tight">
              <InlineEdit value={worker.name} label="Worker name" onSave={(name) => updateWorker(worker.id, { name })} />
            </div>
            <div className="truncate text-[10.5px] font-medium uppercase tracking-[0.08em]" style={{ color: worker.accentColor }}>
              {worker.title}
            </div>
          </div>
          <StatusPill status={worker.status} />
          <WorkerMenu worker={worker} index={index} total={total} />
        </header>

        {/* Current task */}
        <div className="flex min-h-[20px] items-center gap-2 text-[13px] text-foreground/85">
          <span className="min-w-0 truncate">
            <InlineEdit
              value={worker.currentTask}
              label="Current task"
              onSave={(currentTask) => updateWorker(worker.id, { currentTask })}
            />
          </span>
          {worker.status === "working" && <TypingDots color={worker.accentColor} />}
        </div>

        <AnimatePresence initial={false}>
          {!worker.isCollapsed && (
            <motion.div
              key="visual"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <Visual worker={worker} reel={reel} />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] text-muted">
            <span>Progress</span>
            <span className="tabular-nums text-foreground/80">{Math.round(worker.progress)}%</span>
          </div>
          <ProgressBar worker={worker} />
        </div>

        {/* Footer */}
        <footer className="flex items-center gap-2 border-t border-white/[0.06] pt-3 text-[11px]">
          {reel ? (
            <Tooltip content={reel.title}>
              <button
                onClick={() => openReel(reel.id)}
                className="rounded-md bg-white/[0.06] px-1.5 py-0.5 font-semibold tabular-nums text-foreground/90 transition-colors hover:bg-white/[0.12]"
              >
                Reel #{reel.number}
              </button>
            </Tooltip>
          ) : (
            <span className="text-muted">No reel</span>
          )}
          <Tooltip content="Reels completed">
            <span className="flex items-center gap-0.5 text-muted">
              <Check className="h-3 w-3" /> {worker.completedCount}
            </span>
          </Tooltip>
          {queueCount > 0 && (
            <Tooltip content={`${queueCount} reel${queueCount > 1 ? "s" : ""} queued for ${worker.name}`}>
              <span className="rounded-full px-1.5 py-0.5 font-medium" style={{ background: withAlpha(worker.accentColor, 0.15), color: worker.accentColor }}>
                +{queueCount}
              </span>
            </Tooltip>
          )}

          <div className="ml-auto flex items-center gap-0.5">
            <Tooltip content={paused ? "Resume" : "Pause"}>
              <Button variant="ghost" size="icon-sm" aria-label={paused ? `Resume ${worker.name}` : `Pause ${worker.name}`} onClick={() => togglePause(worker.id)}>
                {paused ? <Play /> : <Pause />}
              </Button>
            </Tooltip>
            <Tooltip content={parked ? "Pass reel to next worker" : "Skip to next worker"}>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={parked ? "Pass reel to next worker" : "Skip reel to next worker"}
                disabled={!worker.currentReelId}
                onClick={() => skipWorker(worker.id)}
                style={parked ? { color: worker.accentColor } : undefined}
              >
                {parked ? <ArrowRight /> : <SkipForward />}
              </Button>
            </Tooltip>
            <Tooltip content={worker.status === "error" ? "Retry" : "Restart task"}>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Retry ${worker.name}`}
                onClick={() => retryWorker(worker.id)}
                className={worker.status === "error" ? "text-red-300 hover:text-red-200" : undefined}
              >
                <RotateCcw />
              </Button>
            </Tooltip>
          </div>
        </footer>
      </motion.article>
    </div>
  );
}

export const WorkerCard = memo(WorkerCardInner);
