import{C as d,c as m,j as e,r as i,G as r,m as c}from"./CreateReactScript-DA0R8dkY.js";import{A as h,i as u}from"./Adminto-B-HNi5wQ.js";import{S as n}from"./sweetalert2.esm.all-CnpI_ZcI.js";import"./Logout-C4R5Bi9h.js";const p=({apikey:a})=>{const s=i.useRef();i.useEffect(()=>{},[null]);const l=()=>{c.Clipboard.copy(s.current.value,()=>{n.fire({title:"Correcto!",text:"Se ha copiado el API Key en el portapapeles",timer:2e3})},x=>{n.fire({title:"Ooops!",text:error,timer:2e3})})},t=`<!-- Script para enviar formularios con captura automática de UTMs a Atalaya CRM -->
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
      const response = await fetch("https://${r.APP_CORRELATIVE}.${r.APP_DOMAIN}/free/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer ${a}"
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
<\/script>`,o=()=>{c.Clipboard.copy(t,()=>{n.fire({title:"¡Copiado!",text:"Se ha copiado el script para tu landing page en el portapapeles",timer:2e3})},()=>{n.fire({title:"Ooops!",text:"No se pudo copiar el script",timer:2e3})})};return e.jsx(e.Fragment,{children:e.jsxs("div",{className:"row",children:[e.jsx("div",{className:"col-lg-4 col-md-12",children:e.jsxs("div",{className:"card",children:[e.jsx("div",{className:"card-header",children:e.jsx("h4",{className:"header-title mb-0",children:"Conecta tu Formulario con Atalaya"})}),e.jsxs("div",{className:"card-body",children:[e.jsx("p",{className:"sub-header",children:"A continuación se muestra tu API key. Úsala para conectar tu landing con Atalaya enviando los datos con los headers y cuerpo especificados."}),e.jsxs("div",{className:"mb-3",children:[e.jsx("h5",{children:"Tu API Key:"}),e.jsxs("div",{className:"input-group mb-3",children:[e.jsx("input",{ref:s,type:"text",className:"form-control",defaultValue:a,readOnly:!0}),e.jsx(u,{content:"Copiar API Key",children:e.jsx("button",{className:"btn input-group-text btn-dark waves-effect waves-light",type:"button",onClick:l,children:e.jsx("i",{className:"fa fa-clipboard"})})})]}),e.jsxs("p",{className:"sub-header",children:[e.jsx("b",{children:"Nota"}),": Mantén tu clave privada. Si la compartes públicamente, cualquiera podría enviar registros a tu cuenta."]})]}),e.jsxs("div",{className:"alert alert-info mb-0",children:[e.jsxs("h5",{className:"alert-heading font-14 mb-1",children:[e.jsx("i",{className:"mdi mdi-information-outline me-1"})," Atribución Automática de UTMs:"]}),e.jsxs("p",{className:"mb-0 font-12",children:["Atalaya detecta automáticamente tus campañas de ",e.jsx("b",{children:"Google Ads"}),", ",e.jsx("b",{children:"Facebook"}),", ",e.jsx("b",{children:"Instagram"}),", ",e.jsx("b",{children:"TikTok"}),", etc., si incluyes los parámetros ",e.jsx("code",{children:"utm_source"})," y ",e.jsx("code",{children:"utm_campaign"})," en el cuerpo de la petición."]})]})]})]})}),e.jsx("div",{className:"col-lg-8 col-md-12",children:e.jsxs("div",{className:"card",children:[e.jsx("div",{className:"card-header d-flex justify-content-between align-items-center",children:e.jsx("h4",{className:"header-title mb-0",children:"Detalles de Integración y UTMs"})}),e.jsxs("div",{className:"card-body",children:[e.jsx("p",{className:"sub-header",children:"Endpoint para conectar formularios web y landings con Atalaya CRM:"}),e.jsxs("div",{className:"mb-3",children:[e.jsx("h5",{children:"URL del Endpoint:"}),e.jsx("span",{className:"badge bg-danger me-2",children:"POST"})," ",e.jsxs("code",{children:["https://",r.APP_CORRELATIVE,".",r.APP_DOMAIN,"/free/leads"]})]}),e.jsxs("div",{className:"mb-3",children:[e.jsx("h5",{children:"Headers Requeridos:"}),e.jsx("pre",{children:e.jsx("code",{children:`{
  "Content-Type": "application/json",
  "Authorization": "Bearer ${a}"
}`})})]}),e.jsxs("ul",{className:"nav nav-tabs mb-3",id:"integrationTabs",role:"tablist",children:[e.jsx("li",{className:"nav-item",role:"presentation",children:e.jsxs("a",{className:"nav-link active",id:"body-tab","data-bs-toggle":"tab",href:"#body-spec",role:"tab","aria-controls":"body-spec","aria-selected":"true",children:[e.jsx("i",{className:"mdi mdi-code-json me-1"})," Especificación JSON (Body)"]})}),e.jsx("li",{className:"nav-item",role:"presentation",children:e.jsxs("a",{className:"nav-link",id:"guide-tab","data-bs-toggle":"tab",href:"#utm-guide",role:"tab","aria-controls":"utm-guide","aria-selected":"false",children:[e.jsx("i",{className:"mdi mdi-book-open-page-variant me-1"})," Guía de UTMs y Orígenes"]})}),e.jsx("li",{className:"nav-item",role:"presentation",children:e.jsxs("a",{className:"nav-link",id:"script-tab","data-bs-toggle":"tab",href:"#landing-script",role:"tab","aria-controls":"landing-script","aria-selected":"false",children:[e.jsx("i",{className:"mdi mdi-javascript me-1"})," Script Automático para Landing (JS)"]})}),e.jsx("li",{className:"nav-item",role:"presentation",children:e.jsxs("a",{className:"nav-link",id:"curl-tab","data-bs-toggle":"tab",href:"#curl-example",role:"tab","aria-controls":"curl-example","aria-selected":"false",children:[e.jsx("i",{className:"mdi mdi-console me-1"})," Ejemplo cURL"]})})]}),e.jsxs("div",{className:"tab-content",id:"integrationTabsContent",children:[e.jsxs("div",{className:"tab-pane fade show active",id:"body-spec",role:"tabpanel","aria-labelledby":"body-tab",children:[e.jsx("h5",{children:"Cuerpo de la Solicitud (JSON):"}),e.jsx("pre",{children:e.jsx("code",{children:`{
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
}`})})]}),e.jsxs("div",{className:"tab-pane fade",id:"utm-guide",role:"tabpanel","aria-labelledby":"guide-tab",children:[e.jsxs("div",{className:"alert alert-primary mb-3",children:[e.jsxs("h6",{className:"alert-heading font-14 mb-1",children:[e.jsx("i",{className:"mdi mdi-brain me-1"})," ¿Cómo visualiza Atalaya CRM los datos en la tabla de Leads?"]}),e.jsx("p",{className:"mb-1 font-12",children:"En la tabla principal de Leads, Atalaya mapea automáticamente tus parámetros UTM a las columnas correspondientes:"}),e.jsxs("ul",{className:"mb-0 font-12 ps-3",children:[e.jsxs("li",{children:["Columna ",e.jsx("b",{children:"Red Social (Campaña)"}),": Asigna la red o ecosistema (",e.jsx("b",{children:"Google"}),", ",e.jsx("b",{children:"Meta"}),", ",e.jsx("b",{children:"TikTok"}),", ",e.jsx("b",{children:"LinkedIn"})," u ",e.jsx("b",{children:"Orgánico"}),")."]}),e.jsxs("li",{children:["Columna ",e.jsx("b",{children:"Orígen"}),": Si vino de pauta (",e.jsx("code",{children:"utm_medium=cpc"})," o ",e.jsx("code",{children:"utm_source=googleads"}),"), se muestra como ",e.jsx("b",{children:"Google Ads"})," / ",e.jsx("b",{children:"Meta Ads"})," / ",e.jsx("b",{children:"Landing"}),"."]}),e.jsxs("li",{children:["Columna ",e.jsx("b",{children:"Registrado en"}),": Muestra ",e.jsx("b",{children:"Formulario Landing"})," (o el nombre de tu formulario)."]}),e.jsxs("li",{children:["Columna ",e.jsx("b",{children:"Campaña"}),": Muestra el nombre de tu campaña (",e.jsx("code",{children:"utm_campaign"}),")."]})]})]}),e.jsx("div",{className:"table-responsive",children:e.jsxs("table",{className:"table table-bordered table-sm font-13 align-middle mb-0",children:[e.jsx("thead",{className:"table-light",children:e.jsxs("tr",{children:[e.jsx("th",{children:"Parámetro UTM"}),e.jsx("th",{children:"Valores en URL / Formulario"}),e.jsx("th",{children:"Columna en Atalaya CRM"}),e.jsx("th",{children:"Valor que se Muestra"})]})}),e.jsxs("tbody",{children:[e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"utm_source"})}),e.jsxs("td",{children:[e.jsx("code",{children:"google"}),", ",e.jsx("code",{children:"googleads"})]}),e.jsx("td",{children:e.jsx("b",{children:"Red Social (Campaña)"})}),e.jsx("td",{children:e.jsx("span",{className:"badge bg-danger",children:"Google"})})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"utm_source"})}),e.jsxs("td",{children:[e.jsx("code",{children:"meta"}),", ",e.jsx("code",{children:"facebook"}),", ",e.jsx("code",{children:"instagram"}),", ",e.jsx("code",{children:"messenger"}),", ",e.jsx("code",{children:"whatsapp"})]}),e.jsx("td",{children:e.jsx("b",{children:"Red Social (Campaña)"})}),e.jsx("td",{children:e.jsx("span",{className:"badge bg-primary",children:"Meta"})})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"utm_source"})}),e.jsx("td",{children:e.jsx("code",{children:"tiktok"})}),e.jsx("td",{children:e.jsx("b",{children:"Red Social (Campaña)"})}),e.jsx("td",{children:e.jsx("span",{className:"badge bg-dark",children:"TikTok"})})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"utm_source"})}),e.jsx("td",{children:e.jsx("code",{children:"linkedin"})}),e.jsx("td",{children:e.jsx("b",{children:"Red Social (Campaña)"})}),e.jsx("td",{children:e.jsx("span",{className:"badge bg-info",children:"LinkedIn"})})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("em",{children:"(Sin UTMs)"})}),e.jsx("td",{children:e.jsx("em",{children:"(No enviado)"})}),e.jsx("td",{children:e.jsx("b",{children:"Red Social (Campaña)"})}),e.jsx("td",{children:e.jsx("span",{className:"badge bg-secondary",children:"Orgánico"})})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"utm_medium"})}),e.jsxs("td",{children:[e.jsx("code",{children:"cpc"}),", ",e.jsx("code",{children:"paid"}),", ",e.jsx("code",{children:"ads"})]}),e.jsx("td",{children:e.jsx("b",{children:"Orígen"})}),e.jsxs("td",{children:[e.jsx("b",{children:"Google Ads"})," / ",e.jsx("b",{children:"Meta Ads"})," ",e.jsx("em",{children:"(o Anuncio)"})]})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"utm_campaign"})}),e.jsx("td",{children:e.jsx("code",{children:"Nombre_Campana"})}),e.jsx("td",{children:e.jsx("b",{children:"Campaña"})}),e.jsx("td",{children:e.jsx("b",{children:"Nombre de la Campaña"})})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"utm_term"})}),e.jsxs("td",{children:[e.jsx("code",{children:"Grupo_Anuncios"})," o keyword"]}),e.jsx("td",{children:e.jsx("b",{children:"Grupo de Anuncios"})}),e.jsx("td",{children:"Conjunto de anuncios / keyword"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"utm_content"})}),e.jsx("td",{children:e.jsx("code",{children:"Nombre_Anuncio"})}),e.jsx("td",{children:e.jsx("b",{children:"Anuncio"})}),e.jsx("td",{children:"Creativo / video específico"})]}),e.jsxs("tr",{children:[e.jsx("td",{children:e.jsx("code",{children:"triggered_by"})}),e.jsx("td",{children:e.jsx("code",{children:"Formulario Landing"})}),e.jsx("td",{children:e.jsx("b",{children:"Registrado en"})}),e.jsx("td",{children:e.jsx("b",{children:"Formulario Landing"})})]})]})]})})]}),e.jsxs("div",{className:"tab-pane fade",id:"landing-script",role:"tabpanel","aria-labelledby":"script-tab",children:[e.jsxs("div",{className:"d-flex justify-content-between align-items-center mb-2",children:[e.jsx("span",{className:"text-muted font-13",children:"Copia y pega este script en tu landing page para capturar UTMs automáticamente:"}),e.jsxs("button",{className:"btn btn-sm btn-dark",type:"button",onClick:o,children:[e.jsx("i",{className:"fa fa-clipboard me-1"})," Copiar Script"]})]}),e.jsx("pre",{style:{maxHeight:"350px",overflowY:"auto"},children:e.jsx("code",{children:t})})]}),e.jsxs("div",{className:"tab-pane fade",id:"curl-example",role:"tabpanel","aria-labelledby":"curl-tab",children:[e.jsx("h5",{children:"Ejemplo con cURL:"}),e.jsx("pre",{children:e.jsx("code",{children:`curl -X POST "https://${r.APP_CORRELATIVE}.${r.APP_DOMAIN}/free/leads" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${a}" \\
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
  }'`})})]})]}),e.jsxs("div",{className:"mt-3",children:[e.jsx("h5",{children:"Respuestas del Endpoint:"}),e.jsxs("ul",{className:"nav nav-tabs",id:"responseTab",role:"tablist",children:[e.jsx("li",{className:"nav-item",role:"presentation",children:e.jsx("a",{className:"nav-link active",id:"response-200-tab","data-bs-toggle":"tab",href:"#response-200",role:"tab","aria-controls":"response-200","aria-selected":"true",children:"200 OK"})}),e.jsx("li",{className:"nav-item",role:"presentation",children:e.jsx("a",{className:"nav-link",id:"response-400-tab","data-bs-toggle":"tab",href:"#response-400",role:"tab","aria-controls":"response-400","aria-selected":"false",children:"400 Error"})})]}),e.jsxs("div",{className:"tab-content",id:"responseTabContent",children:[e.jsx("div",{className:"tab-pane fade show active",id:"response-200",role:"tabpanel","aria-labelledby":"response-200-tab",children:e.jsx("pre",{children:e.jsx("code",{children:`{
  "status": 200,
  "message": "Se ha creado el lead correctamente",
  "data": {
    "id": "uuid-del-lead",
    "origin": "Google Ads",
    "campaign_id": "uuid-de-la-campaña"
  }
}`})})}),e.jsx("div",{className:"tab-pane fade",id:"response-400",role:"tabpanel","aria-labelledby":"response-400-tab",children:e.jsx("pre",{children:e.jsx("code",{children:`{
  "status": 400,
  "message": "El nombre de contacto es obligatorio."
}`})})})]})]})]})]})})]})})};d((a,s)=>{if(!s.can("integrations","forms","all"))return location.href="/";m(a).render(e.jsx(h,{...s,title:"API Keys",children:e.jsx(p,{...s})}))});
