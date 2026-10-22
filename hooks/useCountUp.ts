"use client";

import { useEffect, useRef, useState } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** Counts from 0 to `target` (ease-out) once `active` turns true. Jumps straight to the target if the user prefers reduced motion. */
export function useCountUp(target: number, active: boolean, duration = 1200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;

    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }

    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(target * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, target, duration]);

  return value;
}

interface FormattedOptions {
  /** ms, default 1200 */
  duration?: number;
  /** ms before the count starts, default 0 */
  delay?: number;
  /** e.g. "~" */
  prefix?: string;
  /** e.g. "s" */
  suffix?: string;
  /** decimal places, default 0 */
  decimals?: number;
}

/**
 * Same count-up, returned as display text with an optional prefix/suffix ("~11s"), a start delay
 * for staggering, and a run-once guard. Reduced motion shows the final value immediately.
 */
export function useCountUpText(end: number, trigger: boolean, options: FormattedOptions = {}): string {
  const { duration = 1200, delay = 0, prefix = "", suffix = "", decimals = 0 } = options;
  const [value, setValue] = useState(0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (!trigger || hasRun.current) return;
    hasRun.current = true;

    if (prefersReducedMotion()) {
      setValue(end);
      return;
    }

    let raf = 0;
    const start = performance.now() + delay;

    const tick = (now: number) => {
      const elapsed = now - start;
      if (elapsed < 0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const progress = Math.min(elapsed / duration, 1);
      setValue(progress < 1 ? (1 - Math.pow(1 - progress, 3)) * end : end);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    // No cleanup on purpose: hasRun already guards re-runs, and StrictMode's extra effect pass must not cancel the count.
  }, [trigger, end, duration, delay]);

  const text = decimals > 0 ? value.toFixed(decimals) : Math.round(value).toString();
  return `${prefix}${text}${suffix}`;
}
