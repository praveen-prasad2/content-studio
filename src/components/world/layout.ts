import { BarChart3, Boxes, Clapperboard, Lightbulb, PenLine, Radar, Rocket, type LucideIcon } from "lucide-react";
import type { Worker, WorkerRole } from "@/types";

/** Camera angles for the isometric floor. Billboards counter-rotate by these. */
export const TILT = 56;
export const SPIN = -38;

export const ROOM_W = 560;
export const ROOM_D = 460;
export const WALL_H = 150;
export const GAP = 220;
export const MARGIN = 240;

export type TeamInfo = {
  room: string;
  tagline: string;
  /** What the lead says at each patrol stop: desk, wall screen, team prop, side wall. */
  actions: [string, string, string, string];
  /** Little symbols that float up while they work. */
  glyphs: [string, string, string, string];
  icon: LucideIcon;
};

export const TEAMS: Record<WorkerRole, TeamInfo> = {
  research: {
    room: "Research Lab",
    tagline: "Trends, audio & hooks",
    actions: ["Scanning trends", "Reviewing the reel", "Reading the radar", "Filing references"],
    glyphs: ["#", "↗", "♪", "★"],
    icon: Radar,
  },
  strategy: {
    room: "Strategy War Room",
    tagline: "Angles, hooks & CTAs",
    actions: ["Drafting angles", "Checking the hook", "Mapping the plan", "Pinning notes"],
    glyphs: ["💡", "→", "✓", "◎"],
    icon: Lightbulb,
  },
  copywriting: {
    room: "Writers' Room",
    tagline: "Scripts, captions & tags",
    actions: ["Typing captions", "Proofing on-screen text", "Hunting for words", "Picking hashtags"],
    glyphs: ["A", "#", "“", "✎"],
    icon: PenLine,
  },
  editing: {
    room: "Edit Suite",
    tagline: "Cuts, captions & sound",
    actions: ["Cutting clips", "Reviewing the cut", "Syncing the beat", "Grabbing B-roll"],
    glyphs: ["✂", "▶", "♪", "◼"],
    icon: Clapperboard,
  },
  publishing: {
    room: "Launch Pad",
    tagline: "Scheduling & posting",
    actions: ["Queueing posts", "Previewing the reel", "Prepping the launch", "Checking the schedule"],
    glyphs: ["🚀", "⏱", "✓", "↑"],
    icon: Rocket,
  },
  analysing: {
    room: "Data Observatory",
    tagline: "Views, saves & growth",
    actions: ["Crunching numbers", "Watching views", "Reading the charts", "Logging insights"],
    glyphs: ["▲", "%", "👁", "♥"],
    icon: BarChart3,
  },
  custom: {
    room: "Custom Lab",
    tagline: "Your extra step",
    actions: ["Working away", "Reviewing", "Testing", "Organising"],
    glyphs: ["✦", "⚙", "✓", "•"],
    icon: Boxes,
  },
};

export type RoomLayout = {
  role: WorkerRole;
  index: number;
  x: number;
  y: number;
  workers: Worker[];
  accent: string;
};

/** Groups workers into one room per team and lays rooms out in a snake so the pipeline flows room to room. */
export function layoutRooms(workers: Worker[]) {
  const order: WorkerRole[] = [];
  const groups = new Map<WorkerRole, Worker[]>();
  workers.forEach((w) => {
    if (!groups.has(w.role)) {
      groups.set(w.role, []);
      order.push(w.role);
    }
    groups.get(w.role)?.push(w);
  });

  const n = Math.max(order.length, 1);
  const cols = Math.min(3, n);
  const rows = Math.ceil(n / cols);

  const rooms: RoomLayout[] = order.map((role, index) => {
    const row = Math.floor(index / cols);
    const col = row % 2 === 0 ? index % cols : cols - 1 - (index % cols);
    const team = groups.get(role) ?? [];
    return {
      role,
      index,
      x: MARGIN + col * (ROOM_W + GAP),
      y: MARGIN + row * (ROOM_D + GAP),
      workers: team,
      accent: team[0]?.accentColor ?? "#8B5CF6",
    };
  });

  return {
    rooms,
    width: MARGIN * 2 + cols * ROOM_W + (cols - 1) * GAP,
    depth: MARGIN * 2 + rows * ROOM_D + (rows - 1) * GAP,
  };
}

export const roomCenter = (r: Pick<RoomLayout, "x" | "y">) => ({ x: r.x + ROOM_W / 2, y: r.y + ROOM_D / 2 });
