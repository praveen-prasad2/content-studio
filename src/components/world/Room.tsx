"use client";

import { memo, type CSSProperties } from "react";
import { useDroppable } from "@dnd-kit/core";
import { Play } from "lucide-react";
import { useShallow } from "zustand/react/shallow";
import { selectReel, useWorkspaceStore } from "@/store/workspace-store";
import { ReelThumb } from "@/components/shared/ReelThumb";
import { StatusPill } from "@/components/shared/StatusPill";
import { withAlpha } from "@/lib/utils";
import { LeadCharacter } from "./Characters";
import { FLOOR_PROPS, WallArt } from "./Props";
import { Anchor, BackWall, Billboard, Box3D, PlatformEdge, SideWall } from "./primitives";
import { ROOM_D, ROOM_W, TEAMS, WALL_H, type RoomLayout } from "./layout";

const DESK = { top: "#2b2242", front: "#1b1429", side: "#130e1e" };
/** Back-row desks, only used when a team has more than one worker. */
const EXTRA_X = [120, 440];
/** The lead's home spot behind their desk (patrol starts and ends here). */
const HOME = { x: 290, y: 282 };

function Desk({ cx, cy, w, d, h, accent, active }: { cx: number; cy: number; w: number; d: number; h: number; accent: string; active: boolean }) {
  return (
    <>
      <Box3D x={cx - w / 2} y={cy - d / 2} w={w} d={d} h={h} {...DESK}>
        <div className="absolute inset-x-3 bottom-2 h-1.5 rounded-full" style={{ background: withAlpha(accent, active ? 0.7 : 0.25) }} />
      </Box3D>
      <Billboard x={cx} y={cy - d / 2 + 14} z={h}>
        <div className="world-monitor" data-on={active} style={{ "--c": accent, width: w * 0.55 } as CSSProperties}>
          <span className="motion-loop" />
        </div>
      </Billboard>
    </>
  );
}

type RoomProps = {
  room: RoomLayout;
  focused: boolean;
  onFocus: (role: RoomLayout["role"]) => void;
  registerFloor: (role: RoomLayout["role"], el: HTMLElement | null) => void;
};

function RoomInner({ room, focused, onFocus, registerFloor }: RoomProps) {
  const lead = room.workers[0];
  const team = TEAMS[room.role];
  const reel = useWorkspaceStore(selectReel(lead?.currentReelId));
  const queued = useWorkspaceStore(
    useShallow((s) => s.reels.filter((r) => r.workerId && room.workers.some((w) => w.id === r.workerId && w.currentReelId !== r.id) && !r.completedAt)),
  );
  const { openWorkerEditor, openReel } = useWorkspaceStore.getState();

  const target = room.workers.find((w) => !w.currentReelId && w.status !== "paused" && w.status !== "error") ?? lead;
  const { setNodeRef, isOver, active } = useDroppable({ id: `room:${room.role}`, data: { type: "worker", workerId: target?.id } });
  if (!lead) return null;

  const reelOver = isOver && active?.data.current?.type === "reel";
  const accent = room.accent;
  const working = room.workers.some((w) => w.status === "working");
  const Prop = FLOOR_PROPS[room.role];
  const Icon = team.icon;
  // Extra workers with the same role get their own back-row desks.
  const extra = room.workers.slice(1, 1 + EXTRA_X.length);
  const frozen = lead.status === "paused" || lead.status === "error";
  // Faster workers walk their loop quicker; rooms start out of step so the floor never moves in unison.
  const patrolStyle = {
    "--patrol": `${22 - lead.speed * 2}s`,
    "--patrol-delay": `${room.index * -3.7}s`,
    transform: `translate3d(${HOME.x}px, ${HOME.y}px, 0)`,
  } as CSSProperties;

  return (
    <div
      className="world-room"
      data-focused={focused}
      data-over={reelOver}
      data-working={working}
      style={{ left: room.x, top: room.y, width: ROOM_W, height: ROOM_D, "--c": accent } as CSSProperties}
    >
      <PlatformEdge width={ROOM_W} depth={ROOM_D} thickness={26} front="linear-gradient(#211a33, #0d0a16)" side="linear-gradient(90deg, #0d0a16, #18122a)" />

      <div
        ref={(el) => {
          setNodeRef(el);
          registerFloor(room.role, el);
        }}
        className="world-floor"
        onClick={() => onFocus(room.role)}
        role="button"
        tabIndex={-1}
        aria-label={`Focus ${team.room}`}
      />

      <BackWall width={ROOM_W} height={WALL_H} className="world-wall world-wall-back">
        <div className="world-sign">
          <span className="world-sign-icon" style={{ background: withAlpha(accent, 0.2), color: accent }}>
            <Icon className="h-5 w-5" />
          </span>
          <span>
            <b>{team.room}</b>
            <small>{team.tagline}</small>
          </span>
        </div>
        <button
          type="button"
          className="world-screen"
          onClick={() => reel && openReel(reel.id)}
          disabled={!reel}
          aria-label={reel ? `Open Reel #${reel.number}: ${reel.title}` : "No reel on screen"}
        >
          {reel ? (
            <>
              <ReelThumb src={reel.thumbnail} seed={reel.id} rate={working ? 1 : 0} />
              <span className="world-screen-meta">
                <Play className="h-2.5 w-2.5 fill-white" /> #{reel.number}
              </span>
              <span className="world-screen-progress" style={{ transform: `scaleX(${lead.progress / 100})`, background: accent }} />
            </>
          ) : (
            <span className="world-screen-empty">Drop a reel here</span>
          )}
        </button>
        <div className="world-window">
          <span className="motion-loop" />
        </div>
      </BackWall>

      <SideWall offset={ROOM_W} depth={ROOM_D} height={WALL_H} className="world-wall world-wall-side">
        <div className="flex h-full items-center gap-4 px-6">
          <WallArt role={room.role} accent={accent} lead={lead} reel={reel} />
          <div className="world-shelf">
            {[0, 1, 2, 3].map((i) => (
              <i key={i} style={{ background: withAlpha(accent, 0.25 + i * 0.15) }} />
            ))}
          </div>
        </div>
      </SideWall>

      {/* Extra team members (only when several workers share this role) */}
      {extra.map((member, i) => (
        <div key={member.id}>
          <Billboard x={EXTRA_X[i]} y={128}>
            <LeadCharacter worker={member} team={team} onClick={() => openWorkerEditor(member.id)} />
          </Billboard>
          <Desk cx={EXTRA_X[i]} cy={170} w={100} d={50} h={30} accent={accent} active={member.status === "working"} />
        </div>
      ))}

      {/* Swivel chair the lead works from */}
      <div className="world-chair motion-loop" data-frozen={frozen} style={{ left: HOME.x - 22, top: HOME.y - 34, width: 44, height: 40 }}>
        <Box3D x={4} y={6} w={36} d={30} h={20} top={withAlpha(accent, 0.55)} front="#2a2140" side="#1b1429" />
        <Box3D x={4} y={0} w={36} d={7} h={46} top="#3a2f57" front="#2a2140" side="#1b1429" />
      </div>

      {/* The lead walks a loop: desk → wall screen → team prop → side wall → desk */}
      <div className="world-patrol world-sync" data-frozen={frozen} style={patrolStyle}>
        <div className="world-footprint" style={{ background: `radial-gradient(closest-side, ${withAlpha(accent, 0.55)}, transparent)` }} />
        <Billboard x={0} y={0}>
          <LeadCharacter worker={lead} team={team} patrolling onClick={() => openWorkerEditor(lead.id)} />
        </Billboard>
      </div>

      <Desk cx={290} cy={324} w={150} d={62} h={34} accent={accent} active={lead.status === "working"} />

      {/* Steaming mug on the desk */}
      <Billboard x={348} y={322} z={34}>
        <span className="world-mug" style={{ "--c": accent } as CSSProperties}>
          <i className="motion-loop" />
          <i className="motion-loop" />
          <i className="motion-loop" />
        </span>
      </Billboard>

      {/* Server rack humming in the back corner */}
      <Billboard x={70} y={70}>
        <span className="world-rack" style={{ "--c": accent } as CSSProperties} aria-hidden>
          {Array.from({ length: 18 }, (_, i) => (
            <i key={i} className="motion-loop" style={{ animationDelay: `${((i * 7) % 11) * -0.17}s`, opacity: i % 4 === 0 ? 0.4 : 1 }} />
          ))}
        </span>
      </Billboard>

      {/* Plant by the side wall */}
      <Billboard x={505} y={75}>
        <span className="world-plant motion-loop" aria-hidden>
          <i />
          <i />
          <i />
          <b />
        </span>
      </Billboard>

      {/* Delivery drone circling the room with the current reel */}
      <Anchor x={0} y={0} z={0}>
        <div className="world-drone-path world-sync" data-frozen={frozen} style={{ "--patrol-delay": `${room.index * -2.1}s` } as CSSProperties}>
          <Billboard x={0} y={0}>
            <span className="world-drone" style={{ "--c": accent } as CSSProperties}>
              <span className="world-drone-body">
                <i className="motion-loop" />
                <i className="motion-loop" />
              </span>
              {reel && (
                <span className="world-drone-cargo">
                  <ReelThumb src={reel.thumbnail} seed={reel.id} rate={0} />
                </span>
              )}
            </span>
          </Billboard>
        </div>
      </Anchor>

      <Prop lead={lead} reel={reel} accent={accent} />

      {/* Queue rack: reels waiting in this room */}
      {queued.slice(0, 3).map((q, i) => (
        <Billboard key={q.id} x={470 + i * 10} y={400 - i * 14} z={i * 4}>
          <button type="button" className="world-queue-card" onClick={() => openReel(q.id)} aria-label={`Queued Reel #${q.number}`}>
            <ReelThumb src={q.thumbnail} seed={q.id} rate={0} />
          </button>
        </Billboard>
      ))}

      {/* Floating holo label above the back wall */}
      <Billboard x={ROOM_W / 2} y={6} z={WALL_H + 26}>
        <button type="button" className="world-holo-label motion-loop" onClick={() => onFocus(room.role)} style={{ borderColor: withAlpha(accent, 0.45) }}>
          <span className="world-holo-index" style={{ background: accent }}>
            {String(room.index + 1).padStart(2, "0")}
          </span>
          <span className="min-w-0">
            <b>{team.room}</b>
            <span className="flex items-center gap-1.5">
              {lead.name} <StatusPill status={lead.status} className="!px-1.5 !py-0 !text-[8px]" />
              {queued.length > 0 && <em>+{queued.length} queued</em>}
            </span>
          </span>
          <span className="world-holo-bar">
            <i style={{ transform: `scaleX(${lead.progress / 100})`, background: accent }} />
          </span>
        </button>
      </Billboard>
    </div>
  );
}

export const Room = memo(RoomInner);
