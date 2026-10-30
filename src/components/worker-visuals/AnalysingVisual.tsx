"use client";

import { useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Bookmark, Eye, Heart, MessageCircle, Send } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { formatCompact, hashUnit } from "@/lib/utils";
import { ReelSlot, VisualFrame, type VisualProps } from "./shared";

export function AnalysingVisual({ worker, reel }: VisualProps) {
  const reduce = useReducedMotion();
  const stats = reel?.stats ?? { views: 0, likes: 0, comments: 0, shares: 0, saves: 0 };
  const bucket = Math.floor((reel ? worker.progress : 0) / 20);
  const unit = hashUnit(reel?.id ?? worker.id);
  const lift = Math.round(18 + unit * 40);

  // Re-draw the chart a few times per cycle, not on every simulation tick.
  const data = useMemo(() => {
    const points = 10;
    return Array.from({ length: points }, (_, i) => {
      const t = i / (points - 1);
      const curve = Math.pow(t, 1.6) * (0.6 + bucket * 0.1);
      const noise = Math.sin((i + 1) * (3 + unit * 5)) * 0.06;
      return { i, v: Math.max(0, curve + noise) };
    });
  }, [bucket, unit]);

  const rows = [
    { icon: Eye, label: "Views", value: stats.views },
    { icon: Heart, label: "Likes", value: stats.likes },
    { icon: MessageCircle, label: "Comments", value: stats.comments },
    { icon: Send, label: "Shares", value: stats.shares },
    { icon: Bookmark, label: "Saves", value: stats.saves },
  ];

  return (
    <VisualFrame className="flex-col gap-2">
      <div className="flex gap-3">
        <ReelSlot worker={worker} reel={reel} size="sm" />
        <ul className="flex min-w-0 flex-1 flex-col justify-center gap-1">
          {rows.map(({ icon: Icon, label, value }) => (
            <li key={label} className="flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 text-muted">
                <Icon className="h-3 w-3" style={{ color: worker.accentColor }} />
                {label}
              </span>
              <AnimatedNumber value={value} format={formatCompact} className="font-semibold tabular-nums" />
            </li>
          ))}
        </ul>
      </div>

      <div className="relative h-[44px] rounded-lg border border-white/[0.08] bg-white/[0.02] px-1">
        {reel ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 6, bottom: 6, left: 0, right: 0 }}>
              <YAxis hide domain={[0, 1.2]} />
              <Line
                type="monotone"
                dataKey="v"
                stroke={worker.accentColor}
                strokeWidth={2}
                dot={false}
                isAnimationActive={!reduce}
                animationDuration={1200}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full items-center justify-center text-[10px] text-muted">Waiting for a published reel</div>
        )}
        <AnimatePresence>
          {reel && worker.progress > 40 && (
            <motion.span
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute right-1.5 top-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300"
            >
              +{lift}% vs average
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </VisualFrame>
  );
}
