"use client";

import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Bookmark, Heart, MessageCircle, Music2, Play, Send } from "lucide-react";
import type { Reel } from "@/types";
import { ReelThumb } from "@/components/shared/ReelThumb";
import { useWorkspaceStore } from "@/store/workspace-store";
import { cn, formatCompact } from "@/lib/utils";

const SIZES = {
  xs: "w-[54px]",
  sm: "w-[92px]",
  md: "w-[118px]",
  lg: "w-full max-w-[320px]",
  fill: "w-full",
} as const;

type ReelPreviewProps = {
  reel: Reel;
  size?: keyof typeof SIZES;
  /** Show Instagram-style overlay UI (views, side icons, audio marquee). */
  chrome?: boolean;
  /** Clicking opens the reel detail modal. Disable when the parent handles clicks. */
  clickable?: boolean;
  /** Whether the preview can receive keyboard focus as its own button. */
  focusable?: boolean;
  className?: string;
  children?: ReactNode;
};

export function ReelPreview({
  reel,
  size = "md",
  chrome = true,
  clickable = true,
  focusable = true,
  className,
  children,
}: ReelPreviewProps) {
  const openReel = useWorkspaceStore((s) => s.openReel);
  const [hover, setHover] = useState(false);
  const compact = size === "xs" || size === "sm";
  const views = reel.stats?.views;

  const open = () => clickable && openReel(reel.id);

  return (
    <motion.div
      role={clickable && focusable ? "button" : undefined}
      tabIndex={clickable && focusable ? 0 : undefined}
      aria-label={clickable ? `Open Reel #${reel.number}: ${reel.title}` : undefined}
      onClick={open}
      onKeyDown={(e) => {
        if (focusable && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          open();
        }
      }}
      onHoverStart={() => setHover(true)}
      onHoverEnd={() => setHover(false)}
      whileHover={clickable ? { y: -3 } : undefined}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
      className={cn(
        "relative aspect-[9/16] shrink-0 select-none overflow-hidden rounded-reel border border-white/10 bg-black shadow-[0_12px_30px_-14px_rgba(0,0,0,0.9)]",
        clickable && "cursor-pointer",
        SIZES[size],
        className,
      )}
    >
      <ReelThumb src={reel.thumbnail} videoUrl={reel.videoUrl} seed={reel.id} rate={hover ? 2.5 : 1} />

      {/* Gradient scrims for legibility */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black/50 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

      {chrome && (
        <>
          {/* "Playing" progress line */}
          <div className="absolute inset-x-1.5 top-1.5 h-[2px] overflow-hidden rounded-full bg-white/25">
            <div
              className="motion-loop h-full origin-left animate-reel-progress rounded-full bg-white/90"
              style={{ animationDuration: hover ? "3s" : "6s" }}
            />
          </div>

          <div className={cn("absolute left-1.5 top-3 flex items-center gap-1 text-white/90", compact ? "text-[8px]" : "text-[10px]")}>
            <Play className={cn("fill-white", compact ? "h-2 w-2" : "h-2.5 w-2.5")} />
            <span className="font-semibold tabular-nums">{views !== undefined ? formatCompact(views) : "Draft"}</span>
          </div>

          {!compact && (
            <div className="absolute bottom-9 right-1.5 flex flex-col items-center gap-2 text-white">
              <Heart className="h-3.5 w-3.5" />
              <MessageCircle className="h-3.5 w-3.5" />
              <Send className="h-3.5 w-3.5" />
              <Bookmark className="h-3.5 w-3.5" />
            </div>
          )}

          <div className={cn("absolute inset-x-1.5 bottom-1.5 flex items-center gap-1 overflow-hidden text-white/90", compact ? "text-[7px]" : "text-[9px]")}>
            <Music2 className={cn("shrink-0", compact ? "h-2 w-2" : "h-2.5 w-2.5")} />
            <div className="relative min-w-0 flex-1 overflow-hidden">
              <div className="motion-loop flex w-max min-w-[200%] animate-marquee whitespace-nowrap" style={{ animationDuration: hover ? "4s" : "8s" }}>
                <span className="min-w-[50%] pr-6">{reel.audio}</span>
                <span className="min-w-[50%] pr-6" aria-hidden>
                  {reel.audio}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {children}
    </motion.div>
  );
}
