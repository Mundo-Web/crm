import InputContainer from "./InputContainer";
import DropDownContainer from "./DropDownContainer";
import AuthRest from "../../actions/AuthRest";
import { useState } from "react";
import Tippy from "@tippyjs/react";
import 'tippy.js/dist/tippy.css';
import Swal from "sweetalert2";

const authRest = new AuthRest()

const AccountStep = ({ data, setData, setStep, setService, jsEncrypt }) => {

    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState(false);
    const [invalid, setInvalid] = useState(null);
    const [invalidText, setInvalidText] = useState('');
    const [verified, setVerified] = useState(data.email)

    const onModalSubmit = async (e) => {
        e.preventDefault()

        if (!verified) {
            Swal.fire({
                title: 'Verificación requerida',
                text: 'Primero debes verificar tu correo electrónico',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Verificar ahora',
                cancelButtonText: 'Cancelar',
                customClass: {
                    confirmButton: 'bg-[#4621E1] text-white',
                    cancelButton: 'bg-[#FE4611] text-white'
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    onVerifyClicked()
                }
            })
            return
        }

        setLoading(true)
        setInvalid(null)
        const { status, message, type } = await authRest.userExists({
            email: data.email,
            password: jsEncrypt.encrypt(data.password),
            passwordConfirm: jsEncrypt.encrypt(data.passwordConfirm)
        })
        setLoading(false)
        if (!status) {
            setInvalid(type)
            setInvalidText(message)
            return
        }
        setStep('business')
    }

    const onVerifyClicked = async () => {
        setInvalid(null)
        setSending(true)
        const { status, message, summary } = await authRest.sendCode({
            email: data.preEmail
        })
        setSending(false)
        if (!status) {
            setInvalid(summary.type)
            setInvalidText(message)
            return
        }
        const { value } = await Swal.fire({
            title: 'Verificación de Correo',
            html: `
                <p class="text-base text-[#000938] leading-tight">Por favor, ingresa el código enviado a <b>${data.preEmail}</b> para verificar tu identidad y continuar con el registro</p>
            `,
            input: 'text',
            inputPlaceholder: 'Ingresa el código',
            inputAttributes: {
                maxlength: 6
            },
            showCancelButton: true,
            confirmButtonText: 'Verificar',
            cancelButtonText: 'Cancelar',
            showLoaderOnConfirm: true,
            preConfirm: async (code) => {
                if (!code) return Swal.showValidationMessage('El código es requerido')
                if (code.length < 6) return Swal.showValidationMessage('El código debe tener 6 caracteres')
                const { status, message } = await authRest.verifyEmail({
                    email: data.preEmail,
                    code: code
                })
                if (!status) Swal.showValidationMessage(message)
                setVerified(true)
                return data.preEmail
            },
            customClass: {
                popup: 'verification-modal',
                title: 'text-3xl font-bold text-[#000938]',
                input: 'text-base px-3 py-2 text-[#000938] uppercase text-center',
                confirmButton: 'bg-[#4621E1] text-white',
                cancelButton: 'bg-[#FE4611] text-white',
                loader: 'mdi mdi-loading mdi-spin'
            },
            didOpen: () => {
                // Add paste event listener to input
                const input = document.querySelector('.swal2-input');
                input.addEventListener('paste', (e) => {
                    e.preventDefault();
                    // Get pasted text and remove whitespace
                    const pastedText = e.clipboardData.getData('text').replace(/\s/g, '');
                    // Insert cleaned text
                    input.value = pastedText;
                });
            }
        })

        setData(old => ({ ...old, email: value }))
    }

    return <>
        <h2 className="text-4xl font-bold mb-2">Crea tu cuenta</h2>
        <p className="text text-gray-600 mb-8">Necesitamos algunos datos para personalizar tu experiencia</p>

        <form className="space-y-4 mb-2" onSubmit={onModalSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <DropDownContainer
                    label='Tipo de doc.'
                    icon="mdi mdi-badge-account-horizontal-outline"
                    value={data.documentType}
                    values={['DNI', 'CE']}
                    onChange={(e) => setData({ ...data, documentType: e.target.value })}
                    required
                    disabled={loading}
                />
                <div className="lg:col-span-2">
                    <InputContainer
                        label='Número de documento'
                        placeholder='00000000'
                        value={data.documentNumber}
                        onChange={(e) => setData({ ...data, documentNumber: e.target.value })}
                        required
                        disabled={loading} />
                </div>

            </div>
            <div className="grid md:grid-cols-2 gap-4">
                <InputContainer
                    label='Nombres'
                    placeholder='Nombre'
                    value={data.name}
                    onChange={(e) => setData({ ...data, name: e.target.value })}
                    required
                    disabled={loading} />
                <InputContainer
                    label='Apellidos'
                    placeholder='Apellido'
                    value={data.lastname}
                    onChange={(e) => setData({ ...data, lastname: e.target.value })}
                    required
                    disabled={loading} />
            </div>
            <div className="relative">
                <InputContainer
                    className='items-end'
                    label='E-mail'
                    placeholder='correo@ejemplo.com'
                    value={data.preEmail}
                    onChange={(e) => setData({ ...data, preEmail: e.target.value })}
                    invalid={invalid == 'email'}
                    invalidText={invalidText}
                    required
                    disabled={loading || sending || verified}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                            e.preventDefault();
                            onVerifyClicked();
                        }
                    }}>
                    {
                        verified
                            ? <i className="mdi mdi-check text-[#4621E1] font-bold"></i>
                            : <Tippy content='Verificar email'>
                                <button type="button" className="text-sm text-nowrap font-semibold underline text-[#4621E1] outline-none disabled:opacity-90 disabled:cursor-not-allowed" onClick={onVerifyClicked} disabled={sending}>
                                    {
                                        sending
                                            ? <>
                                                <i className="mdi mdi-spin mdi-loading"></i>
                                                Enviando código
                                            </>
                                            : 'Verificar'}
                                </button>
                            </Tippy>
                    }
                </InputContainer>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
                <InputContainer
                    label='Contraseña'
                    placeholder='••••••••'
                    type="password"
                    value={data.password}
                    onChange={(e) => setData({ ...data, password: e.target.value })}
                    invalid={invalid == 'password'}
                    invalidText={invalidText}
                    required
                    disabled={loading} />
                <InputContainer
                    label='Confirmar'
                    placeholder='••••••••'
                    type="password"
                    value={data.passwordConfirm}
                    onChange={(e) => setData({ ...data, passwordConfirm: e.target.value })}
                    invalid={invalid == 'password'}
                    invalidText={invalidText}
                    required
                    disabled={loading} />
            </div>

            <button type="submit" className="w-full !mt-6 bg-[#4621E1] hover:bg-opacity-90 transition-colors text-white rounded-xl py-3 disabled:cursor-not-allowed" disabled={loading}>
                {
                    loading
                        ? <><i className="mdi mdi-loading mdi-spin"></i> Verificando</>
                        : 'Continuar'
                }
            </button>
        </form>

        <div className="flex items-start justify-between mb-6">
            <p className="text-sm">
                Al continuar, aceptas nuestros <a href="#" className="text-[#fe4611] underline">Términos de servicio</a> y <a href="#" className="text-[#fe4611] underline">Políticas de Privacidad</a>
            </p>
            <Tippy content='Ya tiene una cuenta?'>
                <button
                    type="button"
                    onClick={() => setService(null)}
                    className="text-sm text-nowrap text-[#4621E1] hover:underline"
                >
                    Inicia sesión
                </button>
            </Tippy>
        </div>
        <div className="mb-2">
            <b className="block">¿Necesitas ayuda para elegir?</b>
            <span className="text-gray-600">Nuestro equipo está aquí para ayudarte.</span>
        </div>
        <a href="#" className="text-[#4621E1] underline">Hablar con Ventas</a>
    </>
}

export default AccountStep