"use client";

import { useCallback, useEffect, useLayoutEffect, useState, type RefObject } from "react";
import { motion, useReducedMotion } from "framer-motion";
import type { Transfer, Worker } from "@/types";
import { useWorkspaceStore } from "@/store/workspace-store";
import { ReelThumb } from "@/components/shared/ReelThumb";

type Rect = { x: number; y: number; w: number; h: number };

/** Builds a smooth cubic path from card `a` to card `b`, picking horizontal or vertical flow. */
export function connectorPath(a: Rect, b: Rect) {
  const toRight = b.x >= a.x + a.w - 2 && Math.abs(b.y - a.y) < Math.max(a.h, b.h) * 0.6;
  if (toRight) {
    const sx = a.x + a.w + 4;
    const sy = a.y + Math.min(a.h / 2, 200);
    const ex = b.x - 4;
    const ey = b.y + Math.min(b.h / 2, 200);
    const dx = (ex - sx) / 2;
    return { d: `M ${sx} ${sy} C ${sx + dx} ${sy}, ${ex - dx} ${ey}, ${ex} ${ey}`, sx, sy, ex, ey };
  }
  const sx = a.x + a.w / 2;
  const sy = a.y + a.h + 4;
  const ex = b.x + b.w / 2;
  const ey = b.y - 4;
  const dy = (ey - sy) / 2;
  return { d: `M ${sx} ${sy} C ${sx} ${sy + dy}, ${ex} ${ey - dy}, ${ex} ${ey}`, sx, sy, ex, ey };
}

/** Measures card positions (relative to the board) and keeps them fresh. */
export function useCardRects(containerRef: RefObject<HTMLDivElement | null>, nodes: Map<string, HTMLElement>, deps: unknown[]) {
  const [rects, setRects] = useState<Record<string, Rect>>({});

  const measure = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const base = container.getBoundingClientRect();
    const next: Record<string, Rect> = {};
    nodes.forEach((el, id) => {
      if (!el.isConnected) return;
      const r = el.getBoundingClientRect();
      next[id] = { x: r.left - base.left, y: r.top - base.top, w: r.width, h: r.height };
    });
    setRects(next);
  }, [containerRef, nodes]);

  useLayoutEffect(() => {
    measure();
    // Re-measure once enter animations / layout transitions have settled.
    const t1 = window.setTimeout(measure, 320);
    const t2 = window.setTimeout(measure, 700);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(container);
    nodes.forEach((el) => ro.observe(el));
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [measure, ...deps]);

  return { rects, measure };
}

function FlyingReel({ transfer, d }: { transfer: Transfer; d: string }) {
  const reel = useWorkspaceStore((s) => s.reels.find((r) => r.id === transfer.reelId));
  const clearTransfer = useWorkspaceStore((s) => s.clearTransfer);

  useEffect(() => {
    const t = window.setTimeout(() => clearTransfer(transfer.id), 1600);
    return () => window.clearTimeout(t);
  }, [clearTransfer, transfer.id]);

  if (!reel) return null;
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 z-30 h-[56px] w-[32px] overflow-hidden rounded-md border border-white/40 shadow-[0_0_24px_rgba(225,48,108,0.8)]"
      style={{
        offsetPath: `path("${d}")`,
        offsetRotate: "0deg",
        animation: "fly-along 1.2s cubic-bezier(0.45, 0, 0.2, 1) forwards",
      }}
    >
      <ReelThumb src={reel.thumbnail} seed={reel.id} rate={0} />
    </div>
  );
}

type ConnectorLayerProps = {
  order: string[];
  workers: Worker[];
  rects: Record<string, Rect>;
};

export function WorkerConnector({ order, workers, rects }: ConnectorLayerProps) {
  const reduce = useReducedMotion();
  const transfers = useWorkspaceStore((s) => s.transfers);
  const clearTransfer = useWorkspaceStore((s) => s.clearTransfer);
  const byId = new Map(workers.map((w) => [w.id, w]));

  const links = order.slice(0, -1).flatMap((id, i) => {
    const next = order[i + 1];
    const a = rects[id];
    const b = rects[next];
    if (!a || !b) return [];
    return [{ key: `${id}->${next}`, from: id, to: next, ...connectorPath(a, b) }];
  });

  // Drop transfers that can't be animated (reduced motion, or the link no longer exists).
  useEffect(() => {
    transfers.forEach((t) => {
      const drawable = links.some((l) => l.from === t.fromWorkerId && l.to === t.toWorkerId);
      if (reduce || !drawable) clearTransfer(t.id);
    });
  });

  return (
    <>
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden>
        <defs>
          {links.map((l) => (
            <linearGradient key={l.key} id={`grad-${l.key}`} gradientUnits="userSpaceOnUse" x1={l.sx} y1={l.sy} x2={l.ex} y2={l.ey}>
              <stop offset="0%" stopColor="#833AB4" />
              <stop offset="55%" stopColor="#E1306C" />
              <stop offset="100%" stopColor="#F77737" />
            </linearGradient>
          ))}
        </defs>
        {links.map((l) => {
          const working = byId.get(l.from)?.status === "working";
          return (
            <g key={l.key}>
              <motion.path
                d={l.d}
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={6}
                strokeLinecap="round"
                initial={false}
                animate={{ d: l.d }}
                transition={{ duration: 0.45, ease: "easeInOut" }}
              />
              <motion.path
                id={`path-${l.key}`}
                d={l.d}
                fill="none"
                stroke={`url(#grad-${l.key})`}
                strokeWidth={2}
                strokeLinecap="round"
                initial={{ pathLength: 0, opacity: 0, d: l.d }}
                animate={{ pathLength: 1, opacity: working ? 0.9 : 0.4, d: l.d }}
                transition={{ pathLength: { duration: 0.8, ease: "easeOut" }, d: { duration: 0.45, ease: "easeInOut" }, opacity: { duration: 0.4 } }}
              />
              {working && !reduce &&
                [0, 0.8, 1.6].map((begin) => (
                  <g key={begin}>
                    <circle r={6} fill="#E1306C" opacity={0.25}>
                      <animateMotion dur="2.4s" begin={`${begin}s`} repeatCount="indefinite" path={l.d} />
                    </circle>
                    <circle r={2.5} fill="#fff">
                      <animateMotion dur="2.4s" begin={`${begin}s`} repeatCount="indefinite" path={l.d} />
                    </circle>
                  </g>
                ))}
            </g>
          );
        })}
      </svg>

      {!reduce &&
        transfers.map((t) => {
          const link = links.find((l) => l.from === t.fromWorkerId && l.to === t.toWorkerId);
          return link ? <FlyingReel key={t.id} transfer={t} d={link.d} /> : null;
        })}
    </>
  );
}
