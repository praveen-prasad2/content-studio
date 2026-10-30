"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Check, Clock } from "lucide-react";
import { useRisingEdge } from "@/hooks/useUtils";
import { ReelSlot, VisualFrame, type VisualProps } from "./shared";

const RING = 2 * Math.PI * 26;
const CONFETTI = ["#833AB4", "#E1306C", "#F77737", "#22C55E", "#FBBF24", "#06B6D4"];

function ConfettiBurst({ burstKey }: { burstKey: number }) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden key={burstKey}>
      {Array.from({ length: 14 }).map((_, i) => {
        const angle = (i / 14) * Math.PI * 2;
        const dist = 34 + (i % 3) * 10;
        return (
          <motion.span
            key={i}
            className="absolute left-1/2 top-1/2 h-1.5 w-1 rounded-[1px]"
            style={{ background: CONFETTI[i % CONFETTI.length] }}
            initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
            animate={{ x: Math.cos(angle) * dist, y: Math.sin(angle) * dist + 10, opacity: 0, rotate: 180 + i * 30, scale: 0.6 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        );
      })}
    </div>
  );
}

export function PublishingVisual({ worker, reel }: VisualProps) {
  const reduce = useReducedMotion();
  const published = !!reel && (worker.status === "done" || worker.progress >= 100);
  const [burst, setBurst] = useState(0);
  useRisingEdge(published, () => setBurst((b) => b + 1));
  const p = reel ? worker.progress : 0;

  return (
    <VisualFrame>
      {/* Phone frame */}
      <div className="relative shrink-0 rounded-[20px] border border-white/15 bg-black p-[5px] shadow-[0_16px_30px_-16px_rgba(0,0,0,0.9)]">
        <div className="absolute left-1/2 top-[7px] z-10 h-1.5 w-8 -translate-x-1/2 rounded-full bg-black" />
        <ReelSlot worker={worker} reel={reel} size="md">
          {reel && (
            <div className="absolute inset-x-1.5 bottom-6 flex items-center gap-1">
              <span className="h-3.5 w-3.5 rounded-full bg-brand-gradient p-[1px]">
                <span className="block h-full w-full rounded-full bg-black/70" />
              </span>
              <span className="truncate text-[8px] font-semibold text-white">contentstudio</span>
              <span className="rounded-[3px] border border-white/60 px-1 text-[7px] text-white">Follow</span>
            </div>
          )}
        </ReelSlot>
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-2">
        <div className="relative flex h-[76px] w-[76px] items-center justify-center">
          <svg viewBox="0 0 64 64" className="absolute inset-0 -rotate-90" aria-hidden>
            <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
            <motion.circle
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke={published ? "#22C55E" : worker.accentColor}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={RING}
              animate={{ strokeDashoffset: RING * (1 - p / 100) }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          </svg>
          <AnimatePresence mode="wait">
            {published ? (
              <motion.div
                key="done"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 18 }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500"
              >
                <Check className="h-5 w-5 text-white" strokeWidth={3} />
              </motion.div>
            ) : (
              <motion.span key="pct" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-semibold tabular-nums">
                {Math.round(p)}%
              </motion.span>
            )}
          </AnimatePresence>
          {!reduce && burst > 0 && published && <ConfettiBurst burstKey={burst} />}
        </div>

        <div className="text-center">
          <div className={published ? "text-xs font-semibold text-emerald-300" : "text-xs font-semibold"}>
            {published ? "Published" : reel ? (worker.status === "working" ? "Posting…" : "Ready to post") : "Nothing queued"}
          </div>
          <div className="mt-0.5 flex items-center justify-center gap-1 text-[10px] text-muted">
            <Clock className="h-3 w-3" /> Today · 7:00 PM
          </div>
        </div>
      </div>
    </VisualFrame>
  );
}
