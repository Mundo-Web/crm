
import React, { useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import Adminto from './components/Adminto'
import Tippy from '@tippyjs/react'
import { Clipboard } from 'sode-extend-react'
import Swal from 'sweetalert2'
import Global from './Utils/Global.js'

const Apikeys = ({ apikey }) => {

  const keyRef = useRef()

  useEffect(() => {

  }, [null])

  const onCopyClicked = () => {
    Clipboard.copy(keyRef.current.value, () => {
      Swal.fire({
        title: 'Correcto!',
        text: 'Se ha copiado el API Key en el portapapeles',
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
            <h4 className="header-title mb-0">Conecta tu formulario con Atalaya</h4>
          </div>
          <div className="card-body">
            <p className="sub-header">
              A continuación se muestra tu API key. Usa esta clave para conectar tu landing con Atalaya enviando los datos a la URL proporcionada con los headers y el cuerpo especificados.
            </p>

            <div className="mb-3">
              <h5>Tu API Key:</h5>
              <div className="input-group mb-3">
                <input ref={keyRef} type="text" className="form-control" defaultValue={apikey} readOnly />
                <Tippy content="Copiar API Key">
                  <button className="btn input-group-text btn-dark waves-effect waves-light" type="button" onClick={onCopyClicked}>
                    <i className='fa fa-clipboard'></i>
                  </button>
                </Tippy>
              </div>
              <p className='sub-header'><b>Nota</b>: Evita compartirlo con otras personas. Si lo compartes es probable que te llenes de leads más antes de lo que cante un gallo.</p>
            </div>
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
    <Adminto {...properties} title='API Keys'>
      <Apikeys {...properties} />
    </Adminto>
  );
})