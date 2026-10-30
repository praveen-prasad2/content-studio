"use client";

import { AnimatePresence, motion } from "framer-motion";
import { TrendingUp } from "lucide-react";
import { THUMBNAIL_CHOICES } from "@/data/reels";
import { ReelThumb } from "@/components/shared/ReelThumb";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { hashUnit, withAlpha } from "@/lib/utils";
import { phase, ReelSlot, VisualFrame, type VisualProps } from "./shared";

const TAGS = [
  { label: "#trendingaudio", at: 18 },
  { label: "POV hooks", at: 42 },
  { label: "Before/After", at: 66 },
];

export function ResearchVisual({ worker, reel }: VisualProps) {
  const seed = reel?.id ?? worker.id;
  const unit = hashUnit(seed);
  const start = Math.floor(unit * THUMBNAIL_CHOICES.length);
  const refs = [0, 1, 2].map((i) => THUMBNAIL_CHOICES[(start + i * 3) % THUMBNAIL_CHOICES.length]);
  const target = Math.round(72 + unit * 24);
  const score = reel ? Math.round(target * phase(worker.progress, 0, 90)) : 0;
  const scanning = worker.status === "working";

  return (
    <VisualFrame>
      <ReelSlot worker={worker} reel={reel} />

      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <div className="section-label !text-[9px]">Scanning references</div>
        <div className="relative grid grid-cols-3 gap-1.5 overflow-hidden rounded-lg">
          {refs.map((src, i) => (
            <div key={i} className="relative aspect-[9/16] overflow-hidden rounded-md border border-white/10">
              <ReelThumb src={src} seed={`${seed}-${i}`} rate={0.6} />
            </div>
          ))}
          {scanning && (
            <div className="motion-loop pointer-events-none absolute inset-x-0 top-0 h-[10%] motion-safe:animate-scan">
              <div
                className="h-[2px] w-full"
                style={{ background: worker.accentColor, boxShadow: `0 0 12px 2px ${withAlpha(worker.accentColor, 0.8)}` }}
              />
              <div className="h-6 w-full" style={{ background: `linear-gradient(${withAlpha(worker.accentColor, 0.25)}, transparent)` }} />
            </div>
          )}
        </div>

        <div className="flex min-h-[44px] flex-wrap content-start gap-1">
          <AnimatePresence>
            {reel &&
              TAGS.filter((t) => worker.progress >= t.at).map((t) => (
                <motion.span
                  key={`${reel.id}-${t.label}`}
                  initial={{ opacity: 0, scale: 0.6, y: 4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 500, damping: 22 }}
                  className="rounded-full border px-1.5 py-0.5 text-[10px] font-medium"
                  style={{ borderColor: withAlpha(worker.accentColor, 0.35), background: withAlpha(worker.accentColor, 0.12) }}
                >
                  {t.label}
                </motion.span>
              ))}
          </AnimatePresence>
        </div>

        <div className="mt-auto flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5">
          <span className="flex items-center gap-1 text-[10px] text-muted">
            <TrendingUp className="h-3 w-3" style={{ color: worker.accentColor }} />
            Trend score
          </span>
          <AnimatedNumber value={score} className="text-base font-semibold tabular-nums" />
        </div>
      </div>
    </VisualFrame>
  );
}
