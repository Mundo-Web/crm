import React, { useEffect, useRef, useState } from 'react';

// ---------- math helpers ----------

export const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));

export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);

export const easeOutBack = (t) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

export const easeInOutQuad = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/**
 * Local eased progress for an element entering at `at` over `dur`,
 * given the global loop progress `p` (0..1).
 */
export const reveal = (
  p,
  at,
  dur,
  ease = easeOutCubic,
) => ease(clamp((p - at) / dur));

// ---------- loop driver ----------

/**
 * Returns a value that ramps 0 -> 1 over `durationMs` and loops forever.
 */
export function useLoopProgress(durationMs) {
  const [progress, setProgress] = useState(0);
  const startRef = useRef(null);
  const rafRef = useRef(null);

  useEffect(() => {
    const tick = (ts) => {
      if (startRef.current === null) startRef.current = ts;
      const elapsed = (ts - startRef.current) % durationMs;
      setProgress(elapsed / durationMs);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      startRef.current = null;
    };
  }, [durationMs]);

  return progress;
}

// ---------- primitives ----------

const toneClass = {
  base: 'bg-white/[0.06]',
  soft: 'bg-white/[0.04]',
  softer: 'bg-white/[0.025]',
  accent: 'bg-emerald-400/15',
};

const SkeletonBase = ({ className = '', tone = 'base', rounded = 'rounded-md', style }) => (
  <div
    className={`relative overflow-hidden ${toneClass[tone] || toneClass.base} ${rounded} ${className} shimmer`}
    style={style}
  />
);

export const SkBlock = (props) => <SkeletonBase {...props} />;

export const SkBar = ({
  className = '',
  tone = 'base',
  style,
}) => <SkeletonBase className={className} tone={tone} rounded="rounded-full" style={style} />;

export const SkCircle = ({
  className = '',
  tone = 'base',
  style,
}) => (
  <SkeletonBase
    className={className}
    tone={tone}
    rounded="rounded-full"
    style={{ ...style, borderRadius: '9999px' }}
  />
);

// ---------- reveal wrapper ----------

/**
 * Wraps children and animates them in based on loop progress `p`.
 * - pop: scale + fade (easeOutBack)
 * - rise: translateY up + fade
 * - draw: scaleY from 0 + fade (for thin lines)
 * - drop: translateY down + fade (for cards falling into kanban)
 */
export const Reveal = ({
  at,
  dur = 0.12,
  p,
  variant = 'pop',
  distance = 16,
  delay = 0,
  className = '',
  style,
  children,
}) => {
  const start = at + delay;
  const ease = variant === 'pop' ? easeOutBack : easeOutCubic;
  const t = reveal(p, start, dur, ease);
  const tFade = reveal(p, start, dur, easeOutCubic);

  let transform = '';
  let opacity = tFade;
  let transformOrigin = 'center';

  if (t <= 0) {
    opacity = 0;
  }

  switch (variant) {
    case 'pop': {
      const s = 0.82 + 0.18 * clamp(t);
      transform = `scale(${s})`;
      break;
    }
    case 'rise': {
      const y = distance * (1 - clamp(t));
      transform = `translateY(${y}px)`;
      break;
    }
    case 'draw': {
      const sy = clamp(t);
      transform = `scaleY(${sy})`;
      transformOrigin = 'top center';
      opacity = tFade;
      break;
    }
    case 'drop': {
      const y = -distance * (1 - clamp(t));
      transform = `translateY(${y}px)`;
      break;
    }
  }

  return (
    <div
      className={className}
      style={{
        ...style,
        opacity,
        transform,
        transformOrigin,
        willChange: 'transform, opacity',
      }}
    >
      {children}
    </div>
  );
};

// global fade for the whole scene (start + end of loop)
export const sceneOpacity = (p) => {
  const startIn = clamp((p - 0.0) / 0.04);
  const endOut = 1 - clamp((p - 0.93) / 0.07);
  return startIn * endOut;
};
