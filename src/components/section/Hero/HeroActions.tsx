'use client';

/**
 * HeroArtwork
 * -----------------------------------------------------------------------
 * The signature visual of the PizzHub hero section.
 *
 * Concept: "The Reveal" — the pizza is treated like a product shot lifted
 * out of a photo studio and suspended in a warm, dark void. A soft amber
 * key light rakes across it from below-behind, a sparse field of drifting
 * flour dust and glowing embers gives the scene scale and depth, two thin
 * anamorphic light streaks cross behind it, and a faint heat-shimmer ring
 * pulses at the crust edge to suggest it just left the oven.
 *
 * Every layer moves on its own clock (different duration + delay) so
 * nothing reads as a single looping animation. Only `transform`, `opacity`
 * and `filter` are animated — all GPU-friendly — and every animation is
 * disabled when the user has requested reduced motion.
 *
 * Drop this file in next to Hero.tsx and append the rules in
 * `Hero.module.css.additions.css` to your existing Hero.module.css.
 * -----------------------------------------------------------------------
 */

import Image, { type StaticImageData } from 'next/image';
import { useEffect, useMemo, useRef } from 'react';
import styles from './Hero.module.css';

interface HeroArtworkProps {
  /** The cutout product shot of the pizza (transparent background PNG/WebP recommended). */
  src: string | StaticImageData;
  /** Accessible description. Keep it short — this is decorative-but-real content. */
  alt?: string;
  /** Optional extra className for layout positioning from the parent Hero. */
  className?: string;
}

type ParticleKind = 'dust' | 'ember';

interface Particle {
  id: number;
  kind: ParticleKind;
  /** Position as a percentage of the artwork stage, so it scales with the container. */
  left: number;
  top: number;
  size: number;
  /** How far the particle drifts on each axis, in px. */
  driftX: number;
  driftY: number;
  duration: number;
  delay: number;
  opacity: number;
  blur: number;
  /** Depth layer — controls parallax weight and stacking order. */
  depth: 'back' | 'mid' | 'front';
}

const PARTICLE_COUNT = 16;

/**
 * Tiny deterministic PRNG (mulberry32). We seed it with a fixed constant so
 * the particle field is identical on the server and the client — using
 * Math.random() directly here would cause a hydration mismatch.
 */
function createSeededRandom(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateParticles(): Particle[] {
  const random = createSeededRandom(1337);
  const depths: Particle['depth'][] = ['back', 'mid', 'front'];

  return Array.from({ length: PARTICLE_COUNT }, (_, id) => {
    const depth = depths[Math.floor(random() * depths.length)];
    const kind: ParticleKind = random() > 0.72 ? 'ember' : 'dust';
    const depthScale = depth === 'front' ? 1 : depth === 'mid' ? 0.7 : 0.45;

    return {
      id,
      kind,
      left: 8 + random() * 84,
      top: 10 + random() * 80,
      size: (kind === 'ember' ? 3 + random() * 4 : 2 + random() * 3) * depthScale,
      driftX: (random() - 0.5) * 60,
      driftY: -(20 + random() * 50),
      duration: 9 + random() * 10,
      delay: -(random() * 14),
      opacity: (kind === 'ember' ? 0.55 : 0.35) + random() * 0.25,
      blur: depth === 'back' ? 1.5 : depth === 'mid' ? 0.5 : 0,
      depth,
    };
  });
}

function usePrefersReducedMotion() {
  const ref = useRef(false);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    ref.current = query.matches;
  }, []);

  return ref;
}

export default function HeroArtwork({
  src,
  alt = 'A wood-fired PizzHub pizza, suspended in warm cinematic light.',
  className,
}: HeroArtworkProps) {
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const prefersReducedMotion = usePrefersReducedMotion();
  const particles = useMemo(generateParticles, []);

  // Pointer-driven parallax. We write directly to CSS custom properties via
  // the ref rather than React state, so the mouse-move handler never
  // triggers a re-render — the browser just repaints the transform.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || prefersReducedMotion.current) return;

    const handlePointerMove = (event: PointerEvent) => {
      const bounds = stage.getBoundingClientRect();
      const relativeX = (event.clientX - bounds.left) / bounds.width - 0.5;
      const relativeY = (event.clientY - bounds.top) / bounds.height - 0.5;

      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        stage.style.setProperty('--pointer-x', relativeX.toFixed(3));
        stage.style.setProperty('--pointer-y', relativeY.toFixed(3));
      });
    };

    const handlePointerLeave = () => {
      stage.style.setProperty('--pointer-x', '0');
      stage.style.setProperty('--pointer-y', '0');
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    stage.addEventListener('pointerleave', handlePointerLeave);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      stage.removeEventListener('pointerleave', handlePointerLeave);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [prefersReducedMotion]);

  return (
    <div ref={stageRef} className={`${styles.artworkStage} ${className ?? ''}`}>
      {/* Layer 1 — ambient glow, sits behind everything, breathes slowly */}
      <div className={styles.ambientGlow} aria-hidden="true" />

      {/* Layer 2 — two thin anamorphic light streaks crossing behind the pizza */}
      <div className={styles.lightStreak} data-variant="a" aria-hidden="true" />
      <div className={styles.lightStreak} data-variant="b" aria-hidden="true" />

      {/* Layer 3 — back-depth dust/embers, drift slowest, most blurred */}
      <div className={styles.particleField} data-depth="back" aria-hidden="true">
        {particles
          .filter((p) => p.depth === 'back')
          .map((p) => (
            <ParticleDot key={p.id} particle={p} />
          ))}
      </div>

      {/* Layer 4 — the pizza itself, floating with a slow rotation and rim light */}
      <div className={styles.pizzaWrapper}>
        <div className={styles.pizzaRimLight} aria-hidden="true" />
        <div className={styles.pizzaFloat}>
          <Image
            src={src}
            alt={alt}
            width={720}
            height={720}
            priority
            className={styles.pizzaImage}
            sizes="(max-width: 768px) 80vw, 640px"
          />
          <div className={styles.heatShimmer} aria-hidden="true" />
        </div>
        <div className={styles.contactShadow} aria-hidden="true" />
      </div>

      {/* Layer 5 — mid-depth dust/embers */}
      <div className={styles.particleField} data-depth="mid" aria-hidden="true">
        {particles
          .filter((p) => p.depth === 'mid')
          .map((p) => (
            <ParticleDot key={p.id} particle={p} />
          ))}
      </div>

      {/* Layer 6 — steam, very subtle, rises from the crust edge */}
      <div className={styles.steamField} aria-hidden="true">
        <span className={styles.steamWisp} data-variant="a" />
        <span className={styles.steamWisp} data-variant="b" />
      </div>

      {/* Layer 7 — front-depth particles, closest to the viewer, sharpest */}
      <div className={styles.particleField} data-depth="front" aria-hidden="true">
        {particles
          .filter((p) => p.depth === 'front')
          .map((p) => (
            <ParticleDot key={p.id} particle={p} />
          ))}
      </div>

      {/* Layer 8 — two or three tiny sparkle highlights on the cheese */}
      <span className={styles.sparkle} data-variant="a" aria-hidden="true" />
      <span className={styles.sparkle} data-variant="b" aria-hidden="true" />
      <span className={styles.sparkle} data-variant="c" aria-hidden="true" />
    </div>
  );
}

function ParticleDot({ particle }: { particle: Particle }) {
  const style = {
    '--left': `${particle.left}%`,
    '--top': `${particle.top}%`,
    '--size': `${particle.size}px`,
    '--drift-x': `${particle.driftX}px`,
    '--drift-y': `${particle.driftY}px`,
    '--duration': `${particle.duration}s`,
    '--delay': `${particle.delay}s`,
    '--opacity': particle.opacity,
    '--blur': `${particle.blur}px`,
  } as React.CSSProperties;

  return (
    <span
      className={styles.particle}
      data-kind={particle.kind}
      style={style}
    />
  );
}
