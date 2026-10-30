"use client";

import { useState } from "react";
import { cn, isImageUrl, withAlpha } from "@/lib/utils";

type AvatarProps = {
  src: string;
  name: string;
  size?: number;
  accent?: string;
  className?: string;
};

export function Avatar({ src, name, size = 36, accent = "#8B5CF6", className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const initials = name
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const showImage = isImageUrl(src) && !failed;

  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full", className)}
      style={{ width: size, height: size, background: withAlpha(accent, 0.18) }}
      aria-hidden
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" onError={() => setFailed(true)} draggable={false} />
      ) : isImageUrl(src) || !src ? (
        <span className="text-xs font-semibold" style={{ color: accent }}>
          {initials}
        </span>
      ) : (
        <span style={{ fontSize: size * 0.5 }}>{src}</span>
      )}
    </span>
  );
}
