import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type {
  Activity,
  ActivityType,
  Reel,
  RightPanelTab,
  SimulationSpeed,
  Transfer,
  ViewMode,
  Worker,
  WorkerRole,
  WorkspaceExport,
} from "@/types";
import { createDefaultWorkers, ROLE_TEMPLATES } from "@/data/workers";
import { createDefaultReels, IDEA_POOL, stageAction, thumbnailForNumber } from "@/data/reels";
import { createDefaultActivity, RANDOM_EVENTS } from "@/data/activity";

const MAX_ACTIVITY = 30;
const MAX_HISTORY = 50;
const MAX_REELS = 40;
const DONE_HOLD_MS = 1500;
/** How long a worker spends fixing a glitch before getting back to work on their own. */
const GLITCH_FIX_MS = 4000;

let idCounter = 0;
export const uid = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}${(idCounter++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

const rand = (min: number, max: number) => min + Math.random() * (max - min);
const pick = <T,>(list: readonly T[]): T => list[Math.floor(Math.random() * list.length)];

function shallowEqual<T extends object>(a: T, b: T) {
  const ka = Object.keys(a) as (keyof T)[];
  const kb = Object.keys(b) as (keyof T)[];
  if (ka.length !== kb.length) return false;
  return ka.every((k) => a[k] === b[k]);
}

/** Keep original object references when nothing changed, so subscribed components skip re-renders. */
function reuse<T extends { id: string } & object>(prev: T[], next: T[]): T[] {
  const byId = new Map(prev.map((p) => [p.id, p]));
  let changed = prev.length !== next.length;
  const out = next.map((n, i) => {
    const p = byId.get(n.id);
    if (p && shallowEqual(p, n)) {
      if (prev[i] !== p) changed = true;
      return p;
    }
    changed = true;
    return n;
  });
  return changed ? out : prev;
}

function addActivity(list: Activity[], workerId: string, message: string, type: ActivityType): Activity[] {
  const item: Activity = { id: uid("act"), workerId, message, type, at: new Date().toISOString() };
  return [item, ...list].slice(0, MAX_ACTIVITY);
}

function stageFor(worker: Worker, current: WorkerRole): WorkerRole {
  return worker.role === "custom" ? current : worker.role;
}

/* ------------------------------------------------------------------ */
/* Draft: a mutable working copy used by the simulation & reel moves.  */
/* ------------------------------------------------------------------ */

type DraftSource = Pick<WorkspaceState, "workers" | "reels" | "activities" | "transfers">;

function createDraft(s: DraftSource) {
  const workers = s.workers.map((w) => ({ ...w }));
  const reels = s.reels.map((r) => ({ ...r }));
  const reelById = new Map(reels.map((r) => [r.id, r]));
  let activities = s.activities;
  const transfers: Transfer[] = [];
  const nowIso = () => new Date().toISOString();

  const log = (workerId: string, message: string, type: ActivityType = "info") => {
    activities = addActivity(activities, workerId, message, type);
  };

  const queueOf = (w: Worker) =>
    reels.filter((r) => r.workerId === w.id && r.id !== w.currentReelId && !r.completedAt);

  const begin = (w: Worker, r: Reel) => {
    w.currentReelId = r.id;
    w.status = "working";
    w.progress = 0;
    w.doneUntil = undefined;
  };

  const nextNumber = () => reels.reduce((m, r) => Math.max(m, r.number), 0) + 1;

  const createIdeaReel = (w: Worker): Reel => {
    const idea = pick(IDEA_POOL);
    const reel: Reel = {
      id: uid("reel"),
      number: nextNumber(),
      ...idea,
      stage: stageFor(w, "research"),
      workerId: w.id,
      history: [],
    };
    reels.push(reel);
    reelById.set(reel.id, reel);
    return reel;
  };

  const startNext = (w: Worker, idx: number, allowGenerate: boolean) => {
    const queued = queueOf(w)[0];
    if (queued) {
      begin(w, queued);
      return;
    }
    if (idx === 0) {
      const backlog = reels.find((r) => r.workerId === null && !r.completedAt && !r.publishedAt);
      if (backlog) {
        backlog.workerId = w.id;
        backlog.stage = stageFor(w, backlog.stage);
        begin(w, backlog);
        log(w.id, `${w.name} picked up Reel #${backlog.number} from the queue`);
        return;
      }
      if (allowGenerate && Math.random() < 0.12) {
        const reel = createIdeaReel(w);
        begin(w, reel);
        log(w.id, `${w.name} found a new reel idea: “${reel.title}”`, "success");
        return;
      }
    }
    w.currentReelId = null;
    w.status = "waiting";
    w.progress = 0;
    w.doneUntil = undefined;
  };

  /** Hand the worker's current reel to the next worker in the pipeline. */
  const passReel = (idx: number) => {
    const w = workers[idx];
    const reel = w.currentReelId ? reelById.get(w.currentReelId) : undefined;
    w.currentReelId = null;
    if (!reel) return;
    const next = workers[idx + 1];
    if (!next) {
      reel.workerId = null;
      reel.completedAt = nowIso();
      log(w.id, `Reel #${reel.number} finished the pipeline 🎉`, "success");
      return;
    }
    reel.workerId = next.id;
    reel.stage = stageFor(next, reel.stage);
    transfers.push({ id: uid("tr"), reelId: reel.id, fromWorkerId: w.id, toWorkerId: next.id });
    if (!next.currentReelId && next.status === "waiting") begin(next, reel);
  };

  const complete = (w: Worker, idx: number, reel: Reel) => {
    const now = Date.now();
    w.progress = 100;
    w.status = "done";
    w.doneUntil = now + DONE_HOLD_MS;
    w.completedCount += 1;
    const action = w.role === "custom" ? `Completed ${w.title}` : stageAction(w.role);
    reel.history = [...reel.history, { workerId: w.id, action, at: nowIso() }];
    if (w.role === "publishing") {
      reel.publishedAt = nowIso();
      reel.scheduledAt = reel.scheduledAt ?? nowIso();
      reel.stats = reel.stats ?? {
        views: Math.round(rand(180, 600)),
        likes: Math.round(rand(14, 50)),
        comments: Math.round(rand(1, 8)),
        shares: Math.round(rand(1, 10)),
        saves: Math.round(rand(4, 20)),
      };
      log(w.id, `${w.name} published Reel #${reel.number} to Instagram`, "success");
    } else {
      log(w.id, `${w.name} finished ${w.title.toLowerCase()} for Reel #${reel.number}`, "success");
    }
    if (w.autoPass) passReel(idx);
  };

  const commit = (prev: DraftSource) => {
    let nextReels = reels;
    if (nextReels.length > MAX_REELS) {
      const removable = nextReels
        .filter((r) => r.completedAt)
        .sort((a, b) => (a.completedAt ?? "").localeCompare(b.completedAt ?? ""))
        .slice(0, nextReels.length - MAX_REELS)
        .map((r) => r.id);
      nextReels = nextReels.filter((r) => !removable.includes(r.id));
    }
    return {
      workers: reuse(prev.workers, workers),
      reels: reuse(prev.reels, nextReels),
      activities,
      transfers: transfers.length ? [...prev.transfers, ...transfers].slice(-6) : prev.transfers,
    };
  };

  return { workers, reels, reelById, log, begin, startNext, passReel, complete, commit, queueOf };
}

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

type WorkspaceState = {
  workspaceName: string;
  themeAccent: string;
  workers: Worker[];
  reels: Reel[];
  activities: Activity[];
  simulation: { enabled: boolean; speed: SimulationSpeed };
  defaults: { autoPass: boolean; simulationOnStart: boolean };

  // UI
  viewMode: ViewMode;
  sidebarCollapsed: boolean;
  rightPanelOpen: boolean;
  rightPanelTab: RightPanelTab;
  openReelId: string | null;
  editingWorkerId: string | null;
  addWorkerOpen: boolean;
  newReelOpen: boolean;

  // Transient
  transfers: Transfer[];
  past: Worker[][];
  future: Worker[][];
};

export type NewWorkerInput = {
  role: WorkerRole;
  name: string;
  accentColor: string;
  /** Insert after this worker id; null = at the start. */
  afterId: string | null;
};

type WorkspaceActions = {
  setWorkspaceName: (name: string) => void;
  setThemeAccent: (hex: string) => void;
  setSimulationEnabled: (enabled: boolean) => void;
  setSimulationSpeed: (speed: SimulationSpeed) => void;
  setDefaults: (patch: Partial<WorkspaceState["defaults"]>) => void;
  setViewMode: (mode: ViewMode) => void;
  toggleSidebar: () => void;
  setRightPanelOpen: (open: boolean) => void;
  setRightPanelTab: (tab: RightPanelTab) => void;
  openReel: (id: string | null) => void;
  openWorkerEditor: (id: string | null) => void;
  setAddWorkerOpen: (open: boolean) => void;
  setNewReelOpen: (open: boolean) => void;

  addWorker: (input: NewWorkerInput) => string;
  updateWorker: (id: string, patch: Partial<Worker>, options?: { record?: boolean }) => void;
  duplicateWorker: (id: string) => void;
  deleteWorker: (id: string) => { worker: Worker; index: number } | null;
  restoreWorker: (worker: Worker, index: number) => void;
  reorderWorkers: (activeId: string, overId: string) => void;
  moveWorker: (id: string, direction: -1 | 1) => void;
  recordSnapshot: (snapshot: Worker[]) => void;

  togglePause: (id: string) => void;
  resetProgress: (id: string) => void;
  skipWorker: (id: string) => void;
  retryWorker: (id: string) => void;

  assignReel: (reelId: string, workerId: string | null) => void;
  addReel: (input: { title: string; hook: string; thumbnail: string }) => string;
  updateReel: (id: string, patch: Partial<Reel>) => void;

  tick: (multiplier: number) => void;
  randomEvent: () => void;
  clearTransfer: (id: string) => void;

  undo: () => void;
  redo: () => void;
  resetWorkspace: () => void;
  exportWorkspace: () => WorkspaceExport;
  importWorkspace: (data: unknown) => boolean;
};

export type WorkspaceStore = WorkspaceState & WorkspaceActions;

function createInitialData() {
  const now = Date.now();
  return {
    workspaceName: "Content Studio",
    themeAccent: "#E1306C",
    workers: createDefaultWorkers(),
    reels: createDefaultReels(now),
    activities: createDefaultActivity(now),
  };
}

/** Restore a worker-structure snapshot while keeping live simulation fields. */
function mergeSnapshot(snapshot: Worker[], current: Worker[], reels: Reel[]) {
  const workers = snapshot.map((w): Worker => {
    const live = current.find((c) => c.id === w.id);
    if (live) {
      const status =
        w.status === "paused" || w.status === "error"
          ? w.status
          : live.status === "paused"
            ? live.currentReelId
              ? "working"
              : "waiting"
            : live.status;
      return {
        ...w,
        status,
        progress: live.progress,
        completedCount: live.completedCount,
        currentReelId: live.currentReelId,
        doneUntil: live.doneUntil,
      };
    }
    return {
      ...w,
      currentReelId: null,
      progress: 0,
      status: w.status === "paused" ? "paused" : "waiting",
      doneUntil: undefined,
    };
  });
  const ids = new Set(workers.map((w) => w.id));
  const nextReels = reels.map((r) => (r.workerId && !ids.has(r.workerId) ? { ...r, workerId: null } : r));
  return { workers, reels: nextReels };
}

function isWorkspaceExport(data: unknown): data is WorkspaceExport {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.workspaceName === "string" &&
    Array.isArray(d.workers) &&
    Array.isArray(d.reels) &&
    d.workers.every(
      (w) => w && typeof w === "object" && typeof (w as Worker).id === "string" && typeof (w as Worker).name === "string",
    ) &&
    d.reels.every((r) => r && typeof r === "object" && typeof (r as Reel).id === "string")
  );
}

export const useWorkspaceStore = create<WorkspaceStore>()(
  persist(
    (set, get) => {
      const record = (s: WorkspaceState) => ({
        past: [...s.past, s.workers].slice(-MAX_HISTORY),
        future: [] as Worker[][],
      });

      return {
        ...createInitialData(),
        simulation: { enabled: true, speed: 1 },
        defaults: { autoPass: true, simulationOnStart: true },
        viewMode: "pipeline",
        sidebarCollapsed: false,
        rightPanelOpen: true,
        rightPanelTab: "activity",
        openReelId: null,
        editingWorkerId: null,
        addWorkerOpen: false,
        newReelOpen: false,
        transfers: [],
        past: [],
        future: [],

        setWorkspaceName: (workspaceName) => set({ workspaceName: workspaceName.trim() || "Content Studio" }),
        setThemeAccent: (themeAccent) => set({ themeAccent }),
        setSimulationEnabled: (enabled) => set((s) => ({ simulation: { ...s.simulation, enabled } })),
        setSimulationSpeed: (speed) => set((s) => ({ simulation: { ...s.simulation, speed } })),
        setDefaults: (patch) => set((s) => ({ defaults: { ...s.defaults, ...patch } })),
        setViewMode: (viewMode) => set({ viewMode }),
        toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
        setRightPanelOpen: (rightPanelOpen) => set({ rightPanelOpen }),
        setRightPanelTab: (rightPanelTab) => set({ rightPanelTab }),
        openReel: (openReelId) => set({ openReelId }),
        openWorkerEditor: (editingWorkerId) => set({ editingWorkerId }),
        setAddWorkerOpen: (addWorkerOpen) => set({ addWorkerOpen }),
        setNewReelOpen: (newReelOpen) => set({ newReelOpen }),

        addWorker: ({ role, name, accentColor, afterId }) => {
          const t = ROLE_TEMPLATES[role];
          const worker: Worker = {
            id: uid("w"),
            name: name.trim() || t.defaultName,
            role,
            title: t.title,
            avatar: t.avatar,
            accentColor,
            status: "waiting",
            currentTask: t.task,
            progress: 0,
            speed: 3,
            currentReelId: null,
            completedCount: 0,
            isCollapsed: false,
            notes: "",
            autoPass: get().defaults.autoPass,
          };
          set((s) => {
            const index = afterId === null ? 0 : s.workers.findIndex((w) => w.id === afterId) + 1;
            const workers = [...s.workers];
            workers.splice(index <= 0 && afterId !== null ? workers.length : index, 0, worker);
            return {
              ...record(s),
              workers,
              activities: addActivity(s.activities, worker.id, `${worker.name} joined the team as ${t.title}`, "success"),
            };
          });
          return worker.id;
        },

        updateWorker: (id, patch, options) =>
          set((s) => ({
            ...(options?.record === false ? {} : record(s)),
            workers: s.workers.map((w) => (w.id === id ? { ...w, ...patch } : w)),
          })),

        duplicateWorker: (id) =>
          set((s) => {
            const index = s.workers.findIndex((w) => w.id === id);
            if (index < 0) return {};
            const src = s.workers[index];
            const copy: Worker = {
              ...src,
              id: uid("w"),
              name: `${src.name} (copy)`,
              status: "waiting",
              progress: 0,
              currentReelId: null,
              completedCount: 0,
              doneUntil: undefined,
            };
            const workers = [...s.workers];
            workers.splice(index + 1, 0, copy);
            return { ...record(s), workers };
          }),

        deleteWorker: (id) => {
          const s = get();
          const index = s.workers.findIndex((w) => w.id === id);
          if (index < 0) return null;
          const worker = s.workers[index];
          set({
            ...record(s),
            workers: s.workers.filter((w) => w.id !== id),
            reels: s.reels.map((r) => (r.workerId === id ? { ...r, workerId: null } : r)),
            editingWorkerId: s.editingWorkerId === id ? null : s.editingWorkerId,
          });
          return { worker, index };
        },

        restoreWorker: (worker, index) =>
          set((s) => {
            if (s.workers.some((w) => w.id === worker.id)) return {};
            const workers = [...s.workers];
            workers.splice(Math.min(index, workers.length), 0, {
              ...worker,
              currentReelId: null,
              progress: 0,
              status: worker.status === "paused" ? "paused" : "waiting",
              doneUntil: undefined,
            });
            return { ...record(s), workers };
          }),

        reorderWorkers: (activeId, overId) =>
          set((s) => {
            const from = s.workers.findIndex((w) => w.id === activeId);
            const to = s.workers.findIndex((w) => w.id === overId);
            if (from < 0 || to < 0 || from === to) return {};
            const workers = [...s.workers];
            const [moved] = workers.splice(from, 1);
            workers.splice(to, 0, moved);
            return { ...record(s), workers };
          }),

        moveWorker: (id, direction) => {
          const s = get();
          const from = s.workers.findIndex((w) => w.id === id);
          const target = s.workers[from + direction];
          if (from < 0 || !target) return;
          get().reorderWorkers(id, target.id);
        },

        recordSnapshot: (snapshot) =>
          set((s) => ({ past: [...s.past, snapshot].slice(-MAX_HISTORY), future: [] })),

        togglePause: (id) =>
          set((s) => ({
            ...record(s),
            workers: s.workers.map((w) =>
              w.id !== id
                ? w
                : w.status === "paused"
                  ? { ...w, status: w.currentReelId ? (w.progress >= 100 ? "done" : "working") : "waiting" }
                  : { ...w, status: "paused" },
            ),
            activities: (() => {
              const w = s.workers.find((x) => x.id === id);
              if (!w) return s.activities;
              return addActivity(
                s.activities,
                id,
                w.status === "paused" ? `${w.name} resumed work` : `${w.name} was paused`,
                w.status === "paused" ? "info" : "warning",
              );
            })(),
          })),

        resetProgress: (id) =>
          set((s) => ({
            workers: s.workers.map((w) =>
              w.id === id
                ? { ...w, progress: 0, status: w.status === "done" ? (w.currentReelId ? "working" : "waiting") : w.status }
                : w,
            ),
          })),

        skipWorker: (id) =>
          set((s) => {
            const idx = s.workers.findIndex((w) => w.id === id);
            const w = s.workers[idx];
            if (!w || !w.currentReelId) return {};
            const d = createDraft(s);
            const reel = d.reelById.get(w.currentReelId);
            const dw = d.workers[idx];
            if (reel) {
              d.log(
                id,
                dw.status === "done"
                  ? `${dw.name} passed Reel #${reel.number} on`
                  : `${dw.name} skipped Reel #${reel.number}`,
                dw.status === "done" ? "info" : "warning",
              );
            }
            d.passReel(idx);
            if (dw.status !== "paused") d.startNext(dw, idx, false);
            return d.commit(s);
          }),

        retryWorker: (id) =>
          set((s) => {
            const w = s.workers.find((x) => x.id === id);
            if (!w) return {};
            const wasError = w.status === "error";
            return {
              workers: s.workers.map((x) =>
                x.id === id
                  ? {
                      ...x,
                      status: x.currentReelId ? "working" : "waiting",
                      progress: wasError ? x.progress : 0,
                      doneUntil: undefined,
                    }
                  : x,
              ),
              activities: addActivity(
                s.activities,
                id,
                wasError ? `${w.name} retried after an error` : `${w.name} restarted the current task`,
                "info",
              ),
            };
          }),

        assignReel: (reelId, workerId) =>
          set((s) => {
            const reelBefore = s.reels.find((r) => r.id === reelId);
            if (!reelBefore || reelBefore.workerId === workerId) return {};
            const d = createDraft(s);
            const reel = d.reelById.get(reelId);
            if (!reel) return {};
            const prev = d.workers.find((w) => w.id === reel.workerId);
            if (prev && prev.currentReelId === reelId) {
              prev.currentReelId = null;
              prev.progress = 0;
              if (prev.status !== "paused" && prev.status !== "error") prev.status = "waiting";
            }
            if (workerId === null) {
              reel.workerId = null;
              d.log(prev?.id ?? "", `Reel #${reel.number} moved back to the task queue`);
              return d.commit(s);
            }
            const target = d.workers.find((w) => w.id === workerId);
            if (!target) return {};
            reel.workerId = target.id;
            reel.completedAt = undefined;
            reel.stage = stageFor(target, reel.stage);
            if (prev) {
              d.log(target.id, `Reel #${reel.number} moved from ${prev.name} to ${target.name}`);
            } else {
              d.log(target.id, `Reel #${reel.number} assigned to ${target.name}`);
            }
            if (!target.currentReelId && target.status !== "paused" && target.status !== "error") {
              d.begin(target, reel);
            }
            return d.commit(s);
          }),

        addReel: ({ title, hook, thumbnail }) => {
          const s = get();
          const number = s.reels.reduce((m, r) => Math.max(m, r.number), 0) + 1;
          const reel: Reel = {
            id: uid("reel"),
            number,
            title: title.trim() || `Untitled reel #${number}`,
            hook: hook.trim(),
            caption: "",
            hashtags: [],
            audio: "Original audio",
            thumbnail,
            stage: "research",
            workerId: null,
            history: [],
          };
          set({
            reels: [...s.reels, reel],
            activities: addActivity(s.activities, s.workers[0]?.id ?? "", `New reel added to queue: “${reel.title}”`, "info"),
          });
          return reel.id;
        },

        updateReel: (id, patch) => set((s) => ({ reels: s.reels.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),

        tick: (multiplier) =>
          set((s) => {
            const d = createDraft(s);
            const now = Date.now();

            d.workers.forEach((w, idx) => {
              if (w.status === "paused") return;
              if (w.status === "error") {
                // Workers fix glitches themselves. Errors set by hand (no timer yet) get one now.
                if (!w.doneUntil) {
                  w.doneUntil = now + GLITCH_FIX_MS;
                  return;
                }
                if (now < w.doneUntil) return;
                w.status = w.currentReelId ? "working" : "waiting";
                w.doneUntil = undefined;
                d.log(w.id, `${w.name} fixed the glitch and is back to work`, "success");
                return;
              }
              if (w.status === "done") {
                if (w.doneUntil && now < w.doneUntil) return;
                if (w.currentReelId) {
                  if (!w.autoPass) return; // parked until passed manually
                  d.passReel(idx);
                }
                d.startNext(w, idx, true);
                return;
              }
              if (w.status === "waiting") {
                d.startNext(w, idx, true);
                return;
              }
              const reel = w.currentReelId ? d.reelById.get(w.currentReelId) : undefined;
              if (!reel) {
                d.startNext(w, idx, true);
                return;
              }
              w.progress = Math.min(100, w.progress + w.speed * rand(1, 4) * multiplier);
              if (w.progress >= 100) d.complete(w, idx, reel);
            });

            // Analysing workers keep growing stats on published reels.
            const analysing = d.workers.some(
              (w) => w.role === "analysing" && w.status !== "paused" && w.status !== "error",
            );
            if (analysing) {
              d.reels
                .filter((r) => r.publishedAt && r.stats)
                .sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""))
                .slice(0, 8)
                .forEach((r) => {
                  if (!r.stats) return;
                  const ageH = (now - new Date(r.publishedAt ?? now).getTime()) / 3_600_000;
                  const factor = Math.max(0.12, 1 / (1 + ageH / 6));
                  const dv = Math.round(rand(8, 60) * factor * multiplier);
                  if (dv <= 0) return;
                  r.stats = {
                    views: r.stats.views + dv,
                    likes: r.stats.likes + Math.round(dv * rand(0.05, 0.11)),
                    comments: r.stats.comments + (Math.random() < 0.35 ? 1 : 0),
                    shares: r.stats.shares + Math.round(dv * rand(0, 0.03)),
                    saves: r.stats.saves + Math.round(dv * rand(0.01, 0.06)),
                  };
                });
            }

            return d.commit(s);
          }),

        randomEvent: () =>
          set((s) => {
            const active = s.workers.filter((w) => w.status !== "paused" && w.status !== "error");
            if (!active.length) return {};
            const w = pick(active);
            const reelNumber =
              s.reels.find((r) => r.id === w.currentReelId)?.number ?? pick(s.reels.map((r) => r.number));

            if (w.status === "working" && Math.random() < 0.08) {
              return {
                workers: s.workers.map((x) =>
                  x.id === w.id ? { ...x, status: "error", doneUntil: Date.now() + GLITCH_FIX_MS } : x,
                ),
                activities: addActivity(
                  s.activities,
                  w.id,
                  `${w.name} hit a glitch on Reel #${reelNumber} — fixing it now`,
                  "warning",
                ),
              };
            }

            const pool = RANDOM_EVENTS.find((e) => e.role === w.role)?.messages ?? [
              "shared a quick update on Reel #{n}",
            ];
            const message = `${w.name} ${pick(pool).replace("{n}", String(reelNumber))}`;
            return { activities: addActivity(s.activities, w.id, message, "info") };
          }),

        clearTransfer: (id) => set((s) => ({ transfers: s.transfers.filter((t) => t.id !== id) })),

        undo: () =>
          set((s) => {
            const prev = s.past[s.past.length - 1];
            if (!prev) return {};
            const merged = mergeSnapshot(prev, s.workers, s.reels);
            return {
              ...merged,
              past: s.past.slice(0, -1),
              future: [s.workers, ...s.future].slice(0, MAX_HISTORY),
            };
          }),

        redo: () =>
          set((s) => {
            const next = s.future[0];
            if (!next) return {};
            const merged = mergeSnapshot(next, s.workers, s.reels);
            return {
              ...merged,
              past: [...s.past, s.workers].slice(-MAX_HISTORY),
              future: s.future.slice(1),
            };
          }),

        resetWorkspace: () =>
          set((s) => ({
            ...createInitialData(),
            workspaceName: s.workspaceName,
            themeAccent: s.themeAccent,
            transfers: [],
            past: [],
            future: [],
            editingWorkerId: null,
            openReelId: null,
          })),

        exportWorkspace: () => {
          const s = get();
          return {
            version: 1,
            workspaceName: s.workspaceName,
            themeAccent: s.themeAccent,
            workers: s.workers,
            reels: s.reels,
            activities: s.activities,
          };
        },

        importWorkspace: (data) => {
          if (!isWorkspaceExport(data)) return false;
          set({
            workspaceName: data.workspaceName,
            themeAccent: typeof data.themeAccent === "string" ? data.themeAccent : "#E1306C",
            workers: data.workers.map((w) => ({ ...w, autoPass: w.autoPass ?? true })),
            reels: data.reels,
            activities: Array.isArray(data.activities) ? data.activities.slice(0, MAX_ACTIVITY) : [],
            transfers: [],
            past: [],
            future: [],
            editingWorkerId: null,
            openReelId: null,
          });
          return true;
        },
      };
    },
    {
      name: "content-studio-workspace",
      version: 2,
      storage: createJSONStorage(() => localStorage),
      // v1 → v2: stock Unsplash covers become the @beegainsacademy thumbnails. Uploaded covers are kept.
      migrate: (persisted, version) => {
        const state = (persisted ?? {}) as Partial<WorkspaceState>;
        if (version < 2 && Array.isArray(state.reels)) {
          const seeded = new Map(createDefaultReels().map((r) => [r.id, r.thumbnail]));
          state.reels = state.reels.map((r) =>
            r.thumbnail.includes("images.unsplash.com")
              ? { ...r, thumbnail: seeded.get(r.id) ?? thumbnailForNumber(r.number) }
              : r,
          );
        }
        return state as WorkspaceStore;
      },
      partialize: (s) => ({
        workspaceName: s.workspaceName,
        themeAccent: s.themeAccent,
        workers: s.workers,
        reels: s.reels,
        activities: s.activities,
        simulation: s.simulation,
        defaults: s.defaults,
        viewMode: s.viewMode,
        sidebarCollapsed: s.sidebarCollapsed,
        rightPanelOpen: s.rightPanelOpen,
        rightPanelTab: s.rightPanelTab,
      }),
      onRehydrateStorage: () => (state) => {
        if (state && !state.defaults.simulationOnStart) {
          state.setSimulationEnabled(false);
        }
      },
    },
  ),
);

/** Selector helpers */
export const selectWorker = (id: string) => (s: WorkspaceStore) => s.workers.find((w) => w.id === id);
export const selectReel = (id: string | null | undefined) => (s: WorkspaceStore) =>
  id ? s.reels.find((r) => r.id === id) : undefined;
