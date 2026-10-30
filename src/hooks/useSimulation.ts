"use client";

import { useEffect } from "react";
import { useWorkspaceStore } from "@/store/workspace-store";

const TICK_MS = 800;

/**
 * Drives the "live" workspace: progress ticks every 800ms (scaled by the speed control)
 * and a random small event every 10–20s. Paused when the simulation switch is off.
 */
export function useSimulation() {
  const enabled = useWorkspaceStore((s) => s.simulation.enabled);
  const speed = useWorkspaceStore((s) => s.simulation.speed);

  useEffect(() => {
    if (!enabled) return;
    const { tick } = useWorkspaceStore.getState();
    const interval = window.setInterval(() => tick(speed), TICK_MS);
    return () => window.clearInterval(interval);
  }, [enabled, speed]);

  useEffect(() => {
    if (!enabled) return;
    let timeout: number;
    const schedule = () => {
      const delay = (10_000 + Math.random() * 10_000) / speed;
      timeout = window.setTimeout(() => {
        useWorkspaceStore.getState().randomEvent();
        schedule();
      }, delay);
    };
    schedule();
    return () => window.clearTimeout(timeout);
  }, [enabled, speed]);
}
