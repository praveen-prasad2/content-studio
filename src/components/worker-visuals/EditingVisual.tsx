"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Scissors } from "lucide-react";
import { useLoopIndex } from "@/hooks/useUtils";
import { withAlpha } from "@/lib/utils";
import { phase, ReelSlot, VisualFrame, type VisualProps } from "./shared";

const CLIPS = [
  { w: 30, color: "#F59E0B" },
  { w: 22, color: "#F97316" },
  { w: 28, color: "#FBBF24" },
  { w: 20, color: "#FB923C" },
];
const WAVE = Array.from({ length: 28 }, (_, i) => 0.3 + Math.abs(Math.sin(i * 1.7)) * 0.7);
const LOOP_MS = 3000;

export function EditingVisual({ worker, reel }: VisualProps) {
  const p = reel ? worker.progress : 0;
  const active = worker.status === "working";
  const words = (reel?.hook || "Cut. Sync. Caption. Export.").split(/\s+/).slice(0, 8);
  const wordIndex = useLoopIndex(words.length, LOOP_MS, active && !!reel);
  // Clips start spread apart and snap together as the edit progresses.
  const gap = 10 * (1 - phase(p, 0, 70));

  return (
    <VisualFrame>
      <ReelSlot worker={worker} reel={reel}>
        {reel && (
          <div className="absolute inset-x-1 bottom-[22%] flex justify-center">
            <AnimatePresence mode="popLayout">
              <motion.span
                key={`${wordIndex}-${words[wordIndex]}`}
                initial={{ opacity: 0, scale: 0.5, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 1.2 }}
                transition={{ type: "spring", stiffness: 600, damping: 24 }}
                className="text-[13px] font-black uppercase tracking-tight text-white [text-shadow:0_2px_0_#000,0_0_12px_rgba(0,0,0,0.6)]"
                style={{ WebkitTextStroke: "0.5px #000" }}
              >
                <span style={{ color: wordIndex % 3 === 1 ? worker.accentColor : undefined }}>{words[wordIndex]}</span>
              </motion.span>
            </AnimatePresence>
          </div>
        )}
      </ReelSlot>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center gap-1 section-label !text-[9px]">
          <Scissors className="h-3 w-3" /> Timeline
        </div>

        <div className="relative overflow-hidden rounded-lg border border-white/[0.08] bg-black/30 p-1.5">
          {/* Clip track */}
          <div className="flex h-7 items-stretch">
            {CLIPS.map((c, i) => (
              <motion.div
                key={i}
                className="rounded-[4px] border border-black/30"
                animate={{ marginLeft: i === 0 ? 0 : gap }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                style={{
                  width: `${c.w}%`,
                  background: `linear-gradient(180deg, ${c.color}, ${withAlpha(c.color, 0.6)})`,
                }}
              />
            ))}
          </div>
          {/* Waveform */}
          <div className="mt-1.5 flex h-7 items-center gap-[2px]" aria-hidden>
            {WAVE.map((h, i) => (
              <span
                key={i}
                className="motion-loop w-full origin-center rounded-full bg-white/40 motion-safe:animate-wave"
                style={{
                  height: `${h * 100}%`,
                  animationDelay: `${(i % 7) * 0.12}s`,
                  animationPlayState: active ? "running" : "paused",
                }}
              />
            ))}
          </div>
          {/* Playhead */}
          {reel && (
            <div
              className="motion-loop pointer-events-none absolute inset-y-0 left-1.5 right-1.5 motion-safe:animate-playhead"
              style={{ animationDuration: `${LOOP_MS}ms`, animationPlayState: active ? "running" : "paused" }}
            >
              <div className="absolute inset-y-0 right-0 w-[2px] rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.9)]">
                <div className="absolute -left-[3px] -top-0.5 h-2 w-2 rotate-45 rounded-[2px] bg-white" />
              </div>
            </div>
          )}
        </div>

        <div className="mt-auto grid grid-cols-2 gap-1.5 text-[10px]">
          {[
            ["Cuts", Math.round(4 + phase(p, 0, 60) * 14)],
            ["Captions", Math.round(phase(p, 30, 95) * words.length)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2 py-1">
              <div className="text-muted">{label}</div>
              <div className="text-sm font-semibold tabular-nums">{value}</div>
            </div>
          ))}
        </div>
      </div>
    </VisualFrame>
  );
}
