import { useEffect, useState } from "react"
import AuthRest from "../../actions/AuthRest"
import { toast } from "sonner"

const authRest = new AuthRest()

const JoinThanks = ({ data, step, setStep }) => {

    const [failed, setFailed] = useState(false)
    const [loadingDots, setLoadingDots] = useState('.')
    const [countdown, setCountdown] = useState(10)

    const saveData = async () => {
        setFailed(false)
        const { status, message } = await authRest.init(data)
        if (!status) {
            setFailed(true)
            toast(message, { icon: <i className="mdi mdi-alert" /> })
            return
        }
        setStep('thanks')
    }

    useEffect(() => {
        if (step == 'saving') {
            saveData()

            // Animation interval for loading dots
            const interval = setInterval(() => {
                setLoadingDots(prev => {
                    if (prev === '.') return '..'
                    if (prev === '..') return '...'
                    return '.'
                })
            }, 500)

            return () => clearInterval(interval)
        }

        // Start countdown when registration is successful
        if (step === 'thanks') {
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

    return <div className="h-full grid items-center">
        <div className="bg-white rounded-xl max-w-sm w-full mx-auto p-6 text-center">
            <i className={`mdi ${step == 'saving' ? 'mdi-spin mdi-loading' : 'mdi-check'} mdi-36px w-14 h-14 bg-[#DBE0FF] mx-auto mb-6 rounded-2xl flex items-center justify-center text-[#4621E1]`} />
            <h2 className="text-4xl font-bold mb-4">
                {
                    step == 'saving'
                        ? `Configurando${loadingDots}`
                        : <>¡Bienvenido a <span className="text-[#FE4611]">Atalaya</span>!</>
                }
            </h2>
            <p className="leading-tight mb-6 text-gray-600">
                {
                    step == 'saving'
                        ? 'Estamos personalizando tu tablero de CRM, configurando tus preferencias iniciales y preparando todo para que puedas comenzar a gestionar tus clientes de manera efectiva'
                        : 'Tu cuenta ha sido configurada exitosamente. Estás listo para comenzar a gestionar tus clientes y hacer crecer tu negocio.'
                }
            </p>
            <div className="space-y-2 mb-6">
                {
                    step == 'saving'
                        ? <>
                            {
                                failed &&
                                <button className="w-full block border-2 border-[#4621E1] bg-[#4621E1] hover:bg-opacity-90 transition-colors font-semibold text-white rounded-xl py-3 px-6">
                                    <i className="mdi mdi-refresh me-1"></i>
                                    Reintentar
                                </button>
                            }
                        </>
                        : <>
                            <a href="/leads?first_time=1" className="w-full block border-2 border-[#4621E1] bg-[#4621E1] hover:bg-opacity-90 transition-colors font-semibold text-white rounded-xl py-3 px-6">
                                Ir al CRM
                            </a>
                            <p className="text-sm text-gray-600 mt-2">
                                Serás redirigido automáticamente en {countdown} segundos
                            </p>
                            {/* <button className="w-full block border-2 border-[#4621E1] transition-colors text-[#4621E1] hover:bg-[#4621E1] hover:text-white font-semibold rounded-xl py-3 px-6">
                                Ver tutorial
                            </button> */}
                        </>
                }
            </div>
            <p className="leading-tight text-[#4621E1] text-sm">
                <span className="font-bold">💡 Próximos pasos:</span> Importa tus contactos existentes o comienza agregando tu primer lead.</p>
        </div>
    </div>
}

export default JoinThanks