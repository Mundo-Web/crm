import React, { useEffect, useRef, useState } from 'react';
import AuthRest from "../../actions/AuthRest";
import { toast } from "sonner";
import { Session } from "sode-extend-react";

const authRest = new AuthRest();

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

const LOOP_MS = 10000;

// ---------- overlay timing ----------

const OVERLAY_ENTER = 0.46;
const OVERLAY_SETTLED = 0.56;
const TABLE_START = 0.58;
const TABLE_DONE = 0.66;
const KANBAN_START = 0.72;
const KANBAN_DONE = 0.90;

// overlay slide-in (0 -> 1)
function overlaySlideIn(p) {
  const raw = clamp((p - OVERLAY_ENTER) / (OVERLAY_SETTLED - OVERLAY_ENTER));
  return 1 - Math.pow(1 - raw, 3);
}

// overlay slide-out at end of loop
function overlaySlideOut(p) {
  return 1 - clamp((p - 0.93) / 0.07);
}

function overlayOpacity(p) {
  return overlaySlideIn(p) * overlaySlideOut(p);
}

// table visibility: 0 -> 1 during TABLE phase, fades to ~0.15 when kanban starts
function tableAlpha(p) {
  const appear = clamp((p - TABLE_START) / (TABLE_DONE - TABLE_START));
  const dim = clamp((p - KANBAN_START) / 0.04);
  return appear * (1 - dim * 0.9);
}

// kanban visibility: 0 -> 1 during KANBAN phase
function kanbanAlpha(p) {
  return clamp((p - KANBAN_START) / (KANBAN_DONE - KANBAN_START));
}

// ==============================================================
//  Dashboard components (compressed timings: all done by ~0.44)
// ==============================================================

const navItems = Array.from({ length: 7 });

function DashboardSidebar({ p }) {
  const base = 0.03;
  return (
    <aside className="h-full w-[240px] shrink-0 border-r border-white/[0.04] bg-white/[0.012] p-5 flex flex-col gap-6">
      <Reveal p={p} at={base} variant="pop" dur={0.07}>
        <div className="flex items-center gap-3">
          <SkBlock className="h-9 w-9 rounded-lg" tone="accent" />
          <SkBar className="h-3 w-24" />
        </div>
      </Reveal>

      <nav className="flex flex-col gap-1.5 mt-2">
        {navItems.map((_, i) => {
          const at = base + 0.012 + i * 0.018;
          const active = i === 1;
          return (
            <Reveal key={i} p={p} at={at} variant="rise" dur={0.08} distance={10}>
              <div className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${active ? 'bg-emerald-400/[0.06]' : ''}`}>
                <SkBlock className={`h-4 w-4 rounded-[5px] ${active ? '!bg-emerald-400/20' : ''}`} tone={active ? 'accent' : 'soft'} />
                <SkBar className={`h-2.5 ${active ? 'w-28' : 'w-20'}`} tone={active ? 'base' : 'soft'} />
              </div>
            </Reveal>
          );
        })}
      </nav>

      <div className="mt-auto">
        <Reveal p={p} at={base + 0.16} variant="rise" dur={0.09} distance={12}>
          <div className="flex items-center gap-3 rounded-xl border border-white/[0.04] bg-white/[0.015] p-3">
            <SkCircle className="h-9 w-9" tone="soft" />
            <div className="flex flex-col gap-2">
              <SkBar className="h-2.5 w-20" />
              <SkBar className="h-2 w-14" tone="soft" />
            </div>
          </div>
        </Reveal>
      </div>
    </aside>
  );
}

function DashboardTopbar({ p }) {
  const base = 0.04;
  return (
    <header className="h-16 shrink-0 border-b border-white/[0.04] bg-white/[0.012] px-6 flex items-center gap-4">
      <Reveal p={p} at={base} variant="pop" dur={0.07}>
        <div className="flex items-center gap-2.5">
          <SkBar className="h-3 w-16" tone="soft" />
          <SkBlock className="h-1 w-1 rounded-full" tone="softer" />
          <SkBar className="h-3 w-20" />
        </div>
      </Reveal>
      <div className="flex-1" />
      <Reveal p={p} at={base + 0.025} variant="pop" dur={0.07}>
        <div className="flex items-center gap-2.5 rounded-lg border border-white/[0.04] bg-white/[0.02] px-4 py-2.5">
          <SkCircle className="h-3.5 w-3.5" tone="soft" />
          <SkBar className="h-2.5 w-40" tone="soft" />
        </div>
      </Reveal>
      {[0, 1, 2].map((i) => (
        <Reveal key={i} p={p} at={base + 0.04 + i * 0.018} variant="pop" dur={0.06}>
          <SkBlock className="h-9 w-9 rounded-lg" tone="soft" />
        </Reveal>
      ))}
      <Reveal p={p} at={base + 0.1} variant="pop" dur={0.07}>
        <SkCircle className="h-9 w-9" tone="base" />
      </Reveal>
    </header>
  );
}

const stats = [{ accent: true }, {}, {}, {}];

function DashboardStatCards({ p }) {
  const base = 0.16;
  return (
    <div className="grid grid-cols-4 gap-4">
      {stats.map((s, i) => (
        <Reveal key={i} p={p} at={base + i * 0.028} variant="rise" dur={0.09} distance={14}>
          <div className={`rounded-xl border ${s.accent ? 'border-emerald-400/15' : 'border-white/[0.05]'} bg-white/[0.015] p-4 flex flex-col gap-3`}>
            <div className="flex items-center justify-between">
              <SkBar className="h-2.5 w-16" tone="soft" />
              <SkBlock className={`h-7 w-7 rounded-lg ${s.accent ? '!bg-emerald-400/15' : ''}`} tone={s.accent ? 'accent' : 'soft'} />
            </div>
            <SkBar className="h-5 w-20" />
            <div className="flex items-center gap-2 mt-1">
              <SkBlock className={`h-4 w-12 rounded-full ${s.accent ? '!bg-emerald-400/15' : ''}`} tone={s.accent ? 'accent' : 'soft'} />
              <SkBar className="h-2 w-10" tone="softer" />
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  );
}

function DashboardChart({ p }) {
  const base = 0.28;
  const bars = [40, 62, 48, 78, 55, 88, 70, 95, 68, 82, 58, 90];
  return (
    <Reveal p={p} at={base} variant="rise" dur={0.1} distance={16}>
      <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-5 flex flex-col gap-4 h-full">
        <div className="flex items-center justify-between">
          <SkBar className="h-3 w-28" />
          <div className="flex gap-2">
            <SkBlock className="h-6 w-14 rounded-full" tone="soft" />
            <SkBlock className="h-6 w-14 rounded-full" tone="softer" />
          </div>
        </div>
        <div className="flex-1 flex items-end gap-2.5 px-1">
          {bars.map((h, i) => {
            const at = base + 0.05 + i * 0.014;
            const t = reveal(p, at, 0.12);
            return (
              <SkBlock
                key={i}
                className={`w-full rounded-t-md ${i % 4 === 3 ? '!bg-emerald-400/12' : ''}`}
                tone={i % 4 === 3 ? 'accent' : 'soft'}
                style={{ height: `${h * t}%`, opacity: t, transformOrigin: 'bottom' }}
              />
            );
          })}
        </div>
        <div className="flex gap-2.5 px-1">
          {bars.map((_, i) => (
            <SkBar key={i} className="h-1.5 w-full" tone="softer" />
          ))}
        </div>
      </div>
    </Reveal>
  );
}

function DashboardTable({ p }) {
  const base = 0.32;
  const rows = Array.from({ length: 6 });
  return (
    <Reveal p={p} at={base} variant="rise" dur={0.1} distance={16}>
      <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-5 flex flex-col gap-4 h-full">
        <div className="flex items-center justify-between">
          <SkBar className="h-3 w-32" />
          <SkBlock className="h-7 w-20 rounded-lg" tone="soft" />
        </div>
        <Reveal p={p} at={base + 0.04} variant="draw" dur={0.08} className="flex gap-4 px-2 pb-3 border-b border-white/[0.04]">
          <SkBar className="h-2 w-14" tone="soft" />
          <SkBar className="h-2 w-18" tone="soft" />
          <SkBar className="h-2 w-12" tone="soft" />
        </Reveal>
        <div className="flex flex-col gap-3">
          {rows.map((_, i) => {
            const at = base + 0.06 + i * 0.022;
            return (
              <Reveal key={i} p={p} at={at} variant="draw" dur={0.08} className="flex items-center gap-4 px-2">
                <SkCircle className="h-7 w-7 shrink-0" tone="soft" />
                <SkBar className="h-2.5 w-24" />
                <SkBar className="h-2.5 w-20" tone="soft" />
                <SkBlock className="h-5 w-14 rounded-full" tone={i % 3 === 0 ? 'accent' : 'soft'} />
              </Reveal>
            );
          })}
        </div>
      </div>
    </Reveal>
  );
}

function DashboardWidgetRow({ p }) {
  const base = 0.38;
  const feedItems = Array.from({ length: 4 });
  return (
    <div className="grid grid-cols-3 gap-4">
      <Reveal p={p} at={base} variant="rise" dur={0.1} distance={14} className="col-span-2">
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-5 flex flex-col gap-4 h-full">
          <div className="flex items-center justify-between">
            <SkBar className="h-3 w-28" />
            <SkBlock className="h-6 w-14 rounded-full" tone="soft" />
          </div>
          <div className="flex flex-col gap-4">
            {feedItems.map((_, i) => {
              const at = base + 0.04 + i * 0.025;
              return (
                <Reveal key={i} p={p} at={at} variant="rise" dur={0.08} distance={10} className="flex items-center gap-3">
                  <SkCircle className="h-8 w-8 shrink-0" tone="soft" />
                  <div className="flex flex-col gap-2 flex-1">
                    <SkBar className="h-2.5 w-3/4" />
                    <SkBar className="h-2 w-1/2" tone="soft" />
                  </div>
                  <SkBar className="h-2 w-8" tone="softer" />
                </Reveal>
              );
            })}
          </div>
        </div>
      </Reveal>
      <Reveal p={p} at={base + 0.025} variant="rise" dur={0.1} distance={14}>
        <div className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-5 flex flex-col items-center gap-4 h-full">
          <SkBar className="h-3 w-20 self-start" />
          <div className="relative flex-1 flex items-center justify-center w-full">
            <Reveal p={p} at={base + 0.06} variant="pop" dur={0.12}>
              <div className="relative h-28 w-28 rounded-full border-8 border-white/[0.05] border-t-emerald-400/30" />
            </Reveal>
            <div className="absolute flex flex-col items-center gap-2">
              <SkBar className="h-4 w-14" />
              <SkBar className="h-2 w-16" tone="soft" />
            </div>
          </div>
          <div className="flex gap-4 w-full">
            {[0, 1].map((i) => (
              <div key={i} className="flex items-center gap-2">
                <SkBlock className="h-2.5 w-2.5 rounded-sm" tone={i === 0 ? 'accent' : 'soft'} />
                <SkBar className="h-2 w-10" tone="soft" />
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}

// ==============================================================
//  Overlay components
// ==============================================================

function OverlayTable({ p }) {
  const base = TABLE_START;
  const rows = Array.from({ length: 7 });

  return (
    <div className="h-full rounded-xl border border-white/[0.05] bg-white/[0.012] p-5 flex flex-col gap-4">
      {/* header bar */}
      <div className="flex items-center justify-between pb-1">
        <Reveal p={p} at={base} variant="pop" dur={0.06}>
          <div className="flex items-center gap-2.5">
            <SkBlock className="h-5 w-5 rounded-md" tone="accent" />
            <SkBar className="h-3 w-36" />
          </div>
        </Reveal>
        <Reveal p={p} at={base + 0.02} variant="pop" dur={0.06}>
          <div className="flex gap-2">
            <SkBlock className="h-7 w-20 rounded-lg" tone="soft" />
            <SkBlock className="h-7 w-7 rounded-lg" tone="accent" />
          </div>
        </Reveal>
      </div>

      {/* column headers */}
      <Reveal
        p={p}
        at={base + 0.04}
        variant="draw"
        dur={0.08}
        className="flex gap-6 px-2 py-3 border-b border-white/[0.05] border-t border-white/[0.03] rounded-md bg-white/[0.008]"
      >
        <div className="flex items-center gap-2 w-[34%]">
          <SkBlock className="h-3.5 w-3.5 rounded-sm" tone="soft" />
          <SkBar className="h-2.5 w-16" tone="soft" />
        </div>
        <SkBar className="h-2.5 w-20" tone="soft" />
        <SkBar className="h-2.5 w-16" tone="soft" />
        <div className="flex-1" />
        <SkBar className="h-2.5 w-12" tone="soft" />
      </Reveal>

      {/* data rows */}
      <div className="flex flex-col gap-1 flex-1 overflow-hidden">
        {rows.map((_, i) => {
          const at = base + 0.06 + i * 0.022;
          return (
            <Reveal
              key={i}
              p={p}
              at={at}
              variant="draw"
              dur={0.08}
              className={`flex items-center gap-6 px-2 py-2.5 rounded-lg ${i % 2 === 0 ? 'bg-white/[0.006]' : ''}`}
            >
              <div className="flex items-center gap-2.5 w-[34%]">
                <SkCircle className="h-8 w-8 shrink-0" tone="soft" />
                <div className="flex flex-col gap-2">
                  <SkBar className="h-2.5 w-32" />
                  <SkBar className="h-2 w-20" tone="soft" />
                </div>
              </div>
              <SkBar className="h-2.5 w-24" tone="soft" />
              <SkBlock className="h-5 w-16 rounded-full" tone={i % 3 === 0 ? 'accent' : 'soft'} />
              <div className="flex-1" />
              <SkBar className="h-2.5 w-10" tone="softer" />
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}

const kanbanColumns = [0, 1, 2, 3, 4];
const cardsPerCol = [3, 4, 2, 3, 2];

function OverlayKanban({ p }) {
  const base = KANBAN_START + 0.02;

  return (
    <div className="h-full flex flex-col gap-4">
      {/* header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <SkBlock className="h-5 w-5 rounded-md" tone="accent" />
          <SkBar className="h-3 w-36" />
        </div>
        <div className="flex gap-2">
          <SkBlock className="h-7 w-20 rounded-lg" tone="soft" />
          <SkBlock className="h-7 w-7 rounded-lg" tone="accent" />
        </div>
      </div>

      {/* columns */}
      <div className="grid grid-cols-5 gap-3 flex-1 min-h-0">
        {kanbanColumns.map((c, ci) => {
          const colAt = base + ci * 0.035;
          return (
            <Reveal key={c} p={p} at={colAt} variant="rise" dur={0.1} distance={22} className="min-h-0">
              <div className="rounded-lg border border-white/[0.05] bg-white/[0.01] p-3 flex flex-col gap-2.5 h-full">
                {/* column header */}
                <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
                  <div className="flex items-center gap-2">
                    <SkBlock
                      className={`h-2.5 w-2.5 rounded-sm ${ci === 1 ? '!bg-emerald-400/25' : ''}`}
                      tone={ci === 1 ? 'accent' : 'soft'}
                    />
                    <SkBar className="h-2.5 w-14" tone="soft" />
                    <SkBlock className="h-4 w-4 rounded-full" tone="softer" />
                  </div>
                </div>

                {/* cards dropping in */}
                <div className="flex flex-col gap-2.5">
                  {Array.from({ length: cardsPerCol[ci] }).map((_, cardI) => {
                    const cardAt = colAt + 0.04 + cardI * 0.03;
                    return (
                      <Reveal key={cardI} p={p} at={cardAt} variant="drop" dur={0.1} distance={32}>
                        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5 flex flex-col gap-2">
                          <SkBar className="h-2.5 w-full" />
                          <SkBar className="h-2 w-2/3" tone="soft" />
                          <div className="flex items-center justify-between mt-1">
                            <SkBlock
                              className={`h-4 w-10 rounded-full ${cardI % 4 === 0 ? '!bg-emerald-400/20' : ''}`}
                              tone={cardI % 4 === 0 ? 'accent' : 'soft'}
                            />
                            <SkCircle className="h-5 w-5" tone="softer" />
                          </div>
                        </div>
                      </Reveal>
                    );
                  })}
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}

// ==============================================================
//  Main Exported JoinThanks Component
// ==============================================================

const JoinThanks = ({ data = {}, setData, step, setStep }) => {
  const [failed, setFailed] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const p = useLoopProgress(LOOP_MS);

  // Check if we are in preview mode via query param
  const isPreview = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('preview') === '1' ||
    new URLSearchParams(window.location.search).get('step') === 'saving'
  );

  const clearStorage = () => {
    try {
      Session.delete('join-data');
      Session.set('join-data', {});
      localStorage.removeItem('join-data');
      sessionStorage.removeItem('join-data');
    } catch (e) {
      console.error('Error clearing storage:', e);
    }
    if (setData) setData({});
  };

  const saveData = async () => {
    if (isPreview) return; // Do not call backend in preview mode
    setFailed(false);
    try {
      const startTime = Date.now();
      const { status, message } = await authRest.init(data);
      if (!status) {
        setFailed(true);
        toast(message || 'Ocurrió un error al inicializar', { icon: <i className="mdi mdi-alert" /> });
        return;
      }

      const elapsed = Date.now() - startTime;
      const remainingDelay = Math.max(0, 3600 - elapsed);

      setTimeout(() => {
        clearStorage();
        setStep('thanks');
      }, remainingDelay);
    } catch (error) {
      setFailed(true);
      toast('Error de conexión al inicializar la cuenta', { icon: <i className="mdi mdi-alert" /> });
    }
  };

  useEffect(() => {
    if (step === 'saving') {
      saveData();
    }

    if (step === 'thanks') {
      clearStorage();
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            window.location.href = '/leads?first_time=1';
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [step]);

  const opacity = sceneOpacity(p);
  const oSlide = overlaySlideIn(p) * overlaySlideOut(p);
  const oAlpha = overlayOpacity(p);
  const tAlpha = tableAlpha(p);
  const kAlpha = kanbanAlpha(p);

  // ==============================================================
  //  SAVING ANIMATION (Full Skeleton Engine as provided)
  // ==============================================================
  if (step === 'saving') {
    return (
      <div className="relative w-full h-[540px] sm:h-[580px] rounded-2xl overflow-hidden bg-[#08080c] shadow-2xl border border-white/[0.08]">
        <style>{`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          .shimmer::after {
            content: '';
            position: absolute;
            top: 0; right: 0; bottom: 0; left: 0;
            transform: translateX(-100%);
            background-image: linear-gradient(90deg, rgba(255,255,255,0) 0, rgba(255,255,255,0.06) 20%, rgba(255,255,255,0.14) 60%, rgba(255,255,255,0));
            animation: shimmer 2s infinite;
          }
          @keyframes glow-drift {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(20px, -20px) scale(1.08); }
          }
          @keyframes glow-drift-2 {
            0%, 100% { transform: translate(0, 0) scale(1); }
            50% { transform: translate(-20px, 20px) scale(1.06); }
          }
          .glow-drift { animation: glow-drift 8s ease-in-out infinite; }
          .glow-drift-2 { animation: glow-drift-2 10s ease-in-out infinite; }
        `}</style>

        {/* ambient background glows */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="glow-drift absolute -top-40 -left-32 h-[420px] w-[420px] rounded-full bg-emerald-500/[0.05] blur-[120px]" />
          <div className="glow-drift-2 absolute top-1/3 -right-40 h-[480px] w-[480px] rounded-full bg-sky-500/[0.035] blur-[140px]" />
          <div className="glow-drift absolute -bottom-32 left-1/3 h-[380px] w-[380px] rounded-full bg-indigo-500/[0.03] blur-[130px]" />
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage:
                'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
              backgroundSize: '48px 48px',
            }}
          />
        </div>

        {/* ====== Layer 1: Dashboard skeleton ====== */}
        <div
          className="relative z-10 h-full w-full p-3 sm:p-4"
          style={{ opacity, willChange: 'opacity' }}
        >
          <div className="h-full w-full rounded-2xl border border-white/[0.05] bg-black/20 overflow-hidden flex flex-col backdrop-blur-sm">
            <div className="flex flex-1 min-h-0">
              <DashboardSidebar p={p} />
              <div className="flex-1 flex flex-col min-w-0">
                <DashboardTopbar p={p} />
                <main className="flex-1 overflow-hidden p-4 sm:p-6 flex flex-col gap-4 sm:gap-5">
                  <DashboardStatCards p={p} />
                  <div className="grid grid-cols-2 gap-4 sm:gap-5 flex-1 min-h-0">
                    <DashboardChart p={p} />
                    <DashboardTable p={p} />
                  </div>
                  <DashboardWidgetRow p={p} />
                </main>
              </div>
            </div>
          </div>
        </div>

        {/* ====== Layer 2: Overlay (table -> kanban) ====== */}
        <div
          className="absolute inset-0 z-30 flex items-center justify-center p-3 sm:p-4"
          style={{
            opacity: oAlpha,
            willChange: 'opacity, transform',
          }}
        >
          {/* dark scrim behind overlay panel */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-[3px]"
            style={{ opacity: clamp(oSlide * 1.3) }}
          />

          {/* overlay panel slides in from the right */}
          <div
            className="relative w-[95%] sm:w-[92%] h-[88%] sm:h-[82%] rounded-2xl border border-white/[0.07] bg-[#0c0c12] shadow-2xl overflow-hidden flex flex-col"
            style={{
              transform: `translateX(${(1 - oSlide) * 60}px)`,
              willChange: 'transform',
            }}
          >
            {/* overlay topbar */}
            <div className="h-12 sm:h-14 shrink-0 border-b border-white/[0.04] px-4 sm:px-5 flex items-center gap-3 sm:gap-4">
              <div
                className="flex items-center gap-2.5"
                style={{ opacity: clamp(oSlide * 1.5) }}
              >
                <SkBlock className="h-4 w-4 rounded-[5px]" tone="accent" />
                <SkBar className="h-3 w-32" />
              </div>
              <div className="flex-1" />
              <div
                className="flex items-center gap-2"
                style={{ opacity: clamp(oSlide * 1.5) }}
              >
                <SkBlock className="h-7 w-20 rounded-full" tone="soft" />
                <SkBlock className="h-7 w-20 rounded-full" tone="softer" />
              </div>
            </div>

            {/* overlay content: table first, then kanban cross-fades */}
            <div className="flex-1 relative overflow-hidden">
              {/* ---- Phase A: Table skeleton ---- */}
              <div
                className="absolute inset-0 p-4 sm:p-5 flex flex-col gap-4"
                style={{ opacity: tAlpha }}
              >
                <OverlayTable p={p} />
              </div>

              {/* ---- Phase B: Kanban ---- */}
              <div
                className="absolute inset-0 p-4 sm:p-5"
                style={{
                  opacity: kAlpha,
                  transform: `translateY(${(1 - kAlpha) * 20}px)`,
                }}
              >
                <OverlayKanban p={p} />
              </div>
            </div>
          </div>
        </div>

        {failed && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40">
            <button
              onClick={saveData}
              className="inline-flex items-center gap-2 border-2 border-[#4621E1] bg-[#4621E1] hover:bg-opacity-90 transition-colors font-semibold text-white rounded-xl py-2 px-5 text-xs shadow-lg"
            >
              <i className="mdi mdi-refresh" />
              Reintentar guardar
            </button>
          </div>
        )}
      </div>
    );
  }

  // ==============================================================
  //  FINAL THANKS STEP: Compact, clean Atalaya welcome screen
  // ==============================================================
  return (
    <div className="h-full flex items-center justify-center py-6 px-4">
      <div className="bg-white rounded-2xl max-w-sm w-full mx-auto p-6 sm:p-8 text-center shadow-lg border border-gray-100">
        <i className="mdi mdi-check mdi-36px w-14 h-14 bg-[#DBE0FF] mx-auto mb-5 rounded-2xl flex items-center justify-center text-[#4621E1] shadow-inner" />

        <h2 className="text-3xl font-bold mb-3 text-gray-900 tracking-tight">
          ¡Bienvenido a <span className="text-[#FE4611]">Atalaya</span>!
        </h2>

        <p className="leading-relaxed mb-6 text-gray-600 text-sm">
          Tu cuenta ha sido configurada exitosamente. Estás listo para comenzar a gestionar tus clientes y hacer crecer tu negocio.
        </p>

        <div className="space-y-2 mb-6">
          <a
            href="/leads?first_time=1"
            className="w-full block border-2 border-[#4621E1] bg-[#4621E1] hover:bg-opacity-90 transition-colors font-semibold text-white rounded-xl py-3 px-6 text-sm shadow-sm"
          >
            Ir al CRM
          </a>
          <p className="text-xs text-gray-500 pt-1">
            Serás redirigido automáticamente en <span className="font-bold text-[#4621E1]">{countdown}</span> segundos
          </p>
        </div>

        <p className="leading-tight text-[#4621E1] text-xs">
          <span className="font-bold">💡 Próximos pasos:</span> Importa tus contactos existentes o comienza agregando tu primer lead.
        </p>
      </div>
    </div>
  );
};

export default JoinThanks;