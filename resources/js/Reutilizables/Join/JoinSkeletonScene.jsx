import React from 'react';
import {
  useLoopProgress,
  sceneOpacity,
  Reveal,
  SkBlock,
  SkBar,
  SkCircle,
  reveal,
  clamp
} from './SkeletonEngine';

const LOOP_MS = 10000;

// ---------- overlay timing ----------

const OVERLAY_ENTER = 0.46;
const OVERLAY_SETTLED = 0.56;
const TABLE_START = 0.58;
const TABLE_DONE = 0.66;
const KANBAN_START = 0.72;
const KANBAN_DONE = 0.90;

function overlaySlideIn(p) {
  const raw = clamp((p - OVERLAY_ENTER) / (OVERLAY_SETTLED - OVERLAY_ENTER));
  return 1 - Math.pow(1 - raw, 3);
}

function overlaySlideOut(p) {
  return 1 - clamp((p - 0.93) / 0.07);
}

function overlayOpacity(p) {
  return overlaySlideIn(p) * overlaySlideOut(p);
}

function tableAlpha(p) {
  const appear = clamp((p - TABLE_START) / (TABLE_DONE - TABLE_START));
  const dim = clamp((p - KANBAN_START) / 0.04);
  return appear * (1 - dim * 0.9);
}

function kanbanAlpha(p) {
  return clamp((p - KANBAN_START) / (KANBAN_DONE - KANBAN_START));
}

// ==============================================================
//  Dashboard Components (Light Atalaya Theme)
// ==============================================================

const navItems = Array.from({ length: 7 });

function DashboardSidebar({ p }) {
  const base = 0.03;
  return (
    <aside className="h-full w-[210px] shrink-0 border-r border-slate-200/80 bg-slate-50/70 p-4 flex flex-col gap-5">
      <Reveal p={p} at={base} variant="pop" dur={0.07}>
        <div className="flex items-center gap-2.5">
          <SkBlock className="h-8 w-8 rounded-lg !bg-[#4621E1]/15 !border-[#4621E1]/30" tone="accent" />
          <SkBar className="h-3 w-20 !bg-slate-700/80" />
        </div>
      </Reveal>

      <nav className="flex flex-col gap-1.5 mt-1">
        {navItems.map((_, i) => {
          const at = base + 0.012 + i * 0.018;
          const active = i === 1;
          return (
            <Reveal key={i} p={p} at={at} variant="rise" dur={0.08} distance={10}>
              <div className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-all ${active ? 'bg-[#4621E1]/10 border border-[#4621E1]/20' : ''}`}>
                <SkBlock className={`h-3.5 w-3.5 rounded-[4px] ${active ? '!bg-[#4621E1]' : ''}`} tone={active ? 'accent' : 'soft'} />
                <SkBar className={`h-2.5 ${active ? 'w-24 !bg-[#4621E1]/80' : 'w-16'}`} tone={active ? 'base' : 'soft'} />
              </div>
            </Reveal>
          );
        })}
      </nav>

      <div className="mt-auto">
        <Reveal p={p} at={base + 0.16} variant="rise" dur={0.09} distance={12}>
          <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-white p-2.5 shadow-xs">
            <SkCircle className="h-8 w-8" tone="soft" />
            <div className="flex flex-col gap-1.5">
              <SkBar className="h-2.5 w-16" />
              <SkBar className="h-2 w-12" tone="soft" />
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
    <header className="h-14 shrink-0 border-b border-slate-200/80 bg-white px-5 flex items-center gap-3">
      <Reveal p={p} at={base} variant="pop" dur={0.07}>
        <div className="flex items-center gap-2">
          <SkBar className="h-3 w-14" tone="soft" />
          <SkBlock className="h-1 w-1 rounded-full" tone="softer" />
          <SkBar className="h-3 w-18 !bg-[#4621E1]/40" />
        </div>
      </Reveal>
      <div className="flex-1" />
      <Reveal p={p} at={base + 0.025} variant="pop" dur={0.07}>
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
          <SkCircle className="h-3 w-3" tone="soft" />
          <SkBar className="h-2 w-32" tone="soft" />
        </div>
      </Reveal>
      {[0, 1, 2].map((i) => (
        <Reveal key={i} p={p} at={base + 0.04 + i * 0.018} variant="pop" dur={0.06}>
          <SkBlock className="h-8 w-8 rounded-lg" tone="soft" />
        </Reveal>
      ))}
      <Reveal p={p} at={base + 0.1} variant="pop" dur={0.07}>
        <SkCircle className="h-8 w-8 !bg-[#4621E1]/20 !border-[#4621E1]/30" tone="base" />
      </Reveal>
    </header>
  );
}

const stats = [
  { tone: 'accent', badgeBg: '!bg-[#4621E1]/15 !border-[#4621E1]/30' },
  { tone: 'orange', badgeBg: '!bg-[#FE4611]/15 !border-[#FE4611]/30' },
  { tone: 'sky', badgeBg: '!bg-[#50C4FF]/20 !border-[#50C4FF]/30' },
  { tone: 'emerald', badgeBg: '!bg-emerald-500/15 !border-emerald-500/30' },
];

function DashboardStatCards({ p }) {
  const base = 0.16;
  return (
    <div className="grid grid-cols-4 gap-3.5">
      {stats.map((s, i) => (
        <Reveal key={i} p={p} at={base + i * 0.028} variant="rise" dur={0.09} distance={14}>
          <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 flex flex-col gap-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <SkBar className="h-2.5 w-16" tone="soft" />
              <SkBlock className={`h-6 w-6 rounded-lg ${s.badgeBg}`} tone={s.tone} />
            </div>
            <SkBar className="h-4.5 w-18 !bg-slate-800" />
            <div className="flex items-center gap-2 mt-0.5">
              <SkBlock className={`h-3.5 w-10 rounded-full ${s.badgeBg}`} tone={s.tone} />
              <SkBar className="h-2 w-8" tone="softer" />
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
      <div className="rounded-xl border border-slate-200/80 bg-white p-4 flex flex-col gap-3 h-full shadow-xs">
        <div className="flex items-center justify-between">
          <SkBar className="h-3 w-24" />
          <div className="flex gap-1.5">
            <SkBlock className="h-5 w-12 rounded-full" tone="soft" />
            <SkBlock className="h-5 w-12 rounded-full" tone="softer" />
          </div>
        </div>
        <div className="flex-1 flex items-end gap-2 px-1 min-h-[90px]">
          {bars.map((h, i) => {
            const at = base + 0.05 + i * 0.014;
            const t = reveal(p, at, 0.12);
            const isHighlight = i % 4 === 3;
            return (
              <SkBlock
                key={i}
                className={`w-full rounded-t-md ${isHighlight ? '!bg-[#4621E1]/40 !border-[#4621E1]/50' : '!bg-slate-200/70'}`}
                tone={isHighlight ? 'accent' : 'soft'}
                style={{ height: `${h * t}%`, opacity: t, transformOrigin: 'bottom' }}
              />
            );
          })}
        </div>
        <div className="flex gap-2 px-1">
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
      <div className="rounded-xl border border-slate-200/80 bg-white p-4 flex flex-col gap-3 h-full shadow-xs">
        <div className="flex items-center justify-between">
          <SkBar className="h-3 w-28" />
          <SkBlock className="h-6 w-16 rounded-lg" tone="soft" />
        </div>
        <Reveal p={p} at={base + 0.04} variant="draw" dur={0.08} className="flex gap-3 px-2 pb-2.5 border-b border-slate-100">
          <SkBar className="h-2 w-12" tone="soft" />
          <SkBar className="h-2 w-16" tone="soft" />
          <SkBar className="h-2 w-10" tone="soft" />
        </Reveal>
        <div className="flex flex-col gap-2">
          {rows.map((_, i) => {
            const at = base + 0.06 + i * 0.022;
            return (
              <Reveal key={i} p={p} at={at} variant="draw" dur={0.08} className="flex items-center gap-3 px-2">
                <SkCircle className="h-6 w-6 shrink-0" tone="soft" />
                <SkBar className="h-2.5 w-20" />
                <SkBar className="h-2.5 w-16" tone="soft" />
                <SkBlock className="h-4.5 w-12 rounded-full" tone={i % 3 === 0 ? 'accent' : 'soft'} />
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
  const feedItems = Array.from({ length: 3 });
  return (
    <div className="grid grid-cols-3 gap-3.5">
      <Reveal p={p} at={base} variant="rise" dur={0.1} distance={14} className="col-span-2">
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 flex flex-col gap-3 h-full shadow-xs">
          <div className="flex items-center justify-between">
            <SkBar className="h-3 w-24" />
            <SkBlock className="h-5 w-12 rounded-full" tone="soft" />
          </div>
          <div className="flex flex-col gap-3">
            {feedItems.map((_, i) => {
              const at = base + 0.04 + i * 0.025;
              return (
                <Reveal key={i} p={p} at={at} variant="rise" dur={0.08} distance={10} className="flex items-center gap-2.5">
                  <SkCircle className="h-7 w-7 shrink-0" tone="soft" />
                  <div className="flex flex-col gap-1.5 flex-1">
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
        <div className="rounded-xl border border-slate-200/80 bg-white p-4 flex flex-col items-center gap-3 h-full shadow-xs">
          <SkBar className="h-3 w-16 self-start" />
          <div className="relative flex-1 flex items-center justify-center w-full min-h-[80px]">
            <Reveal p={p} at={base + 0.06} variant="pop" dur={0.12}>
              <div className="relative h-20 w-20 rounded-full border-6 border-slate-100 border-t-[#4621E1]" />
            </Reveal>
            <div className="absolute flex flex-col items-center gap-1.5">
              <SkBar className="h-3.5 w-10 !bg-[#4621E1]" />
              <SkBar className="h-1.5 w-12" tone="soft" />
            </div>
          </div>
          <div className="flex gap-3 w-full">
            {[0, 1].map((i) => (
              <div key={i} className="flex items-center gap-1.5">
                <SkBlock className="h-2 w-2 rounded-xs" tone={i === 0 ? 'accent' : 'soft'} />
                <SkBar className="h-2 w-8" tone="soft" />
              </div>
            ))}
          </div>
        </div>
      </Reveal>
    </div>
  );
}

// ==============================================================
//  Overlay Components (Light & Clean Theme)
// ==============================================================

function OverlayTable({ p }) {
  const base = TABLE_START;
  const rows = Array.from({ length: 6 });

  return (
    <div className="h-full rounded-xl border border-slate-200/80 bg-white p-4 flex flex-col gap-3 shadow-xs">
      {/* header bar */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <Reveal p={p} at={base} variant="pop" dur={0.06}>
          <div className="flex items-center gap-2">
            <SkBlock className="h-4.5 w-4.5 rounded-md !bg-[#4621E1]" tone="accent" />
            <SkBar className="h-3 w-32 !bg-slate-800" />
          </div>
        </Reveal>
        <Reveal p={p} at={base + 0.02} variant="pop" dur={0.06}>
          <div className="flex gap-2">
            <SkBlock className="h-6 w-16 rounded-lg" tone="soft" />
            <SkBlock className="h-6 w-6 rounded-lg !bg-[#FE4611]/20" tone="orange" />
          </div>
        </Reveal>
      </div>

      {/* column headers */}
      <Reveal
        p={p}
        at={base + 0.04}
        variant="draw"
        dur={0.08}
        className="flex gap-4 px-2 py-2 border-b border-slate-100 rounded-md bg-slate-50/60"
      >
        <div className="flex items-center gap-2 w-[34%]">
          <SkBlock className="h-3 w-3 rounded-xs" tone="soft" />
          <SkBar className="h-2 w-14" tone="soft" />
        </div>
        <SkBar className="h-2 w-18" tone="soft" />
        <SkBar className="h-2 w-14" tone="soft" />
        <div className="flex-1" />
        <SkBar className="h-2 w-10" tone="soft" />
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
              className={`flex items-center gap-4 px-2 py-2 rounded-lg ${i % 2 === 0 ? 'bg-slate-50/50' : ''}`}
            >
              <div className="flex items-center gap-2 w-[34%]">
                <SkCircle className="h-7 w-7 shrink-0" tone="soft" />
                <div className="flex flex-col gap-1.5">
                  <SkBar className="h-2.5 w-28" />
                  <SkBar className="h-2 w-16" tone="soft" />
                </div>
              </div>
              <SkBar className="h-2.5 w-20" tone="soft" />
              <SkBlock className="h-4.5 w-14 rounded-full" tone={i % 3 === 0 ? 'accent' : i % 3 === 1 ? 'orange' : 'soft'} />
              <div className="flex-1" />
              <SkBar className="h-2 w-8" tone="softer" />
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}

const kanbanColumns = [0, 1, 2, 3, 4];
const cardsPerCol = [3, 3, 2, 1, 0];

function OverlayKanban({ p }) {
  const base = KANBAN_START + 0.02;

  return (
    <div className="h-full flex flex-col gap-3">
      {/* header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <SkBlock className="h-4.5 w-4.5 rounded-md !bg-[#4621E1]" tone="accent" />
          <SkBar className="h-3 w-32 !bg-slate-800" />
        </div>
        <div className="flex gap-2">
          <SkBlock className="h-6 w-16 rounded-lg" tone="soft" />
          <SkBlock className="h-6 w-6 rounded-lg !bg-[#FE4611]/20" tone="orange" />
        </div>
      </div>

      {/* columns */}
      <div className="grid grid-cols-5 gap-2.5 flex-1 min-h-0">
        {kanbanColumns.map((c, ci) => {
          const colAt = base + ci * 0.035;
          return (
            <Reveal key={c} p={p} at={colAt} variant="rise" dur={0.1} distance={22} className="min-h-0">
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-2.5 flex flex-col gap-2 h-full">
                {/* column header */}
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                  <div className="flex items-center gap-1.5">
                    <SkBlock
                      className={`h-2.5 w-2.5 rounded-xs ${ci === 0 ? '!bg-[#4621E1]' : ci === 1 ? '!bg-[#FE4611]' : ci === 2 ? '!bg-[#50C4FF]' : '!bg-emerald-500'}`}
                      tone={ci === 0 ? 'accent' : 'soft'}
                    />
                    <SkBar className="h-2.5 w-12" tone="soft" />
                    <SkBlock className="h-3.5 w-3.5 rounded-full" tone="softer" />
                  </div>
                </div>

                {/* cards dropping in */}
                <div className="flex flex-col gap-2 overflow-hidden">
                  {Array.from({ length: cardsPerCol[ci] }).map((_, cardI) => {
                    const cardAt = colAt + 0.04 + cardI * 0.03;
                    const tagTone = (cardI + ci) % 4 === 0 ? 'accent' : (cardI + ci) % 4 === 1 ? 'orange' : (cardI + ci) % 4 === 2 ? 'sky' : 'soft';
                    return (
                      <Reveal key={cardI} p={p} at={cardAt} variant="drop" dur={0.1} distance={32}>
                        <div className="rounded-lg border border-slate-200/80 bg-white p-2.5 flex flex-col gap-1.5 shadow-xs">
                          <SkBar className="h-2.5 w-full" />
                          <SkBar className="h-2 w-2/3" tone="soft" />
                          <div className="flex items-center justify-between mt-0.5">
                            <SkBlock
                              className="h-3.5 w-9 rounded-full"
                              tone={tagTone}
                            />
                            <SkCircle className="h-4.5 w-4.5" tone="softer" />
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

export function JoinSkeletonScene() {
  const p = useLoopProgress(LOOP_MS);
  const opacity = sceneOpacity(p);
  const oSlide = overlaySlideIn(p) * overlaySlideOut(p);
  const oAlpha = overlayOpacity(p);
  const tAlpha = tableAlpha(p);
  const kAlpha = kanbanAlpha(p);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#f8fafc] rounded-2xl">
      {/* ambient background glows */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="glow-drift absolute -top-32 -left-24 h-[340px] w-[340px] rounded-full bg-[#4621E1]/[0.08] blur-[90px]" />
        <div className="glow-drift-2 absolute top-1/3 -right-24 h-[360px] w-[360px] rounded-full bg-[#FE4611]/[0.06] blur-[100px]" />
        <div className="glow-drift absolute -bottom-24 left-1/3 h-[300px] w-[300px] rounded-full bg-[#50C4FF]/[0.08] blur-[90px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(70,33,225,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(70,33,225,0.3) 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />
      </div>

      {/* ====== Layer 1: Dashboard skeleton ====== */}
      <div
        className="relative z-10 h-full w-full p-3"
        style={{ opacity, willChange: 'opacity' }}
      >
        <div className="h-full w-full rounded-xl border border-slate-200/90 bg-white/95 overflow-hidden flex flex-col shadow-xs backdrop-blur-xs">
          <div className="flex flex-1 min-h-0">
            <DashboardSidebar p={p} />
            <div className="flex-1 flex flex-col min-w-0">
              <DashboardTopbar p={p} />
              <main className="flex-1 overflow-hidden p-4 flex flex-col gap-3.5">
                <DashboardStatCards p={p} />
                <div className="grid grid-cols-2 gap-3.5 flex-1 min-h-0">
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
        className="absolute inset-0 z-30 flex items-center justify-center p-3"
        style={{
          opacity: oAlpha,
          willChange: 'opacity, transform',
        }}
      >
        {/* dark/soft scrim behind overlay panel */}
        <div
          className="absolute inset-0 bg-slate-900/15 backdrop-blur-[2px]"
          style={{ opacity: clamp(oSlide * 1.3) }}
        />

        {/* overlay panel slides in from the right */}
        <div
          className="relative w-[94%] h-[86%] rounded-2xl border border-slate-200/90 bg-white shadow-2xl overflow-hidden flex flex-col"
          style={{
            transform: `translateX(${(1 - oSlide) * 50}px)`,
            willChange: 'transform',
          }}
        >
          {/* overlay topbar */}
          <div className="h-12 shrink-0 border-b border-slate-100 bg-slate-50/70 px-4 flex items-center gap-3">
            <div
              className="flex items-center gap-2"
              style={{ opacity: clamp(oSlide * 1.5) }}
            >
              <SkBlock className="h-4 w-4 rounded-[4px] !bg-[#4621E1]" tone="accent" />
              <SkBar className="h-3 w-28 !bg-slate-700" />
            </div>
            <div className="flex-1" />
            <div
              className="flex items-center gap-2"
              style={{ opacity: clamp(oSlide * 1.5) }}
            >
              <SkBlock className="h-6 w-16 rounded-full" tone="soft" />
              <SkBlock className="h-6 w-16 rounded-full !bg-[#FE4611]/15" tone="orange" />
            </div>
          </div>

          {/* overlay content: table first, then kanban cross-fades */}
          <div className="flex-1 relative overflow-hidden p-3.5">
            {/* ---- Phase A: Table skeleton ---- */}
            <div
              className="absolute inset-0 p-3.5 flex flex-col gap-3"
              style={{ opacity: tAlpha }}
            >
              <OverlayTable p={p} />
            </div>

            {/* ---- Phase B: Kanban ---- */}
            <div
              className="absolute inset-0 p-3.5"
              style={{
                opacity: kAlpha,
                transform: `translateY(${(1 - kAlpha) * 16}px)`,
              }}
            >
              <OverlayKanban p={p} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JoinSkeletonScene;
