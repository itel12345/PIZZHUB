"use client";

import { useEffect, useRef, useState } from "react";

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options?: IntersectionObserverInit
) {
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const ref = useRef<T | null>(null);

  // initialize the state correctly instead of changing it in useEffect
  const [isVisible, setIsVisible] = useState(prefersReducedMotion);

  // Pull out primitives instead of depending on the whole `options` object,
  // so passing an inline object literal at the call site doesn't recreate
  // the observer on every render.
  const threshold = options?.threshold ?? 0;
  const rootMargin = options?.rootMargin ?? "0px 0px -10% 0px";
  const root = options?.root ?? null;

  useEffect(() => {
    if (prefersReducedMotion) return;

    const node = ref.current;
    if (!node) return;

    // Safety net: if IntersectionObserver isn't available for any reason,
    // reveal immediately rather than leaving the section permanently
    // invisible. Content should never be stuck hidden because a
    // scroll-animation API failed to load.
    if (typeof IntersectionObserver === "undefined") {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        // threshold is a ratio of the TARGET's own height, not the
        // viewport's. Any section taller than roughly 5x the visible
        // viewport (very possible for a full-height editorial section,
        // and worse on Safari where the collapsing address bar shrinks
        // the visual viewport mid-scroll) can never satisfy a ratio like
        // 0.2 — that section would stay at opacity: 0 forever. threshold:
        // 0 fires on ANY overlap regardless of the target's height, which
        // is the correct, height-agnostic behavior for a "reveal once
        // visible" pattern used across sections of very different sizes.
        threshold,
        rootMargin,
        root,
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [prefersReducedMotion, threshold, rootMargin, root]);

  return { ref, isVisible };
}