"use client";

import type { CSSProperties, ReactNode } from "react";
import type { Reel, Worker, WorkerRole } from "@/types";
import { formatCompact, withAlpha } from "@/lib/utils";
import { Billboard, Box3D } from "./primitives";

type PropProps = { lead: Worker; reel: Reel | undefined; accent: string };

const shade = (hex: string, a: number) => withAlpha(hex, a);

/* ---------- Floor installations (room coordinates) ---------- */

function Radar({ accent, lead }: PropProps) {
  return (
    <>
      <div className="world-radar motion-loop" style={{ left: 40, top: 300, "--c": accent } as CSSProperties} data-on={lead.status === "working"}>
        <span className="world-radar-sweep" />
      </div>
      <Billboard x={110} y={370} z={30}>
        <div className="world-globe motion-loop" style={{ "--c": accent } as CSSProperties}>
          <i />
          <i />
          <i />
        </div>
      </Billboard>
    </>
  );
}

function HoloTable({ accent, lead }: PropProps) {
  const nodes = [
    [20, 30],
    [60, 14],
    [92, 40],
    [48, 62],
  ];
  return (
    <>
      <Box3D x={50} y={330} w={130} h={26} d={80} top={shade(accent, 0.35)} front="#1d1630" side="#140f22">
        <div className="absolute inset-2 rounded-md" style={{ boxShadow: `0 0 30px ${shade(accent, 0.7)} inset` }} />
      </Box3D>
      <Billboard x={115} y={375} z={30}>
        <svg width="120" height="80" viewBox="0 0 120 80" className="world-holo motion-loop" style={{ color: accent }}>
          {nodes.slice(0, -1).map(([x1, y1], i) => (
            <line key={i} x1={x1} y1={y1} x2={nodes[i + 1][0]} y2={nodes[i + 1][1]} stroke="currentColor" strokeOpacity="0.6" strokeWidth="1.5" />
          ))}
          {nodes.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={lead.progress > i * 25 ? 6 : 3} fill="currentColor" className="world-node" style={{ animationDelay: `${i * 0.3}s` }} />
          ))}
        </svg>
      </Billboard>
    </>
  );
}

function FloatingLetters({ accent, lead }: PropProps) {
  const glyphs = ["A", "#", "“", "✦", "a", "!"];
  return (
    <Billboard x={290} y={330} z={60}>
      <div className="world-letters" data-on={lead.status === "working"}>
        {glyphs.map((g, i) => (
          <span key={i} className="motion-loop" style={{ color: i % 2 ? "#fff" : accent, left: `${i * 18}px`, animationDelay: `${i * 0.45}s` }}>
            {g}
          </span>
        ))}
      </div>
    </Billboard>
  );
}

function FilmStrip({ accent, lead }: PropProps) {
  return (
    <div className="world-filmstrip motion-loop" data-on={lead.status === "working"} style={{ left: 40, top: 395, "--c": accent } as CSSProperties}>
      <span className="world-filmstrip-head" />
    </div>
  );
}

function LaunchPad({ accent, lead }: PropProps) {
  const launched = lead.status === "done";
  return (
    <>
      <div className="world-pad motion-loop" style={{ left: 50, top: 320, "--c": accent } as CSSProperties} />
      <Billboard x={110} y={380} z={6}>
        <div className={launched ? "world-rocket world-rocket-launch" : "world-rocket motion-loop"}>
          <svg width="34" height="64" viewBox="0 0 34 64">
            <path d="M17 2 C29 14 29 34 25 46 H9 C5 34 5 14 17 2Z" fill="#f4f2fb" />
            <circle cx="17" cy="22" r="5" fill={accent} />
            <path d="M9 38 L1 52 L9 48Z M25 38 L33 52 L25 48Z" fill={accent} />
          </svg>
          <span className="world-flame" />
        </div>
      </Billboard>
    </>
  );
}

function BarTower({ accent, lead, reel }: PropProps) {
  const base = [0.45, 0.62, 0.38, 0.8, 0.55];
  const boost = 0.4 + (lead.progress / 100) * 0.6;
  return (
    <>
      {base.map((b, i) => {
        const h = Math.round(20 + b * boost * 110);
        return (
          <Box3D
            key={i}
            x={40 + i * 34}
            y={330 + (i % 2) * 8}
            w={24}
            d={24}
            h={h}
            top={i === 3 ? accent : shade(accent, 0.75)}
            front={shade(accent, 0.45)}
            side={shade(accent, 0.3)}
            className="transition-[transform] duration-700"
          />
        );
      })}
      {reel?.stats && (
        <Billboard x={120} y={420} z={150}>
          <span className="world-chip" style={{ borderColor: shade(accent, 0.5) }}>
            👁 {formatCompact(reel.stats.views)} · ♥ {formatCompact(reel.stats.likes)}
          </span>
        </Billboard>
      )}
    </>
  );
}

function SpinCube({ accent }: PropProps) {
  return (
    <div className="absolute motion-loop world-spin" style={{ left: 70, top: 330, width: 90, height: 90, transformStyle: "preserve-3d" }}>
      <Box3D x={20} y={20} w={50} d={50} h={50} z={20} top={accent} front={shade(accent, 0.6)} side={shade(accent, 0.4)} />
    </div>
  );
}

export const FLOOR_PROPS: Record<WorkerRole, (p: PropProps) => ReactNode> = {
  research: Radar,
  strategy: HoloTable,
  copywriting: FloatingLetters,
  editing: FilmStrip,
  publishing: LaunchPad,
  analysing: BarTower,
  custom: SpinCube,
};

/* ---------- Side-wall art (upright content, depth × height box) ---------- */

export function WallArt({ role, accent, lead, reel }: PropProps & { role: WorkerRole }) {
  const p = lead.progress;
  switch (role) {
    case "research":
      return (
        <div className="world-poster">
          <b>Trending now</b>
          {["#trendingaudio", "POV hooks", "Before/After"].map((t, i) => (
            <span key={t} style={{ opacity: p > i * 30 ? 1 : 0.25, borderColor: shade(accent, 0.5) }}>
              {t}
            </span>
          ))}
        </div>
      );
    case "strategy":
      return (
        <div className="world-whiteboard">
          {[
            ["Hook: 3 sec", "#FDE68A"],
            ["Angle: relatable", "#F9A8D4"],
            ["CTA: save this", "#A5F3FC"],
          ].map(([t, c], i) => (
            <span key={t} className="world-sticky" style={{ background: c, opacity: p > i * 25 + 5 ? 1 : 0, transform: `rotate(${(i - 1) * 4}deg)` }}>
              {t}
            </span>
          ))}
        </div>
      );
    case "copywriting":
      return (
        <div className="world-poster world-script">
          <b>Script</b>
          <p>{(reel?.hook || "Waiting for a brief…").slice(0, Math.max(4, Math.round(((reel?.hook.length ?? 20) * p) / 100)))}</p>
        </div>
      );
    case "editing":
      return (
        <div className="world-poster">
          <b>Timeline</b>
          <div className="world-timeline">
            {[30, 22, 28, 20].map((w, i) => (
              <i key={i} style={{ width: `${w}%`, background: ["#F59E0B", "#F97316", "#FBBF24", "#FB923C"][i] }} />
            ))}
            <span className="motion-loop" />
          </div>
        </div>
      );
    case "publishing":
      return (
        <div className="world-poster">
          <b>Schedule</b>
          <span style={{ borderColor: shade(accent, 0.5) }}>Today · 7:00 PM</span>
          <span style={{ borderColor: shade(accent, 0.5) }}>{lead.status === "done" ? "✓ Published" : `Posting ${Math.round(p)}%`}</span>
        </div>
      );
    case "analysing":
      return (
        <div className="world-poster">
          <b>Growth</b>
          <svg viewBox="0 0 160 50" className="w-full">
            <polyline
              points="0,45 25,40 50,36 75,30 100,22 125,14 160,4"
              fill="none"
              stroke={accent}
              strokeWidth="3"
              strokeDasharray="200"
              strokeDashoffset={200 - p * 2}
              style={{ transition: "stroke-dashoffset 0.7s" }}
            />
          </svg>
        </div>
      );
    default:
      return (
        <div className="world-poster">
          <b>{lead.title}</b>
          <p>{lead.notes || lead.currentTask}</p>
        </div>
      );
  }
}
