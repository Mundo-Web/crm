import { useState } from "react"
import AuthRest from "../../actions/AuthRest"
import DropDownContainer from "./DropDownContainer"
import InputContainer from "./InputContainer"

const authRest = new AuthRest()

const BusinessStep = ({ data, setData, setStep, prefixes = [], jsEncrypt }) => {

    const [loading, setLoading] = useState(false)

    const onModalSubmit = async (e) => {
        e.preventDefault()

        setLoading(true)
        const result = await authRest.register({
            ...data,
            password: jsEncrypt.encrypt(data.password),
            passwordConfirm: jsEncrypt.encrypt(data.passwordConfirm)
        })
        setLoading(false)

        setStep('usage')
    }

    return <>
        <h2 className="text-4xl font-bold mb-2">Información de tu empresa</h2>
        <p className="text text-gray-600 mb-8">Completa los datos de tu empresa para personalizar tu experiencia</p>
        <form className="space-y-4 mb-6" onSubmit={onModalSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <InputContainer
                    label='RUC'
                    placeholder='00000000000'
                    value={data.ruc}
                    onChange={(e) => setData({ ...data, ruc: e.target.value })}
                    required />
                <div className="lg:col-span-2">
                    <InputContainer
                        label='Nombre Comercial'
                        placeholder='Mi Empresa'
                        value={data.commercialName}
                        onChange={(e) => setData({ ...data, commercialName: e.target.value })}
                        required />
                </div>
            </div>
            <InputContainer
                label='Razón Social'
                placeholder='Mi Empresa S.A.C.'
                value={data.businessName}
                onChange={(e) => setData({ ...data, businessName: e.target.value })}
                required />
            <InputContainer
                icon='mdi mdi-map-marker'
                label='Dirección'
                placeholder='Av. Empresarial 456, San Isidro'
                value={data.address}
                onChange={(e) => setData({ ...data, address: e.target.value })}
                required />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <DropDownContainer
                    label='Prefijo'
                    icon="mdi mdi-flag"
                    value={data.phonePrefix}
                    values={prefixes.map((prefix) => ({
                        value: prefix.realCode,
                        label: (<>
                            <span className="font-emoji w-6 inline-block">{prefix.flag}</span>
                            <span className="font-semibold">{prefix.country}</span>
                            <span className="text-gray-600 text-xs ms-1">{prefix.beautyCode}</span>
                        </>),
                    }))}
                    onChange={(e) => setData({ ...data, phonePrefix: e.target.value })}
                    searchable
                />
                <div className="lg:col-span-2">
                    <InputContainer
                        icon='mdi mdi-phone'
                        label='Teléfono'
                        placeholder='000000000'
                        type='tel'
                        value={data.phone}
                        onChange={(e) => setData({ ...data, phone: e.target.value })}
                        required />
                </div>
            </div>
            <button type="submit" className="w-full !mt-6 bg-[#4621E1] hover:bg-opacity-90 transition-colors text-white rounded-xl py-3">Continuar</button>
        </form>

        <blockquote className="bg-[#EBEFFF] p-4 rounded-lg mb-6">
            <div className="font-bold mb-2">
                <i className="mdi mdi-lightbulb me-2"></i>
                Tip
            </div>
            <p className="text-sm leading-tight">Esta información nos ayudará a configurar tu CRM con las mejores prácticas para tu industria.</p>
        </blockquote>

        <div className="mb-2">
            <b className="block">¿Necesitas ayuda para elegir?</b>
            <span className="text-gray-600">Nuestro equipo está aquí para ayudarte.</span>
        </div>
        <a href="#" className="text-[#4621E1] underline">Hablar con Ventas</a>
    </>
}

export default BusinessStep