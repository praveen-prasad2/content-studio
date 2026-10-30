"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspace-store";
import { Avatar } from "@/components/shared/Avatar";
import { useNow } from "@/hooks/useUtils";
import { cn, relativeTime } from "@/lib/utils";

const TYPE_ICON = {
  info: { icon: Info, className: "text-sky-300" },
  success: { icon: CheckCircle2, className: "text-emerald-300" },
  warning: { icon: AlertTriangle, className: "text-amber-300" },
} as const;

export function ActivityFeed({ className }: { className?: string }) {
  const activities = useWorkspaceStore((s) => s.activities);
  const workers = useWorkspaceStore((s) => s.workers);
  const now = useNow(10_000);
  const scrollRef = useRef<HTMLDivElement>(null);
  const latest = activities[0]?.id;

  // Auto-scroll to the newest item, unless the user has scrolled down to read older ones.
  useEffect(() => {
    const el = scrollRef.current;
    if (el && el.scrollTop < 120) el.scrollTo({ top: 0, behavior: "smooth" });
  }, [latest]);

  return (
    <div ref={scrollRef} className={cn("scrollbar-thin -mr-2 overflow-y-auto pr-2", className)} aria-live="polite" aria-label="Live activity">
      <ul className="space-y-1.5">
        <AnimatePresence initial={false}>
          {activities.map((a) => {
            const w = workers.find((x) => x.id === a.workerId);
            const T = TYPE_ICON[a.type];
            return (
              <motion.li
                key={a.id}
                layout="position"
                initial={{ opacity: 0, y: -14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className="flex gap-2.5 rounded-xl border border-transparent p-2 transition-colors hover:border-white/[0.06] hover:bg-white/[0.03]"
              >
                <span className="relative mt-0.5">
                  <Avatar src={w?.avatar ?? "✨"} name={w?.name ?? "Studio"} accent={w?.accentColor} size={28} />
                  <span
                    className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0f0f16]"
                    style={{ background: w?.accentColor ?? "#888" }}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[12.5px] leading-snug text-foreground/90">{a.message}</p>
                  <div className="mt-0.5 flex items-center gap-1 text-[10.5px] text-muted">
                    <T.icon className={cn("h-3 w-3", T.className)} />
                    {w?.name ?? "Studio"} · {relativeTime(a.at, now)}
                  </div>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>
      {!activities.length && <p className="py-8 text-center text-sm text-muted">No activity yet.</p>}
    </div>
  );
}
