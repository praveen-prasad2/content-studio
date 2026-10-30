"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Bookmark, Eye, Heart, Sparkles } from "lucide-react";
import type { Reel } from "@/types";
import { useWorkspaceStore } from "@/store/workspace-store";
import { PageContainer } from "@/components/layout/AppShell";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { ReelThumb } from "@/components/shared/ReelThumb";
import { engagementRate, formatCompact, hashUnit } from "@/lib/utils";

const DAY = 86_400_000;
const AXIS = { fill: "rgb(150,150,168)", fontSize: 11 };
const TOOLTIP = {
  contentStyle: { background: "#16161f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 },
  labelStyle: { color: "#f0f0f5" },
  itemStyle: { color: "#f0f0f5" },
};

/** Views accumulate with exponential decay after publishing: most arrive in the first ~2 days. */
function cumulativeViews(reel: Reel, at: number, now: number) {
  if (!reel.publishedAt || !reel.stats) return 0;
  const pub = new Date(reel.publishedAt).getTime();
  if (at <= pub) return 0;
  const shape = (t: number) => 1 - Math.exp(-(t - pub) / (1.6 * DAY));
  return (reel.stats.views * shape(Math.min(at, now))) / Math.max(shape(now), 0.0001);
}

function Card({ title, children, className = "" }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`glass-card p-5 ${className}`}>
      <h2 className="section-label mb-4">{title}</h2>
      {children}
    </section>
  );
}

export default function AnalyticsPage() {
  const reels = useWorkspaceStore((s) => s.reels);
  const published = reels.filter((r) => r.stats && r.publishedAt);

  const totals = published.reduce(
    (acc, r) => ({
      views: acc.views + (r.stats?.views ?? 0),
      likes: acc.likes + (r.stats?.likes ?? 0),
      saves: acc.saves + (r.stats?.saves ?? 0),
    }),
    { views: 0, likes: 0, saves: 0 },
  );
  const avgEngagement = published.length ? published.reduce((s, r) => s + engagementRate(r.stats), 0) / published.length : 0;

  // Rounded to the minute so the chart doesn't rebuild on every tick.
  const nowMinute = Math.floor(Date.now() / 60_000) * 60_000;
  const viewsSeries = useMemo(() => {
    const end = new Date(nowMinute);
    end.setHours(23, 59, 59, 999);
    return Array.from({ length: 14 }, (_, i) => {
      const dayEnd = end.getTime() - (13 - i) * DAY;
      const dayStart = dayEnd - DAY;
      const fresh = published.reduce(
        (sum, r) => sum + cumulativeViews(r, dayEnd, nowMinute) - cumulativeViews(r, dayStart, nowMinute),
        0,
      );
      // Long-tail views from older catalogue reels.
      const baseline = 5200 + hashUnit(`day-${i}`) * 3600;
      return {
        day: new Date(dayEnd).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        views: Math.round(fresh + baseline),
      };
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nowMinute, published.length, Math.round(totals.views / 500)]);

  const engagementData = [...published]
    .sort((a, b) => a.number - b.number)
    .map((r) => ({ name: `#${r.number}`, engagement: Number(engagementRate(r.stats).toFixed(1)), title: r.title }));

  const top = [...published].sort((a, b) => (b.stats?.views ?? 0) - (a.stats?.views ?? 0)).slice(0, 5);
  const bestEngagement = Math.max(...engagementData.map((d) => d.engagement), 0);

  const kpis = [
    { label: "Total views", value: totals.views, icon: Eye, format: formatCompact },
    { label: "Total likes", value: totals.likes, icon: Heart, format: formatCompact },
    { label: "Total saves", value: totals.saves, icon: Bookmark, format: formatCompact },
    { label: "Avg engagement", value: avgEngagement, icon: Sparkles, format: (n: number) => `${n.toFixed(1)}%` },
  ];

  return (
    <PageContainer className="space-y-6">
      <div>
        <p className="section-label">Performance</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="mt-1 text-sm text-muted">Live numbers from {published.length} published reels, updated by Dev in real time.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map(({ label, value, icon: Icon, format }) => (
          <div key={label} className="glass-card p-4">
            <div className="flex items-center gap-1.5 text-xs text-muted">
              <Icon className="h-3.5 w-3.5" /> {label}
            </div>
            <AnimatedNumber value={value} format={format} className="mt-1 block text-2xl font-semibold tabular-nums tracking-tight" />
          </div>
        ))}
      </div>

      <Card title="Views over time · last 14 days">
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={viewsSeries} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#E1306C" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#E1306C" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="day" tick={AXIS} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
              <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={formatCompact} width={48} />
              <Tooltip {...TOOLTIP} formatter={(v: number) => [v.toLocaleString(), "Views"]} cursor={{ stroke: "rgba(255,255,255,0.15)" }} />
              <Area type="monotone" dataKey="views" stroke="#E1306C" strokeWidth={2} fill="url(#viewsFill)" animationDuration={1200} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <Card title="Engagement rate by reel">
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={engagementData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" tick={AXIS} tickLine={false} axisLine={false} />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v: number) => `${v}%`} />
                <Tooltip
                  {...TOOLTIP}
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  formatter={(v: number) => [`${v}%`, "Engagement"]}
                  labelFormatter={(label: string, payload) => {
                    const title = payload?.[0]?.payload?.title as string | undefined;
                    return title ? `${label} · ${title}` : label;
                  }}
                />
                <Bar dataKey="engagement" radius={[6, 6, 2, 2]} maxBarSize={40}>
                  {engagementData.map((d) => (
                    <Cell key={d.name} fill={d.engagement === bestEngagement ? "#06B6D4" : "rgba(6,182,212,0.4)"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Top performing reels">
          <ol className="space-y-2">
            {top.map((r, i) => (
              <li key={r.id}>
                <Link href={`/reels/${r.id}`} className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-white/[0.04]">
                  <span className="w-4 text-center text-xs font-semibold tabular-nums text-muted">{i + 1}</span>
                  <span className="relative aspect-[9/16] w-9 shrink-0 overflow-hidden rounded-md border border-white/10">
                    <ReelThumb src={r.thumbnail} seed={r.id} rate={0} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{r.title}</span>
                    <span className="text-xs text-muted">{engagementRate(r.stats).toFixed(1)}% engagement</span>
                  </span>
                  <span className="text-right">
                    <AnimatedNumber value={r.stats?.views ?? 0} format={formatCompact} className="block text-sm font-semibold tabular-nums" />
                    <span className="text-[11px] text-muted">views</span>
                  </span>
                </Link>
              </li>
            ))}
            {!top.length && <li className="py-6 text-center text-sm text-muted">Nothing published yet.</li>}
          </ol>
        </Card>
      </div>
    </PageContainer>
  );
}
