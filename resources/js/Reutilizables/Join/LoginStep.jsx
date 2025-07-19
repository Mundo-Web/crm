import { useState } from "react"
import AuthRest from "../../actions/AuthRest"
import InputContainer from "./InputContainer"
import { toast, Toaster } from "sonner"
import ServicesModal from "../Services/ServicesModal"
import Global from "../../Utils/Global"

const authRest = new AuthRest()

const LoginStep = ({ jsEncrypt, services, setService }) => {
    const [email, setEmail] = useState(null);
    const [password, setPassword] = useState(null);
    const [serviceModalOpen, setServiceModalOpen] = useState(false)

    const onLoginSubmit = async (e) => {
        e.preventDefault()
        console.log({ email, password })
        const { status, message, data } = await authRest.login({
            email: jsEncrypt.encrypt(email),
            password: jsEncrypt.encrypt(password)
        })
        if (!status) toast(message, { icon: <i className="mdi mdi-alert text-[#FE4611]"></i> })
        if (!data) {
            location.reload()
        } else {
            location.href = `//${data}.${Global.APP_DOMAIN}/join`
        }
    }
    return <>
        <Toaster />
        <div className="h-full grid items-center">
            <div className="bg-white block rounded-xl max-w-sm w-full mx-auto p-6 shadow-lg">
                <i className="mdi mdi-account mdi-36px w-14 h-14 bg-[#DBE0FF] mx-auto mb-6 rounded-2xl flex items-center justify-center text-[#4621E1]"></i>
                <h2 className="text-3xl font-bold mb-2 text-center w-full">
                    Bienvenido a Atala<span className="text-[#FE4611]">y</span>a
                </h2>
                <p className="text-gray-600 text-center mb-6">Tu plataforma de gestión integral</p>
                <form className="space-y-4 mb-6" onSubmit={onLoginSubmit}>
                    <InputContainer
                        label='Correo Electrónico'
                        icon='mdi mdi-email'
                        placeholder='correo@ejemplo.com'
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required />
                    <InputContainer
                        label='Contraseña'
                        icon='mdi mdi-lock'
                        placeholder='••••••••'
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required />
                    <div className="flex justify-end">
                        <button type="button" className="text-sm text-gray-600 hover:text-[#4621E1]">
                            ¿Olvidaste tu contraseña?
                        </button>
                    </div>
                    <button
                        type="submit"
                        className="w-full block border-2 border-[#4621E1] bg-[#4621E1] hover:bg-opacity-90 transition-colors font-semibold text-white rounded-xl py-2 px-6"
                    >
                        Iniciar Sesión
                    </button>
                </form>
                <div className="text-center space-y-4">
                    {/* <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-gray-300"></div>
                    </div>
                    <div className="relative flex justify-center">
                        <span className="bg-white px-4 text-sm text-gray-500">O continúa con</span>
                    </div>
                </div>
                <div className="flex justify-center space-x-4">
                    <button className="p-2 border rounded-lg hover:bg-gray-50">
                        <i className="mdi mdi-google text-xl"></i>
                    </button>
                    <button className="p-2 border rounded-lg hover:bg-gray-50">
                        <i className="mdi mdi-microsoft text-xl"></i>
                    </button>
                </div> */}
                    <button className="text-[#4621E1] hover:underline text-sm" onClick={() => setServiceModalOpen(true)}>
                        ¿No tienes una cuenta? Regístrate
                    </button>
                </div>
            </div>
        </div>
        <ServicesModal
            modalOpen={serviceModalOpen}
            onRequestClose={() => setServiceModalOpen(false)}
            services={services}
            onServiceClicked={(service) => setService(service)} />
    </>
}

export default LoginStep