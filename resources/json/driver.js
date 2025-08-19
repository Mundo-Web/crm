import LaravelSession from "../js/Utils/LaravelSession"

const leads = [
    {
        element: '.driver-js-menu',
        popover: {
            title: "Menú Principal",
            description: "Bienvenido a tu centro de control. Desde aquí podrás navegar por todas las funciones del sistema.",
            nextBtnText: 'Continuar',
            prevBtnText: 'Saltar Tour',
            side: "left",
            align: "start",
            disableButtons: null,
            onPrevClick: (_, __, { driver }) => driver.destroy()
        }
    },
    {
        element: '.driver-js-new-leads-table',
        popover: {
            title: "Leads Nuevos",
            description: "Aquí aparecerán tus leads recién ingresados. ¡Es importante atenderlos rápidamente!",
            side: "bottom",
            align: "start",
            nextBtnText: 'Continuar',
            prevBtnText: 'Atrás'
        }
    },
    {
        element: '.driver-js-in-progress-table',
        popover: {
            title: "Leads Activos",
            description: "Esta es tu área de trabajo principal. Aquí verás todos los leads que estás gestionando actualmente.",
            side: "bottom",
            align: "start",
            nextBtnText: 'Continuar',
            prevBtnText: 'Atrás',
        }
    },
    {
        element: '.driver-js-account',
        popover: {
            title: "Tu Cuenta",
            description: "Personaliza tu experiencia. Ajusta tu perfil y preferencias según tus necesidades.",
            side: "bottom",
            align: "end",
            nextBtnText: 'Continuar',
            prevBtnText: 'Atrás',
        }
    },
    {
        element: '.driver-js-notifications',
        popover: {
            title: "Notificaciones",
            description: "No te pierdas nada importante. Aquí te mantendremos informado de todas las actualizaciones relevantes.",
            side: "bottom",
            align: "end",
            nextBtnText: 'Continuar',
            prevBtnText: 'Atrás',
            showButtons: ['next', 'prev']
        }
    },
    {
        element: '.driver-js-btn-new-lead',
        popover: {
            title: "¡Hora de la Acción!",
            description: 'Ahora te mostraré cómo crear un nuevo lead. Es un proceso muy sencillo, ¡ya verás!',
            nextBtnText: 'Comenzar',
            prevBtnText: 'Saltar',
            side: "left",
            align: "start",
            disableButtons: null,
            onPrevClick: (_, __, { driver }) => driver.destroy(),
            onNextClick: (target, _, { driver }) => {
                target.click()
                driver.moveNext()
            }
        }
    },
    {
        element: '.driver-js-lead-form',
        popover: {
            title: "Datos de Contacto",
            description: 'Para empezar, solo necesitamos un número de teléfono. No te preocupes por los demás campos, podrás completarlos más tarde.',
            side: "right",
            align: "start",
            nextBtnText: 'Continuar',
            prevBtnText: 'Atrás',
            onNextClick: (_, __, { driver }) => {
                let phone = $('#lead-phone').val()
                if (!phone) phone = '51900000000'
                $('#lead-phone').val(phone)
                driver.moveNext()
            }
        }
    },
    {
        element: '.driver-js-btn-save',
        popover: {
            title: "Guardar Información",
            description: 'Excelente. Ahora solo presiona "Guardar" y tu lead quedará registrado en el sistema.',
            side: "right",
            align: "start",
            nextBtnText: 'Continuar',
            prevBtnText: 'Atrás',
            onNextClick: (target, _, { driver }) => {
                $(target).parents('form').find('button[type="submit"]').trigger('click')
                driver.moveNext()
            }
        }
    },
    {
        element: '.driver-js-new-leads-table',
        popover: {
            title: "¡Perfecto!",
            description: "Has creado tu primer lead. Desde esta vista podrás gestionar todos tus leads de manera eficiente.",
            side: "bottom",
            align: "start",
            nextBtnText: 'Terminar',
            showButtons: ['next']
        }
    },
]
export default { leads }