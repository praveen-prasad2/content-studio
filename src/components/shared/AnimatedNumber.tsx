"use client";

import { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "framer-motion";

type AnimatedNumberProps = {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
};

/** Counts up/down to `value`, writing straight to the DOM to avoid re-renders per frame. */
export function AnimatedNumber({ value, format = (n) => Math.round(n).toLocaleString(), duration = 0.8, className }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const current = useRef(value);
  const reduce = useReducedMotion();
  const formatRef = useRef(format);
  formatRef.current = format;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduce) {
      current.current = value;
      el.textContent = formatRef.current(value);
      return;
    }
    const controls = animate(current.current, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => {
        current.current = v;
        el.textContent = formatRef.current(v);
      },
    });
    return () => controls.stop();
  }, [value, duration, reduce]);

  return (
    <span ref={ref} className={className}>
      {format(current.current)}
    </span>
  );
}
