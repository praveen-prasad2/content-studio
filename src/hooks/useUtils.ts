"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

/** True after the first client render (state is then hydrated from localStorage). */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/** Current time that refreshes on an interval, for relative timestamps. */
export function useNow(intervalMs = 15_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs);
    return () => window.clearInterval(id);
  }, [intervalMs]);
  return now;
}

/**
 * Types `text` out up to `target` characters, one character at a time, so progress jumps
 * from the simulation still look like smooth typing.
 */
export function useTypewriter(text: string, target: number, charMs = 32) {
  const reduce = useReducedMotion();
  const [count, setCount] = useState(Math.min(target, text.length));
  const goal = Math.max(0, Math.min(Math.round(target), text.length));

  useEffect(() => {
    if (reduce) {
      setCount(goal);
      return;
    }
    if (count === goal) return;
    const id = window.setTimeout(() => setCount((c) => (c < goal ? c + 1 : goal)), charMs);
    return () => window.clearTimeout(id);
  }, [count, goal, charMs, reduce]);

  // Reset when the text itself changes (new reel).
  const prevText = useRef(text);
  useEffect(() => {
    if (prevText.current !== text) {
      prevText.current = text;
      setCount(0);
    }
  }, [text]);

  return text.slice(0, count);
}

/** Cycles 0..count-1 every `periodMs / count` ms. Stops when reduced motion is on. */
export function useLoopIndex(count: number, periodMs: number, active = true) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!active || reduce || count <= 1) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), periodMs / count);
    return () => window.clearInterval(id);
  }, [count, periodMs, active, reduce]);
  return index;
}

/** Fires `callback` whenever `value` crosses from false to true. */
export function useRisingEdge(value: boolean, callback: () => void) {
  const prev = useRef(value);
  const cb = useRef(callback);
  cb.current = callback;
  useEffect(() => {
    if (value && !prev.current) cb.current();
    prev.current = value;
  }, [value]);
}

/** Subscribes to a CSS media query. Returns false during SSR / before mount. */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(query);
    const update = () => setMatches(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, [query]);
  return matches;
}
