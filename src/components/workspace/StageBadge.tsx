import type { WorkerRole } from "@/types";
import { ROLE_TEMPLATES } from "@/data/workers";
import { withAlpha } from "@/lib/utils";

export function StageBadge({ stage, label }: { stage: WorkerRole; label?: string }) {
  const t = ROLE_TEMPLATES[stage];
  return (
    <span
      className="inline-flex items-center rounded-full px-1.5 py-[1px] text-[10px] font-semibold"
      style={{ background: withAlpha(t.accentColor, 0.15), color: t.accentColor }}
    >
      {label ?? t.title}
    </span>
  );
}
