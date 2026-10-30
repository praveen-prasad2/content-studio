"use client";

import { useCallback, useRef } from "react";
import { rectSortingStrategy, SortableContext } from "@dnd-kit/sortable";
import { AnimatePresence, motion } from "framer-motion";
import { useShallow } from "zustand/react/shallow";
import { useWorkspaceStore } from "@/store/workspace-store";
import { cn } from "@/lib/utils";
import { WorkerCard } from "./WorkerCard";
import { useCardRects, WorkerConnector } from "./WorkerConnector";

export function PipelineBoard() {
  const order = useWorkspaceStore(useShallow((s) => s.workers.map((w) => w.id)));
  const collapsedKey = useWorkspaceStore((s) => s.workers.map((w) => (w.isCollapsed ? 1 : 0)).join(""));
  const workers = useWorkspaceStore((s) => s.workers);
  const viewMode = useWorkspaceStore((s) => s.viewMode);
  const rightPanelOpen = useWorkspaceStore((s) => s.rightPanelOpen);

  const containerRef = useRef<HTMLDivElement>(null);
  const nodes = useRef(new Map<string, HTMLElement>()).current;
  const register = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      if (el) nodes.set(id, el);
      else nodes.delete(id);
    },
    [nodes],
  );

  const { rects } = useCardRects(containerRef, nodes, [order.join(","), viewMode, collapsedKey, rightPanelOpen]);

  const isGrid = viewMode === "grid";

  if (!order.length) {
    return (
      <div className="glass-card mx-auto my-16 max-w-md p-8 text-center">
        <p className="text-sm text-muted">Your pipeline is empty.</p>
        <button
          className="mt-3 text-sm font-semibold text-accent hover:underline"
          onClick={() => useWorkspaceStore.getState().setAddWorkerOpen(true)}
        >
          Add your first worker
        </button>
      </div>
    );
  }

  return (
    <SortableContext items={order} strategy={rectSortingStrategy}>
      <div
        ref={containerRef}
        className={cn(
          "relative",
          isGrid
            ? "mx-auto grid max-w-[1060px] grid-cols-1 gap-x-12 gap-y-12 md:grid-cols-[repeat(auto-fill,minmax(290px,1fr))]"
            : "flex flex-col gap-12 md:w-max md:flex-row md:items-start md:gap-14",
        )}
      >
        <WorkerConnector order={order} workers={workers} rects={rects} />
        <AnimatePresence initial={true}>
          {order.map((id, index) => (
            <motion.div
              key={id}
              ref={register(id)}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 260, damping: 24, delay: Math.min(index * 0.04, 0.24) }}
              className="relative z-10"
            >
              <WorkerCard workerId={id} index={index} total={order.length} layout={isGrid ? "grid" : "pipeline"} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </SortableContext>
  );
}
