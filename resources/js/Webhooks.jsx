
import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import Adminto from './components/Adminto.jsx'
import Tippy from '@tippyjs/react'
import { Clipboard } from 'sode-extend-react'
import Swal from 'sweetalert2'
import Global from './Utils/Global.js'
import IntegrationsRest from './actions/IntegrationsRest.js'
import Modal from './components/Modal.jsx'
import { toast } from 'sonner'

const integrationsRest = new IntegrationsRest()

const icons = {
  'messenger': (
    <img src="/assets/img/messenger.svg" alt="Messenger" style={{height: '200px', width: 'auto'}} />
  ),
  'instagram': (
    <img src="/assets/img/instagram.svg" alt="Instagram" style={{height: '200px', width: 'auto'}} />
  ),
  'whatsapp': (
    <img src="/assets/img/whatsapp.svg" alt="WhatsApp" style={{height: '200px', width: 'auto'}} />
  ),
  'tiktok': (
    <img src="/assets/img/tiktok.svg" alt="TikTok" style={{height: '200px', width: 'auto', opacity: 0.5}} />
  ),
  'gmail': (
    <img src="/assets/img/gmail.svg" alt="Gmail" style={{height: '200px', width: 'auto'}} />
  ),
  'google-calendar': (
    <img src="/assets/img/calendar.svg" alt="Google Calendar" style={{height: '200px', width: 'auto', opacity: 0.5}} />
  ),
  'formularios': (
    <img src="/assets/img/website.svg" alt="Formularios" style={{height: '200px', width: 'auto'}} />
  )
}

const ServiceCard = ({ service, icon, description, integration, onIntegrate, onUnlink }) => {
  const isComingSoon = service === 'tiktok' || service === 'google-calendar';
  
  return (
    <div className="col-xxl-3 col-xl-4 col-lg-6 col-md-6 " >
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
          {
            integration?.meta_business_name ? (
              <div className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <img
                    className="avatar-sm rounded-circle me-2"
                    src={`/api/integrations/media/${integration.meta_business_profile}`}
                    alt={integration.meta_business_name}
                    onError={e => e.target.src = `//${Global.APP_DOMAIN}/api/logo/thumbnail/null`}
                  />
                  <div>
                    <h5 className="mb-0">{integration.meta_business_name}</h5>
                    <small className="text-muted">
                      {integration.leads_count ?? 0} lead(s) generados
                    </small>
                  </div>
                </div>
                <Tippy content='Desvincular'>
                  <button
                    className="btn btn-link text-danger p-0"
                    type="button"
                    onClick={() => onUnlink(integration.id)}
                  >
                    <i className="mdi mdi-link-variant-off font-18"></i>
                  </button>
                </Tippy>
              </div>
            ) : (
              <button
                className={`btn w-100 ${isComingSoon ? 'btn-outline-secondary' : 'btn-primary'}`}
                onClick={() => !isComingSoon && onIntegrate(service)}
                disabled={isComingSoon}
                style={isComingSoon ? { cursor: 'not-allowed' } : {}}
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
            )
          }
        </div>
      </div>
    </div>
  )
}

const IntegrationWizardModal = ({ service, setService, apikey, auth_token, onClose, onSuccess }) => {
  const modalRef = useRef(null)
  const [step, setStep] = useState(1)
  const [accessToken, setAccessToken] = useState('')
  const [accountId, setAccountId] = useState('')
  const [accountVerified, setAccountVerified] = useState(null)
  const [verifying, setVerifying] = useState(false);
  const [integrating, setIntegrating] = useState(false);

  // Service-specific configurations
  const serviceConfig = {
    messenger: {
      name: 'Messenger',
      color: '#0084FF',
      icon: 'mdi-facebook-messenger',
      developer_url: 'https://developers.facebook.com/apps',
      product_name: 'Messenger',
      account_type: 'página de Facebook',
      permissions: 'pages_messaging, pages_read_engagement',
      steps: [
        'Abrir el <strong>Panel de Desarrolladores</strong> de Meta',
        'Crear una nueva aplicación o <em>seleccionar una existente</em>',
        'Agregar el producto <code>"Messenger"</code> a tu aplicación',
        'Configurar webhook con la URL proporcionada',
        'Generar token de página con <span style="color: #0084FF; font-weight: 600;">permisos de mensajería</span>'
      ],
      authSteps: [
        'Ve a la configuración de tu aplicación en <strong>Meta for Developers</strong>',
        'Navega a <code>"Messenger"</code> → <em>"Settings"</em> en el menú lateral',
        'Selecciona la <span style="color: #0084FF; font-weight: 600;">página de Facebook</span> que deseas conectar',
        'Genera un <strong>Page Access Token</strong> con permisos de mensajería',
        'Copia el <code>Page ID</code> y el <code>Access Token</code> generados'
      ]
    },
    instagram: {
      name: 'Instagram',
      color: '#E4405F',
      icon: 'mdi-instagram',
      developer_url: 'https://developers.facebook.com/apps',
      product_name: 'Instagram Basic Display',
      account_type: 'cuenta de Instagram Business',
      permissions: 'instagram_basic, instagram_manage_messages',
      steps: [
        'Acceder al <strong>Panel de Desarrolladores</strong> de Meta',
        'Crear aplicación y agregar <code>"Instagram Basic Display"</code>',
        'Conectar <em>cuenta de Instagram Business</em>',
        'Configurar webhook para recibir mensajes',
        'Obtener <span style="color: #E4405F; font-weight: 600;">token de acceso</span> de la cuenta'
      ],
      authSteps: [
        'Accede a <a href="https://developers.facebook.com/apps" target="_blank" style="color: #E4405F; text-decoration: underline;">Meta for Developers</a>',
        'Ve a <code>"Instagram Basic Display"</code> → <em>"Basic Display"</em>',
        'Conecta tu <strong>cuenta de Instagram Business</strong>',
        'Genera un <span style="color: #E4405F; font-weight: 600;">User Access Token</span>',
        'Obtén el <code>Instagram User ID</code> de tu cuenta'
      ]
    },
    whatsapp: {
      name: 'WhatsApp',
      color: '#25D366',
      icon: 'mdi-whatsapp',
      developer_url: 'https://developers.facebook.com/apps',
      product_name: 'WhatsApp Business API',
      account_type: 'cuenta de WhatsApp Business',
      permissions: 'whatsapp_business_messaging',
      hasImages: true, // Indicador especial para WhatsApp
      steps: [
        {
          text: 'Dirigirse a la parte superior del Panel Administrativo',
          image: '/assets/img/whatsapp/paso1.png'
        },
        {
          text: 'Seleccionar la opción de configuración de WhatsApp',
          image: '/assets/img/whatsapp/paso2.png'
        }
      ],
      authSteps: [
        {
          text: 'Configurar la integración con el webhook',
          image: '/assets/img/whatsapp/paso3.png'
        },
        {
          text: 'Verificar la conexión y activar el servicio',
          image: '/assets/img/whatsapp/paso4.png'
        }
      ],
      completedStep: {
        text: 'WhatsApp configurado exitosamente y listo para usar',
        image: '/assets/img/whatsapp/paso5.jpg'
      }
    },
    tiktok: {
      name: 'TikTok',
      color: '#FF0050',
      icon: 'mdi-music-note',
      developer_url: 'https://developers.tiktok.com/apps',
      product_name: 'TikTok for Developers',
      account_type: 'cuenta de TikTok Business',
      permissions: 'user.info.basic, video.list',
      steps: [
        'Crear cuenta en TikTok for Developers',
        'Registrar nueva aplicación',
        'Solicitar permisos de API comercial',
        'Configurar webhook para comentarios',
        'Obtener credenciales de API'
      ],
      authSteps: [
        'Accede a <a href="https://developers.tiktok.com/apps" target="_blank" style="color: #FF0050; text-decoration: underline;">TikTok for Developers</a>',
        'Ve a tu aplicación → <code>"Authentication"</code>',
        'Configura <strong>OAuth 2.0</strong> para tu cuenta business',
        'Autoriza la aplicación con tu <em>cuenta de TikTok Business</em>',
        'Obtén el <span style="color: #FF0050; font-weight: 600;">Access Token</span> y <code>User ID</code>'
      ]
    },
    gmail: {
      name: 'Gmail',
      color: '#EA4335',
      icon: 'mdi-gmail',
      developer_url: 'https://console.developers.google.com',
      product_name: 'Gmail API',
      account_type: 'cuenta de Gmail',
      permissions: 'gmail.readonly, gmail.send',
      hasImages: true, // Indicador especial para Gmail
      steps: [
        {
          text: 'Acceder a Google Cloud Console y crear proyecto',
          image: '/assets/img/gmail/paso1.png'
        },
        {
          text: 'Habilitar Gmail API en el proyecto',
          image: '/assets/img/gmail/paso2.png'
        }
      ],
      authSteps: [
        {
          text: 'Configurar credenciales OAuth 2.0',
          image: '/assets/img/gmail/paso3.png'
        }
      ],
      completedStep: {
        text: 'Gmail configurado exitosamente y listo para usar',
        image: '/assets/img/gmail/paso4.jpg'
      }
    },
    'google-calendar': {
      name: 'Google Calendar',
      color: '#4285F4',
      icon: 'mdi-calendar',
      developer_url: 'https://console.developers.google.com',
      product_name: 'Calendar API',
      account_type: 'cuenta de Google',
      permissions: 'calendar.readonly, calendar.events',
      steps: [
        'Abrir Google Cloud Console',
        'Habilitar Calendar API en tu proyecto',
        'Configurar credenciales de servicio',
        'Establecer permisos de calendario',
        'Configurar notificaciones push (opcional)'
      ],
      authSteps: [
        'Accede a <a href="https://console.developers.google.com" target="_blank" style="color: #4285F4; text-decoration: underline;">Google Cloud Console</a>',
        'Ve a <code>"APIs & Services"</code> → <strong>"Calendar API"</strong>',
        'Configura <em>credenciales OAuth 2.0</em> para tu aplicación',
        'Autoriza el acceso a <span style="color: #4285F4; font-weight: 600;">tu calendario de Google</span>',
        'Obtén el <code>Calendar ID</code> y <strong>Access Token</strong> válidos'
      ]
    },
    formularios: {
      name: 'Formularios Web',
      color: '#6C757D',
      icon: 'mdi-form-select',
      developer_url: '#',
      product_name: 'Webhooks Personalizados',
      account_type: 'formulario web',
      permissions: 'webhook.receive',
      hasImages: false, // Indicador para formularios (sin imágenes pero sin inputs)
      steps: [
        'Dirigirse a la seccion de  <a href="/apikeys">Formulario Externo</a>',
      
      ],
      authSteps: [
        'Conecta tu formulario con Atalaya',
      ],
      completedStep: {
        text: 'Formulario configurado exitosamente y listo para recibir datos',
        image: null
      }
    }
  }

  const config = serviceConfig[service] || serviceConfig.messenger

  const onCopyClicked = async (toCopy) => {
    Clipboard.copy(toCopy, () => {
      toast('Copiado al portapapeles', {
        icon: <i className='mdi mdi-content-copy' />,
        description: 'El texto ha sido copiado al portapapeles'
      })
    })
  }

  const onVerifyClicked = async () => {
    setVerifying(true)
    const result = await integrationsRest.profile({
      service,
      accountId,
      accessToken
    })
    setVerifying(false)
    if (!result) return
    setAccountVerified(result)
  }

  const onIntegrateClicked = async () => {
    setIntegrating(true)
    const result = await integrationsRest.save({ service, accountId, accessToken })
    setIntegrating(false)
    if (!result) return
    onSuccess(result)
    setService(null)
  }

  useEffect(() => {
    if (service) {
      setStep(1)
      setAccountId('')
      setAccessToken('')
      setAccountVerified(null)
      $(modalRef.current).modal('show')
    } else {
      $(modalRef.current).modal('hide')
      $('.modal-backdrop').remove()
    }
  }, [service])

  useEffect(() => {
    $(modalRef.current).on('hidden.bs.modal', () => {
      onClose()
      setService(null)
    })
    return () => {
      $(modalRef.current).off('hidden.bs.modal')
    }
  }, [null])

  return <Modal modalRef={modalRef} title={
    <div className="d-flex align-items-center">
      <div className="me-3">
        <div 
          className="avatar-md rounded-circle d-flex align-items-center justify-content-center"
          style={{ backgroundColor: `${config.color}15`, border: `2px solid ${config.color}` }}
        >
         {icons[service] && React.cloneElement(icons[service], { 
                style: { height: '30px', width: 'auto', opacity: 0.8 },
                className: ''
              })}
        </div>
      </div>
      <div>
        <h4 className="mb-0">Integrar {config.name}</h4>
        <small className="text-muted">Conecta tu {config.account_type} con Atalaya</small>
      </div>
    </div>
  } bodyClass='px-4 pt-2 pb-4' hideFooter onClose={() => setService(null)} isStatic>
    <div id="progressbarwizard">

      {/* Solo mostrar tabs si NO es Formularios */}
      {service !== 'formularios' && (
        <ul className="nav nav-pills nav-justified form-wizard-header mb-4 rounded-3" style={{
          backgroundColor: 'var(--bs-gray-100)',
          border: '1px solid var(--bs-border-color)'
        }}>
          <li className="nav-item">
            <a href="#account-2" data-bs-toggle="tab" data-toggle="tab" 
               className={`nav-link rounded-start border-0 pt-3 pb-3 ${step == 1 && 'active'}`} 
               onClick={() => setStep(1)}
               style={{ 
                 backgroundColor: step == 1 ? config.color : 'transparent', 
                 color: step == 1 ? 'white' : 'var(--bs-gray-600)',
                 fontWeight: step == 1 ? '600' : '500',
                 transition: 'all 0.3s ease'
               }}>
              <i className="mdi mdi-cog me-2"></i>
              <span className="d-none d-sm-inline">Configuración</span>
            </a>
          </li>
          <li className="nav-item">
            <a href="#profile-tab-2" data-bs-toggle="tab" data-toggle="tab" 
               className={`nav-link border-0 pt-3 pb-3 ${step == 2 && 'active'}`} 
               onClick={() => setStep(2)}
               style={{ 
                 backgroundColor: step == 2 ? config.color : 'transparent', 
                 color: step == 2 ? 'white' : 'var(--bs-gray-600)',
                 fontWeight: step == 2 ? '600' : '500',
                 transition: 'all 0.3s ease'
               }}>
              <i className="mdi mdi-key me-2"></i>
              <span className="d-none d-sm-inline">Autenticación</span>
            </a>
          </li>
          <li className="nav-item">
            <a href="#finish-2" data-bs-toggle="tab" data-toggle="tab" 
               className={`nav-link rounded-end border-0 pt-3 pb-3 ${step == 3 && 'active'} ${(service === 'whatsapp' || service === 'gmail') ? '' : 'disabled'}`} 
               disabled={service !== 'whatsapp' && service !== 'gmail'}
               onClick={() => (service === 'whatsapp' || service === 'gmail') && setStep(3)}
               style={{ 
                 backgroundColor: step == 3 ? config.color : 'transparent', 
                 color: step == 3 ? 'white' : 'var(--bs-gray-500)',
                 fontWeight: step == 3 ? '600' : '500',
                 transition: 'all 0.3s ease',
                 cursor: (service === 'whatsapp' || service === 'gmail') ? 'pointer' : 'not-allowed'
               }}>
              <i className="mdi mdi-check-circle me-2"></i>
              <span className="d-none d-sm-inline">Completado</span>
            </a>
          </li>
        </ul>
      )}

      <div className="tab-content b-0 mb-0 pt-0">

        <div className={`tab-pane ${step == 1 && 'active'}`} id="account-2">
         
          {service === 'formularios' ? (
            // Contenido especial para formularios - Solo mostrar el step
            <div className="">
              <div className="alert border-0 rounded-3" style={{ 
                backgroundColor: `${config.color}10`,
                borderLeft: `4px solid ${config.color}`
              }}>
                <h6 className="alert-heading d-flex align-items-center mb-3">
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center me-2"
                    style={{ 
                      width: '32px', 
                      height: '32px', 
                      backgroundColor: config.color,
                      color: 'white'
                    }}
                  >
                    <i className="mdi mdi-information fs-6"></i>
                  </div>
                  Configuración de {config.name}
                </h6>
                <div className="mb-0 ps-3">
                  {config.steps.map((step, index) => {
                    return (
                      <div key={index} className="mb-2">
                        <span dangerouslySetInnerHTML={{ __html: step }} />
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="text-center mt-4">
                <button 
                  type='button' 
                  className="btn px-4"
                  style={{ backgroundColor: config.color, borderColor: config.color, color: 'white' }}
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
              <div className="alert border-0 rounded-3" style={{ 
                backgroundColor: `${config.color}10`,
                borderLeft: `4px solid ${config.color}`
              }}>
                <h6 className="alert-heading d-flex align-items-center mb-3">
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center me-2"
                    style={{ 
                      width: '32px', 
                      height: '32px', 
                      backgroundColor: config.color,
                      color: 'white'
                    }}
                  >
                    <i className="mdi mdi-information fs-6"></i>
                  </div>
                  Pasos previos requeridos
                </h6>
                <ol className="mb-0 ps-3">
                  {config.steps.map((step, index) => {
                    // Para WhatsApp con imágenes
                    if (config.hasImages && typeof step === 'object') {
                      return (
                        <li key={index} className="mb-4">
                          <div className="d-flex flex-column">
                            <span dangerouslySetInnerHTML={{ __html: step.text }} className="mb-2" />
                            <div className="border rounded-3 overflow-hidden" style={{ maxWidth: '100%' }}>
                              <img 
                                src={step.image} 
                                alt={`Paso ${index + 1} - WhatsApp`}
                                className="img-fluid"
                                style={{ width: '100%', height: 'auto' }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'block';
                                }}
                              />
                              <div 
                                className="text-center p-3 text-muted" 
                                style={{ display: 'none' }}
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
                    if (typeof step === 'string' && (step.includes('Panel de Desarrolladores') || step.includes('Console'))) {
                      processedStep = step.replace(/Panel de Desarrolladores|Console/g, (match) => 
                        `<a href="${config.developer_url}" target="_blank" style="color: ${config.color}; font-weight: 500; text-decoration: underline;">${match}</a>`
                      );
                    }
                    
                    return (
                      <li key={index} className="mb-2">
                        <span dangerouslySetInnerHTML={{ __html: processedStep }} />
                        {typeof step === 'string' && step.includes('permisos') && (
                          <div className="mt-1">
                            <code className="small px-2 py-1 rounded" style={{ 
                              backgroundColor: 'var(--bs-gray-100)', 
                              color: 'var(--bs-gray-800)',
                              fontSize: '0.75rem'
                            }}>
                              {config.permissions}
                            </code>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ol>
                {service !== 'whatsapp' || service !== 'gmail' && config.developer_url !== '#' && (
                  <div className="mt-3 pt-3 border-top" style={{ borderColor: `${config.color}30` }}>
                    <a 
                      href={config.developer_url} 
                      target="_blank" 
                      className="btn btn-sm"
                      style={{ 
                        backgroundColor: config.color, 
                        borderColor: config.color, 
                        color: 'white' 
                      }}
                    >
                      <i className="mdi mdi-open-in-new me-1"></i>
                      Abrir Panel de Desarrolladores
                    </a>
                  </div>
                )}
              </div>

              {/* Solo mostrar inputs si NO es WhatsApp, Gmail o Formularios */}
              {service !== 'whatsapp' && service !== 'gmail' && service !== 'formularios' && (
                <div className="row g-3">
                  <div className="col-12">
                    <label className='form-label fw-semibold d-flex align-items-center'>
                      <i className="mdi mdi-link me-2" style={{ color: config.color }}></i>
                      URL de Callback:
                    </label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control border-2"
                        value={`${Global.APP_URL}/meta/${service}/${apikey}`}
                        readOnly
                        style={{
                          backgroundColor: 'var(--bs-gray-50)',
                          borderColor: 'var(--bs-border-color)',
                          color: 'var(--bs-body-color)'
                        }}
                      />
                      <button
                        type='button'
                        className="btn border-2"
                        style={{ 
                          borderColor: config.color, 
                          color: config.color,
                          backgroundColor: 'var(--bs-body-bg)'
                        }}
                        onClick={() => onCopyClicked(`${Global.APP_URL}/meta/${service}/${apikey}`)}
                      >
                        <i className="mdi mdi-content-copy"></i>
                      </button>
                    </div>
                  </div>
                  <div className="col-12">
                    <label className='form-label fw-semibold d-flex align-items-center'>
                      <i className="mdi mdi-shield-check me-2" style={{ color: config.color }}></i>
                      Token de Verificación:
                    </label>
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control border-2"
                        value={auth_token}
                        readOnly
                        style={{
                          backgroundColor: 'var(--bs-gray-50)',
                          borderColor: 'var(--bs-border-color)',
                          color: 'var(--bs-body-color)'
                        }}
                      />
                      <button
                        type='button'
                        className="btn border-2"
                        style={{ 
                          borderColor: config.color, 
                          color: config.color,
                          backgroundColor: 'var(--bs-body-bg)'
                        }}
                        onClick={() => onCopyClicked(auth_token)}
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

        <div className={`tab-pane ${step == 2 && 'active'}`} id="profile-tab-2">
        

          <div className="alert border-0 rounded-3" style={{ 
            backgroundColor: `${config.color}10`,
            borderLeft: `4px solid ${config.color}`
          }}>
            <h6 className="alert-heading d-flex align-items-center mb-3">
              <div 
                className="rounded-circle d-flex align-items-center justify-content-center me-2"
                style={{ 
                  width: '32px', 
                  height: '32px', 
                  backgroundColor: config.color,
                  color: 'white'
                }}
              >
                <i className="mdi mdi-key fs-6"></i>
              </div>
              Obtener credenciales de {config.name}
            </h6>
            <ol className="mb-0 ps-3">
              {config.authSteps.map((step, index) => {
                // Para WhatsApp con imágenes
                if (config.hasImages && typeof step === 'object') {
                  return (
                    <li key={index} className="mb-4">
                      <div className="d-flex flex-column">
                        <span dangerouslySetInnerHTML={{ __html: step.text }} className="mb-2" />
                        <div className="border rounded-3 overflow-hidden" style={{ maxWidth: '100%' }}>
                          <img 
                            src={step.image} 
                            alt={`Autenticación paso ${index + 1} - WhatsApp`}
                            className="img-fluid"
                            style={{ width: '100%', height: 'auto' }}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'block';
                            }}
                          />
                          <div 
                            className="text-center p-3 text-muted" 
                            style={{ display: 'none' }}
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
                if (typeof step === 'string' && (step.includes('Panel de Desarrolladores') || step.includes('Console'))) {
                  processedStep = step.replace(/Panel de Desarrolladores|Console/g, (match) => 
                    `<a href="${config.developer_url}" target="_blank" style="color: ${config.color}; font-weight: 500; text-decoration: underline;">${match}</a>`
                  );
                }
                
                return (
                  <li key={index} className="mb-2">
                    <span dangerouslySetInnerHTML={{ __html: processedStep }} />
                  </li>
                );
              })}
            </ol>
          </div>

          {/* Solo mostrar inputs si NO es WhatsApp, Gmail o Formularios */}
          {service !== 'whatsapp' && service !== 'gmail' && service !== 'formularios' && (
            <>
              <div className="row g-3">
                <div className="col-12">
                  <label className='form-label fw-semibold d-flex align-items-center'>
                    <i className="mdi mdi-account me-2" style={{ color: config.color }}></i>
                    ID de la {config.account_type}:
                  </label>
                  <input
                    type="text"
                    className="form-control border-2"
                    value={accountId}
                    onChange={e => setAccountId(e.target.value)}
                    placeholder="Ej: 123456789"
                    disabled={!!accountVerified}
                    style={{ 
                      borderColor: accountVerified ? '#28a745' : 'var(--bs-border-color)',
                      backgroundColor: accountVerified ? '#d4edda' : 'var(--bs-body-bg)',
                      color: 'var(--bs-body-color)'
                    }}
                  />
                </div>
                <div className="col-12">
                  <label className='form-label fw-semibold d-flex align-items-center'>
                    <i className="mdi mdi-key-variant me-2" style={{ color: config.color }}></i>
                    Access Token:
                  </label>
                  <input
                    type="text"
                    className="form-control border-2"
                    value={accessToken}
                    onChange={e => setAccessToken(e.target.value)}
                    placeholder="Pega aquí tu Access Token"
                    disabled={!!accountVerified}
                    style={{ 
                      borderColor: accountVerified ? '#28a745' : 'var(--bs-border-color)',
                      backgroundColor: accountVerified ? '#d4edda' : 'var(--bs-body-bg)',
                      color: 'var(--bs-body-color)'
                    }}
                  />
                </div>
              </div>

              <div className="mt-4">
                {
                  accountVerified
                    ? <div className="alert alert-success border-0 rounded-3">
                        <div className="d-flex align-items-center">
                          <img
                            className="avatar-md rounded-circle me-3 border"
                            src={accountVerified.picture?.data?.url || accountVerified.profile_pic || '/assets/img/default-avatar.png'}
                            alt={accountVerified.name}
                            onError={e => e.target.src = `//${Global.APP_DOMAIN}/api/logo/thumbnail/null`}
                          />
                          <div className="flex-grow-1">
                            <h6 className="mb-1">{accountVerified.name}</h6>
                            <small className="text-muted">
                              @{accountVerified.username || accountVerified.id}
                            </small>
                          </div>
                          <div className="text-success">
                            <i className="mdi mdi-check-circle fs-4"></i>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-top">
                          <i className="mdi mdi-check-circle me-1"></i>
                          <small>Cuenta verificada exitosamente y lista para integrar</small>
                        </div>
                      </div>
                    : <div className="text-center">
                        <button
                          type='button'
                          className="btn btn-lg px-4 py-2"
                          style={{ backgroundColor: config.color, borderColor: config.color, color: 'white' }}
                          onClick={onVerifyClicked}
                          disabled={verifying || !accountId || !accessToken}
                        >
                          {verifying ? (
                            <>
                              <i className="mdi mdi-loading mdi-spin me-2"></i>
                              Verificando cuenta...
                            </>
                          ) : (
                            <>
                              <i className="mdi mdi-check-circle me-2"></i>
                              Verificar cuenta
                            </>
                          )}
                        </button>
                      </div>
                }
              </div>
            </>
          )}
        </div>

        <div className={`tab-pane ${step == 3 && 'active'}`} id="finish-2">
          {/* Contenido personalizado para WhatsApp, Gmail y Formularios */}
          {(service === 'whatsapp' || service === 'gmail' || service === 'formularios') && config.completedStep ? (
            <div className="text-center">
              <div className="mb-4">
                <div 
                  className="avatar-xl rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                  style={{ backgroundColor: `${config.color}15`, border: `3px solid ${config.color}` }}
                >
                  <i className="mdi mdi-check-all fs-1" style={{ color: config.color }}></i>
                </div>
                <h3 className="text-success">¡{config.name} Configurado!</h3>
              </div>

              <div className="alert border-0 rounded-3" style={{ 
                backgroundColor: `${config.color}10`,
                borderLeft: `4px solid ${config.color}`
              }}>
                <h6 className="alert-heading d-flex align-items-center mb-3">
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center me-2"
                    style={{ 
                      width: '32px', 
                      height: '32px', 
                      backgroundColor: config.color,
                      color: 'white'
                    }}
                  >
                    <i className="mdi mdi-check-circle fs-6"></i>
                  </div>
                  Configuración finalizada
                </h6>
                <div className="d-flex flex-column">
                  <span dangerouslySetInnerHTML={{ __html: config.completedStep.text }} className="mb-3" />
                  {config.completedStep.image && (
                    <div className="border rounded-3 overflow-hidden" style={{ maxWidth: '100%' }}>
                      <img 
                        src={config.completedStep.image} 
                        alt={`${config.name} configurado exitosamente`}
                        className="img-fluid"
                        style={{ width: '100%', height: 'auto' }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'block';
                        }}
                      />
                      <div 
                        className="text-center p-3 text-muted" 
                        style={{ display: 'none' }}
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
                {config.name} está ahora completamente configurado y listo para usar.
              </p>
            </div>
          ) : (
            /* Contenido normal para otros servicios */
            <div className="text-center">
              <div className="mb-4">
                <div 
                  className="avatar-xl rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                  style={{ backgroundColor: `${config.color}15`, border: `3px solid ${config.color}` }}
                >
                  <i className="mdi mdi-check-all fs-1" style={{ color: config.color }}></i>
                </div>
                <h3 className="text-success">¡Integración Completada!</h3>
              </div>

              <div className="alert alert-success border-0 rounded-3 text-start">
                <h6 className="alert-heading d-flex align-items-center">
                  <i className="mdi mdi-rocket me-2"></i>
                  ¿Qué puedes hacer ahora?
                </h6>
                <ul className="mb-0 ps-3">
                  <li>Gestionar conversaciones desde el panel principal</li>
                  <li>Recibir notificaciones en tiempo real</li>
                  <li>Automatizar respuestas con IA</li>
                  <li>Generar reportes de engagement</li>
                </ul>
              </div>

              <p className="text-muted">
                Tu {config.account_type} está ahora conectada con {Global.APP_NAME}. 
                Todas las interacciones se sincronizarán automáticamente.
              </p>
            </div>
          )}
        </div>

        <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
          {/* Solo mostrar navegación si NO es Formularios */}
          {service !== 'formularios' && (
            <>
              <div>
                {step > 1 && (
                  <button 
                    type='button' 
                    className="btn btn-outline-secondary px-4"
                    onClick={() => setStep(old => --old)}
                  >
                    <i className="mdi mdi-arrow-left me-1"></i>
                    Anterior
                  </button>
                )}
              </div>
              
              <div className="text-center flex-grow-1">
                <small className="text-muted">Paso {step} de 3</small>
              </div>

              <div>
                {step == 1 && (
                  <button 
                    type='button' 
                    className="btn px-4"
                    style={{ backgroundColor: config.color, borderColor: config.color, color: 'white' }}
                    onClick={() => setStep(old => ++old)}
                  >
                    Siguiente
                    <i className="mdi mdi-arrow-right ms-1"></i>
                  </button>
                )}
                {step == 2 && (
                  /* Para WhatsApp, Gmail y Formularios, permite ir directamente al paso 3 */
                  (service === 'whatsapp' || service === 'gmail' || service === 'formularios') ? (
                    <button 
                      type='button' 
                      className="btn px-4"
                      style={{ backgroundColor: config.color, borderColor: config.color, color: 'white' }}
                      onClick={() => setStep(3)}
                    >
                      Finalizar
                      <i className="mdi mdi-arrow-right ms-1"></i>
                    </button>
                  ) : (
                    /* Para otros servicios, mantener lógica original */
                    accountVerified ? (
                      <button 
                        type='button' 
                        className="btn px-4"
                        style={{ backgroundColor: config.color, borderColor: config.color, color: 'white' }}
                        onClick={() => onIntegrateClicked()}
                        disabled={integrating}
                      >
                        {integrating ? (
                          <>
                            <i className='mdi mdi-spin mdi-loading me-1'></i>
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
                        <button type='button' className="btn btn-outline-secondary px-4" disabled>
                          <i className="mdi mdi-plus me-1"></i>
                          Finalizar
                        </button>
                      </Tippy>
                    )
                  )
                )}
                {/* Botón para cerrar en paso 3 para WhatsApp, Gmail y Formularios */}
                {step == 3 && (service === 'whatsapp' || service === 'gmail' || service === 'formularios') && (
                  <button 
                    type='button' 
                    className="btn px-4"
                    style={{ backgroundColor: config.color, borderColor: config.color, color: 'white' }}
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
  </Modal >
}

const Webhooks = ({ apikey, auth_token, integrations: integrationsDB }) => {
  const [integrations, setIntegrations] = useState(integrationsDB)
  const [wizardService, setWizardService] = useState(null)

  const serviceDescriptions = {
    messenger: 'Integra tu página de Facebook para recibir y responder mensajes directamente desde Atalaya.',
    instagram: 'Conecta tu cuenta de Instagram para gestionar mensajes directos y comentarios desde Atalaya.',
    whatsapp: 'Conecta tu cuenta de WhatsApp Business para gestionar mensajes desde Atalaya.',
    tiktok: 'Integra tu cuenta de TikTok para gestionar comentarios y mensajes desde Atalaya.',
    gmail: 'Conecta tu cuenta de Gmail para gestionar correos electrónicos desde Atalaya.',
    'google-calendar': 'Integra Google Calendar para gestionar citas y eventos desde Atalaya.',
    formularios: 'Conecta formularios web para recibir leads directamente en Atalaya.'
  }

  const handleIntegrationSuccess = (newIntegration) => {
    setIntegrations(old => [...old, newIntegration])
  }

  const onUnlinkClicked = async (integrationId) => {
    const { isConfirmed } = await Swal.fire({
      title: '¿Estás seguro?',
      text: 'Esta acción desvinculará la integración. ¿Deseas continuar?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, desvincular',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    });

    if (!isConfirmed) return
    const success = await integrationsRest.delete(integrationId);
    if (success) {
      setIntegrations(current => current.filter(integration => integration.id !== integrationId));
      toast.success('Integración desvinculada exitosamente');
    }
  }

  const ibms = integrations.reduce((acc, integration) => {
    if (!acc[integration.meta_service]) {
      acc[integration.meta_service] = integration;
    }
    return acc;
  }, {});

  return <>
    <div className="container-fluid">
      <div className="row">
        {Object.entries(icons).map(([service, icon]) => (
          <ServiceCard
            key={service}
            service={service}
            icon={icon}
            description={serviceDescriptions[service]}
            integration={ibms[service]}
            onIntegrate={setWizardService}
            onUnlink={onUnlinkClicked}
          />
        ))}
      </div>
    </div>
    <IntegrationWizardModal
      service={wizardService}
      setService={setWizardService}
      apikey={apikey}
      auth_token={auth_token}
      onClose={() => setWizardService(null)}
      onSuccess={handleIntegrationSuccess} />
  </>
}

CreateReactScript((el, properties) => {
  createRoot(el).render(
    <Adminto {...properties} title='Redes Sociales'>
      <Webhooks {...properties} />
    </Adminto>
  );
})