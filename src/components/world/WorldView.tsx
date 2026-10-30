"use client";

import "./world.css";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion } from "framer-motion";
import { Hand, Maximize, Minus, Pause, Play, Plus, RotateCcw, SkipForward, Pencil, X, Navigation } from "lucide-react";
import type { Transfer, WorkerRole } from "@/types";
import { useWorkspaceStore } from "@/store/workspace-store";
import { Avatar } from "@/components/shared/Avatar";
import { ReelThumb } from "@/components/shared/ReelThumb";
import { StatusPill } from "@/components/shared/StatusPill";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/primitives";
import { cn, withAlpha } from "@/lib/utils";
import { Billboard } from "./primitives";
import { Room } from "./Room";
import { layoutRooms, ROOM_D, ROOM_W, roomCenter, TEAMS, type RoomLayout } from "./layout";

const MIN_ZOOM = 0.12;
const MAX_ZOOM = 1.6;
const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

/* ---------------- Scene pieces ---------------- */

function Conveyor({ rooms, width, depth }: { rooms: RoomLayout[]; width: number; depth: number }) {
  const pts = rooms.map(roomCenter);
  const d = pts.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" ");
  return (
    <svg className="world-conveyor" width={width} height={depth} viewBox={`0 0 ${width} ${depth}`} aria-hidden>
      <defs>
        <linearGradient id="belt" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#833AB4" />
          <stop offset="0.55" stopColor="#E1306C" />
          <stop offset="1" stopColor="#F77737" />
        </linearGradient>
      </defs>
      <path d={d} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="46" strokeLinejoin="round" strokeLinecap="round" />
      <path d={d} fill="none" stroke="url(#belt)" strokeOpacity="0.35" strokeWidth="4" strokeLinejoin="round" />
      <path d={d} fill="none" stroke="url(#belt)" strokeWidth="4" strokeDasharray="14 26" strokeLinejoin="round" className="world-belt motion-loop" />
      {pts.length > 1 &&
        [0, 1, 2, 3, 4].map((i) => (
          <g key={i} className="world-packet">
            <circle r="10" fill="#E1306C" opacity="0.25">
              <animateMotion dur="14s" begin={`${i * -2.8}s`} repeatCount="indefinite" path={d} rotate="auto" />
            </circle>
            <rect x="-7" y="-5" width="14" height="10" rx="2" fill="#fff">
              <animateMotion dur="14s" begin={`${i * -2.8}s`} repeatCount="indefinite" path={d} rotate="auto" />
            </rect>
          </g>
        ))}
    </svg>
  );
}

function FlyingReel({ transfer, from, to }: { transfer: Transfer; from: { x: number; y: number }; to: { x: number; y: number } }) {
  const reel = useWorkspaceStore((s) => s.reels.find((r) => r.id === transfer.reelId));
  const clearTransfer = useWorkspaceStore((s) => s.clearTransfer);
  if (!reel) return null;
  return (
    <motion.div
      className="absolute left-0 top-0"
      style={{ transformStyle: "preserve-3d" }}
      initial={{ x: from.x, y: from.y, z: 40 }}
      animate={{ x: to.x, y: to.y, z: [40, 260, 40] }}
      transition={{ duration: 1.8, ease: "easeInOut" }}
      onAnimationComplete={() => clearTransfer(transfer.id)}
    >
      <Billboard x={0} y={0}>
        <div className="world-flying-reel">
          <ReelThumb src={reel.thumbnail} seed={reel.id} rate={0} />
          <span>#{reel.number}</span>
        </div>
      </Billboard>
    </motion.div>
  );
}

function Particles({ width, depth }: { width: number; depth: number }) {
  const dots = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        x: ((i * 397) % 1000) / 1000,
        y: ((i * 613) % 1000) / 1000,
        d: (i % 7) * 0.9,
        s: 3 + (i % 3) * 2,
      })),
    [],
  );
  return (
    <>
      {dots.map((p, i) => (
        <Billboard key={i} x={p.x * width} y={p.y * depth}>
          <span className="world-particle motion-loop" style={{ animationDelay: `${-p.d}s`, width: p.s, height: p.s }} />
        </Billboard>
      ))}
    </>
  );
}

/* ---------------- HUD ---------------- */

function TeamPanel({ room, onClose }: { room: RoomLayout; onClose: () => void }) {
  const team = TEAMS[room.role];
  const reels = useWorkspaceStore((s) => s.reels);
  const { togglePause, skipWorker, retryWorker, openWorkerEditor, openReel } = useWorkspaceStore.getState();
  const Icon = team.icon;

  return (
    <motion.section
      key={room.role}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ type: "spring", stiffness: 380, damping: 32 }}
      className="world-panel"
      style={{ "--c": room.accent } as CSSProperties}
      aria-label={`${team.room} team`}
    >
      <header className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: withAlpha(room.accent, 0.18), color: room.accent }}>
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-semibold">{team.room}</h2>
          <p className="truncate text-[11px] text-muted">
            {team.tagline}
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" aria-label="Close team panel" onClick={onClose}>
          <X />
        </Button>
      </header>
      <ul className="mt-3 space-y-2">
        {room.workers.map((w) => {
          const reel = reels.find((r) => r.id === w.currentReelId);
          return (
            <li key={w.id} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-2.5">
              <div className="flex items-center gap-2">
                <Avatar src={w.avatar} name={w.name} accent={w.accentColor} size={30} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-[13px] font-medium">
                    {w.name} <StatusPill status={w.status} />
                  </div>
                  <p className="truncate text-[11.5px] text-muted">{w.currentTask}</p>
                </div>
                {reel && (
                  <button type="button" onClick={() => openReel(reel.id)} className="relative aspect-[9/16] w-7 shrink-0 overflow-hidden rounded-md border border-white/10" aria-label={`Open Reel #${reel.number}`}>
                    <ReelThumb src={reel.thumbnail} seed={reel.id} rate={0} />
                  </button>
                )}
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                <div className="h-full origin-left rounded-full transition-transform duration-700" style={{ transform: `scaleX(${w.progress / 100})`, background: w.accentColor }} />
              </div>
              <div className="mt-2 flex items-center gap-1">
                <span className="mr-auto text-[11px] tabular-nums text-muted">
                  {reel ? `Reel #${reel.number} · ` : ""}
                  {Math.round(w.progress)}% · ✓ {w.completedCount}
                </span>
                <Tooltip content={w.status === "paused" ? "Resume" : "Pause"}>
                  <Button variant="ghost" size="icon-sm" aria-label={w.status === "paused" ? `Resume ${w.name}` : `Pause ${w.name}`} onClick={() => togglePause(w.id)}>
                    {w.status === "paused" ? <Play /> : <Pause />}
                  </Button>
                </Tooltip>
                <Tooltip content="Pass reel to the next room">
                  <Button variant="ghost" size="icon-sm" aria-label={`Skip ${w.name}'s reel`} disabled={!w.currentReelId} onClick={() => skipWorker(w.id)}>
                    <SkipForward />
                  </Button>
                </Tooltip>
                <Tooltip content={w.status === "error" ? "Fix now" : "Restart task"}>
                  <Button variant="ghost" size="icon-sm" aria-label={`Retry ${w.name}`} onClick={() => retryWorker(w.id)} className={w.status === "error" ? "text-orange-300" : undefined}>
                    <RotateCcw />
                  </Button>
                </Tooltip>
                <Tooltip content="Edit worker">
                  <Button variant="ghost" size="icon-sm" aria-label={`Edit ${w.name}`} onClick={() => openWorkerEditor(w.id)}>
                    <Pencil />
                  </Button>
                </Tooltip>
              </div>
            </li>
          );
        })}
      </ul>
    </motion.section>
  );
}

function Minimap({ rooms, width, depth, focused, onPick }: { rooms: RoomLayout[]; width: number; depth: number; focused: WorkerRole | null; onPick: (r: WorkerRole) => void }) {
  const scale = 150 / Math.max(width, depth);
  return (
    <nav className="world-minimap" aria-label="Minimap: jump to a team room">
      <div className="world-minimap-plane" style={{ width: width * scale, height: depth * scale }}>
        {rooms.map((r) => {
          const lead = r.workers[0];
          return (
            <button
              key={r.role}
              type="button"
              onClick={() => onPick(r.role)}
              aria-label={`Go to ${TEAMS[r.role].room}`}
              aria-current={focused === r.role}
              className="world-minimap-room"
              data-status={lead?.status}
              style={{ left: r.x * scale, top: r.y * scale, width: ROOM_W * scale, height: ROOM_D * scale, background: withAlpha(r.accent, focused === r.role ? 0.85 : 0.4) }}
            />
          );
        })}
      </div>
    </nav>
  );
}

/* ---------------- Main view ---------------- */

export function WorldView() {
  const workers = useWorkspaceStore((s) => s.workers);
  const transfers = useWorkspaceStore((s) => s.transfers);
  const clearTransfer = useWorkspaceStore((s) => s.clearTransfer);
  const reduce = useReducedMotion();
  const { rooms, width, depth } = useMemo(() => layoutRooms(workers), [workers]);
  const structureKey = rooms.map((r) => `${r.role}:${r.workers.map((w) => w.id).join(".")}`).join("|");

  const viewport = useRef<HTMLDivElement>(null);
  const plane = useRef<HTMLDivElement>(null);
  const floors = useRef(new Map<WorkerRole, HTMLElement>()).current;
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const zoom = useMotionValue(0.6);
  const [zoomLabel, setZoomLabel] = useState(60);
  const [focused, setFocused] = useState<WorkerRole | null>(null);
  const [touring, setTouring] = useState(false);
  const drag = useRef<{ id: number; sx: number; sy: number; x0: number; y0: number; moved: boolean; t: number; vx: number; vy: number; lx: number; ly: number } | null>(null);
  const suppressClick = useRef(false);

  useEffect(() => zoom.on("change", (v) => setZoomLabel(Math.round(v * 100))), [zoom]);

  const fly = useCallback(
    (tx: number, ty: number, tz: number) => {
      const opts = reduce ? { duration: 0 } : { type: "spring" as const, stiffness: 70, damping: 20 };
      animate(x, tx, opts);
      animate(y, ty, opts);
      animate(zoom, clampZoom(tz), opts);
    },
    [reduce, x, y, zoom],
  );

  /** Fit the whole floor into view. */
  const fit = useCallback(() => {
    const vp = viewport.current;
    const pl = plane.current;
    if (!vp || !pl) return;
    const z = zoom.get();
    const r = pl.getBoundingClientRect();
    const target = Math.min(vp.clientWidth / (r.width / z), vp.clientHeight / (r.height / z)) * 0.95;
    setFocused(null);
    fly(0, 0, target);
  }, [fly, zoom]);

  /** Fly the camera so a room's floor is centred, at a comfortable zoom. */
  const focusRoom = useCallback(
    (role: WorkerRole, targetZoom = 0.9) => {
      const vp = viewport.current;
      const el = floors.get(role);
      if (!vp || !el) return;
      const v = vp.getBoundingClientRect();
      const r = el.getBoundingClientRect();
      const z = zoom.get();
      // Projected offset of the room centre from the stage origin, in unscaled units.
      const px = (r.left + r.width / 2 - (v.left + v.width / 2) - x.get()) / z;
      const py = (r.top + r.height / 2 - (v.top + v.height / 2) - y.get()) / z;
      const z1 = clampZoom(Math.min(targetZoom, (v.width * 0.95) / (r.width / z)));
      setFocused(role);
      // Nudge the room down so walls + holo label fit, and left so the team panel doesn't cover it.
      const panelShift = v.width > 900 ? -170 : 0;
      fly(-px * z1 + panelShift, -py * z1 + 80 * z1, z1);
    },
    [floors, fly, x, y, zoom],
  );

  // Initial framing.
  useLayoutEffect(() => {
    const t = window.setTimeout(fit, 60);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Guided tour: visit each room in pipeline order.
  useEffect(() => {
    if (!touring || !rooms.length) return;
    let i = Math.max(0, rooms.findIndex((r) => r.role === focused));
    focusRoom(rooms[i].role);
    const id = window.setInterval(() => {
      i = (i + 1) % rooms.length;
      focusRoom(rooms[i].role);
    }, 4500);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [touring, structureKey]);

  // Wheel: scroll pans, ctrl/⌘ + wheel (or pinch) zooms around the cursor.
  useEffect(() => {
    const vp = viewport.current;
    if (!vp) return;
    const onWheel = (e: WheelEvent) => {
      if ((e.target as Element).closest(".world-hud")) return;
      e.preventDefault();
      setTouring(false);
      if (e.ctrlKey || e.metaKey) {
        const v = vp.getBoundingClientRect();
        const cx = e.clientX - (v.left + v.width / 2);
        const cy = e.clientY - (v.top + v.height / 2);
        const z0 = zoom.get();
        const z1 = clampZoom(z0 * Math.exp(-e.deltaY * 0.0022));
        const k = z1 / z0;
        x.set(cx - (cx - x.get()) * k);
        y.set(cy - (cy - y.get()) * k);
        zoom.set(z1);
      } else {
        x.set(x.get() - e.deltaX);
        y.set(y.get() - e.deltaY);
      }
    };
    vp.addEventListener("wheel", onWheel, { passive: false });
    return () => vp.removeEventListener("wheel", onWheel);
  }, [x, y, zoom]);

  const zoomBy = (factor: number) => {
    setTouring(false);
    const z0 = zoom.get();
    const z1 = clampZoom(z0 * factor);
    const k = z1 / z0;
    fly(x.get() * k, y.get() * k, z1);
  };

  // Transfers between workers in different rooms fly across the floor.
  const roomOf = useMemo(() => {
    const m = new Map<string, RoomLayout>();
    rooms.forEach((r) => r.workers.forEach((w) => m.set(w.id, r)));
    return m;
  }, [rooms]);
  useEffect(() => {
    transfers.forEach((t) => {
      const a = roomOf.get(t.fromWorkerId);
      const b = roomOf.get(t.toWorkerId);
      if (reduce || !a || !b || a === b) clearTransfer(t.id);
    });
  }, [transfers, roomOf, reduce, clearTransfer]);

  const registerFloor = useCallback(
    (role: WorkerRole, el: HTMLElement | null) => {
      if (el) floors.set(role, el);
      else floors.delete(role);
    },
    [floors],
  );
  const onFocus = useCallback(
    (role: WorkerRole) => {
      setTouring(false);
      focusRoom(role);
    },
    [focusRoom],
  );

  const focusedRoom = rooms.find((r) => r.role === focused);

  return (
    <div className="world-shell">
      <div
        ref={viewport}
        className="world-viewport"
        tabIndex={0}
        role="application"
        aria-roledescription="3D studio floor"
        aria-label="Studio floor. Drag or scroll to move around, Ctrl + scroll to zoom, arrow keys to pan, number keys to jump to a room."
        onPointerDown={(e) => {
          if (e.button !== 0 || (e.target as Element).closest("button,a,input,[role='menuitem'],.world-hud")) return;
          const el = e.currentTarget;
          el.setPointerCapture(e.pointerId);
          drag.current = { id: e.pointerId, sx: e.clientX, sy: e.clientY, x0: x.get(), y0: y.get(), moved: false, t: performance.now(), vx: 0, vy: 0, lx: e.clientX, ly: e.clientY };
          x.stop();
          y.stop();
          setTouring(false);
        }}
        onPointerMove={(e) => {
          const d = drag.current;
          if (!d || d.id !== e.pointerId) return;
          const dx = e.clientX - d.sx;
          const dy = e.clientY - d.sy;
          if (!d.moved && Math.hypot(dx, dy) > 5) d.moved = true;
          const now = performance.now();
          const dt = Math.max(1, now - d.t);
          d.vx = (e.clientX - d.lx) / dt;
          d.vy = (e.clientY - d.ly) / dt;
          d.lx = e.clientX;
          d.ly = e.clientY;
          d.t = now;
          x.set(d.x0 + dx);
          y.set(d.y0 + dy);
        }}
        onPointerUp={(e) => {
          const d = drag.current;
          drag.current = null;
          if (!d) return;
          if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
          if (d.moved) {
            suppressClick.current = true;
            if (!reduce) {
              // Glide a little after release.
              animate(x, x.get() + d.vx * 220, { duration: 0.7, ease: [0.15, 0.6, 0.3, 1] });
              animate(y, y.get() + d.vy * 220, { duration: 0.7, ease: [0.15, 0.6, 0.3, 1] });
            }
          }
        }}
        onClickCapture={(e) => {
          if (suppressClick.current) {
            suppressClick.current = false;
            e.stopPropagation();
            e.preventDefault();
          }
        }}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          const step = 80;
          const moves: Record<string, [number, number]> = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
          if (moves[e.key]) {
            e.preventDefault();
            setTouring(false);
            fly(x.get() + moves[e.key][0], y.get() + moves[e.key][1], zoom.get());
          } else if (e.key === "+" || e.key === "=") zoomBy(1.2);
          else if (e.key === "-") zoomBy(1 / 1.2);
          else if (e.key === "0") fit();
          else if (/^[1-9]$/.test(e.key) && rooms[Number(e.key) - 1]) onFocus(rooms[Number(e.key) - 1].role);
          else if (e.key === "Escape") setFocused(null);
        }}
      >
        <div className="world-sky" aria-hidden>
          <span className="world-sky-glow motion-loop" />
        </div>

        <motion.div className="world-stage" style={{ x, y, scale: zoom }}>
          <div ref={plane} className="world-plane" data-focus={focused ?? undefined} style={{ width, height: depth, marginLeft: -width / 2, marginTop: -depth / 2 }}>
            <div className="world-ground" />
            <Conveyor rooms={rooms} width={width} depth={depth} />
            {rooms.map((room) => (
              <Room key={room.role} room={room} focused={focused === room.role} onFocus={onFocus} registerFloor={registerFloor} />
            ))}
            {!reduce && <Particles width={width} depth={depth} />}
            {!reduce &&
              transfers.map((t) => {
                const a = roomOf.get(t.fromWorkerId);
                const b = roomOf.get(t.toWorkerId);
                return a && b && a !== b ? <FlyingReel key={t.id} transfer={t} from={roomCenter(a)} to={roomCenter(b)} /> : null;
              })}
          </div>
        </motion.div>

        {/* HUD */}
        <div className="world-hud world-hud-top">
          <span className="world-hint">
            <Hand className="h-3.5 w-3.5" /> Drag or scroll to explore · Ctrl + scroll to zoom
          </span>
          <nav className="world-room-chips" aria-label="Jump to a team room">
            {rooms.map((r, i) => (
              <button key={r.role} type="button" onClick={() => onFocus(r.role)} aria-current={focused === r.role} className={cn("world-chip-btn", focused === r.role && "is-active")}>
                <i style={{ background: r.accent }} />
                <span className="tabular-nums text-muted">{i + 1}</span>
                {TEAMS[r.role].room}
              </button>
            ))}
          </nav>
        </div>

        <div className="world-hud world-hud-controls">
          <Tooltip content={touring ? "Stop tour" : "Guided tour of every room"}>
            <Button size="sm" variant={touring ? "primary" : "secondary"} onClick={() => setTouring((t) => !t)} aria-pressed={touring}>
              <Navigation /> {touring ? "Touring…" : "Tour"}
            </Button>
          </Tooltip>
          <div className="world-zoom">
            <Tooltip content="Zoom out (−)">
              <Button variant="ghost" size="icon-sm" aria-label="Zoom out" onClick={() => zoomBy(1 / 1.25)}>
                <Minus />
              </Button>
            </Tooltip>
            <output className="w-10 text-center text-[11px] tabular-nums text-muted" aria-label="Zoom level">
              {zoomLabel}%
            </output>
            <Tooltip content="Zoom in (+)">
              <Button variant="ghost" size="icon-sm" aria-label="Zoom in" onClick={() => zoomBy(1.25)}>
                <Plus />
              </Button>
            </Tooltip>
            <Tooltip content="See the whole floor (0)">
              <Button variant="ghost" size="icon-sm" aria-label="See the whole floor" onClick={fit}>
                <Maximize />
              </Button>
            </Tooltip>
          </div>
        </div>

        <div className="world-hud world-hud-minimap">
          <Minimap rooms={rooms} width={width} depth={depth} focused={focused} onPick={onFocus} />
        </div>

        <div className="world-hud world-hud-panel">
          <AnimatePresence>{focusedRoom && <TeamPanel room={focusedRoom} onClose={() => setFocused(null)} />}</AnimatePresence>
        </div>
      </div>
    </div>
  );
}
