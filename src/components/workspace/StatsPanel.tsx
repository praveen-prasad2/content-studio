"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip as ChartTooltip, XAxis } from "recharts";
import { Eye, Film, Rocket, Sparkles } from "lucide-react";
import { useWorkspaceStore } from "@/store/workspace-store";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { engagementRate, formatCompact, isToday } from "@/lib/utils";

export function StatsPanel() {
  const reels = useWorkspaceStore((s) => s.reels);
  const workers = useWorkspaceStore((s) => s.workers);

  const inProgress = reels.filter((r) => r.workerId && !r.completedAt).length;
  const publishedToday = reels.filter((r) => isToday(r.publishedAt)).length;
  const published = reels.filter((r) => r.stats);
  const totalViews = published.reduce((sum, r) => sum + (r.stats?.views ?? 0), 0);
  const avgEngagement = published.length
    ? published.reduce((sum, r) => sum + engagementRate(r.stats), 0) / published.length
    : 0;

  const tiles = [
    { label: "In progress", value: inProgress, icon: Film, format: (n: number) => Math.round(n).toString() },
    { label: "Published today", value: publishedToday, icon: Rocket, format: (n: number) => Math.round(n).toString() },
    { label: "Total views", value: totalViews, icon: Eye, format: formatCompact },
    { label: "Avg engagement", value: avgEngagement, icon: Sparkles, format: (n: number) => `${n.toFixed(1)}%` },
  ];

  const chartData = workers.map((w) => ({ id: w.id, name: w.name, completed: w.completedCount, color: w.accentColor }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {tiles.map(({ label, value, icon: Icon, format }) => (
          <div key={label} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
            <div className="flex items-center gap-1.5 text-[11px] text-muted">
              <Icon className="h-3.5 w-3.5" />
              {label}
            </div>
            <AnimatedNumber value={value} format={format} className="mt-1 block text-xl font-semibold tabular-nums tracking-tight" />
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
        <h3 className="section-label mb-2">Reels completed per worker</h3>
        <div className="h-[150px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fill: "rgb(150,150,168)", fontSize: 10 }} interval={0} />
              <ChartTooltip
                cursor={{ fill: "rgba(255,255,255,0.04)" }}
                contentStyle={{ background: "#16161f", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: "#f0f0f5" }}
                itemStyle={{ color: "#f0f0f5" }}
              />
              <Bar dataKey="completed" name="Completed" radius={[6, 6, 2, 2]} maxBarSize={28}>
                {chartData.map((d) => (
                  <Cell key={d.id} fill={d.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
