"use client";

import Link from "next/link";
import { useWorkspaceStore } from "@/store/workspace-store";
import { PageContainer } from "@/components/layout/AppShell";
import { ReelThumb } from "@/components/shared/ReelThumb";
import { StageBadge } from "@/components/workspace/StageBadge";
import { cn } from "@/lib/utils";

const DAY = 86_400_000;

export default function CalendarPage() {
  const reels = useWorkspaceStore((s) => s.reels);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Two weeks: the past 6 days, today, and the next 7.
  const days = Array.from({ length: 14 }, (_, i) => new Date(today.getTime() + (i - 6) * DAY));

  const reelsOn = (day: Date) =>
    reels.filter((r) => {
      const iso = r.publishedAt ?? r.scheduledAt;
      if (!iso) return false;
      const d = new Date(iso);
      return d.getFullYear() === day.getFullYear() && d.getMonth() === day.getMonth() && d.getDate() === day.getDate();
    });

  const unscheduled = reels.filter((r) => !r.publishedAt && !r.scheduledAt && !r.completedAt);

  return (
    <PageContainer className="space-y-6">
      <div>
        <p className="section-label">Schedule</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Content calendar</h1>
        <p className="mt-1 text-sm text-muted">Published and scheduled reels across the last and next week.</p>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-7">
        {days.map((day) => {
          const isToday = day.getTime() === today.getTime();
          const items = reelsOn(day);
          return (
            <div
              key={day.toISOString()}
              className={cn("glass-card min-h-[140px] !rounded-2xl p-3", isToday && "ring-1 ring-accent/60")}
            >
              <div className="mb-2 flex items-baseline justify-between">
                <span className="text-xs text-muted">{day.toLocaleDateString(undefined, { weekday: "short" })}</span>
                <span className={cn("text-sm font-semibold tabular-nums", isToday && "text-accent")}>{day.getDate()}</span>
              </div>
              <ul className="space-y-1.5">
                {items.map((r) => (
                  <li key={r.id}>
                    <Link href={`/reels/${r.id}`} className="flex items-center gap-2 rounded-lg bg-white/[0.04] p-1.5 transition-colors hover:bg-white/[0.08]">
                      <span className="relative aspect-[9/16] w-6 shrink-0 overflow-hidden rounded">
                        <ReelThumb src={r.thumbnail} seed={r.id} rate={0} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11.5px] font-medium">{r.title}</span>
                        <span className="text-[10px] text-muted">
                          {new Date(r.publishedAt ?? r.scheduledAt ?? "").toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                          {r.publishedAt ? " · live" : " · scheduled"}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <section className="glass-card p-5">
        <h2 className="section-label mb-3">Not scheduled yet</h2>
        <ul className="flex flex-wrap gap-2">
          {unscheduled.map((r) => (
            <li key={r.id}>
              <Link href={`/reels/${r.id}`} className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] py-1 pl-1 pr-3 text-xs hover:bg-white/[0.06]">
                <span className="relative h-6 w-6 overflow-hidden rounded-full">
                  <ReelThumb src={r.thumbnail} seed={r.id} rate={0} />
                </span>
                #{r.number} {r.title}
                <StageBadge stage={r.stage} />
              </Link>
            </li>
          ))}
          {!unscheduled.length && <li className="text-sm text-muted">Everything is scheduled.</li>}
        </ul>
      </section>
    </PageContainer>
  );
}
