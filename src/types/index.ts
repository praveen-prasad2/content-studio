export type WorkerStatus = "working" | "waiting" | "done" | "paused" | "error";

export type WorkerRole =
  | "research"
  | "strategy"
  | "copywriting"
  | "editing"
  | "publishing"
  | "analysing"
  | "custom";

export type Worker = {
  id: string;
  name: string;
  role: WorkerRole;
  title: string;
  avatar: string; // image URL or emoji
  accentColor: string; // hex
  status: WorkerStatus;
  currentTask: string;
  progress: number; // 0-100
  speed: number; // 1-5
  currentReelId: string | null;
  completedCount: number;
  isCollapsed: boolean;
  notes: string;
  autoPass: boolean;
  /** Epoch ms until which the worker shows the "done" state before picking up more work. */
  doneUntil?: number;
};

export type ReelStats = {
  views: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
};

export type ReelHistoryEntry = { workerId: string; action: string; at: string };

export type Reel = {
  id: string;
  number: number;
  title: string;
  thumbnail: string; // 9:16 image
  videoUrl?: string;
  hook: string;
  caption: string;
  hashtags: string[];
  audio: string;
  stage: WorkerRole;
  /** Worker currently holding the reel (active or queued). null = in the backlog / finished. */
  workerId: string | null;
  scheduledAt?: string;
  publishedAt?: string;
  completedAt?: string;
  stats?: ReelStats;
  history: ReelHistoryEntry[];
};

export type ActivityType = "info" | "success" | "warning";

export type Activity = {
  id: string;
  workerId: string;
  message: string;
  at: string;
  type: ActivityType;
};

export type SimulationSpeed = 0.5 | 1 | 2;

export type ViewMode = "pipeline" | "grid";

export type RightPanelTab = "activity" | "queue" | "stats";

/** A transient "reel flying between workers" animation. Never persisted. */
export type Transfer = {
  id: string;
  reelId: string;
  fromWorkerId: string;
  toWorkerId: string;
};

export type WorkspaceExport = {
  version: 1;
  workspaceName: string;
  themeAccent: string;
  workers: Worker[];
  reels: Reel[];
  activities: Activity[];
};
