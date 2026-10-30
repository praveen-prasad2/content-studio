"use client";

import { useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Download, LogOut, Plus, Search, Settings, User, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { SimulationSpeed } from "@/types";
import { useWorkspaceStore } from "@/store/workspace-store";
import { InlineEdit } from "@/components/shared/InlineEdit";
import { ReelThumb } from "@/components/shared/ReelThumb";
import { StageBadge } from "@/components/workspace/StageBadge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch, Tooltip } from "@/components/ui/primitives";
import { downloadWorkspace } from "@/lib/workspace-file";
import { cn } from "@/lib/utils";

const SPEEDS: SimulationSpeed[] = [0.5, 1, 2];

function ReelSearch() {
  const router = useRouter();
  const reels = useWorkspaceStore((s) => s.reels);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^#(?=\d)/, "");
    if (!q) return [];
    return reels
      .filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.hook.toLowerCase().includes(q) ||
          String(r.number) === q ||
          r.hashtags.some((h) => h.toLowerCase().includes(q)),
      )
      .slice(0, 6);
  }, [query, reels]);

  const go = (id: string) => {
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
    router.push(`/reels/${id}`);
  };

  return (
    <div className="relative w-full max-w-[320px]">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
      <input
        ref={inputRef}
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label="Search reels"
        placeholder="Search reels…"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setHighlight(0);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => Math.min(h + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => Math.max(h - 1, 0));
          } else if (e.key === "Enter" && results[highlight]) {
            e.preventDefault();
            go(results[highlight].id);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
        className="h-9 w-full rounded-xl border border-white/[0.08] bg-white/[0.04] pl-9 pr-3 text-sm placeholder:text-muted/70 focus-visible:border-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/25"
      />
      <AnimatePresence>
        {open && query.trim() && (
          <motion.ul
            id={listId}
            role="listbox"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-11 z-50 overflow-hidden rounded-xl border border-white/10 bg-[#16161f]/95 p-1 shadow-2xl backdrop-blur-xl"
          >
            {results.length ? (
              results.map((r, i) => (
                <li
                  key={r.id}
                  role="option"
                  aria-selected={i === highlight}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    go(r.id);
                  }}
                  onMouseEnter={() => setHighlight(i)}
                  className={cn("flex cursor-pointer items-center gap-2.5 rounded-lg p-1.5", i === highlight && "bg-white/[0.08]")}
                >
                  <span className="relative aspect-[9/16] w-7 shrink-0 overflow-hidden rounded-md">
                    <ReelThumb src={r.thumbnail} seed={r.id} rate={0} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13px]">{r.title}</span>
                    <span className="text-[11px] text-muted">#{r.number}</span>
                  </span>
                  <StageBadge stage={r.stage} />
                </li>
              ))
            ) : (
              <li className="p-3 text-center text-xs text-muted">No reels match “{query}”</li>
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function SimulationControls({ className }: { className?: string }) {
  const sim = useWorkspaceStore((s) => s.simulation);
  const setEnabled = useWorkspaceStore((s) => s.setSimulationEnabled);
  const setSpeed = useWorkspaceStore((s) => s.setSimulationSpeed);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <label className="flex items-center gap-2 text-xs text-muted">
        <span className="hidden lg:inline">Simulation</span>
        <Switch checked={sim.enabled} onCheckedChange={setEnabled} aria-label="Simulation on or off" />
        <span className={cn("w-6 font-semibold", sim.enabled ? "text-emerald-300" : "text-muted")}>{sim.enabled ? "ON" : "OFF"}</span>
      </label>
      <div role="radiogroup" aria-label="Simulation speed" className="hidden rounded-lg border border-white/[0.08] bg-white/[0.03] p-0.5 sm:flex">
        {SPEEDS.map((s) => (
          <button
            key={s}
            role="radio"
            aria-checked={sim.speed === s}
            onClick={() => setSpeed(s)}
            disabled={!sim.enabled}
            className={cn(
              "rounded-md px-2 py-1 text-[11px] font-semibold tabular-nums transition-colors disabled:opacity-40",
              sim.speed === s ? "bg-white/[0.1] text-foreground" : "text-muted hover:text-foreground",
            )}
          >
            {s}x
          </button>
        ))}
      </div>
    </div>
  );
}

export function Topbar() {
  const router = useRouter();
  const workspaceName = useWorkspaceStore((s) => s.workspaceName);
  const setWorkspaceName = useWorkspaceStore((s) => s.setWorkspaceName);
  const setNewReelOpen = useWorkspaceStore((s) => s.setNewReelOpen);
  const setAddWorkerOpen = useWorkspaceStore((s) => s.setAddWorkerOpen);
  const today = new Date().toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });

  return (
    <header className="relative z-20 flex h-16 shrink-0 items-center gap-3 border-b border-white/[0.06] bg-background/70 px-4 backdrop-blur-xl md:px-6">
      <div className="min-w-0 max-w-[200px] shrink truncate text-[15px] font-semibold tracking-tight">
        <InlineEdit value={workspaceName} label="Workspace name" onSave={setWorkspaceName} />
      </div>
      <span className="hidden whitespace-nowrap text-xs text-muted xl:inline">{today}</span>

      <div className="hidden flex-1 justify-center md:flex">
        <ReelSearch />
      </div>
      <div className="flex-1 md:hidden" />

      <SimulationControls />

      <div className="flex items-center gap-1.5">
        <Tooltip content="Add a new reel to the queue">
          <Button variant="primary" size="sm" onClick={() => setNewReelOpen(true)} aria-label="New reel">
            <Plus /> <span className="hidden sm:inline">New Reel</span>
          </Button>
        </Tooltip>
        <Tooltip content="Add a worker to the pipeline">
          <Button variant="secondary" size="sm" onClick={() => setAddWorkerOpen(true)} aria-label="Add worker">
            <UserPlus /> <span className="hidden lg:inline">Add Worker</span>
          </Button>
        </Tooltip>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            aria-label="Account menu"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-gradient p-[2px] transition-transform active:scale-95"
          >
            <span className="flex h-full w-full items-center justify-center rounded-full bg-[#14141c] text-xs font-semibold">PP</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Signed in</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => router.push("/settings")}>
            <User /> Profile & workspace
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => router.push("/settings")}>
            <Settings /> Settings
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => downloadWorkspace()}>
            <Download /> Export workspace
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => toast("This is a local demo — nothing to sign out of!")}>
            <LogOut /> Sign out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
