"use client";

import { Activity, BarChart3, ListTodo } from "lucide-react";
import type { RightPanelTab } from "@/types";
import { useWorkspaceStore } from "@/store/workspace-store";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/primitives";
import { ActivityFeed } from "./ActivityFeed";
import { TaskQueue } from "./TaskQueue";
import { StatsPanel } from "./StatsPanel";

export function RightPanelTabs({ feedClassName }: { feedClassName?: string }) {
  const tab = useWorkspaceStore((s) => s.rightPanelTab);
  const setTab = useWorkspaceStore((s) => s.setRightPanelTab);
  const backlogCount = useWorkspaceStore((s) => s.reels.filter((r) => r.workerId === null && !r.completedAt && !r.publishedAt).length);

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as RightPanelTab)} className="flex min-h-0 flex-1 flex-col">
      <TabsList>
        <TabsTrigger value="activity" className="flex items-center justify-center gap-1.5">
          <Activity className="h-3.5 w-3.5" /> Live
          <span className="relative flex h-1.5 w-1.5">
            <span className="motion-loop absolute inset-0 rounded-full bg-emerald-400 motion-safe:animate-pulse-ring" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
        </TabsTrigger>
        <TabsTrigger value="queue" className="flex items-center justify-center gap-1.5">
          <ListTodo className="h-3.5 w-3.5" /> Queue
          {backlogCount > 0 && <span className="rounded-full bg-white/10 px-1.5 text-[10px] tabular-nums">{backlogCount}</span>}
        </TabsTrigger>
        <TabsTrigger value="stats" className="flex items-center justify-center gap-1.5">
          <BarChart3 className="h-3.5 w-3.5" /> Today
        </TabsTrigger>
      </TabsList>
      <TabsContent value="activity" className="min-h-0 flex-1 data-[state=active]:flex data-[state=active]:flex-col">
        <ActivityFeed className={feedClassName ?? "min-h-0 flex-1"} />
      </TabsContent>
      <TabsContent value="queue" className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
        <TaskQueue />
      </TabsContent>
      <TabsContent value="stats" className="scrollbar-thin min-h-0 flex-1 overflow-y-auto">
        <StatsPanel />
      </TabsContent>
    </Tabs>
  );
}
