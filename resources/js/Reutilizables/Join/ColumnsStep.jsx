const columns = [
    'Lead', 'Responsable', 'Correo',
    'Teléfono', 'Estado de gestión', 'Estado del lead',
    'Origen', 'A través de', 'Fecha de creación'
]

const ColumnsStep = ({ data, setData, setStep }) => {

    const onModalSubmit = (e) => {
        e.preventDefault()
        setStep('manage')
    }

    return <>
        <h2 className="text-4xl font-bold mb-2">
            Selecciona las columnas relevantes para tu tablero
        </h2>
        <p className="text text-gray-600 mb-8">Selecciona qué información quieres ver en tu CRM</p>

        <form className="flex flex-wrap gap-2 mb-2" onSubmit={onModalSubmit}>
            <div className="relative flex flex-wrap gap-2">
                {
                    columns.map((column) => {
                        const selected = data.columns?.includes(column)
                        return <div key={column} className={`group border-2 ${selected ? 'border-[#4621E1] bg-[#4621E1] bg-opacity-5' : 'border-[#BEC5FF]'} ps-3 py-1 pe-4 rounded-xl flex gap-1 items-center justify-center cursor-pointer transition-colors`}
                            onClick={() => {
                                const newColumns = selected
                                    ? data.columns?.filter(col => col !== column)
                                    : [...(data.columns ?? []), column]

                                const sortedColumns = newColumns
                                    .filter(x => columns.includes(x))
                                    .sort((a, b) => columns.indexOf(a) - columns.indexOf(b))

                                setData({ ...data, columns: sortedColumns })
                            }}>
                            <input className="absolute left-1/2 bottom-0 -translate-x-1/2 opacity-0 h-[1px]"
                                type="radio" name="medio" checked={data.columns?.includes(column)} value={column} required onChange={() => { }} />
                            {
                                selected
                                    ? <i className="mdi text-xl flex items-center justify-center mdi-checkbox-marked-outline text-[#4621E1] transition-all"></i>
                                    : <i className="mdi text-xl flex items-center justify-center mdi-checkbox-blank-outline text-[#BEC5FF] transition-all"></i>
                            }
                            <span>{column}</span>
                        </div>
                    })
                }
            </div>
            <div className="w-full mt-2 overflow-x-auto">
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b">
                            {data.columns?.map((column, index) => (
                                <th key={index} className="p-3 text-left text-sm font-medium text-gray-600 text-nowrap">
                                    {column}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {[1, 2].map((row) => (
                            <tr key={row} className="border-b">
                                {data.columns?.map((_, index) => (
                                    <td key={index} className="p-3">
                                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
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

export default ColumnsStep