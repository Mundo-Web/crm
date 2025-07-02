
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

const integrationsRest = new IntegrationsRest()

const icons = {
  'messenger': 'mdi-facebook-messenger',
  'instagram': 'mdi-instagram',
}

const ServiceCard = ({ service, icon, description, integration, onIntegrate }) => {
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
                    {integration.meta_leads} leads generados
                  </small>
                </div>
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

  useEffect(() => {
    if (service) {
      setStep(1)
      setAccessToken('')
      $(modalRef.current).modal('show')
    } else {
      $(modalRef.current).modal('hide')
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

  console.log(service)

  return <Modal modalRef={modalRef} title={`Integrar ${service?.toTitleCase()}`} bodyClass='px-3 pt-0 pb-3' hideFooter>
    <div id="progressbarwizard">

      <ul class="nav nav-pills bg-light nav-justified form-wizard-header mb-3">
        <li class="nav-item">
          <a href="#account-2" data-bs-toggle="tab" data-toggle="tab" class="nav-link rounded-0 pt-2 pb-2 active">
            <i class="mdi mdi-application me-1"></i>
            <span class="d-none d-sm-inline">Crear aplicación</span>
          </a>
        </li>
        <li class="nav-item">
          <a href="#profile-tab-2" data-bs-toggle="tab" data-toggle="tab" class="nav-link rounded-0 pt-2 pb-2">
            <i class="mdi mdi-identifier me-1"></i>
            <span class="d-none d-sm-inline">Generar un Token</span>
          </a>
        </li>
        <li class="nav-item">
          <a href="#finish-2" data-bs-toggle="tab" data-toggle="tab" class="nav-link rounded-0 pt-2 pb-2">
            <i class="mdi mdi-checkbox-marked-circle-outline me-1"></i>
            <span class="d-none d-sm-inline">Listo para generar</span>
          </a>
        </li>
      </ul>

      <div class="tab-content b-0 mb-0 pt-0">

        <div class="tab-pane active" id="account-2">
          <p>Para integrar {service?.toTitleCase()}, primero debes:</p>
          <ol>
            <li>Abrir el <a href="https://developers.facebook.com/apps" target="_blank">Panel de Aplicaciones de Meta</a></li>
            <li>Crear una nueva aplicación o seleccionar una existente</li>
            <li>Habilitar el producto "{service === 'messenger' ? 'Messenger' : 'Instagram'}"</li>
            <li>Configurar los permisos necesarios</li>
          </ol>
          <p>Copia y pega estos datos en la configuración de webhook de tu aplicación:</p>
          <div className="form-group mb-3">
            <label>URL de Callback:</label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                value={`${Global.APP_URL}/meta/${service}/${apikey}`}
                readOnly
              />
              <button
                className="btn btn-secondary"
                onClick={() => onCopyClicked(`${Global.APP_URL}/meta/${service}/${apikey}`)}
              >
                <i className="mdi mdi-content-copy"></i>
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Token de Verificación:</label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                value={auth_token}
                readOnly
              />
              <button
                className="btn btn-secondary"
                onClick={() => onCopyClicked(auth_token)}
              >
                <i className="mdi mdi-content-copy"></i>
              </button>
            </div>
          </div>
        </div>

        <div class="tab-pane" id="profile-tab-2">
          <p>Ingresa el Access Token generado para verificar la conexión:</p>
          <div className="form-group">
            <input
              type="text"
              className="form-control"
              value={accessToken}
              onChange={e => setAccessToken(e.target.value)}
              placeholder="Pega aquí tu Access Token"
            />
          </div>
          <h4>Previsualizacion de la cuenta asociada al token</h4>
        </div>

        <div class="tab-pane" id="finish-2">
          <div class="row">
            <div class="col-12">
              <div class="text-center">
                <h2 class="mt-0"><i class="mdi mdi-check-all"></i></h2>
                <h3 class="mt-0">Thank you !</h3>

                <p class="w-75 mb-2 mx-auto">Quisque nec turpis at urna
                  dictum luctus. Suspendisse convallis dignissim eros
                  at volutpat. In egestas mattis dui. Aliquam
                  mattis dictum aliquet.</p>

                <div class="mb-3">
                  <div class="form-check d-inline-block">
                    <input type="checkbox" class="form-check-input" id="customCheck3" />
                    <label class="form-check-label" for="customCheck3">I agree with the Terms
                      and Conditions</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <ul class="list-inline mb-0 wizard mt-3">
          <li class="previous list-inline-item disabled">
            <a href="javascript: void(0);" class="btn btn-secondary">Previous</a>
          </li>
          <li class="next list-inline-item float-end">
            <a href="javascript: void(0);" class="btn btn-secondary">Next</a>
          </li>
        </ul>

      </div>
    </div>
  </Modal>
}

const IntegrationWizard = ({ service, apikey, auth_token, onClose, onSuccess }) => {
  const [step, setStep] = useState(1)
  const [accessToken, setAccessToken] = useState('')

  const steps = [
    {
      title: 'Crear Aplicación',
      content: (
        <div>
          <p>Para integrar {service.toTitleCase()}, primero debes:</p>
          <ol>
            <li>Abrir el <a href="https://developers.facebook.com/apps" target="_blank">Panel de Aplicaciones de Meta</a></li>
            <li>Crear una nueva aplicación o seleccionar una existente</li>
            <li>Habilitar el producto "{service === 'messenger' ? 'Messenger' : 'Instagram'}"</li>
            <li>Configurar los permisos necesarios</li>
          </ol>
        </div>
      )
    },
    {
      title: 'Configurar Webhook',
      content: (
        <div>
          <p>Copia y pega estos datos en la configuración de webhook de tu aplicación:</p>
          <div className="form-group mb-3">
            <label>URL de Callback:</label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                value={`${Global.APP_URL}/meta/${service}/${apikey}`}
                readOnly
              />
              <button
                className="btn btn-secondary"
                onClick={() => onCopyClicked(`${Global.APP_URL}/meta/${service}/${apikey}`)}
              >
                <i className="mdi mdi-content-copy"></i>
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Token de Verificación:</label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                value={auth_token}
                readOnly
              />
              <button
                className="btn btn-secondary"
                onClick={() => onCopyClicked(auth_token)}
              >
                <i className="mdi mdi-content-copy"></i>
              </button>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Conectar',
      content: (
        <div>
          <p>Ingresa el Access Token generado para verificar la conexión:</p>
          <div className="form-group">
            <input
              type="text"
              className="form-control"
              value={accessToken}
              onChange={e => setAccessToken(e.target.value)}
              placeholder="Pega aquí tu Access Token"
            />
          </div>
        </div>
      )
    }
  ]

  const handleFinish = async () => {
    if (!accessToken) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Debes ingresar un Access Token'
      })
      return
    }

    try {
      const result = await integrationsRest.save({
        meta_service: service,
        meta_access_token: accessToken
      })

      if (result) {
        onSuccess(result)
        onClose()
        Swal.fire({
          icon: 'success',
          title: '¡Éxito!',
          text: 'Integración completada correctamente'
        })
      }
    } catch (error) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message
      })
    }
  }

  return (
    <div className="modal fade show" style={{ display: 'block' }}>
      <div className="modal-dialog modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              Integrar {service.toTitleCase()}
            </h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body">
            <div className="bs-wizard" style={{ borderBottom: '0' }}>
              {steps.map((s, i) => (
                <div key={i} className={`bs-wizard-step ${i + 1 === step ? 'active' : i + 1 < step ? 'complete' : 'disabled'}`}>
                  <div className="text-center bs-wizard-stepnum">{s.title}</div>
                  <div className="progress">
                    <div className="progress-bar"></div>
                  </div>
                  <a href="#" className="bs-wizard-dot"></a>
                </div>
              ))}
            </div>
            <div className="mt-4">
              {steps[step - 1].content}
            </div>
          </div>
          <div className="modal-footer">
            {step > 1 && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setStep(s => s - 1)}
              >
                Anterior
              </button>
            )}
            {step < steps.length ? (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setStep(s => s + 1)}
              >
                Siguiente
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-success"
                onClick={handleFinish}
              >
                Finalizar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

const Webhooks = ({ apikey, auth_token, integrations: integrationsDB }) => {
  const [integrations, setIntegrations] = useState(integrationsDB)
  const [wizardService, setWizardService] = useState(null)

  const serviceDescriptions = {
    messenger: 'Integra tu página de Facebook para recibir y responder mensajes directamente desde Atalaya.',
    instagram: 'Conecta tu cuenta de Instagram para gestionar mensajes directos y comentarios.'
  }

  const handleIntegrationSuccess = (newIntegration) => {
    setIntegrations(old => [...old, newIntegration])
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
          />
        ))}
      </div>

      {/* {wizardService && (
        <IntegrationWizard
          service={wizardService}
          apikey={apikey}
          auth_token={auth_token}
          onClose={() => setWizardService(null)}
          onSuccess={handleIntegrationSuccess}
        />
      )} */}
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