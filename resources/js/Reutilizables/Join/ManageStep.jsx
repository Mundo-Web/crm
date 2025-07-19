import { useEffect } from "react"

const manageStatuses = [
    'Pendiente',
    'Atendiendo',
    'No responde',
    'Sin presupuesto',
]

const ManageStep = ({ data, setData, setStep }) => {
    // Initialize manageStatuses with 'Pendiente' if not present
    useEffect(() => {
        if (!data.manageStatuses || !data.manageStatuses.includes('Pendiente')) {
            setData({
                ...data,
                manageStatuses: ['Pendiente', ...(data.manageStatuses || [])]
            })
        }
    }, [])

    const onModalSubmit = (e) => {
        e.preventDefault()
        setStep('statuses')
    }

    return <>
        <h2 className="text-4xl font-bold mb-2">
            Que estados de gestion quieres ver en tu tablero
        </h2>
        <p className="text text-gray-600 mb-8">Define los estados para organizar tu proceso de ventas</p>

        <form className="mb-2" onSubmit={onModalSubmit}>
            <div className="relative flex flex-wrap gap-2">
                {
                    manageStatuses.map((status) => {
                        const isPendiente = status === 'Pendiente'
                        const selected = isPendiente || data.manageStatuses?.includes(status)
                        return <div key={status} 
                            className={`group border-2 ${selected ? 'border-[#4621E1] bg-[#4621E1] bg-opacity-5' : 'border-[#BEC5FF]'} ps-3 py-1 pe-4 rounded-xl flex gap-1 items-center justify-center ${isPendiente ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'} transition-colors`}
                            onClick={() => {
                                if (isPendiente) return // Prevent clicking on Pendiente status
                                const newStatuses = selected
                                    ? data.manageStatuses?.filter(col => col !== status)
                                    : [...(data.manageStatuses ?? []), status]
                                setData({ ...data, manageStatuses: newStatuses })
                            }}>
                            <input className="absolute left-1/2 bottom-0 -translate-x-1/2 opacity-0 h-[1px]"
                                type="radio" name="medio" checked={selected} value={status} required onChange={() => { }} />
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
            <blockquote className="bg-[#EBEFFF] p-4 rounded-lg mt-6 w-full">
                <div className="font-bold mb-2">
                    <i className="mdi mdi-lightbulb me-2"></i>
                    Tip
                </div>
                <p className="text-sm leading-tight">Averigua de un vistazo cuándo y quién actualizó el trabajo por última vez</p>
            </blockquote>

            <div className="flex w-full justify-end !mt-6">
                <button type="submit" className="bg-[#4621E1] hover:bg-opacity-90 transition-colors text-white rounded-xl py-3 px-6">Siguiente</button>
            </div>
        </form>
    </>
}

export default ManageStep