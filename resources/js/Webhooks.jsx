import React, { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import CreateReactScript from "./Utils/CreateReactScript.jsx";
import Adminto from "./components/Adminto.jsx";
import Tippy from "@tippyjs/react";
import { Clipboard } from "sode-extend-react";
import Swal from "sweetalert2";
import Global from "./Utils/Global.js";
import IntegrationsRest from "./actions/IntegrationsRest.js";
import Modal from "./components/Modal.jsx";
import { toast } from "sonner";

const integrationsRest = new IntegrationsRest();

const icons = {
    forms: (
        <img
            src="/assets/img/meta.png"
            alt="Formularios de Meta"
            style={{ height: "200px", width: "auto" }}
        />
    ),
    messenger: (
        <img
            src="/assets/img/messenger.svg"
            alt="Messenger"
            style={{ height: "200px", width: "auto" }}
        />
    ),
    instagram: (
        <img
            src="/assets/img/instagram.svg"
            alt="Instagram"
            style={{ height: "200px", width: "auto" }}
        />
    ),
    whatsapp: (
        <img
            src="/assets/img/wa-business.svg"
            alt="WhatsApp"
            style={{ height: "200px", width: "auto" }}
        />
    ),
    // 'whatsappevo': (
    //   <img src="/assets/img/whatsapp.svg" alt="WhatsApp" style={{ height: '200px', width: 'auto' }} />
    // ),
    tiktok: (
        <img
            src="/assets/img/tiktok.svg"
            alt="TikTok"
            style={{ height: "200px", width: "auto", opacity: 0.5 }}
        />
    ),
    gmail: (
        <img
            src="/assets/img/gmail.svg"
            alt="Gmail"
            style={{ height: "200px", width: "auto" }}
        />
    ),
    "google-calendar": (
        <img
            src="/assets/img/calendar.svg"
            alt="Google Calendar"
            style={{ height: "200px", width: "auto", opacity: 0.5 }}
        />
    ),
    formularios: (
        <img
            src="/assets/img/website.svg"
            alt="Formularios"
            style={{ height: "200px", width: "auto" }}
        />
    ),
};

const ServiceCard = ({
    service,
    icon,
    description,
    integration,
    onIntegrate,
    onUnlink,
}) => {
    const isComingSoon = service === "tiktok" || service === "google-calendar";

    return (
        <div className="col-xxl-3 col-xl-4 col-lg-6 col-md-6 ">
            <div className="card">
                <div className="card-body">
                    <div className="d-flex align-items-center justify-content-center mb-3">
                        <h4 className="mt-0 mb-1">{service.toTitleCase()}</h4>
                    </div>
                    <div className="d-flex align-items-center justify-content-center mb-3">
                        <div className="">
                            <span className="avatar-title rounded p-2 d-flex align-items-center justify-content-center text-primary">
                                {icon}
                            </span>
                        </div>
                    </div>
                    {integration?.meta_business_name ? (
                        <div className="d-flex align-items-center justify-content-between">
                            <div className="d-flex align-items-center flex-grow-1">
                                <img
                                    className="avatar-sm rounded-circle me-2"
                                    src={`/api/integrations/media/${integration.meta_business_profile}`}
                                    alt={integration.meta_business_name}
                                    onError={(e) =>
                                        (e.target.src = `//${Global.APP_DOMAIN}/api/logo/thumbnail/null`)
                                    }
                                />
                                <div
                                    className="overflow-hidden"
                                    style={{ maxWidth: "160px" }}
                                >
                                    <h5 className="mb-0 text-truncate">
                                        {integration.meta_business_name}
                                    </h5>
                                    <small className="text-muted">
                                        {integration.leads_count ?? 0} lead(s)
                                        generados
                                    </small>
                                </div>
                            </div>
                            <div className="d-flex gap-1 ms-2">
                                <Tippy content="Editar Configuración">
                                    <button
                                        className="btn btn-link text-primary p-0"
                                        type="button"
                                        onClick={() =>
                                            onIntegrate(service, integration)
                                        }
                                    >
                                        <i className="mdi mdi-pencil font-18"></i>
                                    </button>
                                </Tippy>
                                <Tippy content="Desvincular">
                                    <button
                                        className="btn btn-link text-danger p-0"
                                        type="button"
                                        onClick={() => onUnlink(integration.id)}
                                    >
                                        <i className="mdi mdi-link-variant-off font-18"></i>
                                    </button>
                                </Tippy>
                            </div>
                        </div>
                    ) : (
                        <button
                            className={`btn w-100 ${isComingSoon ? "btn-outline-secondary" : "btn-primary"}`}
                            onClick={() =>
                                !isComingSoon && onIntegrate(service)
                            }
                            disabled={isComingSoon}
                            style={
                                isComingSoon ? { cursor: "not-allowed" } : {}
                            }
                        >
                            {isComingSoon ? (
                                <>
                                    <i className="mdi mdi-clock-outline me-1"></i>
                                    Próximamente
                                </>
                            ) : (
                                <>
                                    <i className="mdi mdi-plus me-1"></i>
                                    Integrar {service.toTitleCase()}
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

const IntegrationWizardModal = ({
    service,
    setService,
    editingIntegration,
    apikey,
    auth_token,
    onClose,
    onSuccess,
}) => {
    const modalRef = useRef(null);
    const [step, setStep] = useState(1);
    const [accessToken, setAccessToken] = useState("");
    const [appToken, setAppToken] = useState("");
    const [metaAppId, setMetaAppId] = useState("");
    const [metaAppSecret, setMetaAppSecret] = useState("");
    const [adAccountId, setAdAccountId] = useState("");
    const [accountId, setAccountId] = useState("");
    const [phoneId, setPhoneId] = useState("");
    const [accountVerified, setAccountVerified] = useState(null);
    const [verifying, setVerifying] = useState(false);
    const [integrating, setIntegrating] = useState(false);
    const [exchanging, setExchanging] = useState(false);

    // Service-specific configurations
    const serviceConfig = {
        forms: {
            name: "Formularios de Meta",
            color: "#1877f2",
            icon: "mdi-forms",
            developer_url: "https://developers.facebook.com/apps",
            product_name: "Webhooks",
            account_type: "página",
            permissions:
                "leads_retrieval, ads_read, pages_read_engagement, business_management",
            steps: [
                '<strong>Crear una App en Meta:</strong> Entra a <a href="https://developers.facebook.com" target="_blank" style="color: #1877f2; font-weight: 500;">Meta for Developers</a>. Arriba a la derecha dice "Mis aplicaciones", haz clic ahí y luego en el botón azul "Crear aplicación". Elige el tipo "Negocios" u "Otros" y completa el nombre.',
                '<strong>Añadir el producto Webhooks:</strong> Una vez dentro de tu aplicación, en la columna de la izquierda busca "Añadir producto". En la lista que aparece, busca "Webhooks" y haz clic en el botón "Configurar".',
                '<strong>Configurar la URL de Callback:</strong> En la pantalla de Webhooks, verás un menú desplegable que dice "User". Cámbialo a <strong>"Page"</strong> y haz clic en el botón que dice "Suscribirse a este objeto". Pega la URL de Callback y el Token de Verificación que te damos abajo.',
                '<strong>Suscribirse al campo de Leads:</strong> Verás una lista larga de opciones. Busca la que dice <code>leadgen</code> y haz clic en el botón "Suscribirse" a su derecha. Esto permitirá que Atalaya reciba tus leads.',
                '<strong>Vincular la App a la Página (¡MUY IMPORTANTE!):</strong> Si no haces esto, Meta no enviará ningún lead. Entra al <a href="https://developers.facebook.com/tools/explorer/" target="_blank" style="color: #1877f2; font-weight: 500;">Explorador de la Graph API</a>. 1. Selecciona tu página en el campo "Usuario o página". 2. En la barra donde dice la URL, bórrala y escribe el ID de tu página seguido de `/subscribed_apps` (ejemplo: `123456789/subscribed_apps`). 3. Cambia el método de `GET` a `POST`. 4. <strong>Abajo en la sección "Params"</strong>, añade una fila con la clave <code>subscribed_fields</code> y el valor <code>leadgen</code> (esto le dice a Meta que quieres escuchar los leads). 5. Haz clic en el botón azul "Submit". Debe responderte <code>{"success": true}</code>.',
            ],
            authSteps: [
                '<strong>Obtener el ID de la Página (Account ID):</strong><br/><span style="color:#555">Entra a tu página de Facebook. Haz clic en la pestaña "Información" (debajo de la foto de portada). Desplázate hacia abajo hasta encontrar el número largo que dice "Identificador de la página". Cópialo y pégalo abajo.</span>',
                '<strong>Obtener el Access Token (Token de Leads):</strong><br/><span style="color:#555">Entra a <a href="https://developers.facebook.com/tools/explorer/" target="_blank" style="color: #1877f2; font-weight: 500;">este enlace del Explorador</a>. En la columna derecha, en el campo "Usuario o página", selecciona tu página de Facebook. Luego, en la sección "Permisos", busca y añade: <code>leads_retrieval</code> y <code>pages_read_engagement</code>. Haz clic en el botón azul "Generate Access Token". Copia el texto largo que sale y pégalo abajo.<br/><strong>⚠️ Nota:</strong> El token del Explorador dura solo unas horas. Para convertirlo en uno de 60 días, guarda la integración y luego usa el botón de rayo ⚡ que aparecerá al lado del campo de token.</span>',
                '<strong>Obtener Meta App ID y Meta App Secret:</strong><br/><span style="color:#555">En Meta for Developers, entra a tu App. En el menú de la izquierda ve a <strong>Configuración</strong> -> <strong>Básica</strong>. Verás el "Identificador de la aplicación" y abajo la "Clave secreta" (haz clic en "Mostrar" para verla). Cópialos y pégalos abajo.</span>',
                '<strong>Obtener App Token (Para campañas - Opcional):</strong><br/><span style="color:#555">Entra a <a href="https://business.facebook.com/settings/system-users" target="_blank" style="color: #1877f2; font-weight: 500;">este enlace de Usuarios del Sistema</a> en la Configuración de tu Negocio. 1. Selecciona tu usuario del sistema (si no tienes uno, haz clic en "Añadir"). 2. Haz clic en el botón "Generar nuevo token". 3. Selecciona tu App en el desplegable. 4. Marca las casillas de los permisos <code>ads_management</code> y <code>ads_read</code>. 5. Haz clic en "Generar", copia el token y pégalo abajo.</span>',
                '<strong>Obtener el Ad Account ID (Opcional):</strong><br/><span style="color:#555">Entra a tu <a href="https://adsmanager.facebook.com/" target="_blank" style="color: #1877f2; font-weight: 500;">Administrador de Anuncios</a>. Arriba a la izquierda verás un selector con el nombre de tu cuenta. El número largo que aparece ahí es tu ID de cuenta publicitaria (ej: <code>1960065440840205</code>). Cópialo y pégalo abajo.</span>',
                '<strong>Nota sobre los campos del Formulario:</strong><br/><span style="color:#555">Cuando estés creando tus Formularios Instantáneos en el <a href="https://business.facebook.com/" target="_blank" style="color: #1877f2; font-weight: 500;">Meta Business Suite</a>, en la sección de preguntas, asegúrate de que el "Nombre de la columna" o ID de cada campo sea exactamente: <code>full_name</code> (o nombre), <code>phone_number</code> (o telefono) y <code>email</code> (o correo). Si pones nombres raros como "tu_celu", Atalaya no sabrá que es el teléfono y no podrá guardarlo.</span>',
            ],
        },
        messenger: {
            name: "Messenger",
            color: "#0084FF",
            icon: "mdi-facebook-messenger",
            developer_url: "https://developers.facebook.com/apps",
            product_name: "Messenger",
            account_type: "página de Facebook",
            permissions: "pages_messaging, pages_read_engagement",
            steps: [
                '<strong>Crear una App en Meta:</strong> Entra a <a href="https://developers.facebook.com" target="_blank" style="color: #0084FF; font-weight: 500;">Meta for Developers</a> y crea o selecciona tu app.',
                '<strong>Añadir Messenger:</strong> En la columna izquierda, ve a "Añadir producto" y selecciona <strong>Messenger</strong>.',
                "<strong>Configurar Webhook:</strong> En la configuración de Messenger, añade la URL de Callback y el Token de Verificación que aparecen abajo.",
                "<strong>Suscribirse a Mensajes:</strong> En la sección de Webhooks de Messenger, suscríbete a los campos <code>messages</code> y <code>messaging_postbacks</code>.",
            ],
            authSteps: [
                "<strong>Ir a la configuración de Messenger:</strong> En el menú lateral de tu app en Meta for Developers, busca Messenger y haz clic en Configuración.",
                '<strong>Seleccionar Página:</strong> En la sección "Configuración de acceso", busca tu página de Facebook en el selector.',
                '<strong>Generar Token:</strong> Haz clic en el botón "Generar token" al lado de tu página. Cópialo y pégalo en el campo <strong>Access Token</strong> de abajo.',
                "<strong>Obtener ID de la Página:</strong> Copia el número de identificación que aparece al lado de la página y pégalo en <strong>ID de la cuenta</strong>.",
            ],
        },
        instagram: {
            name: "Instagram",
            color: "#E4405F",
            icon: "mdi-instagram",
            developer_url: "https://developers.facebook.com/apps",
            product_name: "Instagram Basic Display",
            account_type: "cuenta de Instagram Business",
            permissions: "instagram_basic, instagram_manage_messages",
            steps: [
                "<strong>Tener cuenta Business:</strong> Asegúrate de que tu cuenta de Instagram sea Profesional (Empresa o Creador) y esté vinculada a una página de Facebook.",
                '<strong>Añadir producto:</strong> En Meta for Developers, busca "Añadir producto" y añade "Instagram Graph API" o "Instagram Basic Display".',
                "<strong>Configurar Webhook:</strong> Pega la URL de Callback y el Token de Verificación abajo para recibir los mensajes de Instagram.",
            ],
            authSteps: [
                "<strong>Ir a Instagram Basic Display:</strong> En el menú izquierdo de tu app en Meta for Developers, ve a Instagram Basic Display -> Basic Display.",
                "<strong>Añadir Probador:</strong> Desplázate hasta el final de la página y añade tu cuenta de Instagram como tester (probador).",
                "<strong>Aceptar Invitación:</strong> Abre Instagram.com en tu navegador, ve a Configuración -> Aplicaciones y sitios web -> Invitaciones de probador y acepta la invitación.",
                "<strong>Generar Token:</strong> Vuelve a la pantalla de Meta for Developers y ahora podrás generar el token de usuario. Cópialo y pégalo abajo junto con tu ID.",
            ],
        },
        whatsapp: {
            name: "WhatsApp",
            color: "#25D366",
            icon: "mdi-whatsapp",
            developer_url: "https://developers.facebook.com/apps",
            product_name: "WhatsApp",
            account_type: "Cuenta de WhatsApp",
            permissions: "messages",
            steps: [
                '<strong>Añadir WhatsApp:</strong> En Meta for Developers, busca "Añadir producto" y selecciona <strong>WhatsApp</strong> para añadirlo a tu app.',
                "<strong>Configurar Webhook:</strong> En la configuración de WhatsApp, introduce la URL de Callback y el Token de Verificación que te damos abajo.",
                "<strong>Suscribirse a Mensajes:</strong> En la sección de Webhook, marca la casilla de <code>messages</code> para que Atalaya pueda recibir los mensajes.",
                '<strong>Vincular la App al Negocio (Opcional):</strong> Si los mensajes no llegan, entra al <a href="https://developers.facebook.com/tools/explorer/" target="_blank" style="color: #25D366; font-weight: 500;">Explorador de la Graph API</a>. 1. Escribe tu <code>WhatsApp Business Account ID</code> seguido de `/subscribed_apps` en la barra de URL. 2. Cambia el método a `POST` y haz clic en "Submit".',
            ],
            authSteps: [
                "<strong>Ir a WhatsApp -> Configuración:</strong> En el menú lateral de tu app en Meta for Developers, entra en WhatsApp y luego en Configuración.",
                "<strong>Obtener Phone Number ID:</strong> Busca el campo que dice <code>Phone Number ID</code> (ID de número de teléfono), cópialo y pégalo abajo.",
                "<strong>Obtener WhatsApp Business Account ID:</strong> Busca ese ID en la misma pantalla y pégalo en el campo <strong>ID de la cuenta</strong> abajo.",
                "<strong>Generar Token:</strong> Para uso real, genera un token permanente en la Configuración del Negocio (Usuarios del sistema). Para pruebas rápidas, puedes usar el token temporal que sale en esa pantalla.",
            ],
        },
        whatsappevo: {
            name: "WhatsApp",
            color: "#25D366",
            icon: "mdi-whatsappevo",
            developer_url: "https://developers.facebook.com/apps",
            product_name: "WhatsApp Business API",
            account_type: "cuenta de WhatsApp Business",
            permissions: "whatsapp_business_messaging",
            hasImages: true, // Indicador especial para WhatsApp
            steps: [
                {
                    text: "Dirigirse a la parte superior del Panel Administrativo",
                    image: "/assets/img/whatsappevo/paso1.png",
                },
                {
                    text: "Seleccionar la opción de configuración de WhatsApp",
                    image: "/assets/img/whatsappevo/paso2.png",
                },
            ],
            authSteps: [
                {
                    text: "Configurar la integración con el webhook",
                    image: "/assets/img/whatsappevo/paso3.png",
                },
                {
                    text: "Verificar la conexión y activar el servicio",
                    image: "/assets/img/whatsappevo/paso4.png",
                },
            ],
            completedStep: {
                text: "WhatsApp configurado exitosamente y listo para usar",
                image: "/assets/img/whatsappevo/paso5.jpg",
            },
        },
        tiktok: {
            name: "TikTok",
            color: "#FF0050",
            icon: "mdi-music-note",
            developer_url: "https://developers.tiktok.com/apps",
            product_name: "TikTok for Developers",
            account_type: "cuenta de TikTok Business",
            permissions: "user.info.basic, video.list",
            steps: [
                "Crear cuenta en TikTok for Developers",
                "Registrar nueva aplicación",
                "Solicitar permisos de API comercial",
                "Configurar webhook para comentarios",
                "Obtener credenciales de API",
            ],
            authSteps: [
                'Accede a <a href="https://developers.tiktok.com/apps" target="_blank" style="color: #FF0050; text-decoration: underline;">TikTok for Developers</a>',
                'Ve a tu aplicación → <code>"Authentication"</code>',
                "Configura <strong>OAuth 2.0</strong> para tu cuenta business",
                "Autoriza la aplicación con tu <em>cuenta de TikTok Business</em>",
                'Obtén el <span style="color: #FF0050; font-weight: 600;">Access Token</span> y <code>User ID</code>',
            ],
        },
        gmail: {
            name: "Gmail",
            color: "#EA4335",
            icon: "mdi-gmail",
            developer_url: "https://console.developers.google.com",
            product_name: "Gmail API",
            account_type: "cuenta de Gmail",
            permissions: "gmail.readonly, gmail.send",
            hasImages: true, // Indicador especial para Gmail
            steps: [
                {
                    text: "Acceder a Google Cloud Console y crear proyecto",
                    image: "/assets/img/gmail/paso1.png",
                },
                {
                    text: "Habilitar Gmail API en el proyecto",
                    image: "/assets/img/gmail/paso2.png",
                },
            ],
            authSteps: [
                {
                    text: "Configurar credenciales OAuth 2.0",
                    image: "/assets/img/gmail/paso3.png",
                },
            ],
            completedStep: {
                text: "Gmail configurado exitosamente y listo para usar",
                image: "/assets/img/gmail/paso4.jpg",
            },
        },
        "google-calendar": {
            name: "Google Calendar",
            color: "#4285F4",
            icon: "mdi-calendar",
            developer_url: "https://console.developers.google.com",
            product_name: "Calendar API",
            account_type: "cuenta de Google",
            permissions: "calendar.readonly, calendar.events",
            steps: [
                "Abrir Google Cloud Console",
                "Habilitar Calendar API en tu proyecto",
                "Configurar credenciales de servicio",
                "Establecer permisos de calendario",
                "Configurar notificaciones push (opcional)",
            ],
            authSteps: [
                'Accede a <a href="https://console.developers.google.com" target="_blank" style="color: #4285F4; text-decoration: underline;">Google Cloud Console</a>',
                'Ve a <code>"APIs & Services"</code> → <strong>"Calendar API"</strong>',
                "Configura <em>credenciales OAuth 2.0</em> para tu aplicación",
                'Autoriza el acceso a <span style="color: #4285F4; font-weight: 600;">tu calendario de Google</span>',
                "Obtén el <code>Calendar ID</code> y <strong>Access Token</strong> válidos",
            ],
        },
        formularios: {
            name: "Formularios Web",
            color: "#6C757D",
            icon: "mdi-form-select",
            developer_url: "#",
            product_name: "Webhooks Personalizados",
            account_type: "formulario web",
            permissions: "webhook.receive",
            hasImages: false, // Indicador para formularios (sin imágenes pero sin inputs)
            steps: [
                'Dirigirse a la seccion de  <a href="/apikeys">Formulario Externo</a>',
            ],
            authSteps: ["Conecta tu formulario con Atalaya"],
            completedStep: {
                text: "Formulario configurado exitosamente y listo para recibir datos",
                image: null,
            },
        },
    };

    const config = serviceConfig[service] || serviceConfig.messenger;

    const onCopyClicked = async (toCopy) => {
        Clipboard.copy(toCopy, () => {
            toast("Copiado al portapapeles", {
                icon: <i className="mdi mdi-content-copy" />,
                description: "El texto ha sido copiado al portapapeles",
            });
        });
    };

    const onVerifyClicked = async () => {
        setVerifying(true);
        const result = await integrationsRest.profile({
            service,
            accountId,
            accessToken,
        });
        setVerifying(false);
        if (!result) return;
        setAccountVerified(result);
    };

    const onExchangeToken = async () => {
        if (!accessToken || !metaAppId || !metaAppSecret) {
            return toast.warning("Faltan datos", {
                description:
                    "Debes ingresar el Access Token corto, el App ID y el App Secret.",
            });
        }

        setExchanging(true);
        try {
            const response = await fetch("/api/meta/exchange-token", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                    "X-CSRF-TOKEN": document.querySelector(
                        'meta[name="csrf-token"]',
                    )?.content,
                },
                body: JSON.stringify({
                    integration_id: editingIntegration?.id,
                    short_token: accessToken,
                    app_id: metaAppId,
                    app_secret: metaAppSecret,
                }),
            });

            const result = await response.json();
            if (result.status === "success") {
                setAccessToken(result.token);
                toast.success("¡Éxito!", { description: result.message });
            } else {
                toast.error("Error", { description: result.message });
            }
        } catch (error) {
            toast.error("Error de conexión", {
                description: "No se pudo comunicar con el servidor.",
            });
        } finally {
            setExchanging(false);
        }
    };

    const onIntegrateClicked = async () => {
        setIntegrating(true);
        const result = await integrationsRest.save({
            id: editingIntegration?.id,
            service,
            phoneId,
            accountId,
            accessToken,
            appToken:
                service === "forms" || service === "whatsapp"
                    ? appToken
                    : undefined,
            adAccountId:
                service === "forms" || service === "whatsapp"
                    ? adAccountId
                    : undefined,
            meta_app_id:
                service === "forms" || service === "whatsapp"
                    ? metaAppId
                    : undefined,
            meta_app_secret:
                service === "forms" || service === "whatsapp"
                    ? metaAppSecret
                    : undefined,
        });
        setIntegrating(false);
        if (!result) return;
        onSuccess(result, !!editingIntegration);
        setService(null);
    };

    useEffect(() => {
        if (service) {
            setStep(1);
            // Cargar datos si estamos editando
            setAccountId(editingIntegration?.meta_business_id || "");
            setAccessToken(editingIntegration?.meta_access_token || "");
            setAppToken(editingIntegration?.meta_app_token || "");
            setAdAccountId(editingIntegration?.meta_ad_account_id || "");
            setMetaAppId(editingIntegration?.meta_app_id || "");
            setMetaAppSecret(editingIntegration?.meta_app_secret || "");
            setPhoneId(editingIntegration?.meta_number_id || "");

            // Si ya tenemos cuenta e ID, podemos marcarlo como "pre-verificado" visualmente
            if (
                editingIntegration?.meta_business_id &&
                editingIntegration?.meta_access_token
            ) {
                setAccountVerified({
                    id: editingIntegration.meta_business_id,
                    name: editingIntegration.meta_business_name,
                    profile_pic: `/api/integrations/media/${editingIntegration.meta_business_profile}`,
                });
            } else {
                setAccountVerified(null);
            }

            $(modalRef.current).modal("show");
        } else {
            $(modalRef.current).modal("hide");
            $(".modal-backdrop").remove();
        }
    }, [service, editingIntegration]);

    useEffect(() => {
        $(modalRef.current).on("hidden.bs.modal", () => {
            onClose();
            setService(null);
        });
        return () => {
            $(modalRef.current).off("hidden.bs.modal");
        };
    }, [null]);

    return (
        <Modal
            modalRef={modalRef}
            title={
                <div className="d-flex align-items-center">
                    <div className="me-3">
                        <div
                            className="avatar-md rounded-circle d-flex align-items-center justify-content-center"
                            style={{
                                backgroundColor: `${config.color}15`,
                                border: `2px solid ${config.color}`,
                            }}
                        >
                            {icons[service] &&
                                React.cloneElement(icons[service], {
                                    style: {
                                        height: "30px",
                                        width: "auto",
                                        opacity: 0.8,
                                    },
                                    className: "",
                                })}
                        </div>
                    </div>
                    <div>
                        <h4 className="mb-0">Integrar {config.name}</h4>
                        <small className="text-muted">
                            Conecta tu {config.account_type} con Atalaya
                        </small>
                    </div>
                </div>
            }
            bodyClass="px-4 pt-2 pb-4"
            hideFooter
            onClose={() => setService(null)}
            isStatic
        >
            <div id="progressbarwizard">
                {/* Solo mostrar tabs si NO es Formularios */}
                {service !== "formularios" && (
                    <ul
                        className="nav nav-pills nav-justified form-wizard-header mb-4 rounded-3"
                        style={{
                            backgroundColor: "var(--bs-gray-100)",
                            border: "1px solid var(--bs-border-color)",
                        }}
                    >
                        <li className="nav-item">
                            <a
                                href="#account-2"
                                data-bs-toggle="tab"
                                data-toggle="tab"
                                className={`nav-link rounded-start border-0 pt-3 pb-3 ${step == 1 && "active"}`}
                                onClick={() => setStep(1)}
                                style={{
                                    backgroundColor:
                                        step == 1
                                            ? config.color
                                            : "transparent",
                                    color:
                                        step == 1
                                            ? "white"
                                            : "var(--bs-gray-600)",
                                    fontWeight: step == 1 ? "600" : "500",
                                    transition: "all 0.3s ease",
                                }}
                            >
                                <i className="mdi mdi-cog me-2"></i>
                                <span className="d-none d-sm-inline">
                                    Configuración
                                </span>
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                href="#profile-tab-2"
                                data-bs-toggle="tab"
                                data-toggle="tab"
                                className={`nav-link border-0 pt-3 pb-3 ${step == 2 && "active"}`}
                                onClick={() => setStep(2)}
                                style={{
                                    backgroundColor:
                                        step == 2
                                            ? config.color
                                            : "transparent",
                                    color:
                                        step == 2
                                            ? "white"
                                            : "var(--bs-gray-600)",
                                    fontWeight: step == 2 ? "600" : "500",
                                    transition: "all 0.3s ease",
                                }}
                            >
                                <i className="mdi mdi-key me-2"></i>
                                <span className="d-none d-sm-inline">
                                    Autenticación
                                </span>
                            </a>
                        </li>
                        <li className="nav-item">
                            <a
                                href="#finish-2"
                                data-bs-toggle="tab"
                                data-toggle="tab"
                                className={`nav-link rounded-end border-0 pt-3 pb-3 ${step == 3 && "active"} ${service === "whatsappevo" || service === "gmail" ? "" : "disabled"}`}
                                disabled={
                                    service !== "whatsappevo" &&
                                    service !== "gmail"
                                }
                                onClick={() =>
                                    (service === "whatsappevo" ||
                                        service === "gmail") &&
                                    setStep(3)
                                }
                                style={{
                                    backgroundColor:
                                        step == 3
                                            ? config.color
                                            : "transparent",
                                    color:
                                        step == 3
                                            ? "white"
                                            : "var(--bs-gray-500)",
                                    fontWeight: step == 3 ? "600" : "500",
                                    transition: "all 0.3s ease",
                                    cursor:
                                        service === "whatsappevo" ||
                                        service === "gmail"
                                            ? "pointer"
                                            : "not-allowed",
                                }}
                            >
                                <i className="mdi mdi-check-circle me-2"></i>
                                <span className="d-none d-sm-inline">
                                    Completado
                                </span>
                            </a>
                        </li>
                    </ul>
                )}

                <div className="tab-content b-0 mb-0 pt-0">
                    <div
                        className={`tab-pane ${step == 1 && "active"}`}
                        id="account-2"
                    >
                        {service === "formularios" ? (
                            // Contenido especial para formularios - Solo mostrar el step
                            <div className="">
                                <div
                                    className="alert border-0 rounded-3"
                                    style={{
                                        backgroundColor: `${config.color}10`,
                                        borderLeft: `4px solid ${config.color}`,
                                    }}
                                >
                                    <h6 className="alert-heading d-flex align-items-center mb-3">
                                        <div
                                            className="rounded-circle d-flex align-items-center justify-content-center me-2"
                                            style={{
                                                width: "32px",
                                                height: "32px",
                                                backgroundColor: config.color,
                                                color: "white",
                                            }}
                                        >
                                            <i className="mdi mdi-information fs-6"></i>
                                        </div>
                                        Configuración de {config.name}
                                    </h6>
                                    <div className="mb-0 ps-3">
                                        {config.steps.map((step, index) => {
                                            return (
                                                <div
                                                    key={index}
                                                    className="mb-2"
                                                >
                                                    <span
                                                        dangerouslySetInnerHTML={{
                                                            __html: step,
                                                        }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="text-center mt-4">
                                    <button
                                        type="button"
                                        className="btn px-4"
                                        style={{
                                            backgroundColor: config.color,
                                            borderColor: config.color,
                                            color: "white",
                                        }}
                                        onClick={() => setService(null)}
                                    >
                                        <i className="mdi mdi-check me-2"></i>
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            // Contenido normal para otros servicios
                            <>
                                <div
                                    className="alert border-0 rounded-3"
                                    style={{
                                        backgroundColor: `${config.color}10`,
                                        borderLeft: `4px solid ${config.color}`,
                                    }}
                                >
                                    <h6 className="alert-heading d-flex align-items-center mb-3">
                                        <div
                                            className="rounded-circle d-flex align-items-center justify-content-center me-2"
                                            style={{
                                                width: "32px",
                                                height: "32px",
                                                backgroundColor: config.color,
                                                color: "white",
                                            }}
                                        >
                                            <i className="mdi mdi-information fs-6"></i>
                                        </div>
                                        Pasos previos requeridos
                                    </h6>
                                    <ol className="mb-0 ps-3">
                                        {config.steps.map((step, index) => {
                                            // Para WhatsApp con imágenes
                                            if (
                                                config.hasImages &&
                                                typeof step === "object"
                                            ) {
                                                return (
                                                    <li
                                                        key={index}
                                                        className="mb-4"
                                                    >
                                                        <div className="d-flex flex-column">
                                                            <span
                                                                dangerouslySetInnerHTML={{
                                                                    __html: step.text,
                                                                }}
                                                                className="mb-2"
                                                            />
                                                            <div
                                                                className="border rounded-3 overflow-hidden"
                                                                style={{
                                                                    maxWidth:
                                                                        "100%",
                                                                }}
                                                            >
                                                                <img
                                                                    src={
                                                                        step.image
                                                                    }
                                                                    alt={`Paso ${index + 1} - WhatsApp`}
                                                                    className="img-fluid"
                                                                    style={{
                                                                        width: "100%",
                                                                        height: "auto",
                                                                    }}
                                                                    onError={(
                                                                        e,
                                                                    ) => {
                                                                        e.target.style.display =
                                                                            "none";
                                                                        e.target.nextSibling.style.display =
                                                                            "block";
                                                                    }}
                                                                />
                                                                <div
                                                                    className="text-center p-3 text-muted"
                                                                    style={{
                                                                        display:
                                                                            "none",
                                                                    }}
                                                                >
                                                                    <i className="mdi mdi-image-off-outline fs-4 mb-2"></i>
                                                                    <br />
                                                                    Imagen no
                                                                    disponible
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </li>
                                                );
                                            }

                                            // Para otros servicios (texto normal)
                                            let processedStep = step;
                                            if (
                                                typeof step === "string" &&
                                                (step.includes(
                                                    "Panel de Desarrolladores",
                                                ) ||
                                                    step.includes("Console"))
                                            ) {
                                                processedStep = step.replace(
                                                    /Panel de Desarrolladores|Console/g,
                                                    (match) =>
                                                        `<a href="${config.developer_url}" target="_blank" style="color: ${config.color}; font-weight: 500; text-decoration: underline;">${match}</a>`,
                                                );
                                            }

                                            return (
                                                <li
                                                    key={index}
                                                    className="mb-2"
                                                >
                                                    <span
                                                        dangerouslySetInnerHTML={{
                                                            __html: processedStep,
                                                        }}
                                                    />
                                                    {typeof step === "string" &&
                                                        step.includes(
                                                            "permisos",
                                                        ) && (
                                                            <div className="mt-1">
                                                                <code
                                                                    className="small px-2 py-1 rounded"
                                                                    style={{
                                                                        backgroundColor:
                                                                            "var(--bs-gray-100)",
                                                                        color: "var(--bs-gray-800)",
                                                                        fontSize:
                                                                            "0.75rem",
                                                                    }}
                                                                >
                                                                    {
                                                                        config.permissions
                                                                    }
                                                                </code>
                                                            </div>
                                                        )}
                                                </li>
                                            );
                                        })}
                                    </ol>
                                    {service !== "whatsappevo" ||
                                        (service !== "gmail" &&
                                            config.developer_url !== "#" && (
                                                <div
                                                    className="mt-3 pt-3 border-top"
                                                    style={{
                                                        borderColor: `${config.color}30`,
                                                    }}
                                                >
                                                    <a
                                                        href={
                                                            config.developer_url
                                                        }
                                                        target="_blank"
                                                        className="btn btn-sm"
                                                        style={{
                                                            backgroundColor:
                                                                config.color,
                                                            borderColor:
                                                                config.color,
                                                            color: "white",
                                                        }}
                                                    >
                                                        <i className="mdi mdi-open-in-new me-1"></i>
                                                        Abrir Panel de
                                                        Desarrolladores
                                                    </a>
                                                </div>
                                            ))}
                                </div>

                                {/* Solo mostrar inputs si NO es WhatsApp, Gmail o Formularios */}
                                {service !== "whatsappevo" &&
                                    service !== "gmail" &&
                                    service !== "formularios" && (
                                        <div className="row g-3">
                                            <div className="col-12">
                                                <label className="form-label fw-semibold d-flex align-items-center">
                                                    <i
                                                        className="mdi mdi-link me-2"
                                                        style={{
                                                            color: config.color,
                                                        }}
                                                    ></i>
                                                    URL de Callback:
                                                </label>
                                                <div className="input-group">
                                                    <input
                                                        type="text"
                                                        className="form-control border-2"
                                                        value={`${Global.APP_URL}/meta/${service}/${apikey}`}
                                                        readOnly
                                                        style={{
                                                            backgroundColor:
                                                                "var(--bs-gray-50)",
                                                            borderColor:
                                                                "var(--bs-border-color)",
                                                            color: "var(--bs-body-color)",
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn border-2"
                                                        style={{
                                                            borderColor:
                                                                config.color,
                                                            color: config.color,
                                                            backgroundColor:
                                                                "var(--bs-body-bg)",
                                                        }}
                                                        onClick={() =>
                                                            onCopyClicked(
                                                                `${Global.APP_URL}/meta/${service}/${apikey}`,
                                                            )
                                                        }
                                                    >
                                                        <i className="mdi mdi-content-copy"></i>
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="col-12">
                                                <label className="form-label fw-semibold d-flex align-items-center">
                                                    <i
                                                        className="mdi mdi-shield-check me-2"
                                                        style={{
                                                            color: config.color,
                                                        }}
                                                    ></i>
                                                    Token de Verificación:
                                                </label>
                                                <div className="input-group">
                                                    <input
                                                        type="text"
                                                        className="form-control border-2"
                                                        value={auth_token}
                                                        readOnly
                                                        style={{
                                                            backgroundColor:
                                                                "var(--bs-gray-50)",
                                                            borderColor:
                                                                "var(--bs-border-color)",
                                                            color: "var(--bs-body-color)",
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn border-2"
                                                        style={{
                                                            borderColor:
                                                                config.color,
                                                            color: config.color,
                                                            backgroundColor:
                                                                "var(--bs-body-bg)",
                                                        }}
                                                        onClick={() =>
                                                            onCopyClicked(
                                                                auth_token,
                                                            )
                                                        }
                                                    >
                                                        <i className="mdi mdi-content-copy"></i>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                            </>
                        )}
                    </div>

                    <div
                        className={`tab-pane ${step == 2 && "active"}`}
                        id="profile-tab-2"
                    >
                        <div
                            className="alert border-0 rounded-3"
                            style={{
                                backgroundColor: `${config.color}10`,
                                borderLeft: `4px solid ${config.color}`,
                            }}
                        >
                            <h6 className="alert-heading d-flex align-items-center mb-3">
                                <div
                                    className="rounded-circle d-flex align-items-center justify-content-center me-2"
                                    style={{
                                        width: "32px",
                                        height: "32px",
                                        backgroundColor: config.color,
                                        color: "white",
                                    }}
                                >
                                    <i className="mdi mdi-key fs-6"></i>
                                </div>
                                Obtener credenciales de {config.name}
                            </h6>
                            <ol className="mb-0 ps-3">
                                {config.authSteps.map((step, index) => {
                                    // Para WhatsApp con imágenes
                                    if (
                                        config.hasImages &&
                                        typeof step === "object"
                                    ) {
                                        return (
                                            <li key={index} className="mb-4">
                                                <div className="d-flex flex-column">
                                                    <span
                                                        dangerouslySetInnerHTML={{
                                                            __html: step.text,
                                                        }}
                                                        className="mb-2"
                                                    />
                                                    <div
                                                        className="border rounded-3 overflow-hidden"
                                                        style={{
                                                            maxWidth: "100%",
                                                        }}
                                                    >
                                                        <img
                                                            src={step.image}
                                                            alt={`Autenticación paso ${index + 1} - WhatsApp`}
                                                            className="img-fluid"
                                                            style={{
                                                                width: "100%",
                                                                height: "auto",
                                                            }}
                                                            onError={(e) => {
                                                                e.target.style.display =
                                                                    "none";
                                                                e.target.nextSibling.style.display =
                                                                    "block";
                                                            }}
                                                        />
                                                        <div
                                                            className="text-center p-3 text-muted"
                                                            style={{
                                                                display: "none",
                                                            }}
                                                        >
                                                            <i className="mdi mdi-image-off-outline fs-4 mb-2"></i>
                                                            <br />
                                                            Imagen no disponible
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        );
                                    }

                                    // Para otros servicios (texto normal)
                                    let processedStep = step;
                                    if (
                                        typeof step === "string" &&
                                        (step.includes(
                                            "Panel de Desarrolladores",
                                        ) ||
                                            step.includes("Console"))
                                    ) {
                                        processedStep = step.replace(
                                            /Panel de Desarrolladores|Console/g,
                                            (match) =>
                                                `<a href="${config.developer_url}" target="_blank" style="color: ${config.color}; font-weight: 500; text-decoration: underline;">${match}</a>`,
                                        );
                                    }

                                    return (
                                        <li key={index} className="mb-2">
                                            <span
                                                dangerouslySetInnerHTML={{
                                                    __html: processedStep,
                                                }}
                                            />
                                        </li>
                                    );
                                })}
                            </ol>
                        </div>

                        {/* Solo mostrar inputs si NO es WhatsApp, Gmail o Formularios */}
                        {service !== "whatsappevo" &&
                            service !== "gmail" &&
                            service !== "formularios" && (
                                <>
                                    <div className="row g-3">
                                        <div className="col-12">
                                            <label className="form-label fw-semibold d-flex align-items-center">
                                                <i
                                                    className="mdi mdi-account me-2"
                                                    style={{
                                                        color: config.color,
                                                    }}
                                                ></i>
                                                ID de la {config.account_type}:
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control border-2"
                                                value={accountId}
                                                onChange={(e) =>
                                                    setAccountId(e.target.value)
                                                }
                                                placeholder="Ej: 123456789"
                                                disabled={!!accountVerified}
                                                style={{
                                                    borderColor: accountVerified
                                                        ? "#28a745"
                                                        : "var(--bs-border-color)",
                                                    backgroundColor:
                                                        accountVerified
                                                            ? "#d4edda"
                                                            : "var(--bs-body-bg)",
                                                    color: "var(--bs-body-color)",
                                                }}
                                            />
                                        </div>
                                        {service === "whatsapp" && (
                                            <div className="col-12">
                                                <label className="form-label fw-semibold d-flex align-items-center">
                                                    <i
                                                        className="mdi mdi-account me-2"
                                                        style={{
                                                            color: config.color,
                                                        }}
                                                    ></i>
                                                    ID de número de teléfono:
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control border-2"
                                                    value={phoneId}
                                                    onChange={(e) =>
                                                        setPhoneId(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder="Ej: 123456789"
                                                    disabled={!!accountVerified}
                                                    style={{
                                                        borderColor:
                                                            accountVerified
                                                                ? "#28a745"
                                                                : "var(--bs-border-color)",
                                                        backgroundColor:
                                                            accountVerified
                                                                ? "#d4edda"
                                                                : "var(--bs-body-bg)",
                                                        color: "var(--bs-body-color)",
                                                    }}
                                                />
                                            </div>
                                        )}
                                        <div className="col-12">
                                            <label className="form-label fw-semibold d-flex align-items-center">
                                                <i
                                                    className="mdi mdi-key-variant me-2"
                                                    style={{
                                                        color: config.color,
                                                    }}
                                                ></i>
                                                {service === "whatsapp"
                                                    ? "App Token (System User):"
                                                    : "Access Token:"}
                                            </label>
                                            <div className="input-group">
                                                <input
                                                    type="text"
                                                    className="form-control border-2"
                                                    value={accessToken}
                                                    onChange={(e) =>
                                                        setAccessToken(
                                                            e.target.value,
                                                        )
                                                    }
                                                    placeholder={
                                                        service === "whatsapp"
                                                            ? "Pega aquí tu System User Token"
                                                            : "Pega aquí tu Access Token"
                                                    }
                                                    style={{
                                                        borderColor:
                                                            accountVerified
                                                                ? "#28a745"
                                                                : "var(--bs-border-color)",
                                                        backgroundColor:
                                                            accountVerified
                                                                ? "#d4edda"
                                                                : "var(--bs-body-bg)",
                                                        color: "var(--bs-body-color)",
                                                    }}
                                                />
                                                {service === "forms" && (
                                                    <Tippy content="Convertir a token de 60 días">
                                                        <button
                                                            type="button"
                                                            className="btn btn-warning"
                                                            onClick={
                                                                onExchangeToken
                                                            }
                                                            disabled={
                                                                exchanging
                                                            }
                                                        >
                                                            {exchanging ? (
                                                                <i className="mdi mdi-loading mdi-spin"></i>
                                                            ) : (
                                                                <i className="mdi mdi-flash"></i>
                                                            )}
                                                        </button>
                                                    </Tippy>
                                                )}
                                            </div>
                                        </div>

                                        {service === "forms" && (
                                            <>
                                                <div className="col-md-6">
                                                    <label className="form-label fw-semibold">
                                                        Meta App ID:
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-control border-2"
                                                        value={metaAppId}
                                                        onChange={(e) =>
                                                            setMetaAppId(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Ej: 1408966357619599"
                                                    />
                                                    <div className="form-text small">
                                                        ID de la App en Meta
                                                        Developers
                                                    </div>
                                                </div>
                                                <div className="col-md-6">
                                                    <label className="form-label fw-semibold">
                                                        Meta App Secret:
                                                    </label>
                                                    <input
                                                        type="password"
                                                        className="form-control border-2"
                                                        value={metaAppSecret}
                                                        onChange={(e) =>
                                                            setMetaAppSecret(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="••••••••"
                                                    />
                                                    <div className="form-text small">
                                                        Clave secreta de la App
                                                    </div>
                                                </div>
                                            </>
                                        )}

                                        {/* App Token + Ad Account ID - Solo para Meta Forms */}
                                        {service === "forms" && (
                                            <>
                                                <div className="col-12">
                                                    <label className="form-label fw-semibold d-flex align-items-center">
                                                        <i
                                                            className="mdi mdi-key-star me-2"
                                                            style={{
                                                                color: config.color,
                                                            }}
                                                        ></i>
                                                        App Token{" "}
                                                        <span className="text-muted fw-normal ms-2 small">
                                                            (para sincronizar
                                                            campañas)
                                                        </span>
                                                        :
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-control border-2"
                                                        value={appToken}
                                                        onChange={(e) =>
                                                            setAppToken(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Token con permisos: ads_management, ads_read, pages_manage_ads"
                                                        style={{
                                                            borderColor:
                                                                "var(--bs-border-color)",
                                                            backgroundColor:
                                                                "var(--bs-body-bg)",
                                                            color: "var(--bs-body-color)",
                                                        }}
                                                    />
                                                    <div className="form-text text-muted mt-1">
                                                        <i className="mdi mdi-information-outline me-1"></i>
                                                        Opcional. Token
                                                        diferente al de leads
                                                        con permisos de gestión
                                                        de anuncios.
                                                    </div>
                                                </div>
                                                <div className="col-12">
                                                    <label className="form-label fw-semibold d-flex align-items-center">
                                                        <i
                                                            className="mdi mdi-identifier me-2"
                                                            style={{
                                                                color: config.color,
                                                            }}
                                                        ></i>
                                                        Ad Account ID{" "}
                                                        <span className="text-muted fw-normal ms-2 small">
                                                            (para sincronizar
                                                            campañas)
                                                        </span>
                                                        :
                                                    </label>
                                                    <input
                                                        type="text"
                                                        className="form-control border-2"
                                                        value={adAccountId}
                                                        onChange={(e) =>
                                                            setAdAccountId(
                                                                e.target.value,
                                                            )
                                                        }
                                                        placeholder="Ej: 1960065440840205"
                                                        style={{
                                                            borderColor:
                                                                "var(--bs-border-color)",
                                                            backgroundColor:
                                                                "var(--bs-body-bg)",
                                                            color: "var(--bs-body-color)",
                                                        }}
                                                    />
                                                    <div className="form-text text-muted mt-1">
                                                        <i className="mdi mdi-information-outline me-1"></i>
                                                        Opcional. Si lo pones,
                                                        solo se sincronizarán
                                                        las campañas de esta
                                                        cuenta.
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <div className="mt-4">
                                        {accountVerified ? (
                                            <div className="alert alert-success border-0 rounded-3">
                                                <div className="d-flex align-items-center">
                                                    <img
                                                        className="avatar-md rounded-circle me-3 border"
                                                        src={
                                                            accountVerified
                                                                .picture?.data
                                                                ?.url ||
                                                            accountVerified.profile_pic ||
                                                            "/assets/img/default-avatar.png"
                                                        }
                                                        alt={
                                                            accountVerified.name
                                                        }
                                                        onError={(e) =>
                                                            (e.target.src = `//${Global.APP_DOMAIN}/api/logo/thumbnail/null`)
                                                        }
                                                    />
                                                    <div className="flex-grow-1">
                                                        <h6 className="mb-1">
                                                            {
                                                                accountVerified.name
                                                            }
                                                        </h6>
                                                        <small className="text-muted">
                                                            @
                                                            {accountVerified.username ||
                                                                accountVerified.id}
                                                        </small>
                                                    </div>
                                                    <div className="text-success">
                                                        <i className="mdi mdi-check-circle fs-4"></i>
                                                    </div>
                                                </div>
                                                <div className="mt-3 pt-3 border-top">
                                                    <i className="mdi mdi-check-circle me-1"></i>
                                                    <small>
                                                        Cuenta verificada
                                                        exitosamente y lista
                                                        para integrar
                                                    </small>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center">
                                                <button
                                                    type="button"
                                                    className="btn btn-lg px-4 py-2"
                                                    style={{
                                                        backgroundColor:
                                                            config.color,
                                                        borderColor:
                                                            config.color,
                                                        color: "white",
                                                    }}
                                                    onClick={onVerifyClicked}
                                                    disabled={
                                                        verifying ||
                                                        !accountId ||
                                                        !accessToken
                                                    }
                                                >
                                                    {verifying ? (
                                                        <>
                                                            <i className="mdi mdi-loading mdi-spin me-2"></i>
                                                            Verificando
                                                            cuenta...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <i className="mdi mdi-check-circle me-2"></i>
                                                            Verificar cuenta
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                    </div>

                    <div
                        className={`tab-pane ${step == 3 && "active"}`}
                        id="finish-2"
                    >
                        {/* Contenido personalizado para WhatsApp, Gmail y Formularios */}
                        {(service === "whatsappevo" ||
                            service === "gmail" ||
                            service === "formularios") &&
                        config.completedStep ? (
                            <div className="text-center">
                                <div className="mb-4">
                                    <div
                                        className="avatar-xl rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                                        style={{
                                            backgroundColor: `${config.color}15`,
                                            border: `3px solid ${config.color}`,
                                        }}
                                    >
                                        <i
                                            className="mdi mdi-check-all fs-1"
                                            style={{ color: config.color }}
                                        ></i>
                                    </div>
                                    <h3 className="text-success">
                                        ¡{config.name} Configurado!
                                    </h3>
                                </div>

                                <div
                                    className="alert border-0 rounded-3"
                                    style={{
                                        backgroundColor: `${config.color}10`,
                                        borderLeft: `4px solid ${config.color}`,
                                    }}
                                >
                                    <h6 className="alert-heading d-flex align-items-center mb-3">
                                        <div
                                            className="rounded-circle d-flex align-items-center justify-content-center me-2"
                                            style={{
                                                width: "32px",
                                                height: "32px",
                                                backgroundColor: config.color,
                                                color: "white",
                                            }}
                                        >
                                            <i className="mdi mdi-check-circle fs-6"></i>
                                        </div>
                                        Configuración finalizada
                                    </h6>
                                    <div className="d-flex flex-column">
                                        <span
                                            dangerouslySetInnerHTML={{
                                                __html: config.completedStep
                                                    .text,
                                            }}
                                            className="mb-3"
                                        />
                                        {config.completedStep.image && (
                                            <div
                                                className="border rounded-3 overflow-hidden"
                                                style={{ maxWidth: "100%" }}
                                            >
                                                <img
                                                    src={
                                                        config.completedStep
                                                            .image
                                                    }
                                                    alt={`${config.name} configurado exitosamente`}
                                                    className="img-fluid"
                                                    style={{
                                                        width: "100%",
                                                        height: "auto",
                                                    }}
                                                    onError={(e) => {
                                                        e.target.style.display =
                                                            "none";
                                                        e.target.nextSibling.style.display =
                                                            "block";
                                                    }}
                                                />
                                                <div
                                                    className="text-center p-3 text-muted"
                                                    style={{ display: "none" }}
                                                >
                                                    <i className="mdi mdi-image-off-outline fs-4 mb-2"></i>
                                                    <br />
                                                    Imagen no disponible
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <p className="text-muted">
                                    {config.name} está ahora completamente
                                    configurado y listo para usar.
                                </p>
                            </div>
                        ) : (
                            /* Contenido normal para otros servicios */
                            <div className="text-center">
                                <div className="mb-4">
                                    <div
                                        className="avatar-xl rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                                        style={{
                                            backgroundColor: `${config.color}15`,
                                            border: `3px solid ${config.color}`,
                                        }}
                                    >
                                        <i
                                            className="mdi mdi-check-all fs-1"
                                            style={{ color: config.color }}
                                        ></i>
                                    </div>
                                    <h3 className="text-success">
                                        ¡Integración Completada!
                                    </h3>
                                </div>

                                <div className="alert alert-success border-0 rounded-3 text-start">
                                    <h6 className="alert-heading d-flex align-items-center">
                                        <i className="mdi mdi-rocket me-2"></i>
                                        ¿Qué puedes hacer ahora?
                                    </h6>
                                    <ul className="mb-0 ps-3">
                                        <li>
                                            Gestionar conversaciones desde el
                                            panel principal
                                        </li>
                                        <li>
                                            Recibir notificaciones en tiempo
                                            real
                                        </li>
                                        <li>Automatizar respuestas con IA</li>
                                        <li>Generar reportes de engagement</li>
                                    </ul>
                                </div>

                                <p className="text-muted">
                                    Tu {config.account_type} está ahora
                                    conectada con {Global.APP_NAME}. Todas las
                                    interacciones se sincronizarán
                                    automáticamente.
                                </p>
                            </div>
                        )}
                    </div>

                    <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                        {/* Solo mostrar navegación si NO es Formularios */}
                        {service !== "formularios" && (
                            <>
                                <div>
                                    {step > 1 && (
                                        <button
                                            type="button"
                                            className="btn btn-outline-secondary px-4"
                                            onClick={() =>
                                                setStep((old) => --old)
                                            }
                                        >
                                            <i className="mdi mdi-arrow-left me-1"></i>
                                            Anterior
                                        </button>
                                    )}
                                </div>

                                <div className="text-center flex-grow-1">
                                    <small className="text-muted">
                                        Paso {step} de 3
                                    </small>
                                </div>

                                <div>
                                    {step == 1 && (
                                        <button
                                            type="button"
                                            className="btn px-4"
                                            style={{
                                                backgroundColor: config.color,
                                                borderColor: config.color,
                                                color: "white",
                                            }}
                                            onClick={() =>
                                                setStep((old) => ++old)
                                            }
                                        >
                                            Siguiente
                                            <i className="mdi mdi-arrow-right ms-1"></i>
                                        </button>
                                    )}
                                    {step == 2 &&
                                        /* Para WhatsApp, Gmail y Formularios, permite ir directamente al paso 3 */
                                        (service === "whatsappevo" ||
                                        service === "gmail" ||
                                        service === "formularios" ? (
                                            <button
                                                type="button"
                                                className="btn px-4"
                                                style={{
                                                    backgroundColor:
                                                        config.color,
                                                    borderColor: config.color,
                                                    color: "white",
                                                }}
                                                onClick={() => setStep(3)}
                                            >
                                                Finalizar
                                                <i className="mdi mdi-arrow-right ms-1"></i>
                                            </button>
                                        ) : /* Para otros servicios, mantener lógica original */
                                        accountVerified ? (
                                            <button
                                                type="button"
                                                className="btn px-4"
                                                style={{
                                                    backgroundColor:
                                                        config.color,
                                                    borderColor: config.color,
                                                    color: "white",
                                                }}
                                                onClick={() =>
                                                    onIntegrateClicked()
                                                }
                                                disabled={integrating}
                                            >
                                                {integrating ? (
                                                    <>
                                                        <i className="mdi mdi-spin mdi-loading me-1"></i>
                                                        Integrando...
                                                    </>
                                                ) : (
                                                    <>
                                                        <i className="mdi mdi-plus me-1"></i>
                                                        Finalizar
                                                    </>
                                                )}
                                            </button>
                                        ) : (
                                            <Tippy content="Verifica la cuenta primero">
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-secondary px-4"
                                                    disabled
                                                >
                                                    <i className="mdi mdi-plus me-1"></i>
                                                    Finalizar
                                                </button>
                                            </Tippy>
                                        ))}
                                    {/* Botón para cerrar en paso 3 para WhatsApp, Gmail y Formularios */}
                                    {step == 3 &&
                                        (service === "whatsappevo" ||
                                            service === "gmail" ||
                                            service === "formularios") && (
                                            <button
                                                type="button"
                                                className="btn px-4"
                                                style={{
                                                    backgroundColor:
                                                        config.color,
                                                    borderColor: config.color,
                                                    color: "white",
                                                }}
                                                onClick={() => setService(null)}
                                            >
                                                <i className="mdi mdi-check me-2"></i>
                                                Cerrar
                                            </button>
                                        )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Modal>
    );
};

const Webhooks = ({ apikey, auth_token, integrations: integrationsDB }) => {
    const [integrations, setIntegrations] = useState(integrationsDB);
    const [wizardService, setWizardService] = useState(null);
    const [editingIntegration, setEditingIntegration] = useState(null);

    const handleOpenWizard = (service, integration = null) => {
        setEditingIntegration(integration);
        setWizardService(service);
    };

    const serviceDescriptions = {
        messenger:
            "Integra tu página de Facebook para recibir y responder mensajes directamente desde Atalaya.",
        instagram:
            "Conecta tu cuenta de Instagram para gestionar mensajes directos y comentarios desde Atalaya.",
        whatsappevo:
            "Conecta tu cuenta de WhatsApp Business para gestionar mensajes desde Atalaya.",
        tiktok: "Integra tu cuenta de TikTok para gestionar comentarios y mensajes desde Atalaya.",
        gmail: "Conecta tu cuenta de Gmail para gestionar correos electrónicos desde Atalaya.",
        "google-calendar":
            "Integra Google Calendar para gestionar citas y eventos desde Atalaya.",
        formularios:
            "Conecta formularios web para recibir leads directamente en Atalaya.",
    };

    const handleIntegrationSuccess = (newIntegration, isEdit = false) => {
        if (isEdit) {
            setIntegrations((old) =>
                old.map((i) =>
                    i.id === newIntegration.id ? newIntegration : i,
                ),
            );
            toast.success("Configuración actualizada");
        } else {
            setIntegrations((old) => [...old, newIntegration]);
            toast.success("Integración vinculada exitosamente");
        }
    };

    const onUnlinkClicked = async (integrationId) => {
        const { isConfirmed } = await Swal.fire({
            title: "¿Estás seguro?",
            text: "Esta acción desvinculará la integración. ¿Deseas continuar?",
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: "Sí, desvincular",
            cancelButtonText: "Cancelar",
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
        });

        if (!isConfirmed) return;
        const success = await integrationsRest.delete(integrationId);
        if (success) {
            setIntegrations((current) =>
                current.filter(
                    (integration) => integration.id !== integrationId,
                ),
            );
            toast.success("Integración desvinculada exitosamente");
        }
    };

    const ibms = integrations.reduce((acc, integration) => {
        if (!acc[integration.meta_service]) {
            acc[integration.meta_service] = integration;
        }
        return acc;
    }, {});

    return (
        <>
            <div className="container-fluid">
                <div className="row">
                    {Object.entries(icons).map(([service, icon]) => (
                        <ServiceCard
                            key={service}
                            service={service}
                            icon={icon}
                            description={serviceDescriptions[service]}
                            integration={ibms[service]}
                            onIntegrate={handleOpenWizard}
                            onUnlink={onUnlinkClicked}
                        />
                    ))}
                </div>
            </div>
            <IntegrationWizardModal
                service={wizardService}
                setService={setWizardService}
                editingIntegration={editingIntegration}
                apikey={apikey}
                auth_token={auth_token}
                onClose={() => {
                    setWizardService(null);
                    setEditingIntegration(null);
                }}
                onSuccess={handleIntegrationSuccess}
            />
        </>
    );
};

CreateReactScript((el, properties) => {
    createRoot(el).render(
        <Adminto {...properties} title="Redes Sociales">
            <Webhooks {...properties} />
        </Adminto>,
    );
});
