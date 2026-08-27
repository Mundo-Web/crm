import React, { useEffect, useRef, useState } from "react"
import AuthRest from "../../actions/AuthRest"
import { toast } from "sonner"
import { Session } from "sode-extend-react"

const authRest = new AuthRest()

// ==============================================================
//  Math helpers & loop driver
// ==============================================================

const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v))

const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

const easeOutBack = (t) => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
}

const reveal = (p, at, dur, ease = easeOutCubic) => ease(clamp((p - at) / dur))

function useLoopProgress(durationMs) {
    const [progress, setProgress] = useState(0)
    const startRef = useRef(null)
    const rafRef = useRef(null)

    useEffect(() => {
        const tick = (ts) => {
            if (startRef.current === null) startRef.current = ts
            const elapsed = (ts - startRef.current) % durationMs
            setProgress(elapsed / durationMs)
            rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)
        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current)
            startRef.current = null
        }
    }, [durationMs])

    return progress
}

// ==============================================================
//  Primitives & Reveal
// ==============================================================

const toneClass = {
    base: 'bg-white/[0.08]',
    soft: 'bg-white/[0.05]',
    softer: 'bg-white/[0.03]',
    accent: 'bg-[#4621E1]/40 border border-[#4621E1]/50',
    emerald: 'bg-emerald-400/25 border border-emerald-400/30',
    orange: 'bg-[#FE4611]/30 border border-[#FE4611]/40',
    sky: 'bg-[#50C4FF]/30 border border-[#50C4FF]/40',
}

const SkeletonBase = ({ className = '', tone = 'base', rounded = 'rounded-md', style }) => (
    <div
        className={`relative overflow-hidden ${toneClass[tone] || toneClass.base} ${rounded} ${className} shimmer`}
        style={style}
    />
)

const SkBlock = (props) => <SkeletonBase {...props} />

const SkBar = ({ className = '', tone = 'base', style }) => (
    <SkeletonBase className={className} tone={tone} rounded="rounded-full" style={style} />
)

const SkCircle = ({ className = '', tone = 'base', style }) => (
    <SkeletonBase
        className={className}
        tone={tone}
        rounded="rounded-full"
        style={{ ...style, borderRadius: '9999px' }}
    />
)

const Reveal = ({
    at,
    dur = 0.12,
    p,
    variant = 'pop',
    distance = 16,
    delay = 0,
    className = '',
    style = {},
    children,
}) => {
    const start = at + delay
    const ease = variant === 'pop' ? easeOutBack : easeOutCubic
    const t = reveal(p, start, dur, ease)
    const tFade = reveal(p, start, dur, easeOutCubic)

    let transform = ''
    let opacity = tFade
    let transformOrigin = 'center'

    if (t <= 0) {
        opacity = 0
    }

    switch (variant) {
        case 'pop': {
            const s = 0.82 + 0.18 * clamp(t)
            transform = `scale(${s})`
            break
        }
        case 'rise': {
            const y = distance * (1 - clamp(t))
            transform = `translateY(${y}px)`
            break
        }
        case 'draw': {
            const sy = clamp(t)
            transform = `scaleY(${sy})`
            transformOrigin = 'top center'
            opacity = tFade
            break
        }
        case 'drop': {
            const y = -distance * (1 - clamp(t))
            transform = `translateY(${y}px)`
            break
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
    )
}

const sceneOpacity = (p) => {
    const startIn = clamp((p - 0.0) / 0.04)
    const endOut = 1 - clamp((p - 0.94) / 0.06)
    return startIn * endOut
}

// ==============================================================
//  Timing constants
// ==============================================================

const LOOP_MS = 9000
const OVERLAY_ENTER = 0.44
const OVERLAY_SETTLED = 0.54
const TABLE_START = 0.56
const TABLE_DONE = 0.68
const KANBAN_START = 0.72
const KANBAN_DONE = 0.92

function overlaySlideIn(p) {
    const raw = clamp((p - OVERLAY_ENTER) / (OVERLAY_SETTLED - OVERLAY_ENTER))
    return 1 - Math.pow(1 - raw, 3)
}

function overlaySlideOut(p) {
    return 1 - clamp((p - 0.94) / 0.06)
}

function overlayOpacity(p) {
    return overlaySlideIn(p) * overlaySlideOut(p)
}

function tableAlpha(p) {
    const appear = clamp((p - TABLE_START) / (TABLE_DONE - TABLE_START))
    const dim = clamp((p - KANBAN_START) / 0.04)
    return appear * (1 - dim * 0.92)
}

function kanbanAlpha(p) {
    return clamp((p - KANBAN_START) / (KANBAN_DONE - KANBAN_START))
}

// ==============================================================
//  Dashboard Skeleton Subcomponents
// ==============================================================

function DashboardSidebar({ p, projectName }) {
    const base = 0.02
    const navItems = Array.from({ length: 5 })
    return (
        <aside className="h-full w-[170px] shrink-0 border-r border-white/[0.04] bg-white/[0.015] p-3.5 flex flex-col gap-4">
            <Reveal p={p} at={base} variant="pop" dur={0.07}>
                <div className="flex items-center gap-2">
                    <SkBlock className="h-7 w-7 rounded-lg" tone="accent" />
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-white tracking-wide truncate max-w-[100px]">
                            {projectName}
                        </span>
                        <SkBar className="h-1.5 w-12" tone="soft" />
                    </div>
                </div>
            </Reveal>

            <nav className="flex flex-col gap-1.5 mt-1">
                {navItems.map((_, i) => {
                    const at = base + 0.01 + i * 0.015
                    const active = i === 0
                    return (
                        <Reveal key={i} p={p} at={at} variant="rise" dur={0.07} distance={8}>
                            <div className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${active ? 'bg-[#4621E1]/20 border border-[#4621E1]/30' : ''}`}>
                                <SkBlock className={`h-3 w-3 rounded-sm ${active ? '!bg-[#4621E1]' : ''}`} tone={active ? 'accent' : 'soft'} />
                                <SkBar className={`h-2 ${active ? 'w-20' : 'w-14'}`} tone={active ? 'base' : 'soft'} />
                            </div>
                        </Reveal>
                    )
                })}
            </nav>

            <div className="mt-auto">
                <Reveal p={p} at={base + 0.12} variant="rise" dur={0.08} distance={10}>
                    <div className="flex items-center gap-2 rounded-lg border border-white/[0.04] bg-white/[0.015] p-2">
                        <SkCircle className="h-6 w-6" tone="soft" />
                        <div className="flex flex-col gap-1">
                            <SkBar className="h-2 w-14" />
                            <SkBar className="h-1.5 w-10" tone="soft" />
                        </div>
                    </div>
                </Reveal>
            </div>
        </aside>
    )
}

function DashboardTopbar({ p, projectName }) {
    const base = 0.03
    return (
        <header className="h-11 shrink-0 border-b border-white/[0.04] bg-white/[0.01] px-4 flex items-center gap-3">
            <Reveal p={p} at={base} variant="pop" dur={0.06}>
                <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold text-slate-200">Tablero /</span>
                    <span className="text-[11px] font-semibold text-indigo-400 truncate max-w-[120px]">{projectName}</span>
                </div>
            </Reveal>
            <div className="flex-1" />
            <Reveal p={p} at={base + 0.02} variant="pop" dur={0.06}>
                <div className="flex items-center gap-2 rounded-md border border-white/[0.04] bg-white/[0.02] px-2.5 py-1">
                    <SkCircle className="h-2.5 w-2.5" tone="soft" />
                    <SkBar className="h-2 w-20" tone="soft" />
                </div>
            </Reveal>
            {[0, 1].map((i) => (
                <Reveal key={i} p={p} at={base + 0.03 + i * 0.015} variant="pop" dur={0.05}>
                    <SkBlock className="h-6 w-6 rounded-md" tone="soft" />
                </Reveal>
            ))}
            <Reveal p={p} at={base + 0.08} variant="pop" dur={0.06}>
                <SkCircle className="h-6 w-6" tone="accent" />
            </Reveal>
        </header>
    )
}

function DashboardStatCards({ p }) {
    const base = 0.12
    const stats = [
        { label: 'Leads Nuevos', tone: 'accent', icon: 'mdi-account-plus' },
        { label: 'En Gestión', tone: 'sky', icon: 'mdi-account-sync' },
        { label: 'Calificados', tone: 'orange', icon: 'mdi-fire' },
        { label: 'Ventas Concretadas', tone: 'emerald', icon: 'mdi-check-decagram' }
    ]
    return (
        <div className="grid grid-cols-4 gap-2.5">
            {stats.map((s, i) => (
                <Reveal key={i} p={p} at={base + i * 0.02} variant="rise" dur={0.08} distance={10}>
                    <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-2.5 flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[9px] text-slate-400 font-medium truncate">{s.label}</span>
                            <SkBlock className="h-5 w-5 rounded-md" tone={s.tone} />
                        </div>
                        <SkBar className="h-3.5 w-12" tone="base" />
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <SkBlock className="h-2.5 w-8 rounded-full" tone={s.tone} />
                            <SkBar className="h-1.5 w-6" tone="softer" />
                        </div>
                    </div>
                </Reveal>
            ))}
        </div>
    )
}

function DashboardChart({ p }) {
    const base = 0.22
    const bars = [35, 55, 42, 75, 50, 85, 65, 95, 60, 80, 52, 90]
    return (
        <Reveal p={p} at={base} variant="rise" dur={0.08} distance={12}>
            <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-3 flex flex-col gap-2.5 h-full">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-300">Embudo de Conversión</span>
                    <div className="flex gap-1.5">
                        <SkBlock className="h-4 w-10 rounded-full" tone="soft" />
                    </div>
                </div>
                <div className="flex-1 flex items-end gap-1.5 px-1 min-h-[70px]">
                    {bars.map((h, i) => {
                        const at = base + 0.03 + i * 0.01
                        const t = reveal(p, at, 0.09)
                        return (
                            <SkBlock
                                key={i}
                                className={`w-full rounded-t-sm ${i % 3 === 2 ? '!bg-indigo-400/30' : ''}`}
                                tone={i % 3 === 2 ? 'accent' : 'soft'}
                                style={{ height: `${h * t}%`, opacity: t, transformOrigin: 'bottom' }}
                            />
                        )
                    })}
                </div>
            </div>
        </Reveal>
    )
}

function DashboardTable({ p, statuses }) {
    const base = 0.26
    const rows = Array.from({ length: 4 })
    return (
        <Reveal p={p} at={base} variant="rise" dur={0.08} distance={12}>
            <div className="rounded-lg border border-white/[0.05] bg-white/[0.015] p-3 flex flex-col gap-2.5 h-full">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-300">Últimas Oportunidades</span>
                    <SkBlock className="h-4 w-12 rounded" tone="soft" />
                </div>
                <div className="flex flex-col gap-2 mt-1">
                    {rows.map((_, i) => {
                        const at = base + 0.04 + i * 0.016
                        const stName = statuses[i % statuses.length] || 'Nuevo'
                        return (
                            <Reveal key={i} p={p} at={at} variant="draw" dur={0.06} className="flex items-center gap-2.5 px-1">
                                <SkCircle className="h-5 w-5 shrink-0" tone="soft" />
                                <div className="flex flex-col gap-1 flex-1">
                                    <SkBar className="h-2 w-20" />
                                    <SkBar className="h-1.5 w-14" tone="softer" />
                                </div>
                                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 truncate max-w-[80px]">
                                    {stName}
                                </span>
                            </Reveal>
                        )
                    })}
                </div>
            </div>
        </Reveal>
    )
}

// ==============================================================
//  Overlay Components: Table -> Kanban Synthesis
// ==============================================================

function OverlayTable({ p, projectName, statuses }) {
    const base = TABLE_START
    const rows = Array.from({ length: 5 })

    return (
        <div className="h-full rounded-xl border border-white/[0.05] bg-white/[0.012] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-1">
                <Reveal p={p} at={base} variant="pop" dur={0.05}>
                    <div className="flex items-center gap-2">
                        <SkBlock className="h-4 w-4 rounded-md" tone="accent" />
                        <span className="text-[11px] font-bold text-slate-200">{projectName} — Base de Datos</span>
                    </div>
                </Reveal>
                <Reveal p={p} at={base + 0.02} variant="pop" dur={0.05}>
                    <div className="flex gap-1.5">
                        <SkBlock className="h-5 w-14 rounded-md" tone="soft" />
                        <SkBlock className="h-5 w-5 rounded-md" tone="accent" />
                    </div>
                </Reveal>
            </div>

            <Reveal
                p={p}
                at={base + 0.03}
                variant="draw"
                dur={0.06}
                className="flex gap-4 px-2 py-2 border-b border-white/[0.05] border-t border-white/[0.03] rounded-md bg-white/[0.008] text-[9px] font-mono text-slate-400"
            >
                <span className="w-[30%]">Lead / Contacto</span>
                <span className="w-[25%]">Etapa Pipeline</span>
                <span className="w-[20%]">Temperatura</span>
                <div className="flex-1" />
                <span>Estado</span>
            </Reveal>

            <div className="flex flex-col gap-1.5 flex-1 overflow-hidden">
                {rows.map((_, i) => {
                    const at = base + 0.05 + i * 0.018
                    const st = statuses[i % statuses.length] || 'Nuevo'
                    const temps = ['🔥 Caliente', '⚡ Tibio', '❄️ Frío']
                    const temp = temps[i % temps.length]

                    return (
                        <Reveal
                            key={i}
                            p={p}
                            at={at}
                            variant="draw"
                            dur={0.06}
                            className={`flex items-center gap-4 px-2 py-2 rounded-lg ${i % 2 === 0 ? 'bg-white/[0.006]' : ''}`}
                        >
                            <div className="flex items-center gap-2 w-[30%]">
                                <SkCircle className="h-6 w-6 shrink-0" tone="soft" />
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-medium text-slate-200">Prospecto #{i + 1}</span>
                                    <SkBar className="h-1.5 w-14" tone="softer" />
                                </div>
                            </div>
                            <span className="w-[25%] text-[9px] font-mono text-indigo-300 truncate">{st}</span>
                            <span className="w-[20%] text-[8px] font-mono text-slate-300">{temp}</span>
                            <div className="flex-1" />
                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                                Activo
                            </span>
                        </Reveal>
                    )
                })}
            </div>
        </div>
    )
}

function OverlayKanban({ p, projectName, statuses }) {
    const base = KANBAN_START + 0.01
    const activeColumns = statuses.slice(0, 5)

    return (
        <div className="h-full flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <SkBlock className="h-4 w-4 rounded-md" tone="accent" />
                    <span className="text-[11px] font-bold text-white">{projectName} — Vista Kanban</span>
                </div>
                <div className="flex gap-1.5">
                    <span className="text-[9px] font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        {activeColumns.length} Columnas Activas
                    </span>
                </div>
            </div>

            <div className="grid grid-flow-col auto-cols-fr gap-2.5 flex-1 min-h-0">
                {activeColumns.map((colName, ci) => {
                    const colAt = base + ci * 0.025
                    const cardsPerCol = [3, 2, 2, 2, 1]
                    const count = cardsPerCol[ci % cardsPerCol.length]
                    const temps = [
                        { name: '🔥 Caliente', color: 'border-rose-500/30 bg-rose-500/15 text-rose-300' },
                        { name: '⚡ Tibio', color: 'border-amber-500/30 bg-amber-500/15 text-amber-300' },
                        { name: '❄️ Frío', color: 'border-blue-500/30 bg-blue-500/15 text-blue-300' }
                    ]

                    return (
                        <Reveal key={ci} p={p} at={colAt} variant="rise" dur={0.08} distance={18} className="min-h-0">
                            <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-2.5 flex flex-col gap-2 h-full">
                                <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.04]">
                                    <span className="text-[10px] font-semibold text-slate-200 truncate">{colName}</span>
                                    <span className="text-[9px] font-mono text-slate-400 bg-white/[0.05] px-1 rounded">
                                        {count}
                                    </span>
                                </div>

                                <div className="flex flex-col gap-2 overflow-hidden">
                                    {Array.from({ length: count }).map((_, cardI) => {
                                        const cardAt = colAt + 0.03 + cardI * 0.02
                                        const t = temps[(ci + cardI) % temps.length]
                                        return (
                                            <Reveal key={cardI} p={p} at={cardAt} variant="drop" dur={0.08} distance={24}>
                                                <div className="rounded-lg border border-white/[0.06] bg-slate-900/80 p-2 flex flex-col gap-1.5 shadow-sm">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[9px] font-medium text-slate-200">Lead #{ci * 3 + cardI + 1}</span>
                                                        <span className={`text-[8px] font-mono px-1 py-0.5 rounded border ${t.color}`}>
                                                            {t.name}
                                                        </span>
                                                    </div>
                                                    <SkBar className="h-1.5 w-full" tone="soft" />
                                                    <div className="flex items-center justify-between mt-0.5">
                                                        <span className="text-[8px] text-slate-400">Atalaya CRM</span>
                                                        <SkCircle className="h-3.5 w-3.5" tone="softer" />
                                                    </div>
                                                </div>
                                            </Reveal>
                                        )
                                    })}
                                </div>
                            </div>
                        </Reveal>
                    )
                })}
            </div>
        </div>
    )
}

// ==============================================================
//  Main JoinThanks Component
// ==============================================================

const JoinThanks = ({ data = {}, setData, step, setStep }) => {
    const [failed, setFailed] = useState(false)
    const [countdown, setCountdown] = useState(5)
    const p = useLoopProgress(LOOP_MS)

    const summaryRef = useRef({
        projectName: data.projectName || 'Leads',
        statuses: data.statuses?.length ? data.statuses : ['Nuevo', 'Gestión', 'Decisión'],
        manageStatuses: data.manageStatuses?.length ? data.manageStatuses : ['Pendiente', 'Contactado'],
    })

    const clearStorage = () => {
        try {
            Session.delete('join-data')
            Session.set('join-data', {})
            localStorage.removeItem('join-data')
            sessionStorage.removeItem('join-data')
        } catch (e) {
            console.error('Error clearing storage:', e)
        }
        if (setData) setData({})
    }

    const saveData = async () => {
        setFailed(false)
        try {
            const startTime = Date.now()
            const { status, message } = await authRest.init(data)
            if (!status) {
                setFailed(true)
                toast(message || 'Ocurrió un error al inicializar', { icon: <i className="mdi mdi-alert" /> })
                return
            }

            const elapsed = Date.now() - startTime
            // Allow animation to run at least 3.2s to show the full layered synthesis
            const remainingDelay = Math.max(0, 3200 - elapsed)

            setTimeout(() => {
                clearStorage()
                setStep('thanks')
            }, remainingDelay)
        } catch (error) {
            setFailed(true)
            toast('Error de conexión al inicializar la cuenta', { icon: <i className="mdi mdi-alert" /> })
        }
    }

    useEffect(() => {
        if (step === 'saving') {
            saveData()
        }

        if (step === 'thanks') {
            clearStorage()
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer)
                        window.location.href = '/leads?first_time=1'
                        return 0
                    }
                    return prev - 1
                })
            }, 1000)

            return () => clearInterval(timer)
        }
    }, [step])

    const projectName = summaryRef.current.projectName
    const statuses = summaryRef.current.statuses

    const opacity = sceneOpacity(p)
    const oSlide = overlaySlideIn(p) * overlaySlideOut(p)
    const oAlpha = overlayOpacity(p)
    const tAlpha = tableAlpha(p)
    const kAlpha = kanbanAlpha(p)

    // ==============================================================
    //  STEP 'SAVING': Mathematical Multi-Layer Skeleton Synthesis
    // ==============================================================
    if (step === 'saving') {
        return (
            <div className="w-full flex flex-col items-center justify-center py-2">
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
                        50% { transform: translate(15px, -15px) scale(1.06); }
                    }
                    @keyframes glow-drift-2 {
                        0%, 100% { transform: translate(0, 0) scale(1); }
                        50% { transform: translate(-15px, 15px) scale(1.05); }
                    }
                    .glow-drift { animation: glow-drift 7s ease-in-out infinite; }
                    .glow-drift-2 { animation: glow-drift-2 9s ease-in-out infinite; }
                `}</style>

                {/* Top subtitle */}
                <div className="text-center mb-3">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#EEF2FF] border border-[#DBE0FF] text-[#4621E1] rounded-full text-xs font-semibold mb-1">
                        <i className="mdi mdi-loading mdi-spin text-sm" />
                        <span>Sintetizando arquitectura de tu CRM</span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                        Configurando tablero: <span className="text-[#4621E1]">{projectName}</span>
                    </h2>
                </div>

                {/* Mathematical Skeleton Engine Container */}
                <div className="relative w-full max-w-2xl h-[330px] sm:h-[360px] rounded-2xl overflow-hidden bg-[#08080c] border border-white/[0.08] shadow-2xl">
                    {/* Ambient Glows */}
                    <div className="pointer-events-none absolute inset-0 overflow-hidden">
                        <div className="glow-drift absolute -top-20 -left-20 h-[260px] w-[260px] rounded-full bg-[#4621E1]/[0.12] blur-[80px]" />
                        <div className="glow-drift-2 absolute top-1/3 -right-20 h-[280px] w-[280px] rounded-full bg-[#FE4611]/[0.08] blur-[90px]" />
                        <div className="glow-drift absolute -bottom-20 left-1/3 h-[240px] w-[240px] rounded-full bg-emerald-500/[0.08] blur-[80px]" />
                        <div
                            className="absolute inset-0 opacity-[0.02]"
                            style={{
                                backgroundImage:
                                    'linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)',
                                backgroundSize: '32px 32px',
                            }}
                        />
                    </div>

                    {/* Layer 1: Dashboard skeleton */}
                    <div
                        className="relative z-10 h-full w-full p-2.5"
                        style={{ opacity, willChange: 'opacity' }}
                    >
                        <div className="h-full w-full rounded-xl border border-white/[0.05] bg-black/30 overflow-hidden flex flex-col backdrop-blur-sm">
                            <div className="flex flex-1 min-h-0">
                                <DashboardSidebar p={p} projectName={projectName} />
                                <div className="flex-1 flex flex-col min-w-0">
                                    <DashboardTopbar p={p} projectName={projectName} />
                                    <main className="flex-1 overflow-hidden p-3 flex flex-col gap-2.5">
                                        <DashboardStatCards p={p} />
                                        <div className="grid grid-cols-2 gap-2.5 flex-1 min-h-0">
                                            <DashboardChart p={p} />
                                            <DashboardTable p={p} statuses={statuses} />
                                        </div>
                                    </main>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Layer 2: Overlay (Table -> Kanban) */}
                    <div
                        className="absolute inset-0 z-30 flex items-center justify-center p-3"
                        style={{
                            opacity: oAlpha,
                            willChange: 'opacity, transform',
                        }}
                    >
                        {/* Dark Scrim */}
                        <div
                            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
                            style={{ opacity: clamp(oSlide * 1.2) }}
                        />

                        {/* Overlay Panel */}
                        <div
                            className="relative w-full h-full rounded-xl border border-white/[0.08] bg-[#0c0c14] shadow-2xl overflow-hidden flex flex-col"
                            style={{
                                transform: `translateX(${(1 - oSlide) * 40}px)`,
                                willChange: 'transform',
                            }}
                        >
                            {/* Overlay Topbar */}
                            <div className="h-10 shrink-0 border-b border-white/[0.04] px-4 flex items-center gap-3">
                                <div className="flex items-center gap-2" style={{ opacity: clamp(oSlide * 1.5) }}>
                                    <SkBlock className="h-3.5 w-3.5 rounded" tone="accent" />
                                    <span className="text-[10px] font-bold text-white font-mono">{projectName}</span>
                                </div>
                                <div className="flex-1" />
                                <div className="flex items-center gap-1.5" style={{ opacity: clamp(oSlide * 1.5) }}>
                                    <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                        35 Procesos Listos
                                    </span>
                                </div>
                            </div>

                            {/* Overlay Content */}
                            <div className="flex-1 relative overflow-hidden p-3">
                                {/* Phase A: Table skeleton */}
                                <div
                                    className="absolute inset-0 p-3 flex flex-col gap-2"
                                    style={{ opacity: tAlpha }}
                                >
                                    <OverlayTable p={p} projectName={projectName} statuses={statuses} />
                                </div>

                                {/* Phase B: Kanban */}
                                <div
                                    className="absolute inset-0 p-3"
                                    style={{
                                        opacity: kAlpha,
                                        transform: `translateY(${(1 - kAlpha) * 15}px)`,
                                    }}
                                >
                                    <OverlayKanban p={p} projectName={projectName} statuses={statuses} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {failed && (
                    <button
                        onClick={saveData}
                        className="mt-3 inline-flex items-center gap-2 border-2 border-[#4621E1] bg-[#4621E1] hover:bg-opacity-90 transition-colors font-semibold text-white rounded-xl py-2 px-5 text-xs shadow"
                    >
                        <i className="mdi mdi-refresh" />
                        Reintentar configuración
                    </button>
                )}
            </div>
        )
    }

    // ==============================================================
    //  STEP 'THANKS': Compact, Clean & Authentic Atalaya Essence
    // ==============================================================
    return (
        <div className="h-full flex items-center justify-center py-6 px-4">
            <div className="bg-white rounded-2xl max-w-sm w-full mx-auto p-6 sm:p-7 text-center shadow-lg border border-gray-100 transition-all">
                <i className="mdi mdi-check mdi-36px w-14 h-14 bg-[#DBE0FF] mx-auto mb-4 rounded-2xl flex items-center justify-center text-[#4621E1] shadow-inner" />

                <h2 className="text-3xl font-bold mb-3 text-gray-900 tracking-tight">
                    ¡Bienvenido a <span className="text-[#FE4611]">Atalaya</span>!
                </h2>

                <p className="leading-relaxed mb-6 text-gray-600 text-sm">
                    Tu cuenta y tu tablero <strong className="text-gray-800 font-semibold">{projectName}</strong> han sido configurados exitosamente. Estás listo para comenzar a gestionar tus clientes y hacer crecer tu negocio.
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
    )
}

export default JoinThanks