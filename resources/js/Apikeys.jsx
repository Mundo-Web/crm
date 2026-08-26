
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

  const landingScriptExample = `<!-- Script para enviar formularios con captura automática de UTMs a Atalaya CRM -->
<script>
(function () {
  // 1. Extraer automáticamente todos los parámetros UTM y de campaña de la URL
  function getAtalayaTrackingData() {
    const params = new URLSearchParams(window.location.search);
    
    // Si tienes el Pixel de Atalaya instalado, lee la cookie de sesión X-Breakdown-ID
    const getCookie = (name) => {
      const value = "; " + document.cookie;
      const parts = value.split("; " + name + "=");
      if (parts.length === 2) return parts.pop().split(";").shift();
      return null;
    };

    return {
      utm_source: params.get("utm_source") || "",
      utm_medium: params.get("utm_medium") || "",
      utm_campaign: params.get("utm_campaign") || "",
      utm_term: params.get("utm_term") || "",
      utm_content: params.get("utm_content") || "",
      web_url: window.location.href,
      referrer: document.referrer || "",
      x_breakdown_id: getCookie("X-Breakdown-ID") || localStorage.getItem("atalaya_breakdown_id") || ""
    };
  }

  // 2. Función global para enviar los datos del lead a Atalaya CRM
  window.sendLeadToAtalaya = async function (formData) {
    const tracking = getAtalayaTrackingData();
    
    const payload = {
      contact_name: formData.name || formData.contact_name,
      contact_phone: formData.phone || formData.contact_phone,
      contact_email: formData.email || formData.contact_email,
      message: formData.message || "Lead capturado desde formulario web",
      contact_position: formData.position || formData.contact_position || "",
      tradename: formData.tradename || formData.company || "",
      workers: formData.workers || "",
      // Atributos de Marketing y UTMs
      utm_source: tracking.utm_source,
      utm_medium: tracking.utm_medium,
      utm_campaign: tracking.utm_campaign,
      utm_term: tracking.utm_term,
      utm_content: tracking.utm_content,
      web_url: tracking.web_url,
      referrer: tracking.referrer,
      x_breakdown_id: tracking.x_breakdown_id
    };

    try {
      const response = await fetch("https://${Global.APP_CORRELATIVE}.${Global.APP_DOMAIN}/free/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer ${apikey}"
        },
        body: JSON.stringify(payload)
      });
      return await response.json();
    } catch (error) {
      console.error("Error enviando lead a Atalaya:", error);
      throw error;
    }
  };

  // 3. Ejemplo de integración automática con un formulario <form id="leadForm">
  document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("leadForm");
    if (!form) return;

    form.addEventListener("submit", async function (e) {
      e.preventDefault();
      
      const formData = {
        name: form.querySelector("[name='name']")?.value,
        phone: form.querySelector("[name='phone']")?.value,
        email: form.querySelector("[name='email']")?.value,
        message: form.querySelector("[name='message']")?.value || "Contacto desde Landing"
      };

      const result = await window.sendLeadToAtalaya(formData);
      if (result.status === 200) {
        alert("¡Gracias por contactarnos!");
        form.reset();
      } else {
        alert("Hubo un error al enviar el formulario.");
      }
    });
  });
})();
</script>`;

  const copyLandingScript = () => {
    Clipboard.copy(landingScriptExample, () => {
      Swal.fire({
        title: '¡Copiado!',
        text: 'Se ha copiado el script para tu landing page en el portapapeles',
        timer: 2000
      })
    }, () => {
      Swal.fire({
        title: 'Ooops!',
        text: 'No se pudo copiar el script',
        timer: 2000
      })
    })
  }

  return (<>
    <div className="row">
      <div className="col-lg-4 col-md-12">
        <div className="card">
          <div className="card-header">
            <h4 className="header-title mb-0">Conecta tu Formulario con Atalaya</h4>
          </div>
          <div className="card-body">
            <p className="sub-header">
              A continuación se muestra tu API key. Úsala para conectar tu landing con Atalaya enviando los datos con los headers y cuerpo especificados.
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
              <p className='sub-header'><b>Nota</b>: Mantén tu clave privada. Si la compartes públicamente, cualquiera podría enviar registros a tu cuenta.</p>
            </div>

            <div className="alert alert-info mb-0">
              <h5 className="alert-heading font-14 mb-1"><i className="mdi mdi-information-outline me-1"></i> Atribución Automática de UTMs:</h5>
              <p className="mb-0 font-12">
                Atalaya detecta automáticamente tus campañas de <b>Google Ads</b>, <b>Facebook</b>, <b>Instagram</b>, <b>TikTok</b>, etc., si incluyes los parámetros <code>utm_source</code> y <code>utm_campaign</code> en el cuerpo de la petición.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="col-lg-8 col-md-12">
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h4 className="header-title mb-0">Detalles de Integración y UTMs</h4>
          </div>
          <div className="card-body">
            <p className="sub-header">
              Endpoint para conectar formularios web y landings con Atalaya CRM:
            </p>

            <div className="mb-3">
              <h5>URL del Endpoint:</h5>
              <span className='badge bg-danger me-2'>POST</span> <code>https://{Global.APP_CORRELATIVE}.{Global.APP_DOMAIN}/free/leads</code>
            </div>

            <div className="mb-3">
              <h5>Headers Requeridos:</h5>
              <pre><code>{`{
  "Content-Type": "application/json",
  "Authorization": "Bearer ${apikey}"
}`}</code></pre>
            </div>

            <ul className="nav nav-tabs mb-3" id="integrationTabs" role="tablist">
              <li className="nav-item" role="presentation">
                <a className="nav-link active" id="body-tab" data-bs-toggle="tab" href="#body-spec" role="tab" aria-controls="body-spec" aria-selected="true">
                  <i className="mdi mdi-code-json me-1"></i> Especificación JSON (Body)
                </a>
              </li>
              <li className="nav-item" role="presentation">
                <a className="nav-link" id="guide-tab" data-bs-toggle="tab" href="#utm-guide" role="tab" aria-controls="utm-guide" aria-selected="false">
                  <i className="mdi mdi-book-open-page-variant me-1"></i> Guía de UTMs y Orígenes
                </a>
              </li>
              <li className="nav-item" role="presentation">
                <a className="nav-link" id="script-tab" data-bs-toggle="tab" href="#landing-script" role="tab" aria-controls="landing-script" aria-selected="false">
                  <i className="mdi mdi-javascript me-1"></i> Script Automático para Landing (JS)
                </a>
              </li>
              <li className="nav-item" role="presentation">
                <a className="nav-link" id="curl-tab" data-bs-toggle="tab" href="#curl-example" role="tab" aria-controls="curl-example" aria-selected="false">
                  <i className="mdi mdi-console me-1"></i> Ejemplo cURL
                </a>
              </li>
            </ul>

            <div className="tab-content" id="integrationTabsContent">
              {/* Tab 1: Body Spec */}
              <div className="tab-pane fade show active" id="body-spec" role="tabpanel" aria-labelledby="body-tab">
                <h5>Cuerpo de la Solicitud (JSON):</h5>
                <pre><code>{`{
  // --- DATOS DEL CONTACTO (OBLIGATORIOS) ---
  "contact_name": "Juan Pérez",                 // Requerido (Nombre completo del contacto)
  "contact_phone": "999888777",                 // Requerido (Teléfono o WhatsApp)
  "contact_email": "juan.perez@example.com",    // Requerido (Correo electrónico)
  "message": "Hola, solicito información",      // Requerido (Mensaje o requerimiento)

  // --- DATOS DEL CONTACTO (OPCIONALES) ---
  "contact_position": "Gerente General",        // Opcional (Cargo o puesto)
  "tradename": "Empresa SAC",                   // Opcional (Nombre de la empresa)
  "workers": "10-20",                           // Opcional (N° de trabajadores)

  // --- PARÁMETROS DE ATRIBUCIÓN Y MARKETING (RECOMENDADOS) ---
  "utm_source": "meta",                         // Opcional ("meta", "google", "tiktok", "linkedin", "whatsapp")
  "utm_medium": "cpc",                          // Opcional ("cpc" se clasifica como tipo Anuncio publicitario)
  "utm_campaign": "Busqueda_Marca",             // Opcional (Nombre de Campaña - Atalaya la vincula automáticamente)
  "utm_term": "Grupo_Anuncios_Lima",            // Opcional (Grupo de Anuncios / AdSet o Palabra clave)
  "utm_content": "Anuncio_Video_1",             // Opcional (Nombre de Anuncio / Creativo específico)
  "web_url": "https://landing.tusitio.com/?...", // Opcional (URL completa de la landing con UTMs)

  // --- DISPARADOR / FORMULARIO ---
  "triggered_by": "Formulario Landing"          // Opcional (Por defecto: "Formulario Landing" o el nombre de tu formulario)
}`}</code></pre>
              </div>

              {/* Tab 2: Guía de UTMs */}
              <div className="tab-pane fade" id="utm-guide" role="tabpanel" aria-labelledby="guide-tab">
                <div className="alert alert-primary mb-3">
                  <h6 className="alert-heading font-14 mb-1"><i className="mdi mdi-brain me-1"></i> ¿Cómo resuelve Atalaya el Origen (<code>origin</code>) de forma inteligente?</h6>
                  <p className="mb-1 font-12">
                    Si tu formulario envía <code>"origin": "Landing Page"</code> o valores genéricos pero la URL tiene parámetros UTM, <b>Atalaya sobreescribe inteligentemente el origen</b> asignando la plataforma real publicitaria:
                  </p>
                  <ul className="mb-0 font-12 ps-3">
                    <li>Si <code>utm_source</code> es <b><code>google</code></b> o <b><code>googleads</code></b> $\rightarrow$ Se guarda automáticamente como <b>Google Ads</b>.</li>
                    <li>Si <code>utm_source</code> es <b><code>meta</code></b>, <b><code>facebook</code></b>, <b><code>instagram</code></b>, <b><code>messenger</code></b> o <b><code>whatsapp</code></b> $\rightarrow$ Se guarda como <b>Meta</b>.</li>
                    <li>Si el usuario entra de forma directa o sin UTMs $\rightarrow$ Se guarda como <b>Orgánico</b>.</li>
                    <li>La fuente técnica (<code>source</code>) se mantiene como <b>Landing</b> y el disparador (<code>triggered_by</code>) como <b>Formulario Landing</b>.</li>
                  </ul>
                </div>

                <div className="table-responsive">
                  <table className="table table-bordered table-sm font-13 align-middle mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Parámetro</th>
                        <th>Valores en URL / JSON</th>
                        <th>Resultado en Atalaya CRM</th>
                        <th>Notas de Lógica</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><code>utm_source</code></td>
                        <td><code>google</code>, <code>googleads</code></td>
                        <td><span className="badge bg-danger">Google Ads</span></td>
                        <td>Asigna Origen: Google Ads</td>
                      </tr>
                      <tr>
                        <td><code>utm_source</code></td>
                        <td><code>meta</code>, <code>facebook</code>, <code>instagram</code>, <code>messenger</code>, <code>whatsapp</code></td>
                        <td><span className="badge bg-primary">Meta</span></td>
                        <td>Asigna Origen: Meta (engloba el ecosistema Meta)</td>
                      </tr>
                      <tr>
                        <td><code>utm_source</code></td>
                        <td><code>tiktok</code></td>
                        <td><span className="badge bg-dark">TikTok</span></td>
                        <td>Asigna Origen: TikTok</td>
                      </tr>
                      <tr>
                        <td><code>utm_source</code></td>
                        <td><code>linkedin</code></td>
                        <td><span className="badge bg-info">LinkedIn</span></td>
                        <td>Asigna Origen: LinkedIn</td>
                      </tr>
                      <tr>
                        <td><em>(Sin UTMs)</em></td>
                        <td><em>(No enviado)</em></td>
                        <td><span className="badge bg-secondary">Orgánico</span></td>
                        <td>Tráfico directo o sin pauta</td>
                      </tr>
                      <tr>
                        <td><code>utm_medium</code></td>
                        <td><code>cpc</code>, <code>paid</code>, <code>ads</code></td>
                        <td><b>Anuncio</b></td>
                        <td>Clasifica el proceso como pauta pagada</td>
                      </tr>
                      <tr>
                        <td><code>utm_campaign</code></td>
                        <td><code>Nombre_Campana</code></td>
                        <td><b>Campaña Vinculada</b></td>
                        <td>Crea o vincula la campaña automáticamente en Atalaya</td>
                      </tr>
                      <tr>
                        <td><code>utm_term</code></td>
                        <td><code>Grupo_Anuncios</code> o keyword</td>
                        <td><b>Grupo de Anuncios</b> (AdSet)</td>
                        <td>Guarda el conjunto de anuncios</td>
                      </tr>
                      <tr>
                        <td><code>utm_content</code></td>
                        <td><code>Nombre_Anuncio</code></td>
                        <td><b>Anuncio / Creativo</b></td>
                        <td>Guarda el anuncio o video específico</td>
                      </tr>
                      <tr>
                        <td><code>triggered_by</code></td>
                        <td><code>Formulario Landing</code></td>
                        <td><b>Formulario Landing</b></td>
                        <td>Disparador de entrada en la página</td>
                      </tr>
                      <tr>
                        <td><code>source</code></td>
                        <td><code>Landing</code></td>
                        <td><b>Landing</b></td>
                        <td>Fuente técnica de conversión web</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tab 3: Landing Script */}
              <div className="tab-pane fade" id="landing-script" role="tabpanel" aria-labelledby="script-tab">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span className="text-muted font-13">Copia y pega este script en tu landing page para capturar UTMs automáticamente:</span>
                  <button className="btn btn-sm btn-dark" type="button" onClick={copyLandingScript}>
                    <i className="fa fa-clipboard me-1"></i> Copiar Script
                  </button>
                </div>
                <pre style={{ maxHeight: '350px', overflowY: 'auto' }}><code>{landingScriptExample}</code></pre>
              </div>

              {/* Tab 4: cURL Example */}
              <div className="tab-pane fade" id="curl-example" role="tabpanel" aria-labelledby="curl-tab">
                <h5>Ejemplo con cURL:</h5>
                <pre><code>{`curl -X POST "https://${Global.APP_CORRELATIVE}.${Global.APP_DOMAIN}/free/leads" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${apikey}" \\
  -d '{
    "contact_name": "Jane Doe",
    "contact_phone": "987654321",
    "contact_email": "jane@example.com",
    "message": "Consulta de cotización",
    "utm_source": "meta",
    "utm_medium": "cpc",
    "utm_campaign": "Campana_Verano_2026",
    "utm_term": "Grupo_Anuncios_Lima",
    "utm_content": "Anuncio_Video_1",
    "web_url": "https://landing.tusitio.com/?utm_source=meta&utm_medium=cpc&utm_campaign=Campana_Verano_2026"
  }'`}</code></pre>
              </div>
            </div>

            <div className="mt-3">
              <h5>Respuestas del Endpoint:</h5>
              <ul className="nav nav-tabs" id="responseTab" role="tablist">
                <li className="nav-item" role="presentation">
                  <a className="nav-link active" id="response-200-tab" data-bs-toggle="tab" href="#response-200" role="tab" aria-controls="response-200" aria-selected="true">200 OK</a>
                </li>
                <li className="nav-item" role="presentation">
                  <a className="nav-link" id="response-400-tab" data-bs-toggle="tab" href="#response-400" role="tab" aria-controls="response-400" aria-selected="false">400 Error</a>
                </li>
              </ul>
              <div className="tab-content" id="responseTabContent">
                <div className="tab-pane fade show active" id="response-200" role="tabpanel" aria-labelledby="response-200-tab">
                  <pre><code>{`{
  "status": 200,
  "message": "Se ha creado el lead correctamente",
  "data": {
    "id": "uuid-del-lead",
    "origin": "Google Ads",
    "campaign_id": "uuid-de-la-campaña"
  }
}`}</code></pre>
                </div>
                <div className="tab-pane fade" id="response-400" role="tabpanel" aria-labelledby="response-400-tab">
                  <pre><code>{`{
  "status": 400,
  "message": "El nombre de contacto es obligatorio."
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
  if (!properties.can('integrations', 'forms', 'all')) return (location.href = '/');
  createRoot(el).render(
    <Adminto {...properties} title='API Keys'>
      <Apikeys {...properties} />
    </Adminto>
  );
})