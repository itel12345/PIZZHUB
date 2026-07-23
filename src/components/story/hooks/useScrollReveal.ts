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

  useEffect(() => {
    if (prefersReducedMotion) return;

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.2,
        rootMargin: "0px 0px -10% 0px",
        ...options,
      }
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [options, prefersReducedMotion]);

  return { ref, isVisible };
}