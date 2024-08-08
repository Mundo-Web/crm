
import React, { useEffect, useRef } from 'react'
import { createRoot } from 'react-dom/client'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import UsersRest from './actions/UsersRest.js'
import Adminto from './components/Adminto'
import Tippy from '@tippyjs/react'
import { Clipboard } from 'sode-extend-react'
import Swal from 'sweetalert2'

const usersRest = new UsersRest()

const Apikeys = ({ can, apikey, APP_DOMAIN, APP_CORRELATIVE }) => {

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
    <div class="row">
      <div class="col-lg-4 col-md-6 col-sm-12">
        <div class="card">
          <div class="card-header">
            <h4 class="header-title mb-0">Conecta tu formulario con Atalaya</h4>
          </div>
          <div class="card-body">
            <p class="sub-header">
              A continuación se muestra tu API key. Usa esta clave para conectar tu landing con Atalaya enviando los datos a la URL proporcionada con los headers y el cuerpo especificados.
            </p>

            <div class="mb-3">
              <h5>Tu API Key:</h5>
              <div class="input-group mb-3">
                <input ref={keyRef} type="text" class="form-control" defaultValue={apikey} readOnly />
                <Tippy content="Copiar API Key">
                  <button class="btn input-group-text btn-dark waves-effect waves-light" type="button" onClick={onCopyClicked}>
                    <i className='fa fa-clipboard'></i>
                  </button>
                </Tippy>
              </div>
              <p className='sub-header'><b>Nota</b>: Evita compartirlo con otras personas. Si lo compartes es probable que te llenes de leads más antes de lo que cante un gallo.</p>
            </div>
          </div>
        </div>
      </div>
      <div class="col-lg-8 col-md-6 col-sm-12">
        <div class="card">
          <div class="card-header">
            <h4 class="header-title mb-0">Detalles de Integración</h4>
          </div>
          <div class="card-body">
            <p class="sub-header">
              Usa la siguiente URL, encabezados y cuerpo para conectar tu landing con Atalaya.
            </p>

            <div class="mb-3">
              <h5>URL:</h5>
              <span className='badge bg-danger'>POST</span> <code>https://{APP_CORRELATIVE}.{APP_DOMAIN}/free/leads</code>
            </div>

            <div class="mb-3">
              <h5>Headers:</h5>
              <pre><code>{`{
  "Content-Type": "application/json",
  "Authorization": "Bearer ${apikey}"
}`}</code></pre>
            </div>

            <div class="mb-3">
              <h5>Body:</h5>
              <pre><code>{`{
  "contact_name": "Jane Doe",                   --Requerido
  "contact_phone": "123456789",                 --Requerido
  "contact_email": "janedoe@example.com",       --Requerido
  "contact_position": "Manager",
  "tradename": "Example Corp",                  --Requerido
  "workers": "5-10",
  "message": "Este es un mensaje de prueba.",   --Requerido
  "origin": "Landing Page"                      --Requerido
  "triggered_by": "WhatsApp|Instagram|Facebook|Tiktok|etc"
}`}</code></pre>
            </div>

            <div class="mb-3">
              <h5>Ejemplos de Respuesta:</h5>
              <ul class="nav nav-tabs" id="responseTab" role="tablist">
                <li class="nav-item" role="presentation">
                  <a class="nav-link active" id="response-200-tab" data-bs-toggle="tab" href="#response-200" role="tab" aria-controls="response-200" aria-selected="true">200</a>
                </li>
                <li class="nav-item" role="presentation">
                  <a class="nav-link" id="response-400-tab" data-bs-toggle="tab" href="#response-400" role="tab" aria-controls="response-400" aria-selected="false">400</a>
                </li>
              </ul>
              <div class="tab-content" id="responseTabContent">
                <div class="tab-pane fade show active" id="response-200" role="tabpanel" aria-labelledby="response-200-tab">
                  <pre><code>{
                    `{
  "status": 200,
  "message": "Se ha creado el lead correctamente"
}`}</code></pre>
                </div>
                <div class="tab-pane fade" id="response-400" role="tabpanel" aria-labelledby="response-400-tab">
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