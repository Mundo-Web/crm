
import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import Adminto from './components/Adminto.jsx'
import Tippy from '@tippyjs/react'
import { Clipboard } from 'sode-extend-react'
import Swal from 'sweetalert2'
import Global from './Utils/Global.js'
import IntegrationsRest from './actions/IntegrationsRest.js'

const integrationsRest = new IntegrationsRest()

const icons = {
  'messenger': 'mdi-facebook-messenger',
  'instagram': 'mdi-instagram',
}

const Webhooks = ({ apikey, auth_token, integrations: integrationsDB }) => {

  const [integrations, setIntegrations] = useState(integrationsDB)

  useEffect(() => {

  }, [null])

  const onCopyClicked = (toCopy) => {
    Clipboard.copy(toCopy, () => {
      Swal.fire({
        title: 'Correcto!',
        text: 'Se ha copiado el contenido al portapapeles',
        timer: 2000
      })
    }, (e) => {
      Swal.fire({
        title: 'Ooops!',
        text: error,
        timer: 2000
      })
    })
  }

  const onAccesTokenSet = async (integration) => {
    const swalResult = await Swal.fire({
      title: `Ingrese el Token de ${integration.meta_business_id}`,
      input: 'text',
      inputLabel: 'Access Token',
      showCancelButton: true,
      showLoaderOnConfirm: true,
      allowOutsideClick: () => !Swal.isLoading(),
      preConfirm: async (accessToken) => {
        if (!accessToken) {
          Swal.showValidationMessage('Debe ingresar un access token')
          return false
        }

        try {
          const result = await integrationsRest.save({
            id: integration.id,
            meta_access_token: accessToken
          })
          if (!result) throw new Error('No se pudo guardar el token')
          setIntegrations(old => {
            return old.map(integration => {
              if (integration.id === result.id) {
                return result
              }
              return integration
            })
          })
          return true
        } catch (error) {
          Swal.showValidationMessage(error.message)
          return false
        }
      }
    })

    if (swalResult.isConfirmed) {
      await Swal.fire({
        title: 'Éxito',
        text: 'Token guardado correctamente',
        icon: 'success',
        timer: 2000
      })
    }
  }

  const ibms = integrations.reduce((acc, integration) => {
    if (!acc[integration.meta_service]) {
      acc[integration.meta_service] = [];
    }
    acc[integration.meta_service].push(integration);
    return acc;
  }, {});

  return (<>
    <div className="row">
      <div className="col-lg-4 col-md-6 col-sm-12">
        <div className="card">
          <div className="card-header">
            <h4 className="header-title mb-0">Conecta servicios de Meta con Atalaya</h4>
          </div>
          <div className="card-body">
            <p className="sub-header">
              Aquí encontrarás las URLs de webhook necesarias para integrar tu aplicación con los servicios de Meta (Messenger e Instagram).
              Estas URLs te permitirán recibir actualizaciones en tiempo real.
            </p>

            <div className="mb-3">
              <h5>
                <i className={`mdi ${icons.messenger} me-1`}></i>
                Webhook Messenger:
              </h5>
              <div>
                <code className='d-block mb-1'>{Global.APP_URL}/meta/messenger/{apikey}</code>
                <button className='btn btn-xs btn-dark' onClick={() => onCopyClicked(`${Global.APP_URL}/meta/messenger/${apikey}`)}>
                  <i className='mdi mdi-content-copy me-1'></i>
                  Copiar enlace
                </button>
              </div>
            </div>

            <div className="mb-3">
              <h5>
                <i className={`mdi ${icons.instagram} me-1`}></i>
                Webhook Instagram:
              </h5>
              <div>
                <code className='d-block mb-1'>{Global.APP_URL}/meta/instagram/{apikey}</code>
                <button className='btn btn-xs btn-dark' onClick={() => onCopyClicked(`${Global.APP_URL}/meta/instagram/${apikey}`)}>
                  <i className='mdi mdi-content-copy me-1'></i>
                  Copiar enlace
                </button>
              </div>
            </div>

            <div className="mb-3">
              <h5>Token de Verificación:</h5>
              <div>
                <code className='d-block mb-1'>{auth_token}</code>
                <button className='btn btn-xs btn-dark' onClick={() => onCopyClicked(auth_token)}>
                  <i className='mdi mdi-content-copy me-1'></i>
                  Copiar token
                </button>
              </div>
            </div>

            <p className='sub-header'><b>Importante</b>: Mantén estas URLs y el token de verificación en un lugar seguro. No los compartas con personas no autorizadas para evitar accesos no deseados a tu sistema.</p>
          </div>
        </div>
      </div>
      <div className="col-lg-8 col-md-6 col-sm-12">
        <div className="card">
          <div className="card-header">
            <h4 className="header-title my-0">Integraciones</h4>
          </div>
          <div className="card-body">
            {
              Object.keys(ibms).map((meta_service, index) => {
                const integrations = ibms[meta_service]
                console.log(integrations)
                return <>
                  <h5 className='header-title mt-0'>
                    <i className={`mdi ${icons[meta_service]} me-1`}></i>
                    {meta_service.toTitleCase()}
                  </h5>
                  <table className='table table-sm'>
                    <thead>
                      <tr>
                        <th>Cuenta</th>
                        <th>Leads</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {
                        integrations.map((integration, index) => {
                          return <tr key={index}>
                            <td className='w-100'>
                              <div className='d-flex gap-1 align-items-center'>
                                <img className='avatar-sm rounded-circle' src={`/api/integrations/media/${integration.meta_business_profile}`} alt={integration.meta_business_name ?? 'Desconocido'} style={{
                                  objectFit: 'cover',
                                  objectPosition: 'center',
                                }}
                                onError={e => e.target.src = `//${Global.APP_DOMAIN}/api/logo/thumbnail/null`}/>
                                <div>
                                  <b className='d-block'>{integration.meta_business_name ?? 'Desconocido'}</b>
                                  <small className='text-muted'>{integration.meta_business_id}</small>
                                </div>
                              </div>
                            </td>
                            <td>{integration.meta_leads ?? 0}</td>
                            <td>
                              {
                                integration.meta_business_name
                                  ? <span>Activo</span>
                                  : <button className='btn btn-xs btn-dark text-nowrap'
                                    onClick={() => onAccesTokenSet(integration)}>Agregar Token</button>
                              }
                            </td>
                          </tr>
                        })
                      }
                    </tbody>
                  </table>
                </>
              })
            }
          </div>
        </div>
      </div>
    </div>
  </>
  )
};

CreateReactScript((el, properties) => {
  createRoot(el).render(
    <Adminto {...properties} title='Webhooks'>
      <Webhooks {...properties} />
    </Adminto>
  );
})