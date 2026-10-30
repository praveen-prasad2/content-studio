import type { ComponentType } from "react";
import type { WorkerRole } from "@/types";
import type { VisualProps } from "./shared";
import { ResearchVisual } from "./ResearchVisual";
import { StrategyVisual } from "./StrategyVisual";
import { CopywritingVisual } from "./CopywritingVisual";
import { EditingVisual } from "./EditingVisual";
import { PublishingVisual } from "./PublishingVisual";
import { AnalysingVisual } from "./AnalysingVisual";
import { CustomVisual } from "./CustomVisual";

export const WORKER_VISUALS: Record<WorkerRole, ComponentType<VisualProps>> = {
  research: ResearchVisual,
  strategy: StrategyVisual,
  copywriting: CopywritingVisual,
  editing: EditingVisual,
  publishing: PublishingVisual,
  analysing: AnalysingVisual,
  custom: CustomVisual,
};

export type { VisualProps, ReelDragData } from "./shared";
