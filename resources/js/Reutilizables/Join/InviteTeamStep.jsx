import { useEffect, useState } from "react"
import InputContainer from "./InputContainer"

const InviteTeamStep = ({ data, setData, setStep }) => {
    const [emails, setEmails] = useState(data.emails ?? [])
    const [email, setEmail] = useState('')

    const onModalSubmit = () => {
        setData({ ...data, emails })
        setStep('dashboard')
    }

    useEffect(() => {
        setData({ ...data, emails })
    }, [emails])

    return <>
        <h2 className="text-4xl font-bold mb-2">Invita a tu equipo</h2>
        <p className="text text-gray-600 mb-8">Agrega miembros de tu equipo para colaborar (opcional)</p>

        <InputContainer
            className='items-end'
            label='Ingresa email'
            type="email"
            placeholder='hola@mail.com'
            value={email}
            onChange={(e) => {
                setEmail(e.target.value)
            }}
            onKeyDown={(e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (emailRegex.test(e.target.value)) {
                        setEmails([...new Set([...emails, e.target.value])]);
                        setEmail('');
                    }
                }
            }}
            required >
            <button className="text-sm font-semibold underline text-[#4621E1]" onClick={() => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (emailRegex.test(email)) {
                    setEmails([...new Set([...emails, email])]);
                    setEmail('');
                }
            }}>
                Agregar
            </button>
        </InputContainer>
        {
            emails.length > 0 &&
            <div className=" bg-[#EBEFFF] mt-6 rounded-xl">
                <div className="font-bold p-4 pb-0 text-sm">Miembros invitados:</div>
                <div className="px-4 pb-2">
                    {emails.map((email, index) => (
                        <div key={index} className={`flex items-center gap-2 border-gray-300 py-2 w-full ${index != 0 && 'border-t'}`}>
                            <div className="flex-1 truncate">
                                {email}
                            </div>
                            <button
                                className="flex-shrink-0 font-semibold text-sm text-red-600 hover:text-red-800"
                                onClick={() => {
                                    setEmails(emails.filter((e) => e != email));
                                }}
                            >
                                Eliminar
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        }
        <div className="text-xs text-gray-600 leading-tight mt-4">Puedes invitar más miembrodivespués desde la configuración de tu cuenta</div>

        <div className="flex w-full justify-end !mt-6">
            <button className="bg-[#4621E1] hover:bg-opacity-90 transition-colors text-white rounded-xl py-3 px-6" onClick={onModalSubmit}>{emails.length > 0 ? 'Siguiente' : 'Omitir'}</button>
        </div>
    </>
}

export default InviteTeamStep