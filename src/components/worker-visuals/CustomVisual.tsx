"use client";

import { Cog } from "lucide-react";
import { withAlpha } from "@/lib/utils";
import { phase, ReelSlot, VisualFrame, type VisualProps } from "./shared";

export function CustomVisual({ worker, reel }: VisualProps) {
  const p = reel ? worker.progress : 0;
  const lines = [0.9, 0.7, 0.8, 0.5];
  return (
    <VisualFrame>
      <ReelSlot worker={worker} reel={reel} />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center gap-2">
          <Cog
            className="motion-loop h-6 w-6 motion-safe:animate-spin-slow"
            style={{ color: worker.accentColor, animationPlayState: worker.status === "working" ? "running" : "paused" }}
          />
          <span className="section-label !text-[9px]">{worker.title}</span>
        </div>
        <div className="space-y-1.5">
          {lines.map((w, i) => (
            <div key={i} className="h-2 overflow-hidden rounded-full bg-white/[0.06]" style={{ width: `${w * 100}%` }}>
              <div
                className="h-full origin-left rounded-full transition-transform duration-500"
                style={{ background: withAlpha(worker.accentColor, 0.7), transform: `scaleX(${phase(p, i * 20, i * 20 + 30)})` }}
              />
            </div>
          ))}
        </div>
        <p className="mt-auto line-clamp-4 text-[11px] text-muted">{worker.notes || "Add notes in the editor to describe this step."}</p>
      </div>
    </VisualFrame>
  );
}
