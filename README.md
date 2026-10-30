# Content Studio – AI Team Workspace

A dark, animated dashboard where six AI workers (Research, Strategy, Copywriting, Editing, Publishing, Analysing) pass Instagram reels down a pipeline. There's no backend: everything is simulated in the browser and saved to `localStorage`.

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000. It redirects to `/workspace`.

Other scripts: `npm run build`, `npm start` and `npm run typecheck`.

Requires Node 18.18+.

## Features

- **3D World view (the default).** The workspace is an isometric studio floor with a walled room for each team: Research Lab, Strategy War Room, Writers' Room, Edit Suite, Launch Pad and Data Observatory.
  - Each room has its real worker as team lead, plus a crew of three robot specialists who type, idle, sleep or panic depending on the lead's status. Workers who share a role sit at the crew desks instead.
  - The back wall has a live screen showing the reel being worked on. The side wall shows team art that updates with progress: sticky notes, a typed script, a timeline, the posting schedule or a growth chart.
  - Each room has its own animated prop: a radar and globe, a holo table, floating letters, a film strip, a launch pad with a rocket, or a 3D bar chart.
  - A glowing conveyor links the rooms in pipeline order. Finished reels arc through the air to the next room.
  - **Moving around:** drag the floor (it glides when you let go), scroll to pan, and Ctrl/⌘ + scroll to zoom. On the keyboard, use the arrow keys, `+` / `-`, `0` to fit, and `1`–`9` to jump to a room.
  - **Navigation tools:** room chips, a clickable minimap, and a **Tour** button that flies the camera through every room.
  - Clicking a room opens its team panel (pause, skip, retry, edit). Clicking a character opens their editor. Clicking the wall screen opens the reel. You can drag reels from the Task Queue straight onto a room.
  - Built with CSS 3D transforms and Framer Motion, with no WebGL. The Studio, Pipeline and Grid views are still in the toolbar.
- **Live pipeline.** Six worker cards are joined by gradient connector lines. Glowing dots travel along a line while a worker is busy, and a reel thumbnail flies to the next worker when a stage finishes. You can switch between a horizontal **Pipeline** view and a **Grid** view.
- **A custom visual for each role:**
  - Research: scan line and trend tags
  - Strategy: sticky notes and a checklist
  - Copywriting: typewriter hook and caption
  - Editing: timeline, playhead and burned-in captions
  - Publishing: phone frame, progress ring and confetti
  - Analysing: live stats and a line chart
- **Reel previews (9:16).** Thumbnails slowly zoom (Ken Burns effect) and show Instagram-style overlay UI with a scrolling audio name. Hovering speeds them up. Clicking opens a detail modal.
- **Drag and drop (dnd-kit):**
  - Reorder workers by their grip handle.
  - Drag reels from the Task Queue onto a worker.
  - Drag a reel from one worker to another.
  - Drop a reel back on the queue to unassign it.
  - Keyboard dragging works too: focus a grip, press Space, use the arrow keys, then press Space again.
- **Editing:**
  - Double-click a worker's name, task or the workspace name to edit it in place.
  - The ⋮ menu has duplicate, change color, collapse, pause, reset, move left/right and delete (with an undo toast).
  - A side-sheet editor previews changes live on the card. Cancel reverts them.
  - "Add Worker" lets you pick a template and a position in the pipeline.
- **Undo / redo** with Ctrl+Z and Ctrl+Shift+Z (or Ctrl+Y). Covers reorder, edit, add, delete and duplicate.
- **Simulation:**
  - Ticks every 800 ms. Each tick adds progress equal to the worker's speed × a random 1–4, scaled by the speed control (0.5×, 1×, 2×).
  - At 100% a worker shows "done" for 1.5 s, then hands the reel on.
  - Random events happen every 10–20 s, including the occasional error that needs a Retry.
  - When Research runs out of work it scouts new reel ideas.
  - Published reels keep gaining views.
- **Right panel:** Live Activity, Task Queue (with "+ New Reel" and image upload) and Today's Stats (count-up numbers and a per-worker bar chart).
- **Instagram reels (`/instagram`).** Shows real reels from an Instagram profile (defaults to @beegainsacademy) using Instagram's official embed player.
  - **Any public account:** paste reel links (one or many, in any messy text). They're cleaned up, saved in this browser, and can be reordered or removed.
  - **Your own professional account:** copy `.env.example` to `.env.local` and set `INSTAGRAM_ACCESS_TOKEN`. `/api/instagram` then lists the account's reels automatically and caches them for 10 minutes. Instagram only gives this list for accounts you hold a token for.
- **Pages:**
  - `/reels`: filter and search all reels
  - `/reels/[id]`: editable hook, caption and hashtags, plus a worker timeline
  - `/analytics`: views over time, engagement by reel and top performers
  - `/calendar`: published and scheduled reels
  - `/settings`: workspace name, theme accent, simulation defaults, export/import as JSON, and reset
- **Responsive:**
  - On mobile, the sidebar becomes a bottom nav and the side panel becomes a bottom sheet.
  - Cards stack vertically on narrow screens.
- **Accessible:**
  - Labelled controls, focus rings and tooltips on icon buttons
  - Screen-reader announcements during drag and drop
  - `prefers-reduced-motion` support: looping animations stop and only fades remain

## Tech

Next.js 15 (App Router, TypeScript), Tailwind CSS, Framer Motion, @dnd-kit, Zustand (`persist`), Radix UI primitives in the shadcn/ui style (`src/components/ui`), sonner, Recharts and lucide-react.

## Structure

```
src/
  app/                 routes (workspace, reels, reels/[id], analytics, calendar, settings)
  components/
    layout/            AppShell, Sidebar, Topbar, MobileNav
    workspace/         PipelineBoard, WorkerCard, WorkerConnector, WorkerEditor, AddWorkerDialog,
                       ReelPreview, ActivityFeed, TaskQueue, StatsPanel, ...
    worker-visuals/    one animated visual per role, chosen via WORKER_VISUALS map
    reels/             ReelDetail, ReelModal
    shared/ ui/        small reusable pieces and shadcn-style primitives
  store/workspace-store.ts   all state + simulation step + undo/redo
  hooks/useSimulation.ts     drives the live behaviour
  data/                mock workers, reels, activity
  types/               shared types
```

Mock thumbnails are loaded from Unsplash and avatars from DiceBear. If an image fails to load, the app shows a gradient or initials instead.

To start over, use **Settings → Reset workspace** or clear the `content-studio-workspace` key in `localStorage`.
