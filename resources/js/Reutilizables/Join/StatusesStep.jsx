import { useEffect } from "react";
import AuthRest from "../../actions/AuthRest";
const statuses = [
    'Nuevo',
    'Gestión',
    'Reunión',
    'Propuesta',
    'Decisión',
]

const StatusesStep = ({ data, setData, setStep }) => {
    // Ensure 'Nuevo' status is always included in data.statuses
    useEffect(() => {
        if (!data.statuses || !data.statuses.includes('Nuevo')) {
            setData({
                ...data,
                statuses: ['Nuevo', ...(data.statuses || [])]
            });
        }
    }, []);

    const onModalSubmit = async (e) => {
        e.preventDefault()
        setStep('saving')
    }

    return <>
        <h2 className="text-4xl font-bold mb-2">
            Qué estapas de lead necesitar tener a la mano
        </h2>
        <p className="text text-gray-600 mb-8">Configura las etapas del embudo de conversión</p>

        <form className="mb-2" onSubmit={onModalSubmit}>
            <div className="relative flex flex-wrap gap-2 mb-6">
                {
                    structuredClone(statuses).map((status) => {
                        const selected = data.statuses?.includes(status)
                        const isNuevo = status === 'Nuevo'
                        return <div
                            key={status}
                            className={`group border-2 ${selected ? 'border-[#4621E1] bg-[#4621E1] bg-opacity-5' : 'border-[#BEC5FF]'} ps-3 py-1 pe-4 rounded-xl flex gap-1 items-center justify-center ${isNuevo ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'} transition-colors select-none`}
                            onClick={() => {
                                if (isNuevo) return; // Prevent clicking on 'Nuevo' status

                                const statusIndex = statuses.indexOf(status);
                                let newStatuses;

                                if (selected) {
                                    newStatuses = data.statuses?.filter(col => col !== status);
                                } else {
                                    newStatuses = [...(data.statuses ?? []), status].sort(
                                        (a, b) => statuses.indexOf(a) - statuses.indexOf(b)
                                    );
                                }

                                setData({ ...data, statuses: newStatuses });
                            }}>
                            <input
                                className="absolute left-1/2 bottom-0 -translate-x-1/2 opacity-0 h-[1px]"
                                type="radio"
                                name="medio"
                                checked={data.statuses?.includes(status)}
                                value={status}
                                required
                                onChange={() => { }}
                                disabled={isNuevo}
                            />
                            {
                                selected
                                    ? <i className="mdi text-xl flex items-center justify-center mdi-checkbox-marked-outline text-[#4621E1] transition-all"></i>
                                    : <i className="mdi text-xl flex items-center justify-center mdi-checkbox-blank-outline text-[#BEC5FF] transition-all"></i>
                            }
                            <span>{status}</span>
                        </div>
                    })
                }
            </div>
            <div className="w-full mt-2 overflow-x-auto">
                <div className="flex gap-4">
                    {data.statuses?.map((status, index) => (
                        <div key={index} className="flex-1 min-w-[150px] max-w-[150px]">
                            <div className="text-sm font-medium text-gray-600 mb-3">{status}</div>
                            <div className="space-y-2">
                                {[1, 2].map((item) => (
                                    <div key={item} className="bg-gray-200 h-16 rounded-lg animate-pulse p-2">
                                        <div className="h-4 w-3/4 bg-gray-300 rounded mb-2"></div>
                                        <div className="h-3 w-1/2 bg-gray-300 rounded"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <blockquote className="bg-[#EBEFFF] p-4 rounded-lg mt-6 w-full">
                <div className="font-bold mb-2">
                    <i className="mdi mdi-lightbulb me-2"></i>
                    Tip
                </div>
                <p className="text-sm leading-tight">Encontrarás todo tu contenido en los "tableros de Atalaya"</p>
            </blockquote>

            <div className="flex w-full justify-end !mt-6">
                <button type="submit" className="bg-[#4621E1] hover:bg-opacity-90 transition-colors text-white rounded-xl py-3 px-6">
                    Finalizar configuración
                </button>
            </div>
        </form>
    </>
}

export default StatusesStep