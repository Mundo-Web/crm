import { useEffect, useState, useRef } from "react"
import AuthRest from "../../actions/AuthRest"
import { toast } from "sonner"
import { Session } from "sode-extend-react"

const authRest = new AuthRest()

const JoinThanks = ({ data = {}, setData, step, setStep }) => {
    const [failed, setFailed] = useState(false)
    const [countdown, setCountdown] = useState(6)
    const [progress, setProgress] = useState(15)
    const [activeStage, setActiveStage] = useState(0)

    // Preserve summary info for thanks screen even after clearing data
    const summaryRef = useRef({
        projectName: data.projectName || 'Leads',
        statuses: data.statuses?.length ? data.statuses : ['Nuevo', 'Gestión', 'Decisión'],
        manageStatuses: data.manageStatuses?.length ? data.manageStatuses : ['Pendiente', 'Contactado'],
    })

    const stages = [
        { label: 'Estructurando tablero y vistas', icon: 'mdi-view-dashboard-outline' },
        { label: `Configurando etapas del Pipeline (${summaryRef.current.statuses.length} etapas)`, icon: 'mdi-view-column-outline' },
        { label: 'Asignando estados de gestión y etiquetas', icon: 'mdi-tag-multiple-outline' },
        { label: 'Creando temperaturas de lead (Caliente, Tibio, Frío)', icon: 'mdi-fire' },
        { label: 'Cargando 35 procesos y flujos de conversión', icon: 'mdi-check-all' },
    ]

    const clearStorage = () => {
        try {
            Session.delete('join-data')
            Session.set('join-data', {})
            localStorage.removeItem('join-data')
            sessionStorage.removeItem('join-data')
        } catch (e) {
            console.error('Error clearing storage:', e)
        }
        if (setData) {
            setData({})
        }
    }

    const saveData = async () => {
        setFailed(false)
        try {
            const { status, message } = await authRest.init(data)
            if (!status) {
                setFailed(true)
                toast(message || 'Ocurrió un error al guardar la configuración', { icon: <i className="mdi mdi-alert" /> })
                return
            }
            // Clear storage immediately upon success
            clearStorage()
            setProgress(100)
            setActiveStage(stages.length)
            setTimeout(() => {
                setStep('thanks')
            }, 600)
        } catch (error) {
            setFailed(true)
            toast('Error de conexión al inicializar la cuenta', { icon: <i className="mdi mdi-alert" /> })
        }
    }

    useEffect(() => {
        if (step === 'saving') {
            saveData()

            // Simulated progress stages
            const progressTimer = setInterval(() => {
                setProgress(prev => {
                    if (prev < 90) return prev + 15
                    return prev
                })
            }, 500)

            const stageTimer = setInterval(() => {
                setActiveStage(prev => {
                    if (prev < stages.length - 1) return prev + 1
                    return prev
                })
            }, 700)

            return () => {
                clearInterval(progressTimer)
                clearInterval(stageTimer)
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
            <div className="w-full max-w-2xl mx-auto py-4">
                {/* Header */}
                <div className="text-center mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#EEF2FF] text-[#4621E1] rounded-full text-xs font-semibold mb-3">
                        <i className="mdi mdi-loading mdi-spin text-sm" />
                        <span>Configurando tu espacio de trabajo</span>
                    </div>
                    <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
                        Construyendo tablero: <span className="text-[#4621E1]">{projectName}</span>
                    </h2>
                    <p className="text-sm text-gray-500 max-w-md mx-auto">
                        Estamos generando tus pipelines, temperaturas y procesos comerciales personalizados...
                    </p>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-gray-100 h-2.5 rounded-full mb-6 overflow-hidden">
                    <div
                        className="bg-[#4621E1] h-full rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Live Mock Board Construction Preview */}
                <div className="bg-[#F8FAFC] border border-gray-200 rounded-2xl p-5 shadow-sm mb-6">
                    <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-200">
                        <div className="flex items-center gap-2">
                            <i className="mdi mdi-view-dashboard text-[#4621E1] text-lg" />
                            <span className="font-bold text-gray-800 text-sm">{projectName}</span>
                        </div>
                        <span className="text-xs px-2.5 py-0.5 bg-emerald-50 text-emerald-600 font-medium rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            En vivo
                        </span>
                    </div>

                    {/* Columns Preview */}
                    <div className="grid grid-flow-col auto-cols-[minmax(140px,1fr)] gap-3 overflow-x-auto pb-2">
                        {statuses.map((statusName, idx) => {
                            const isReady = activeStage >= 1
                            const tempTags = [
                                { name: 'Caliente', color: '#EF4444', icon: 'mdi-fire' },
                                { name: 'Tibio', color: '#F59E0B', icon: 'mdi-lightning-bolt' },
                                { name: 'Frío', color: '#3B82F6', icon: 'mdi-snowflake' }
                            ]
                            const temp = tempTags[idx % tempTags.length]

                            return (
                                <div
                                    key={idx}
                                    className={`bg-white rounded-xl p-3 border transition-all duration-300 ${isReady ? 'border-gray-200 shadow-sm opacity-100' : 'border-dashed border-gray-300 opacity-60'}`}
                                >
                                    <div className="flex items-center justify-between mb-2.5">
                                        <span className="font-semibold text-xs text-gray-700 truncate">{statusName}</span>
                                        <span className="w-2 h-2 rounded-full bg-[#4621E1]" />
                                    </div>

                                    {/* Mock Cards inside column */}
                                    <div className="space-y-2">
                                        <div className="bg-[#F8FAFC] rounded-lg p-2 border border-gray-100 text-[11px]">
                                            <div className="flex items-center justify-between mb-1.5">
                                                <span className="font-medium text-gray-800">Lead #{idx + 1}</span>
                                                <span
                                                    className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded font-semibold text-white"
                                                    style={{ backgroundColor: temp.color }}
                                                >
                                                    <i className={`mdi ${temp.icon} text-[10px]`} />
                                                    {temp.name}
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-3/4 bg-gray-200 rounded animate-pulse mb-1" />
                                            <div className="h-1.5 w-1/2 bg-gray-200 rounded animate-pulse" />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Steps Checklist */}
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-2">
                    {stages.map((st, i) => {
                        const isDone = activeStage > i
                        const isCurrent = activeStage === i

                        return (
                            <div key={i} className="flex items-center gap-3 text-xs">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${isDone ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-[#4621E1] text-white animate-pulse' : 'bg-gray-100 text-gray-400'}`}>
                                    {isDone ? (
                                        <i className="mdi mdi-check text-xs font-bold" />
                                    ) : isCurrent ? (
                                        <i className="mdi mdi-loading mdi-spin text-xs" />
                                    ) : (
                                        <i className={`mdi ${st.icon} text-xs`} />
                                    )}
                                </div>
                                <span className={`flex-1 ${isDone ? 'text-gray-700 font-medium' : isCurrent ? 'text-[#4621E1] font-semibold' : 'text-gray-400'}`}>
                                    {st.label}
                                </span>
                            </div>
                        )
                    })}
                </div>

                {failed && (
                    <div className="mt-4 text-center">
                        <button
                            onClick={saveData}
                            className="inline-flex items-center gap-2 border-2 border-[#4621E1] bg-[#4621E1] hover:bg-opacity-90 transition-colors font-semibold text-white rounded-xl py-2.5 px-6 text-sm"
                        >
                            <i className="mdi mdi-refresh" />
                            Reintentar configuración
                        </button>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className="h-full grid items-center py-6">
            <div className="bg-white rounded-2xl max-w-md w-full mx-auto p-8 text-center shadow-lg border border-gray-100">
                {/* Success Badge */}
                <div className="w-16 h-16 bg-[#EEF2FF] mx-auto mb-5 rounded-2xl flex items-center justify-center text-[#4621E1] shadow-inner">
                    <i className="mdi mdi-check-decagram text-3xl text-[#4621E1]" />
                </div>

                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
                    ¡Bienvenido a <span className="text-[#FE4611]">Atalaya</span>!
                </h2>
                <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                    Tu tablero <strong className="text-gray-800 font-semibold">{projectName}</strong> y tus etapas comerciales han sido configurados exitosamente.
                </p>

                {/* Summary Box */}
                <div className="bg-[#F8FAFC] border border-gray-200 rounded-xl p-4 mb-6 text-left text-xs space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Tablero inicial:</span>
                        <span className="font-semibold text-gray-800">{projectName}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Etapas en Pipeline:</span>
                        <span className="font-semibold text-gray-800 truncate max-w-[200px]" title={statuses.join(' → ')}>
                            {statuses.join(' → ')}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Temperaturas:</span>
                        <span className="font-semibold text-gray-800">Caliente, Tibio, Frío</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Procesos listos:</span>
                        <span className="font-semibold text-emerald-600">35 actividades</span>
                    </div>
                </div>

                <div className="space-y-3 mb-6">
                    <a
                        href="/leads?first_time=1"
                        className="w-full block bg-[#4621E1] hover:bg-opacity-95 transition-all text-white font-semibold rounded-xl py-3 px-6 shadow-md shadow-indigo-100 text-sm"
                    >
                        Entrar a mi tablero ({projectName})
                    </a>
                    <p className="text-xs text-gray-500">
                        Redirigiendo automáticamente en <span className="font-bold text-[#4621E1]">{countdown}</span> segundos...
                    </p>
                </div>

                <div className="pt-4 border-t border-gray-100 text-xs text-gray-500 flex items-center justify-center gap-1.5">
                    <i className="mdi mdi-lightbulb-on text-amber-500" />
                    <span>Importa tus leads desde Excel o agrégalos manualmente.</span>
                </div>
            </div>
        </div>
    )
}

export default JoinThanks