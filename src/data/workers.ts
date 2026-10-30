import type { Worker, WorkerRole } from "@/types";

export const ROLE_ORDER: Exclude<WorkerRole, "custom">[] = [
  "research",
  "strategy",
  "copywriting",
  "editing",
  "publishing",
  "analysing",
];

export type RoleTemplate = {
  role: WorkerRole;
  title: string;
  defaultName: string;
  accentColor: string;
  task: string;
  description: string;
  avatar: string;
};

export const ROLE_TEMPLATES: Record<WorkerRole, RoleTemplate> = {
  research: {
    role: "research",
    title: "Research",
    defaultName: "Riya",
    accentColor: "#3B82F6",
    task: "Scanning trending audio & hooks",
    description: "Finds trends, audio and winning hooks.",
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=Riya&backgroundColor=b6e3f4",
  },
  strategy: {
    role: "strategy",
    title: "Strategy",
    defaultName: "Arjun",
    accentColor: "#A855F7",
    task: "Planning content angle & hook",
    description: "Picks the angle, hook length and CTA.",
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=Arjun&backgroundColor=d1d4f9",
  },
  copywriting: {
    role: "copywriting",
    title: "Copywriting",
    defaultName: "Meera",
    accentColor: "#EC4899",
    task: "Writing caption & on-screen text",
    description: "Writes on-screen text, caption and hashtags.",
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=Meera&backgroundColor=ffd5dc",
  },
  editing: {
    role: "editing",
    title: "Editing",
    defaultName: "Kiran",
    accentColor: "#F59E0B",
    task: "Cutting clips & adding captions",
    description: "Cuts clips, syncs audio and burns captions.",
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=Kiran&backgroundColor=ffdfbf",
  },
  publishing: {
    role: "publishing",
    title: "Publishing",
    defaultName: "Anu",
    accentColor: "#22C55E",
    task: "Scheduled for 7:00 PM",
    description: "Schedules and posts reels at peak time.",
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=Anu&backgroundColor=c0aede",
  },
  analysing: {
    role: "analysing",
    title: "Analysing",
    defaultName: "Dev",
    accentColor: "#06B6D4",
    task: "Tracking performance",
    description: "Tracks views, saves and engagement.",
    avatar: "https://api.dicebear.com/9.x/notionists/svg?seed=Dev&backgroundColor=c2f0e8",
  },
  custom: {
    role: "custom",
    title: "Custom",
    defaultName: "Nova",
    accentColor: "#8B5CF6",
    task: "Working on a custom step",
    description: "Any extra step you need in the pipeline.",
    avatar: "🤖",
  },
};

export const ACCENT_SWATCHES = [
  "#3B82F6",
  "#A855F7",
  "#EC4899",
  "#F59E0B",
  "#22C55E",
  "#06B6D4",
  "#EF4444",
  "#F97316",
];

export const AVATAR_PRESETS = [
  "https://api.dicebear.com/9.x/notionists/svg?seed=Riya&backgroundColor=b6e3f4",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Arjun&backgroundColor=d1d4f9",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Meera&backgroundColor=ffd5dc",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Kiran&backgroundColor=ffdfbf",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Anu&backgroundColor=c0aede",
  "https://api.dicebear.com/9.x/notionists/svg?seed=Dev&backgroundColor=c2f0e8",
  "🤖",
  "🦄",
];

export function createDefaultWorkers(): Worker[] {
  const progress: Record<string, number> = {
    research: 34,
    strategy: 62,
    copywriting: 18,
    editing: 47,
    publishing: 71,
    analysing: 40,
  };
  const reelFor: Record<string, string> = {
    research: "reel-24",
    strategy: "reel-23",
    copywriting: "reel-22",
    editing: "reel-21",
    publishing: "reel-20",
    analysing: "reel-19",
  };
  const completed: Record<string, number> = {
    research: 14,
    strategy: 12,
    copywriting: 11,
    editing: 9,
    publishing: 8,
    analysing: 7,
  };

  return ROLE_ORDER.map((role) => {
    const t = ROLE_TEMPLATES[role];
    return {
      id: `w-${role}`,
      name: t.defaultName,
      role,
      title: t.title,
      avatar: t.avatar,
      accentColor: t.accentColor,
      status: "working",
      currentTask: t.task,
      progress: progress[role],
      speed: role === "editing" ? 2 : role === "research" ? 4 : 3,
      currentReelId: reelFor[role],
      completedCount: completed[role],
      isCollapsed: false,
      notes: "",
      autoPass: true,
    } satisfies Worker;
  });
}
