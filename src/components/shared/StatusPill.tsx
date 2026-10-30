import { Check } from "lucide-react";
import type { WorkerStatus } from "@/types";
import { cn } from "@/lib/utils";

const STYLES: Record<WorkerStatus, { label: string; className: string; dot: string }> = {
  working: { label: "Working", className: "bg-emerald-500/10 text-emerald-300 border-emerald-500/25", dot: "bg-emerald-400" },
  waiting: { label: "Waiting", className: "bg-amber-500/10 text-amber-300 border-amber-500/25 motion-loop motion-safe:animate-breathe", dot: "bg-amber-400" },
  done: { label: "Done", className: "bg-sky-500/10 text-sky-300 border-sky-500/25", dot: "" },
  paused: { label: "Paused", className: "bg-white/[0.06] text-white/60 border-white/10", dot: "bg-white/40" },
  error: { label: "Fixing", className: "bg-orange-500/10 text-orange-300 border-orange-500/30", dot: "bg-orange-400" },
};

export const STATUS_LABELS: Record<WorkerStatus, string> = {
  working: "Working",
  waiting: "Waiting",
  done: "Done",
  paused: "Paused",
  error: "Fixing a glitch",
};

export function StatusPill({ status, className }: { status: WorkerStatus; className?: string }) {
  const s = STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
        s.className,
        className,
      )}
    >
      {status === "done" ? (
        <Check className="h-3 w-3" strokeWidth={3} />
      ) : (
        <span className="relative flex h-1.5 w-1.5">
          {status === "working" && (
            <span className={cn("motion-loop absolute inset-0 rounded-full motion-safe:animate-pulse-ring", s.dot)} />
          )}
          <span className={cn("relative h-1.5 w-1.5 rounded-full", s.dot)} />
        </span>
      )}
      {s.label}
    </span>
  );
}

export function TypingDots({ color = "currentColor" }: { color?: string }) {
  return (
    <span className="motion-loop inline-flex items-center gap-[3px] align-middle" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1 w-1 rounded-full motion-safe:animate-dot-bounce"
          style={{ background: color, animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  );
}
