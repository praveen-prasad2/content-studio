"use client";

import type { CSSProperties } from "react";
import type { Worker } from "@/types";
import { Avatar } from "@/components/shared/Avatar";
import { withAlpha } from "@/lib/utils";
import type { TeamInfo } from "./layout";

const RING = 2 * Math.PI * 25;

/** What floats above the character's head. While patrolling it cycles through the team's actions in sync with each stop. */
function ActionLabel({ worker, team, patrolling }: { worker: Worker; team: TeamInfo; patrolling: boolean }) {
  if (worker.status === "done") return <span className="world-label world-label-done">✓ Reel done!</span>;
  if (worker.status === "error") return <span className="world-label world-label-error">🔧 Fixing a glitch…</span>;
  if (worker.status === "paused") return <span className="world-label world-label-paused motion-loop">z z z · paused</span>;
  if (!patrolling) return <span className="world-label">{team.actions[0]}…</span>;
  return (
    <span className="world-label world-label-cycle">
      {team.actions.map((a, i) => (
        <span key={a} className={`world-act world-act-${i + 1} world-sync`}>
          {a}…
        </span>
      ))}
      <span className="invisible">{team.actions.reduce((l, a) => (a.length > l.length ? a : l), "")}…</span>
    </span>
  );
}

/** The team lead: the real worker, with their avatar as the head. Clickable. */
export function LeadCharacter({ worker, team, patrolling = false, onClick }: { worker: Worker; team: TeamInfo; patrolling?: boolean; onClick: () => void }) {
  const active = worker.status !== "paused" && worker.status !== "error";
  return (
    <button
      type="button"
      onClick={onClick}
      className="world-char world-lead group"
      data-status={worker.status}
      style={{ "--char": worker.accentColor } as CSSProperties}
      aria-label={`${worker.name}, ${worker.title} lead, ${worker.status}. Edit worker.`}
      title={`${worker.name} · ${worker.currentTask}`}
    >
      <ActionLabel worker={worker} team={team} patrolling={patrolling} />

      {active && (
        <span className="world-glyphs" aria-hidden>
          {team.glyphs.map((g, i) => (
            <span key={i} className="motion-loop" style={{ animationDelay: `${i * -0.9}s`, left: `${12 + i * 10}px`, color: i % 2 ? "#fff" : worker.accentColor }}>
              {g}
            </span>
          ))}
        </span>
      )}

      <span className="world-char-rig motion-loop">
        <span className="world-head">
          <svg className="world-head-progress" viewBox="0 0 56 56" aria-hidden>
            <circle cx="28" cy="28" r="25" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="3" />
            <circle
              cx="28"
              cy="28"
              r="25"
              fill="none"
              stroke={worker.accentColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={RING}
              strokeDashoffset={RING * (1 - worker.progress / 100)}
              transform="rotate(-90 28 28)"
              style={{ transition: "stroke-dashoffset 0.7s ease-out" }}
            />
          </svg>
          <span className="world-head-orbit motion-loop" style={{ borderColor: withAlpha(worker.accentColor, 0.55) }} />
          <Avatar src={worker.avatar} name={worker.name} accent={worker.accentColor} size={40} />
        </span>
        <span className="world-torso" style={{ background: `linear-gradient(160deg, ${worker.accentColor}, ${withAlpha(worker.accentColor, 0.45)})` }}>
          <span className="world-arm world-arm-l motion-loop" />
          <span className="world-arm world-arm-r motion-loop" />
          <span className="world-badge" />
        </span>
        <span className="world-legs" aria-hidden>
          <span className={patrolling ? "world-leg world-leg-l world-sync" : "world-leg"} />
          <span className={patrolling ? "world-leg world-leg-r world-sync" : "world-leg"} />
        </span>
      </span>
      <span className="world-nametag">{worker.name}</span>
    </button>
  );
}
