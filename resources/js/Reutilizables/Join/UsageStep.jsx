import Swal from "sweetalert2"

const types = [
    {
        key: 'personal',
        icon: 'mdi mdi-account-outline',
        name: 'Personal',
        description: 'Para uso individual y freelancers'
    },
    {
        key: 'startup',
        icon: 'mdi mdi-flash-outline',
        name: 'Emprendimiento',
        description: 'Para startups y proyectos emergentes'
    },
    {
        key: 'business',
        icon: 'mdi mdi-account-group-outline',
        name: 'Negocio',
        description: 'Para empresas y equipos comerciales'
    }
]

const UsageStep = ({ data, setData, setStep }) => {
    const onModalSubmit = (e) => {
        e.preventDefault()
        if (!data.accountType) {
            Swal.fire({
                icon: 'warning',
                title: 'Atención',
                text: 'Por favor selecciona una opción antes de continuar'
            })
            return
        }
        setStep('survey')
    }

    return <>
        <h2 className="text-4xl font-bold mb-2">Hola, ¿cómo planeas usar Atalaya CRM?</h2>
        <p className="text text-gray-600 mb-8">Esto nos ayudará a personalizar tu experiencia</p>

        <form className="space-y-4 mb-2" onSubmit={onModalSubmit}>
            <div className="relative space-y-4">
                {
                    types.map((type) => {
                        return <div key={type.key} className="select-none">
                            <input
                                type="radio"
                                name="accountType"
                                id={`type-${type.key}`}
                                value={type.key}
                                checked={type.key == data.accountType}
                                className="opacity-0 peer absolute left-1/2 bottom-0 -translate-x-1/2"
                                onChange={(e) => setData({ ...data, accountType: e.target.value })}
                                required
                            />
                            <label
                                htmlFor={`type-${type.key}`}
                                className="p-4 group flex items-center gap-2 border-2 border-[#BEC5FF] rounded-xl bg-white cursor-pointer transition-colors peer-checked:border-[#4621E1]"
                            >
                                <i className={`${type.icon} text-2xl w-10 h-10 rounded-lg flex items-center justify-center ${type.key == data.accountType ? 'bg-[#4621E1] text-white' : 'bg-[#DBE0FF] text-[#4621E1]'} transition-colors`}></i>
                                <div className="flex-1">
                                    <b className="block">{type.name}</b>
                                    <small className="block">{type.description}</small>
                                </div>
                            </label>
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

export default UsageStep