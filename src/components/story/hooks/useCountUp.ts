"use client";

import { useEffect, useRef, useState } from "react";

interface UseCountUpOptions {
  /** The final value to count up to. */
  end: number;
  /** Animation duration in milliseconds. */
  duration?: number;
  /** Set true once to begin the animation. Ignored after the first run. */
  start: boolean;
  /**
   * Decimal places to preserve during the animation and in the final
   * value. Defaults to 0 (whole numbers) — existing whole-number
   * stats are unaffected by this addition.
   */
  decimals?: number;
}

/**
 * useCountUp
 *
 * Reusable, dependency-free count-up animation built on
 * requestAnimationFrame with an ease-out cubic curve for a smooth,
 * decelerating finish (no linear "ticking" feel).
 *
 * - Runs exactly once: a ref guards against re-triggering if `start`
 *   flips true again or the component re-renders.
 * - Respects prefers-reduced-motion: jumps straight to the final
 *   value with no animation.
 * - Pure RAF loop (no setInterval), so it stays in sync with the
 *   browser's paint cycle for a smooth 60fps result.
 */
export function useCountUp({
  end,
  duration = 1800,
  start,
  decimals = 0,
}: UseCountUpOptions) {
  const [value, setValue] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!start || hasAnimated.current) return;
    hasAnimated.current = true;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      setValue(end);
      return;
    }

    let rafId: number;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic: fast start, gentle settle — matches the
      // "buttery smooth, Apple-keynote" feel requested.
      const eased = 1 - Math.pow(1 - progress, 3);
      const raw = eased * end;
      const factor = 10 ** decimals;
      setValue(Math.round(raw * factor) / factor);

      if (progress < 1) {
        rafId = requestAnimationFrame(tick);
      }
    }

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [start, end, duration, decimals]);

  return value;
}
