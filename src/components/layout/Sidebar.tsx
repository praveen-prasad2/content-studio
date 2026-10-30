"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronsLeft, ChevronsRight, ChevronsUpDown, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useWorkspaceStore } from "@/store/workspace-store";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip } from "@/components/ui/primitives";
import { cn } from "@/lib/utils";
import { isActive, NAV_ITEMS } from "./nav";

function Fade({ show, children, className }: { show: boolean; children: React.ReactNode; className?: string }) {
  return (
    <AnimatePresence initial={false}>
      {show && (
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className={className}>
          {children}
        </motion.span>
      )}
    </AnimatePresence>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useWorkspaceStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useWorkspaceStore((s) => s.toggleSidebar);
  const workspaceName = useWorkspaceStore((s) => s.workspaceName);
  const online = useWorkspaceStore((s) => s.workers.filter((w) => w.status !== "paused").length);
  const open = !collapsed;

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ type: "spring", stiffness: 320, damping: 34 }}
      className="relative hidden shrink-0 flex-col border-r border-white/[0.06] bg-[#0d0d14]/80 backdrop-blur-xl md:flex"
      aria-label="Main navigation"
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 px-[18px]">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-gradient shadow-[0_8px_20px_-8px_rgba(225,48,108,0.8)]">
          <Sparkles className="h-[18px] w-[18px] text-white" />
        </span>
        <Fade show={open} className="min-w-0">
          <span className="block truncate text-sm font-semibold tracking-tight">Content Studio</span>
          <span className="block text-[10px] uppercase tracking-[0.16em] text-muted">AI Team</span>
        </Fade>
      </div>

      <nav className="mt-2 flex flex-col gap-1 px-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          const link = (
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              aria-label={collapsed ? label : undefined}
              className={cn(
                "relative flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors",
                active ? "text-foreground" : "text-muted hover:bg-white/[0.04] hover:text-foreground",
              )}
            >
              {active && (
                <motion.span
                  layoutId="nav-active"
                  className="absolute inset-0 rounded-xl border border-white/[0.08] bg-white/[0.07]"
                  transition={{ type: "spring", stiffness: 500, damping: 38 }}
                />
              )}
              {active && <span className="absolute left-0 top-2.5 h-5 w-[3px] rounded-r-full bg-accent" />}
              <Icon className="relative h-[18px] w-[18px] shrink-0" />
              <Fade show={open} className="relative truncate">
                {label}
              </Fade>
            </Link>
          );
          return collapsed ? (
            <Tooltip key={href} content={label} side="right">
              {link}
            </Tooltip>
          ) : (
            <div key={href}>{link}</div>
          );
        })}
      </nav>

      <div className="mt-auto space-y-2 p-3">
        <div className={cn("flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs text-muted", open && "border border-white/[0.06] bg-white/[0.02]")}>
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="motion-loop absolute inset-0 rounded-full bg-emerald-400 motion-safe:animate-pulse-ring" />
            <span className="relative h-2 w-2 rounded-full bg-emerald-400" />
          </span>
          <Fade show={open}>
            <span className="text-foreground/90">{online} workers</span> online
          </Fade>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex w-full items-center gap-2.5 rounded-xl p-2 text-left transition-colors hover:bg-white/[0.05]"
              aria-label={`Workspace: ${workspaceName}. Switch workspace`}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/40 to-pink-500/40 text-xs font-bold">
                {workspaceName.slice(0, 2).toUpperCase()}
              </span>
              <Fade show={open} className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{workspaceName}</span>
                <span className="block text-[11px] text-muted">Pro plan</span>
              </Fade>
              {open && <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted" />}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-[230px]">
            <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
            <DropdownMenuItem>
              <Check /> {workspaceName}
            </DropdownMenuItem>
            {["Personal brand", "Client: Aurora"].map((n) => (
              <DropdownMenuItem key={n} onSelect={() => toast(`“${n}” is a demo workspace`, { description: "Multiple workspaces are coming soon." })}>
                <span className="w-4" /> {n}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => toast("Creating workspaces is coming soon")}>
              <Plus /> New workspace
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Tooltip content={collapsed ? "Expand sidebar" : "Collapse sidebar"} side="right">
          <button
            onClick={toggleSidebar}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="flex h-8 w-full items-center justify-center rounded-lg text-muted transition-colors hover:bg-white/[0.05] hover:text-foreground"
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </button>
        </Tooltip>
      </div>
    </motion.aside>
  );
}
