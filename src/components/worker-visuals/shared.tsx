"use client";

import type { ReactNode } from "react";
import { useDraggable } from "@dnd-kit/core";
import { Film } from "lucide-react";
import type { Reel, Worker } from "@/types";
import { ReelPreview } from "@/components/workspace/ReelPreview";
import { cn, withAlpha } from "@/lib/utils";

export type VisualProps = {
  worker: Worker;
  reel: Reel | undefined;
};

export type ReelDragData = { type: "reel"; reelId: string; fromWorkerId: string | null };

/** Maps progress (0-100) into 0..1 across the [start, end] window. */
export function phase(progress: number, start: number, end: number) {
  if (progress <= start) return 0;
  if (progress >= end) return 1;
  return (progress - start) / (end - start);
}

/** The worker's reel preview; can be dragged onto another worker to move stages. */
export function DraggableReel({
  reel,
  workerId,
  size = "md",
  chrome = true,
  className,
  children,
}: {
  reel: Reel;
  workerId: string;
  size?: "xs" | "sm" | "md";
  chrome?: boolean;
  className?: string;
  children?: ReactNode;
}) {
  const data: ReelDragData = { type: "reel", reelId: reel.id, fromWorkerId: workerId };
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `reel:${reel.id}:${workerId}`,
    data,
  });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      aria-label={`Reel #${reel.number}. Press space to drag it to another worker.`}
      aria-roledescription="draggable reel"
      className={cn(
        "touch-none rounded-reel transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70",
        isDragging && "opacity-30",
        className,
      )}
    >
      <ReelPreview reel={reel} size={size} chrome={chrome} focusable={false}>
        {children}
      </ReelPreview>
    </div>
  );
}

export function EmptyReel({ accent, size = "md" }: { accent: string; size?: "sm" | "md" }) {
  return (
    <div
      className={cn(
        "flex aspect-[9/16] shrink-0 flex-col items-center justify-center gap-1.5 rounded-reel border border-dashed p-2 text-center text-[10px] text-muted",
        size === "md" ? "w-[118px]" : "w-[92px]",
      )}
      style={{ borderColor: withAlpha(accent, 0.35), background: withAlpha(accent, 0.05) }}
    >
      <Film className="h-4 w-4" style={{ color: accent }} />
      Drop a reel here
    </div>
  );
}

export function VisualFrame({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("flex min-h-[210px] gap-3", className)}>{children}</div>;
}

export function ReelSlot({ worker, reel, children, size = "md" }: VisualProps & { children?: ReactNode; size?: "sm" | "md" }) {
  if (!reel) return <EmptyReel accent={worker.accentColor} size={size} />;
  return (
    <DraggableReel reel={reel} workerId={worker.id} size={size}>
      {children}
    </DraggableReel>
  );
}
