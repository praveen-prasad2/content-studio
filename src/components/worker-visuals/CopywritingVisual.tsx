"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";
import { useTypewriter } from "@/hooks/useUtils";
import { withAlpha } from "@/lib/utils";
import { phase, ReelSlot, VisualFrame, type VisualProps } from "./shared";

function Cursor({ color }: { color: string }) {
  return <span className="motion-loop ml-px inline-block h-[1em] w-[2px] translate-y-[2px] motion-safe:animate-blink" style={{ background: color }} />;
}

export function CopywritingVisual({ worker, reel }: VisualProps) {
  const p = reel ? worker.progress : 0;
  const finished = worker.status === "done" || p >= 100;
  const hook = reel?.hook || reel?.title || "";
  const caption = reel?.caption || "Caption coming together — short, punchy, save-worthy.";
  const typedHook = useTypewriter(hook, hook.length * phase(p, 0, 40), 40);
  const typedCaption = useTypewriter(caption, caption.length * phase(p, 40, 88), 22);
  const showTags = p >= 90;
  const typingHook = typedHook.length < hook.length && worker.status === "working";
  const typingCaption = !typingHook && typedCaption.length < caption.length && p >= 40 && worker.status === "working";

  return (
    <VisualFrame>
      <ReelSlot worker={worker} reel={reel}>
        {reel && typedHook && (
          <div className="absolute inset-x-1.5 top-[38%] flex justify-center">
            <motion.span
              animate={finished ? { backgroundColor: [withAlpha(worker.accentColor, 0.9), "rgba(255,255,255,0.95)"] } : undefined}
              transition={{ duration: 0.8 }}
              className="rounded-[5px] bg-white/95 px-1 py-0.5 text-center text-[9px] font-bold leading-tight text-black"
            >
              {typedHook}
              {typingHook && <Cursor color="#000" />}
            </motion.span>
          </div>
        )}
      </ReelSlot>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="section-label !text-[9px]">Caption</span>
          <AnimatePresence>
            {finished && reel && (
              <motion.span
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-4 w-4 items-center justify-center rounded-full"
                style={{ background: worker.accentColor }}
                aria-label="Copy complete"
              >
                <Check className="h-2.5 w-2.5 text-white" strokeWidth={4} />
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        <motion.p
          className="min-h-[80px] rounded-lg p-1.5 text-[11px] leading-relaxed text-foreground/90"
          animate={{ backgroundColor: finished ? [withAlpha(worker.accentColor, 0.25), withAlpha(worker.accentColor, 0.06)] : "rgba(255,255,255,0.02)" }}
          transition={{ duration: 1.2 }}
        >
          {reel ? typedCaption : <span className="text-muted">Waiting for a brief…</span>}
          {typingCaption && <Cursor color={worker.accentColor} />}
        </motion.p>

        <div className="mt-auto flex min-h-[40px] flex-wrap content-start gap-1">
          <AnimatePresence>
            {reel &&
              showTags &&
              (reel.hashtags.length ? reel.hashtags : ["#reels", "#contentcreator", "#explore"]).map((tag, i) => (
                <motion.span
                  key={`${reel.id}-${tag}`}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.12 }}
                  className="text-[10px] font-medium"
                  style={{ color: "#f9a8d4" }}
                >
                  {tag}
                </motion.span>
              ))}
          </AnimatePresence>
        </div>
      </div>
    </VisualFrame>
  );
}
