"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReelSlot, VisualFrame, type VisualProps } from "./shared";

const NOTES = [
  { text: "Hook: 3 sec", at: 8, rotate: -4, bg: "#FDE68A" },
  { text: "Angle: relatable", at: 28, rotate: 3, bg: "#F9A8D4" },
  { text: "CTA: save this", at: 48, rotate: -2, bg: "#A5F3FC" },
];

const CHECKLIST = [
  { text: "Hook under 3s", at: 30 },
  { text: "Story angle", at: 55 },
  { text: "Clear CTA", at: 78 },
  { text: "Audio fits mood", at: 95 },
];

export function StrategyVisual({ worker, reel }: VisualProps) {
  const p = reel ? worker.progress : 0;

  return (
    <VisualFrame>
      <ReelSlot worker={worker} reel={reel} />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="relative flex min-h-[96px] flex-col gap-1.5">
          <AnimatePresence>
            {reel &&
              NOTES.filter((n) => p >= n.at).map((n, i) => (
                <motion.div
                  key={`${reel.id}-${n.text}`}
                  initial={{ opacity: 0, y: -28, rotate: n.rotate * 3 }}
                  animate={{ opacity: 1, y: 0, rotate: n.rotate }}
                  exit={{ opacity: 0, y: 6 }}
                  transition={{ type: "spring", stiffness: 260, damping: 14 }}
                  className="w-fit rounded-[4px] px-2 py-1 text-[10px] font-semibold text-black/80 shadow-[0_6px_14px_-6px_rgba(0,0,0,0.7)]"
                  style={{ background: n.bg, marginLeft: i * 6 }}
                >
                  {n.text}
                </motion.div>
              ))}
          </AnimatePresence>
        </div>

        <ul className="mt-auto space-y-1" aria-label="Strategy checklist">
          {CHECKLIST.map((c) => {
            const done = p >= c.at;
            return (
              <li key={c.text} className="flex items-center gap-1.5 text-[11px]">
                <span
                  className={cn(
                    "flex h-3.5 w-3.5 items-center justify-center rounded-[4px] border transition-colors duration-300",
                    done ? "border-transparent" : "border-white/20",
                  )}
                  style={done ? { background: worker.accentColor } : undefined}
                >
                  <AnimatePresence>
                    {done && (
                      <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ type: "spring", stiffness: 600, damping: 20 }}>
                        <Check className="h-2.5 w-2.5 text-white" strokeWidth={4} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </span>
                <span className={cn("transition-colors duration-300", done ? "text-foreground" : "text-muted")}>{c.text}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </VisualFrame>
  );
}
