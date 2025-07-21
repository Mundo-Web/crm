
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
  'messenger': 'mdi-facebook-messenger',
  'instagram': 'mdi-instagram',
}

const ServiceCard = ({ service, icon, description, integration, onIntegrate, onUnlink }) => {
  return (
    <div className="col-xxl-3 col-xl-4 col-lg-6 col-md-6 " >
      <div className="card">
        <div className="card-body">
          <div className="d-flex align-items-center mb-3">
            <div className="avatar-sm me-3">
              <span className="avatar-title bg-soft-primary rounded px-2">
                <i className={`mdi ${icon} font-22 text-primary`}></i>
              </span>
            </div>
            <div className="flex-grow-1">
              <h4 className="mt-0 mb-1">{service.toTitleCase()}</h4>
              <p className="text-muted mb-0">{description}</p>
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
                className="btn btn-primary w-100"
                onClick={() => onIntegrate(service)}
              >
                <i className="mdi mdi-plus me-1"></i>
                Integrar {service.toTitleCase()}
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

  return <Modal modalRef={modalRef} title={`Integrar ${service?.toTitleCase()}`} bodyClass='px-3 pt-0 pb-3' hideFooter onClose={() => setService(null)} isStatic>
    <div id="progressbarwizard">

      <ul class="nav nav-pills bg-light nav-justified form-wizard-header mb-3">
        <li class="nav-item">
          <a href="#account-2" data-bs-toggle="tab" data-toggle="tab" class={`nav-link rounded-0 pt-2 pb-2 ${step == 1 && 'active'}`} onClick={() => setStep(1)}>
            <i class="mdi mdi-application me-1"></i>
            <span class="d-none d-sm-inline">Crear Aplicación</span>
          </a>
        </li>
        <li class="nav-item">
          <a href="#profile-tab-2" data-bs-toggle="tab" data-toggle="tab" class={`nav-link rounded-0 pt-2 pb-2 ${step == 2 && 'active'}`} onClick={() => setStep(2)}>
            <i class="mdi mdi-key me-1"></i>
            <span class="d-none d-sm-inline">Generar Token</span>
          </a>
        </li>
        <li class="nav-item">
          <a href="#finish-2" data-bs-toggle="tab" data-toggle="tab" class={`nav-link rounded-0 disabled pt-2 pb-2 ${step == 3 && 'active'}`} disabled>
            <i class="mdi mdi-check me-1"></i>
            <span class="d-none d-sm-inline">Integración Lista</span>
          </a>
        </li>
      </ul>

      <div class="tab-content b-0 mb-0 pt-0">

        <div class={`tab-pane ${step == 1 && 'active'}`} id="account-2">
          <p>Para integrar {service?.toTitleCase()}, primero debes:</p>
          <ol>
            <li>Abrir el <a href="https://developers.facebook.com/apps" target="_blank">Panel de Aplicaciones de Meta</a></li>
            <li>Crear una nueva aplicación o seleccionar una existente</li>
            <li>Habilitar el producto "{service === 'messenger' ? 'Messenger' : 'Instagram'}"</li>
            <li>Configurar los permisos necesarios</li>
          </ol>
          <p>Copia y pega estos datos en la configuración de webhook de tu aplicación:</p>
          <div className="form-group mb-2">
            <label className='form-label mb-0'>URL de Callback:</label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                value={`${Global.APP_URL}/meta/${service}/${apikey}`}
                readOnly
              />
              <button
                type='button'
                className="btn btn-secondary"
                onClick={() => onCopyClicked(`${Global.APP_URL}/meta/${service}/${apikey}`)}
              >
                <i className="mdi mdi-content-copy"></i>
              </button>
            </div>
          </div>
          <div className="form-group">
            <label className='form-label mb-0'>Token de Verificación:</label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                value={auth_token}
                readOnly
              />
              <button
                type='button'
                className="btn btn-secondary"
                onClick={() => onCopyClicked(auth_token)}
              >
                <i className="mdi mdi-content-copy"></i>
              </button>
            </div>
          </div>
        </div>

        <div class={`tab-pane ${step == 2 && 'active'}`} id="profile-tab-2">
          <p>Para obtener el Access Token y el ID de la cuenta de {service === 'messenger' ? 'Facebook' : 'Instagram'}, sigue estos pasos:</p>
          <ol>
            <li>Ve a la configuración de tu aplicación en Meta Developers</li>
            <li>Navega a la sección de "{service === 'messenger' ? 'Messenger' : 'Instagram'}" en el menú lateral</li>
            <li>Selecciona la página/cuenta que deseas conectar y genera un token de acceso con los permisos de mensajería</li>
          </ol>
          <p>Ingresa el ID de tu {service === 'messenger' ? 'página de Facebook' : 'cuenta de Instagram'} y el token de acceso generado:</p>
          <div className="form-group mb-2">
            <label className='form-label mb-0'>ID de la cuenta:</label>
            <input
              type="text"
              className="form-control"
              value={accountId}
              onChange={e => setAccountId(e.target.value)}
              placeholder="Ej: 123456789"
              disabled={!!accountVerified}
            />
          </div>
          <div className="form-group mb-3">
            <label className='form-label mb-0'>Access Token:</label>
            <input
              type="text"
              className="form-control"
              value={accessToken}
              onChange={e => setAccessToken(e.target.value)}
              placeholder="Pega aquí tu Access Token"
              disabled={!!accountVerified}
            />
          </div>
          {
            accountVerified
              ? <div className="alert alert-info">
                <div className="d-flex align-items-center">
                  <img
                    className="avatar-sm rounded-circle me-2"
                    src={accountVerified.picture.data.url}
                    alt={accountVerified.name}
                    onError={e => e.target.src = `//${Global.APP_DOMAIN}/api/logo/thumbnail/null`}
                  />
                  <div>
                    <h5 className="mb-0">{accountVerified.name}</h5>
                    <small className="text-muted">
                      @{accountVerified.username}
                    </small>
                  </div>
                </div>
                <div className="mt-2">
                  <i className="mdi mdi-check-circle me-1"></i>
                  Cuenta verificada exitosamente
                </div>
              </div>
              : <button
                type='button'
                className="btn btn-primary"
                onClick={onVerifyClicked}
                disabled={verifying}
              >
                {verifying ? (
                  <>
                    <i className="mdi mdi-loading mdi-spin me-1"></i>
                    Verificando...
                  </>
                ) : (
                  <>
                    <i className="mdi mdi-check me-1"></i>
                    Verificar cuenta
                  </>
                )}
              </button>
          }
        </div>

        <div class={`tab-pane ${step == 3 && 'active'}`} id="finish-2">
          <div class="row">
            <div class="col-12">
              <div class="text-center">
                <h2 class="mt-0"><i class="mdi mdi-check-all text-success"></i></h2>
                <h3 class="mt-0">¡Todo listo!</h3>

                <p class="w-75 mb-2 mx-auto">
                  Has completado exitosamente la integración de tu cuenta de {service?.toTitleCase()} con {Global.APP_NAME}.
                  Ahora podrás gestionar tus conversaciones y leads directamente desde nuestra plataforma.
                </p>

                <div class="alert alert-success mt-3">
                  <i className="mdi mdi-rocket me-2"></i>
                  Estás listo para empezar a generar leads y gestionar conversaciones con {Global.APP_NAME}
                </div>
              </div>
            </div>
          </div>
        </div>

        <ul class="list-inline mb-0 wizard mt-3">

          {
            step > 1 &&
            <li class="prev list-inline-item">
              <button type='button' class="btn btn-secondary" onClick={() => setStep(old => --old)}>Anterior</button>
            </li>
          }
          {
            step == 1 &&
            <li class="next list-inline-item float-end">
              <button type='button' class="btn btn-secondary" onClick={() => setStep(old => ++old)}>Siguiente</button>
            </li>
          }
          {
            step == 2 &&
            (
              accountVerified
                ? <li class="next list-inline-item float-end" >
                  <button type='button' class="btn btn-secondary" onClick={() => onIntegrateClicked()}>
                    {integrating
                      ? <>
                        <i className='mdi mdi-spin mdi-loading me-1'></i>
                        Integrando
                      </>
                      : 'Integrar'}
                  </button>
                </li>
                : <Tippy content="Verifica la cuenta primero">
                  <li class="next list-inline-item float-end">
                    <button type='button' class="btn btn-secondary" disabled>Integrar</button>
                  </li>
                </Tippy>
            )
          }
        </ul>

      </div>
    </div>
  </Modal >
}

const Webhooks = ({ apikey, auth_token, integrations: integrationsDB }) => {
  const [integrations, setIntegrations] = useState(integrationsDB)
  const [wizardService, setWizardService] = useState(null)

  const serviceDescriptions = {
    messenger: 'Integra tu página de Facebook para recibir y responder mensajes directamente desde Atalaya.',
    instagram: 'Conecta tu cuenta de Instagram para gestionar mensajes directos y comentarios desde Atalaya.'
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

    if (!isConfirmed) result
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
    <Adminto {...properties} title='Integraciones - Webhooks'>
      <Webhooks {...properties} />
    </Adminto>
  );
})