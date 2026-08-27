import { useEffect, useState, useRef } from "react"
import AuthRest from "../../actions/AuthRest"
import { toast } from "sonner"
import { Session } from "sode-extend-react"

const authRest = new AuthRest()

const JoinThanks = ({ data = {}, setData, step, setStep }) => {
    const [failed, setFailed] = useState(false)
    const [countdown, setCountdown] = useState(5)
    const [buildPhase, setBuildPhase] = useState(0) // 0: Init, 1: Columns, 2: Rows/Tags, 3: Compacting, 4: Ready
    const [currentActionText, setCurrentActionText] = useState('Iniciando arquitectura del tablero...')

    // Preserve summary info
    const summaryRef = useRef({
        projectName: data.projectName || 'Leads',
        statuses: data.statuses?.length ? data.statuses : ['Nuevo', 'Gestión', 'Decisión'],
        manageStatuses: data.manageStatuses?.length ? data.manageStatuses : ['Pendiente', 'Contactado', 'Calificado'],
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

            // Ensure the animation has at least 2.6s to display the full layering effect
            const elapsed = Date.now() - startTime
            const remainingDelay = Math.max(0, 2600 - elapsed)

            setTimeout(() => {
                clearStorage()
                setBuildPhase(4)
                setTimeout(() => {
                    setStep('thanks')
                }, 400)
            }, remainingDelay)
        } catch (error) {
            setFailed(true)
            toast('Error de conexión al inicializar la cuenta', { icon: <i className="mdi mdi-alert" /> })
        }
    }

    useEffect(() => {
        if (step === 'saving') {
            saveData()

            const t1 = setTimeout(() => {
                setBuildPhase(1)
                setCurrentActionText('Construyendo columnas y etapas del pipeline...')
            }, 600)

            const t2 = setTimeout(() => {
                setBuildPhase(2)
                setCurrentActionText('Indexando estados de gestión y temperaturas...')
            }, 1300)

            const t3 = setTimeout(() => {
                setBuildPhase(3)
                setCurrentActionText('Optimizando 35 procesos comerciales y flujos...')
            }, 2000)

            return () => {
                clearTimeout(t1)
                clearTimeout(t2)
                clearTimeout(t3)
            }
        }

        if (step === 'thanks') {
            clearStorage()
            const timer = setInterval(() => {
                setCountdown(prev => {
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

    if (step === 'saving') {
        return (
            <div className="h-full flex items-center justify-center py-6 px-4">
                <style>{`
                    @keyframes scanline {
                        0% { transform: translateY(-100%); }
                        100% { transform: translateY(300%); }
                    }
                    @keyframes pulse-glow {
                        0%, 100% { opacity: 0.4; transform: scale(1); }
                        50% { opacity: 0.8; transform: scale(1.02); }
                    }
                    @keyframes layer-in {
                        0% { opacity: 0; transform: translateY(12px) scale(0.97); }
                        100% { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    .animate-layer-in {
                        animation: layer-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    }
                    .animate-scan {
                        animation: scanline 2.2s linear infinite;
                    }
                `}</style>

                <div className="bg-white border border-gray-100 rounded-2xl max-w-lg w-full p-6 sm:p-7 text-center shadow-xl shadow-indigo-100/50 relative overflow-hidden">
                    {/* Glowing background ambient */}
                    <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#4621E1]/10 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#FE4611]/10 rounded-full blur-3xl pointer-events-none" />

                    {/* Header badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EEF2FF] border border-[#DBE0FF] text-[#4621E1] rounded-full text-xs font-semibold mb-4">
                        <span className="w-2 h-2 rounded-full bg-[#4621E1] animate-ping" />
                        <span>Sintetizando espacio de trabajo</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                        Construyendo <span className="text-[#4621E1]">{projectName}</span>
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500 mb-5 max-w-sm mx-auto">
                        {currentActionText}
                    </p>

                    {/* Dev-0 Style Layered Table Construction Mock */}
                    <div className="bg-[#0F172A] rounded-xl p-4 text-left border border-slate-800 shadow-inner relative overflow-hidden mb-5">
                        {/* Terminal Header dots */}
                        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-[11px] text-slate-400">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                                <span className="ml-2 font-mono text-slate-300">tablero://{projectName.toLowerCase().replace(/\s+/g, '-')}</span>
                            </div>
                            <span className="font-mono text-[10px] text-indigo-400 font-medium">
                                {buildPhase === 0 && 'Capa 1/4: Esquema'}
                                {buildPhase === 1 && 'Capa 2/4: Pipelines'}
                                {buildPhase === 2 && 'Capa 3/4: Estados'}
                                {buildPhase >= 3 && 'Capa 4/4: Compactando'}
                            </span>
                        </div>

                        {/* Scanner light beam */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-indigo-500/10 to-transparent h-16 pointer-events-none animate-scan" />

                        {/* Visual Table Layering */}
                        <div className="space-y-2 relative z-10">
                            {/* Layer 1: Column Headers */}
                            <div className="grid grid-flow-col auto-cols-fr gap-2 pb-1 border-b border-slate-800">
                                {statuses.slice(0, 4).map((st, i) => (
                                    <div
                                        key={i}
                                        className={`transition-all duration-300 font-mono text-[10px] px-2 py-1 rounded ${buildPhase >= 1 ? 'bg-slate-800/90 text-indigo-300 border border-indigo-500/30 animate-layer-in' : 'bg-slate-900/50 text-slate-600 border border-slate-800/40'}`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="truncate">{st}</span>
                                            {buildPhase >= 1 && <span className="text-emerald-400 text-[9px]">✓</span>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Layer 2: Rows / Lead Cards Docking */}
                            <div className="grid grid-flow-col auto-cols-fr gap-2 pt-1">
                                {statuses.slice(0, 4).map((st, i) => {
                                    const temps = [
                                        { name: 'Caliente', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30', icon: '🔥' },
                                        { name: 'Tibio', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/30', icon: '⚡' },
                                        { name: 'Frío', bg: 'bg-blue-500/20 text-blue-300 border-blue-500/30', icon: '❄️' },
                                        { name: 'Caliente', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/30', icon: '🔥' },
                                    ]
                                    const temp = temps[i % temps.length]

                                    return (
                                        <div key={i} className="space-y-1.5 min-h-[64px]">
                                            {buildPhase >= 2 ? (
                                                <div className="bg-slate-800/70 border border-slate-700/60 rounded-lg p-2 text-[10px] animate-layer-in shadow-sm">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-slate-200 font-medium font-mono text-[9px]">Lead #{i + 1}</span>
                                                        <span className={`text-[8px] px-1 py-0.5 rounded border ${temp.bg}`}>
                                                            {temp.icon}
                                                        </span>
                                                    </div>
                                                    <div className="h-1 w-full bg-slate-700 rounded mb-1 opacity-60" />
                                                    <div className="h-1 w-2/3 bg-slate-700 rounded opacity-40" />
                                                </div>
                                            ) : (
                                                <div className="border border-dashed border-slate-800/60 rounded-lg h-14 flex items-center justify-center">
                                                    <div className="w-3 h-3 border-2 border-indigo-400/40 border-t-indigo-400 rounded-full animate-spin" />
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>

                            {/* Layer 3: Compacting Footer Bar */}
                            <div className="pt-2 flex items-center justify-between text-[10px] font-mono text-slate-400 border-t border-slate-800/80">
                                <span className="flex items-center gap-1">
                                    <i className={`mdi ${buildPhase >= 3 ? 'mdi-check-circle text-emerald-400' : 'mdi-sync mdi-spin text-indigo-400'}`} />
                                    35 procesos comerciales listos
                                </span>
                                <span className="text-indigo-300 font-semibold">
                                    {buildPhase === 0 && '25%'}
                                    {buildPhase === 1 && '50%'}
                                    {buildPhase === 2 && '75%'}
                                    {buildPhase >= 3 && '100%'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden mb-3">
                        <div
                            className="bg-[#4621E1] h-full rounded-full transition-all duration-500 ease-out"
                            style={{
                                width: buildPhase === 0 ? '25%' : buildPhase === 1 ? '55%' : buildPhase === 2 ? '80%' : '100%'
                            }}
                        />
                    </div>

                    {failed && (
                        <button
                            onClick={saveData}
                            className="mt-3 inline-flex items-center gap-2 border-2 border-[#4621E1] bg-[#4621E1] hover:bg-opacity-90 transition-colors font-semibold text-white rounded-xl py-2.5 px-6 text-xs"
                        >
                            <i className="mdi mdi-refresh" />
                            Reintentar configuración
                        </button>
                    )}
                </div>
            </div>
        )
    }

    // Step 'thanks' - Compact, beautiful and preserving Atalaya's pure essence
    return (
        <div className="h-full flex items-center justify-center py-6 px-4">
            <div className="bg-white rounded-2xl max-w-sm w-full mx-auto p-6 sm:p-8 text-center shadow-lg border border-gray-100 transition-all">
                {/* Icon badge */}
                <i className="mdi mdi-check mdi-36px w-14 h-14 bg-[#DBE0FF] mx-auto mb-5 rounded-2xl flex items-center justify-center text-[#4621E1] shadow-inner" />

                <h2 className="text-3xl font-bold mb-3 text-gray-900 tracking-tight">
                    ¡Bienvenido a <span className="text-[#FE4611]">Atalaya</span>!
                </h2>

                <p className="leading-relaxed mb-6 text-gray-600 text-sm">
                    Tu cuenta y tu tablero <strong className="text-gray-800 font-semibold">{projectName}</strong> han sido configurados exitosamente. Estás listo para comenzar a gestionar tus clientes y hacer crecer tu negocio.
                </p>

                <div className="space-y-3 mb-6">
                    <a
                        href="/leads?first_time=1"
                        className="w-full block border-2 border-[#4621E1] bg-[#4621E1] hover:bg-opacity-90 transition-colors font-semibold text-white rounded-xl py-3 px-6 text-sm shadow-sm"
                    >
                        Ir al CRM
                    </a>
                    <p className="text-xs text-gray-500">
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