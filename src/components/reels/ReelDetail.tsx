"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Bookmark, CalendarClock, Eye, Heart, MessageCircle, Music2, Send } from "lucide-react";
import type { Reel } from "@/types";
import { useWorkspaceStore } from "@/store/workspace-store";
import { ROLE_TEMPLATES } from "@/data/workers";
import { ReelPreview } from "@/components/workspace/ReelPreview";
import { StageBadge } from "@/components/workspace/StageBadge";
import { Avatar } from "@/components/shared/Avatar";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { InlineEdit } from "@/components/shared/InlineEdit";
import { Input, Label, Textarea } from "@/components/ui/fields";
import { cn, engagementRate, formatCompact, formatDateTime } from "@/lib/utils";

export function reelStatus(reel: Reel) {
  if (reel.completedAt) return "Complete";
  if (reel.workerId) return "In progress";
  if (reel.publishedAt) return "Published";
  return "In queue";
}

function EditableArea({
  id,
  label,
  value,
  onSave,
  rows = 3,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onSave: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        rows={rows}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => draft !== value && onSave(draft)}
        className="min-h-0 resize-none"
      />
    </div>
  );
}

function HashtagEditor({ reel }: { reel: Reel }) {
  const updateReel = useWorkspaceStore((s) => s.updateReel);
  const [draft, setDraft] = useState("");
  const add = () => {
    const tags = draft
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter(Boolean)
      .map((t) => (t.startsWith("#") ? t : `#${t}`));
    if (tags.length) updateReel(reel.id, { hashtags: Array.from(new Set([...reel.hashtags, ...tags])) });
    setDraft("");
  };
  return (
    <div className="space-y-1.5">
      <Label htmlFor={`tags-${reel.id}`}>Hashtags</Label>
      <div className="flex flex-wrap gap-1.5">
        {reel.hashtags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => updateReel(reel.id, { hashtags: reel.hashtags.filter((t) => t !== tag) })}
            className="group rounded-full border border-pink-500/25 bg-pink-500/10 px-2 py-0.5 text-xs text-pink-200 transition-colors hover:border-red-500/40 hover:bg-red-500/10"
            aria-label={`Remove ${tag}`}
          >
            {tag} <span className="text-pink-200/50 group-hover:text-red-300">×</span>
          </button>
        ))}
      </div>
      <Input
        id={`tags-${reel.id}`}
        value={draft}
        placeholder="Add hashtags, press Enter"
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            add();
          }
        }}
        onBlur={add}
      />
    </div>
  );
}

export function ReelStatsGrid({ reel }: { reel: Reel }) {
  const s = reel.stats;
  const items = [
    { icon: Eye, label: "Views", value: s?.views ?? 0 },
    { icon: Heart, label: "Likes", value: s?.likes ?? 0 },
    { icon: MessageCircle, label: "Comments", value: s?.comments ?? 0 },
    { icon: Send, label: "Shares", value: s?.shares ?? 0 },
    { icon: Bookmark, label: "Saves", value: s?.saves ?? 0 },
  ];
  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
      {items.map(({ icon: Icon, label, value }) => (
        <div key={label} className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5">
          <div className="flex items-center gap-1 text-[10.5px] text-muted">
            <Icon className="h-3 w-3" /> {label}
          </div>
          <AnimatedNumber value={value} format={formatCompact} className="mt-0.5 block text-base font-semibold tabular-nums" />
        </div>
      ))}
      <div className="rounded-xl border border-white/[0.08] bg-white/[0.03] p-2.5">
        <div className="text-[10.5px] text-muted">Engagement</div>
        <div className="mt-0.5 text-base font-semibold tabular-nums">{engagementRate(s).toFixed(1)}%</div>
      </div>
    </div>
  );
}

export function ReelTimeline({ reel }: { reel: Reel }) {
  const workers = useWorkspaceStore((s) => s.workers);
  const holder = workers.find((w) => w.id === reel.workerId);
  const entries = [...reel.history].reverse();

  return (
    <ol className="relative space-y-4 border-l border-white/[0.08] pl-5" aria-label="Reel timeline">
      {holder && (
        <li className="relative">
          <span
            className="motion-loop absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-[#0b0b10] motion-safe:animate-breathe"
            style={{ background: holder.accentColor }}
          />
          <div className="flex items-center gap-2 text-sm">
            <Avatar src={holder.avatar} name={holder.name} accent={holder.accentColor} size={22} />
            <span className="font-medium">{holder.name}</span>
            <span className="text-muted">is working on it now</span>
          </div>
          <div className="mt-0.5 text-xs text-muted">{holder.title} · {Math.round(holder.currentReelId === reel.id ? holder.progress : 0)}%</div>
        </li>
      )}
      {entries.map((h, i) => {
        const w = workers.find((x) => x.id === h.workerId);
        const role = (h.workerId.replace(/^w-/, "") as keyof typeof ROLE_TEMPLATES) in ROLE_TEMPLATES ? (h.workerId.replace(/^w-/, "") as keyof typeof ROLE_TEMPLATES) : "custom";
        const color = w?.accentColor ?? ROLE_TEMPLATES[role].accentColor;
        return (
          <motion.li
            key={`${h.at}-${i}`}
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="relative"
          >
            <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full ring-4 ring-[#0b0b10]" style={{ background: color }} />
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <Avatar src={w?.avatar ?? ""} name={w?.name ?? "Former worker"} accent={color} size={22} />
              <span className="font-medium">{w?.name ?? "Former worker"}</span>
              <span className="text-foreground/80">{h.action}</span>
            </div>
            <div className="mt-0.5 text-xs text-muted">{formatDateTime(h.at)}</div>
          </motion.li>
        );
      })}
      {!entries.length && !holder && <li className="text-sm text-muted">No work recorded yet — this reel is waiting in the queue.</li>}
    </ol>
  );
}

export function ReelDetail({ reel, variant = "page" }: { reel: Reel; variant?: "page" | "modal" }) {
  const updateReel = useWorkspaceStore((s) => s.updateReel);
  const page = variant === "page";

  return (
    <div className={cn("grid gap-6", page ? "lg:grid-cols-[340px_1fr]" : "sm:grid-cols-[200px_1fr]")}>
      <div className={cn("mx-auto w-full", page ? "max-w-[340px]" : "max-w-[200px]")}>
        <ReelPreview reel={reel} size="fill" clickable={false}>
          {reel.hook && (
            <div className="absolute inset-x-3 top-[36%] flex justify-center">
              <span className="rounded-md bg-white/95 px-2 py-1 text-center text-[13px] font-bold leading-tight text-black">{reel.hook}</span>
            </div>
          )}
        </ReelPreview>
      </div>

      <div className="min-w-0 space-y-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
            <span className="tabular-nums">Reel #{reel.number}</span>
            <StageBadge stage={reel.stage} />
            <span className="rounded-full bg-white/[0.06] px-2 py-0.5">{reelStatus(reel)}</span>
          </div>
          <h2 className={cn("mt-2 font-semibold tracking-tight", page ? "text-2xl" : "text-lg")}>
            <InlineEdit value={reel.title} label="Reel title" onSave={(title) => updateReel(reel.id, { title })} />
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            <span className="flex items-center gap-1">
              <Music2 className="h-3.5 w-3.5" /> {reel.audio}
            </span>
            {reel.scheduledAt && (
              <span className="flex items-center gap-1">
                <CalendarClock className="h-3.5 w-3.5" /> {reel.publishedAt ? "Published" : "Scheduled"} {formatDateTime(reel.publishedAt ?? reel.scheduledAt)}
              </span>
            )}
          </div>
        </div>

        <ReelStatsGrid reel={reel} />

        <div className="grid gap-4 md:grid-cols-2">
          <EditableArea id={`hook-${reel.id}`} label="Hook" rows={2} value={reel.hook} onSave={(hook) => updateReel(reel.id, { hook })} placeholder="First 3 seconds…" />
          <EditableArea id={`caption-${reel.id}`} label="Caption" rows={3} value={reel.caption} onSave={(caption) => updateReel(reel.id, { caption })} placeholder="Write a caption…" />
        </div>
        <HashtagEditor reel={reel} />

        {page && (
          <section>
            <h3 className="section-label mb-3">Timeline</h3>
            <ReelTimeline reel={reel} />
          </section>
        )}
      </div>
    </div>
  );
}
