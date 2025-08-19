import LaravelSession from "../js/Utils/LaravelSession"

console.log(LaravelSession.name)

const leads = [
    {
        element: '[driver-js="1"]',
        popover: {
            title: "¡Bienvenido al Gestor de Leads! 👋",
            description: '¡Empecemos a crear tu primer lead! Te guiaré paso a paso en este proceso sencillo y rápido.',
            nextBtnText: 'Empezar ⇀',
            prevBtnText: 'Saltar Tour',
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
        element: '[driver-js="2"]',
        popover: {
            title: "Información de Contacto 📱",
            description: '¡Es muy fácil! Solo necesitas ingresar un número de celular para empezar. Los demás datos los puedes completar después.',
            side: "right",
            align: "start",
            nextBtnText: 'Siguiente',
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
        element: '.driver-js-3',
        popover: {
            title: "¡Guarda tu Lead! 💾",
            description: 'Haz clic en el botón "Guardar" para registrar la información de tu lead en el sistema.',
            side: "right",
            align: "start",
            nextBtnText: 'Siguiente',
            prevBtnText: 'Atrás',
            onNextClick: (target, _, { driver }) => {
                $(target).parents('form').find('button[type="submit"]').trigger('click')
                driver.moveNext()
            }
        }
    },
    {
        element: '.driver-js-4',
        popover: {
            title: "¡Lead Creado con Éxito! 🎉",
            description: "Aquí podrás ver todos tus leads registrados. Puedes ordenarlos, filtrarlos y gestionar su información fácilmente.",
            side: "bottom",
            align: "start",
            nextBtnText: 'Listo',
            showButtons: ['next']
        }
    },
]

export default { leads }