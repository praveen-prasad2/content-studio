"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Plus, Search } from "lucide-react";
import type { WorkerRole } from "@/types";
import { ROLE_ORDER, ROLE_TEMPLATES } from "@/data/workers";
import { useWorkspaceStore } from "@/store/workspace-store";
import { PageContainer } from "@/components/layout/AppShell";
import { ReelPreview } from "@/components/workspace/ReelPreview";
import { StageBadge } from "@/components/workspace/StageBadge";
import { reelStatus } from "@/components/reels/ReelDetail";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/fields";
import { cn } from "@/lib/utils";

type Filter = "all" | WorkerRole | "complete";

export default function ReelsPage() {
  const reels = useWorkspaceStore((s) => s.reels);
  const setNewReelOpen = useWorkspaceStore((s) => s.setNewReelOpen);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const filters: { value: Filter; label: string; count: number }[] = [
    { value: "all", label: "All", count: reels.length },
    ...ROLE_ORDER.map((r) => ({
      value: r,
      label: ROLE_TEMPLATES[r].title,
      count: reels.filter((x) => x.stage === r && !x.completedAt).length,
    })),
    { value: "complete", label: "Complete", count: reels.filter((x) => x.completedAt).length },
  ];

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...reels]
      .sort((a, b) => b.number - a.number)
      .filter((r) => (filter === "all" ? true : filter === "complete" ? !!r.completedAt : r.stage === filter && !r.completedAt))
      .filter((r) => !q || r.title.toLowerCase().includes(q) || r.hook.toLowerCase().includes(q) || r.hashtags.some((h) => h.includes(q)));
  }, [reels, filter, query]);

  return (
    <PageContainer>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="section-label">Library</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">All reels</h1>
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title, hook, hashtag…" className="pl-9" aria-label="Search reels" />
          </div>
          <Button variant="primary" onClick={() => setNewReelOpen(true)}>
            <Plus /> New Reel
          </Button>
        </div>
      </div>

      <div className="no-scrollbar -mx-4 mt-5 flex gap-1.5 overflow-x-auto px-4" role="tablist" aria-label="Filter by stage">
        {filters.map((f) => (
          <button
            key={f.value}
            role="tab"
            aria-selected={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              filter === f.value ? "border-white/20 bg-white/[0.1] text-foreground" : "border-white/[0.08] text-muted hover:text-foreground",
            )}
          >
            {f.label}
            <span className="tabular-nums text-muted">{f.count}</span>
          </button>
        ))}
      </div>

      <motion.ul layout className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        <AnimatePresence mode="popLayout">
          {visible.map((r) => (
            <motion.li
              key={r.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <Link href={`/reels/${r.id}`} className="group block rounded-reel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/70" aria-label={`Reel #${r.number}: ${r.title}`}>
                <ReelPreview reel={r} size="fill" clickable={false} className="transition-transform duration-200 group-hover:-translate-y-1" />
                <div className="mt-2 px-0.5">
                  <p className="truncate text-sm font-medium">{r.title}</p>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
                    <span className="tabular-nums">#{r.number}</span>
                    {r.completedAt ? <StageBadge stage="publishing" label="Complete" /> : <StageBadge stage={r.stage} />}
                    <span className="truncate">{reelStatus(r)}</span>
                  </div>
                </div>
              </Link>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
      {!visible.length && <p className="py-16 text-center text-sm text-muted">No reels match these filters.</p>}
    </PageContainer>
  );
}
