import Swal from "sweetalert2"

const medios = [
    'Google', 'Redes sociales', 'Recomendación',
    'Publicidad online', 'Blog o artículo',
    'Evento o conferencia', 'Otro'
]

const SurveyStep = ({ data, setData, setStep }) => {
    const onModalSubmit = (e) => {
        e.preventDefault()
        if (!data.medio) {
            Swal.fire({
                icon: 'warning',
                title: 'Atención',
                text: 'Por favor selecciona una opción antes de continuar'
            })
            return
        }
        setStep('invite-team')
    }

    return <>
        <h2 className="text-4xl font-bold mb-2">
            Una última pregunta<br />
            ¿Cómo supiste de nosotros?
        </h2>
        <p className="text text-gray-600 mb-8">Nos ayuda a entender mejor a nuestros usuarios</p>

        <form className="space-y-4" onSubmit={onModalSubmit}>
            <div className="flex flex-wrap gap-2 relative">
                {
                    medios.map((medio) => {
                        const selected = data.medio == medio
                        return <div key={medio} className={`group border-2 ${selected ? 'border-[#4621E1] bg-[#4621E1] bg-opacity-5' : 'border-[#BEC5FF]'} ps-3 py-1 pe-4 rounded-xl flex gap-1 items-center justify-center cursor-pointer transition-colors`}
                            onClick={() => setData({ ...data, medio })} >
                            <input className="absolute left-1/2 bottom-0 -translate-x-1/2 opacity-0"
                                type="radio" name="medio" checked={data.medio?.includes(medio)} value={medio} onChange={() => { }} required />
                            {
                                selected
                                    ? <i className="mdi text-xl flex items-center justify-center mdi-check-circle text-[#4621E1] transition-all"></i>
                                    : <i className="mdi text-xl flex items-center justify-center mdi-circle-outline text-[#BEC5FF] transition-all"></i>
                            }
                            <span>{medio}</span>
                        </div>
                    })
                }
            </div>
            <div className="flex w-full justify-end !mt-6">
                <button type="submit" className="bg-[#4621E1] hover:bg-opacity-90 transition-colors text-white rounded-xl py-3 px-6">Siguiente</button>
            </div>
        </form>
    </>
}

export default SurveyStep