
import React, { useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import Adminto from './components/Adminto.jsx'
import Tippy from '@tippyjs/react'
import { Clipboard } from 'sode-extend-react'
import Swal from 'sweetalert2'
import Global from './Utils/Global.js'

const Webhooks = ({ apikey, auth_token }) => {

  const keyRef = useRef()

  console.log(auth_token)

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
                <i className='mdi mdi-facebook-messenger me-1'></i>
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
                <i className='mdi mdi-instagram me-1'></i>
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
            <h4 className="header-title mb-0">Detalles de Integración</h4>
          </div>
          <div className="card-body">
            <p className="sub-header">
              Usa la siguiente URL, encabezados y cuerpo para conectar tu landing con Atalaya.
            </p>

            <div className="mb-3">
              <h5>URL:</h5>
              <span className='badge bg-danger'>POST</span> <code>https://{Global.APP_CORRELATIVE}.{Global.APP_DOMAIN}/free/leads</code>
            </div>

            <div className="mb-3">
              <h5>Headers:</h5>
              <pre><code>{`{
  "Content-Type": "application/json",
  "Authorization": "Bearer ${apikey}"
}`}</code></pre>
            </div>

            <div className="mb-3">
              <h5>Body:</h5>
              <pre><code>{`{
  "contact_name": "Jane Doe",                   --Requerido
  "contact_phone": "123456789",                 --Requerido
  "contact_email": "janedoe@example.com",       --Requerido
  "contact_position": "Manager",
  "tradename": "Example Corp",
  "workers": "5-10",
  "message": "Este es un mensaje de prueba.",   --Requerido
  "origin": "Landing Page"                      --Requerido
  "triggered_by": "WhatsApp|Instagram|Facebook|Tiktok|etc"
}`}</code></pre>
            </div>

            <div className="mb-3">
              <h5>Ejemplos de Respuesta:</h5>
              <ul className="nav nav-tabs" id="responseTab" role="tablist">
                <li className="nav-item" role="presentation">
                  <a className="nav-link active" id="response-200-tab" data-bs-toggle="tab" href="#response-200" role="tab" aria-controls="response-200" aria-selected="true">200</a>
                </li>
                <li className="nav-item" role="presentation">
                  <a className="nav-link" id="response-400-tab" data-bs-toggle="tab" href="#response-400" role="tab" aria-controls="response-400" aria-selected="false">400</a>
                </li>
              </ul>
              <div className="tab-content" id="responseTabContent">
                <div className="tab-pane fade show active" id="response-200" role="tabpanel" aria-labelledby="response-200-tab">
                  <pre><code>{
                    `{
  "status": 200,
  "message": "Se ha creado el lead correctamente"
}`}</code></pre>
                </div>
                <div className="tab-pane fade" id="response-400" role="tabpanel" aria-labelledby="response-400-tab">
                  <pre><code>{
                    `{
  "status": 400,
  "message": "Solicitud incorrecta. Faltan datos obligatorios."
}`}</code></pre>
                </div>
              </div>
            </div>
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