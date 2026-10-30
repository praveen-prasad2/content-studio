"use client";

import { useEffect, useRef, useState } from "react";
import { cn, hashUnit } from "@/lib/utils";

const FALLBACKS = [
  "linear-gradient(160deg, #833AB4, #E1306C)",
  "linear-gradient(160deg, #1e3a8a, #06B6D4)",
  "linear-gradient(160deg, #7c2d12, #F59E0B)",
  "linear-gradient(160deg, #14532d, #22C55E)",
  "linear-gradient(160deg, #581c87, #EC4899)",
];

type ReelThumbProps = {
  src: string;
  videoUrl?: string;
  seed: string;
  /** Ken Burns playback rate. 0 = still. */
  rate?: number;
  className?: string;
};

/**
 * A 9:16 thumbnail with a slow Ken Burns zoom (Web Animations API so the rate can change
 * smoothly on hover), or a muted looping video when `videoUrl` is provided.
 */
export function ReelThumb({ src, videoUrl, seed, rate = 1, className }: ReelThumbProps) {
  const ref = useRef<HTMLDivElement>(null);
  const anim = useRef<Animation | null>(null);
  const [failed, setFailed] = useState(false);
  const unit = hashUnit(seed);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof el.animate !== "function") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const dx = unit > 0.5 ? -4 : 4;
    anim.current = el.animate(
      [
        { transform: "scale(1.02) translate3d(0,0,0)" },
        { transform: `scale(1.14) translate3d(${dx}%, -3%, 0)` },
      ],
      { duration: 14_000, iterations: Infinity, direction: "alternate", easing: "ease-in-out", delay: -unit * 14_000 },
    );
    return () => anim.current?.cancel();
  }, [unit]);

  useEffect(() => {
    const a = anim.current;
    if (!a) return;
    if (rate === 0) a.pause();
    else {
      if (a.playState === "paused") a.play();
      a.updatePlaybackRate(rate);
    }
  }, [rate]);

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)} style={{ background: FALLBACKS[Math.floor(unit * FALLBACKS.length)] }}>
      <div ref={ref} className="absolute inset-0 will-change-transform">
        {videoUrl ? (
          <video src={videoUrl} poster={src} className="h-full w-full object-cover" muted autoPlay loop playsInline />
        ) : !failed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            draggable={false}
            onError={() => setFailed(true)}
          />
        ) : null}
      </div>
    </div>
  );
}
