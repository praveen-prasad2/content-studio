"use client";

import { useState } from "react";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  rectIntersection,
  useSensor,
  useSensors,
  type Announcements,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, Box, Globe2, LayoutGrid, PanelRightClose, PanelRightOpen, Redo2, Undo2, Workflow } from "lucide-react";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/store/workspace-store";
import { useMediaQuery } from "@/hooks/useUtils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/dialog";
import { Tooltip } from "@/components/ui/primitives";
import type { ReelDragData } from "@/components/worker-visuals";
import { cn } from "@/lib/utils";
import { PipelineBoard } from "./PipelineBoard";
import { ReelPreview } from "./ReelPreview";
import { RightPanelTabs } from "./RightPanel";
import type { WorkerDragData } from "./WorkerCard";
import { StudioBoard } from "./StudioBoard";
import { WorldView } from "@/components/world/WorldView";

export type Scene = "world" | "studio" | "board";

type DragData = ReelDragData | WorkerDragData | { type: "queue" };

const getData = (d: { data: { current?: Record<string, unknown> } } | null | undefined) =>
  d?.data.current as DragData | undefined;

const collisionDetection: CollisionDetection = (args) => {
  const type = (args.active.data.current as DragData | undefined)?.type;
  if (type === "reel") {
    const droppableContainers = args.droppableContainers.filter((c) => {
      const t = (c.data.current as DragData | undefined)?.type;
      return t === "worker" || t === "queue";
    });
    const hits = pointerWithin({ ...args, droppableContainers });
    return hits.length ? hits : rectIntersection({ ...args, droppableContainers });
  }
  const droppableContainers = args.droppableContainers.filter(
    (c) => (c.data.current as DragData | undefined)?.type === "worker",
  );
  return closestCenter({ ...args, droppableContainers });
};

function nameOf(id: string | number | undefined) {
  const s = useWorkspaceStore.getState();
  const w = s.workers.find((x) => x.id === id);
  if (w) return w.name;
  const reel = s.reels.find((r) => String(id).startsWith(`reel:${r.id}:`));
  return reel ? `Reel #${reel.number}` : "item";
}

const announcements: Announcements = {
  onDragStart: ({ active }) => `Picked up ${nameOf(active.id)}.`,
  onDragOver: ({ active, over }) => (over ? `${nameOf(active.id)} is over ${nameOf(over.id)}.` : `${nameOf(active.id)} is not over a drop target.`),
  onDragEnd: ({ active, over }) => (over ? `${nameOf(active.id)} was dropped on ${nameOf(over.id)}.` : `${nameOf(active.id)} was dropped.`),
  onDragCancel: ({ active }) => `Dragging ${nameOf(active.id)} was cancelled.`,
};

function Toolbar({ scene, setScene }: { scene: Scene; setScene: (value: Scene) => void }) {
  const studio = scene === "studio";
  const viewMode = useWorkspaceStore((s) => s.viewMode);
  const setViewMode = useWorkspaceStore((s) => s.setViewMode);
  const rightPanelOpen = useWorkspaceStore((s) => s.rightPanelOpen);
  const setRightPanelOpen = useWorkspaceStore((s) => s.setRightPanelOpen);
  const canUndo = useWorkspaceStore((s) => s.past.length > 0);
  const canRedo = useWorkspaceStore((s) => s.future.length > 0);
  const total = useWorkspaceStore((s) => s.workers.length);
  const working = useWorkspaceStore((s) => s.workers.filter((w) => w.status === "working").length);
  const { undo, redo } = useWorkspaceStore.getState();

  return (
    <div className="flex flex-wrap items-center gap-3 px-4 pb-2 pt-5 md:px-8">
      <div className="mr-auto">
        <p className="section-label text-violet-300">YOUR CREATIVE COMMAND CENTER</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">The studio is alive<span className="text-violet-400">.</span></h1>
        <p className="mt-1 text-sm text-foreground/80">
          <span className="font-semibold text-foreground">{total} workers</span> · {working} working right now
        </p>
      </div>

      <div className="flex items-center gap-1">
        <Tooltip content="Undo (Ctrl+Z)">
          <Button variant="ghost" size="icon" aria-label="Undo" disabled={!canUndo} onClick={undo}>
            <Undo2 />
          </Button>
        </Tooltip>
        <Tooltip content="Redo (Ctrl+Shift+Z)">
          <Button variant="ghost" size="icon" aria-label="Redo" disabled={!canRedo} onClick={redo}>
            <Redo2 />
          </Button>
        </Tooltip>
      </div>

      <div role="radiogroup" aria-label="Board layout" className="flex rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
        <button role="radio" aria-checked={scene === "world"} onClick={() => setScene("world")} className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium", scene === "world" ? "bg-pink-500/20 text-pink-200" : "text-muted")}><Globe2 className="h-3.5 w-3.5" />World</button>
        <button role="radio" aria-checked={studio} onClick={() => setScene("studio")} className={cn("flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium", studio ? "bg-violet-500/20 text-violet-200" : "text-muted")}><Box className="h-3.5 w-3.5" />Studio</button>
        {(
          [
            ["pipeline", "Pipeline", Workflow],
            ["grid", "Grid", LayoutGrid],
          ] as const
        ).map(([mode, label, Icon]) => (
          <button
            key={mode}
            role="radio"
            aria-checked={scene === "board" && viewMode === mode}
            onClick={() => { setScene("board"); setViewMode(mode); }}
            className={cn(
              "relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              scene === "board" && viewMode === mode ? "text-foreground" : "text-muted hover:text-foreground",
            )}
          >
            {scene === "board" && viewMode === mode && (
              <motion.span layoutId="view-toggle" className="absolute inset-0 rounded-lg bg-white/[0.08]" transition={{ type: "spring", stiffness: 500, damping: 35 }} />
            )}
            <Icon className="relative h-3.5 w-3.5" />
            <span className="relative">{label}</span>
          </button>
        ))}
      </div>

      <Tooltip content={rightPanelOpen ? "Hide side panel" : "Show side panel"}>
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:inline-flex"
          aria-label={rightPanelOpen ? "Hide side panel" : "Show side panel"}
          onClick={() => setRightPanelOpen(!rightPanelOpen)}
        >
          {rightPanelOpen ? <PanelRightClose /> : <PanelRightOpen />}
        </Button>
      </Tooltip>
    </div>
  );
}

export function WorkspaceView() {
  const [scene, setScene] = useState<Scene>("world");
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const rightPanelOpen = useWorkspaceStore((s) => s.rightPanelOpen);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeReelId, setActiveReelId] = useState<string | null>(null);
  const activeReel = useWorkspaceStore((s) => s.reels.find((r) => r.id === activeReelId));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragStart = ({ active }: DragStartEvent) => {
    const data = getData(active);
    if (data?.type === "reel") setActiveReelId(data.reelId);
  };

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    setActiveReelId(null);
    const a = getData(active);
    const o = getData(over);
    if (!a || !o || !over) return;
    const s = useWorkspaceStore.getState();
    if (a.type === "worker" && o.type === "worker" && active.id !== over.id) {
      s.reorderWorkers(String(active.id), String(over.id));
    } else if (a.type === "reel" && o.type === "worker" && a.fromWorkerId !== o.workerId) {
      const target = s.workers.find((w) => w.id === o.workerId);
      const reel = s.reels.find((r) => r.id === a.reelId);
      s.assignReel(a.reelId, o.workerId);
      if (target && reel) toast.success(`Reel #${reel.number} → ${target.name}`, { description: `Moved to ${target.title}` });
    } else if (a.type === "reel" && o.type === "queue" && a.fromWorkerId !== null) {
      s.assignReel(a.reelId, null);
      toast("Reel moved back to the queue");
    }
  };

  const showAside = isDesktop && rightPanelOpen;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveReelId(null)}
      accessibility={{ announcements }}
    >
      <div className="flex min-h-0 flex-1">
        <section className="relative flex min-w-0 flex-1 flex-col">
          {/* Ambient background: soft glow + dotted grid */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
            <div className="dotted-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_center,black_40%,transparent_80%)]" />
            <div className="absolute left-1/2 top-[45%] h-[520px] w-[900px] max-w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(131,58,180,0.22),rgba(225,48,108,0.10),transparent)] blur-2xl" />
          </div>

          <div className="relative">
            <Toolbar scene={scene} setScene={setScene} />
          </div>
          {scene === "world" ? (
            <div className="relative flex min-h-0 flex-1 pb-16 md:pb-0">
              <WorldView />
            </div>
          ) : (
            <div className="scrollbar-thin relative min-h-0 flex-1 overflow-auto px-4 pb-28 pt-6 md:px-8 lg:pb-10">
              {scene === "studio" ? <StudioBoard /> : <PipelineBoard />}
            </div>
          )}
        </section>

        <AnimatePresence initial={false}>
          {showAside && (
            <motion.aside
              key="aside"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="flex w-[340px] shrink-0 flex-col border-l border-white/[0.06] bg-[#0d0d14]/70 p-4 backdrop-blur-xl"
              aria-label="Workspace side panel"
            >
              <RightPanelTabs />
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {!isDesktop && (
        <>
          <Button
            variant="primary"
            className="fixed bottom-20 right-4 z-30 rounded-full shadow-2xl lg:hidden"
            onClick={() => setSheetOpen(true)}
          >
            <Activity /> Activity & Queue
          </Button>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetContent side="bottom" className="h-[80dvh] p-4 pt-5">
              <SheetTitle className="mb-1 text-base">Workspace</SheetTitle>
              <SheetDescription className="mb-3 text-xs">Live activity, task queue and today&apos;s stats.</SheetDescription>
              <RightPanelTabs />
            </SheetContent>
          </Sheet>
        </>
      )}

      <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.2, 0.9, 0.3, 1)" }}>
        {activeReel ? (
          <div className="rotate-3 scale-105 drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)]">
            <ReelPreview reel={activeReel} size="sm" clickable={false} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
