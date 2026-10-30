"use client";

import { useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspace-store";
import { useSimulation } from "@/hooks/useSimulation";
import { useUndoHotkeys } from "@/hooks/useUndoHotkeys";
import { useMounted } from "@/hooks/useUtils";
import { cn, hexToRgb } from "@/lib/utils";
import { Toaster, TooltipProvider } from "@/components/ui/primitives";
import { AddWorkerDialog } from "@/components/workspace/AddWorkerDialog";
import { NewReelDialog } from "@/components/workspace/NewReelDialog";
import { WorkerEditor } from "@/components/workspace/WorkerEditor";
import { ReelModal } from "@/components/reels/ReelModal";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { MobileNav } from "./MobileNav";

function Splash() {
  return (
    <div className="flex h-dvh items-center justify-center" aria-busy="true" aria-label="Loading workspace">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient motion-safe:animate-breathe">
        <Sparkles className="h-6 w-6 text-white" />
      </span>
    </div>
  );
}

function useThemeAccent() {
  const accent = useWorkspaceStore((s) => s.themeAccent);
  useEffect(() => {
    const [r, g, b] = hexToRgb(accent);
    document.documentElement.style.setProperty("--accent", `${r} ${g} ${b}`);
  }, [accent]);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  // The store hydrates from localStorage on the client; render only after mount
  // so server HTML never mismatches persisted state.
  const mounted = useMounted();
  useSimulation();
  useUndoHotkeys();
  useThemeAccent();

  if (!mounted) return <Splash />;

  return (
    <MotionConfig reducedMotion="user">
      <TooltipProvider delayDuration={300} skipDelayDuration={150}>
        <div className="flex h-dvh overflow-hidden">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar />
            <main id="main" className="flex min-h-0 flex-1 flex-col">
              {children}
            </main>
          </div>
        </div>
        <MobileNav />
        <AddWorkerDialog />
        <NewReelDialog />
        <WorkerEditor />
        <ReelModal />
        <Toaster />
      </TooltipProvider>
    </MotionConfig>
  );
}

export function PageContainer({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className="scrollbar-thin flex-1 overflow-y-auto">
      <div className={cn("mx-auto w-full max-w-[1400px] px-4 pb-28 pt-6 md:px-8 md:pb-12", className)}>{children}</div>
    </div>
  );
}
