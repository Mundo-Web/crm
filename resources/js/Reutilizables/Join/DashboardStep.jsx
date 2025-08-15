import InputContainer from "./InputContainer"

const DashboardStep = ({ data, setData, setStep }) => {
    const onModalSubmit = (e) => {
        e.preventDefault()
        setStep('columns')
    }

    return <>
        <h2 className="text-4xl font-bold mb-2">
            Empecemos a trabajar <br />
            Nombre de tu tablero
        </h2>
        <p className="text text-gray-600 mb-8">Dale un nombre a tu tablero, por ejemplo, Plan de marketing, proceso de ventas, hoja de ruta trim....</p>

        <form onSubmit={onModalSubmit}>
            <InputContainer
                className='items-end'
                label='Nombre de tu proyecto'
                placeholder='Mi primer proyecto'
                value={data.projectName}
                onChange={(e) => {
                    setData({ ...data, projectName: e.target.value })
                }}
                required />

            <div className="w-full mt-4 overflow-x-auto">
                <h4 className="font-semibold">{data.projectName || 'Leads'}</h4>
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b">
                            {data.columns?.length ? (
                                data.columns.map((column, index) => (
                                    <th key={index} className="p-3 text-left text-sm font-medium text-gray-600 text-nowrap">
                                        {column}
                                    </th>
                                ))
                            ) : (
                                <th className="p-3 text-left text-sm font-medium text-gray-600 text-nowrap">
                                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {[1, 2].map((row) => (
                            <tr key={row} className="border-b">
                                {data.columns?.length ? (
                                    data.columns.map((_, index) => (
                                        <td key={index} className="p-3">
                                            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                                        </td>
                                    ))
                                ) : (
                                    <td className="p-3">
                                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <blockquote className="bg-[#EBEFFF] p-4 rounded-lg mt-6">
                <div className="font-bold mb-2">
                    <i className="mdi mdi-lightbulb me-2"></i>
                    Tip
                </div>
                <p className="text-sm leading-tight">Encontrarás todo tu contenido en los “tableros de Atalaya</p>
            </blockquote>

            <div className="flex w-full justify-end !mt-6">
                <button type="submit" className="bg-[#4621E1] hover:bg-opacity-90 transition-colors text-white rounded-xl py-3 px-6">Siguiente</button>
            </div>
        </form>
    </>
}

export default DashboardStep