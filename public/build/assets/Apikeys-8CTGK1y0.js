import{C as c,c as o,R as e,r as l,G as r,m}from"./CreateReactScript-CFX3eQQt.js";import{A as i,i as d,S as n}from"./Adminto-BSECEZIE.js";const p=({apikey:t})=>{const a=l.useRef();l.useEffect(()=>{},[null]);const s=()=>{m.Clipboard.copy(a.current.value,()=>{n.fire({title:"Correcto!",text:"Se ha copiado el API Key en el portapapeles",timer:2e3})},u=>{n.fire({title:"Ooops!",text:error,timer:2e3})})};return e.createElement(e.Fragment,null,e.createElement("div",{className:"row"},e.createElement("div",{className:"col-lg-4 col-md-6 col-sm-12"},e.createElement("div",{className:"card"},e.createElement("div",{className:"card-header"},e.createElement("h4",{className:"header-title mb-0"},"Conecta tu formulario con Atalaya")),e.createElement("div",{className:"card-body"},e.createElement("p",{className:"sub-header"},"A continuación se muestra tu API key. Usa esta clave para conectar tu landing con Atalaya enviando los datos a la URL proporcionada con los headers y el cuerpo especificados."),e.createElement("div",{className:"mb-3"},e.createElement("h5",null,"Tu API Key:"),e.createElement("div",{className:"input-group mb-3"},e.createElement("input",{ref:a,type:"text",className:"form-control",defaultValue:t,readOnly:!0}),e.createElement(d,{content:"Copiar API Key"},e.createElement("button",{className:"btn input-group-text btn-dark waves-effect waves-light",type:"button",onClick:s},e.createElement("i",{className:"fa fa-clipboard"})))),e.createElement("p",{className:"sub-header"},e.createElement("b",null,"Nota"),": Evita compartirlo con otras personas. Si lo compartes es probable que te llenes de leads más antes de lo que cante un gallo."))))),e.createElement("div",{className:"col-lg-8 col-md-6 col-sm-12"},e.createElement("div",{className:"card"},e.createElement("div",{className:"card-header"},e.createElement("h4",{className:"header-title mb-0"},"Detalles de Integración")),e.createElement("div",{className:"card-body"},e.createElement("p",{className:"sub-header"},"Usa la siguiente URL, encabezados y cuerpo para conectar tu landing con Atalaya."),e.createElement("div",{className:"mb-3"},e.createElement("h5",null,"URL:"),e.createElement("span",{className:"badge bg-danger"},"POST")," ",e.createElement("code",null,"https://",r.APP_CORRELATIVE,".",r.APP_DOMAIN,"/free/leads")),e.createElement("div",{className:"mb-3"},e.createElement("h5",null,"Headers:"),e.createElement("pre",null,e.createElement("code",null,`{
  "Content-Type": "application/json",
  "Authorization": "Bearer ${t}"
}`))),e.createElement("div",{className:"mb-3"},e.createElement("h5",null,"Body:"),e.createElement("pre",null,e.createElement("code",null,`{
  "contact_name": "Jane Doe",                   --Requerido
  "contact_phone": "123456789",                 --Requerido
  "contact_email": "janedoe@example.com",       --Requerido
  "contact_position": "Manager",
  "tradename": "Example Corp",
  "workers": "5-10",
  "message": "Este es un mensaje de prueba.",   --Requerido
  "origin": "Landing Page"                      --Requerido
  "triggered_by": "WhatsApp|Instagram|Facebook|Tiktok|etc"
}`))),e.createElement("div",{className:"mb-3"},e.createElement("h5",null,"Ejemplos de Respuesta:"),e.createElement("ul",{className:"nav nav-tabs",id:"responseTab",role:"tablist"},e.createElement("li",{className:"nav-item",role:"presentation"},e.createElement("a",{className:"nav-link active",id:"response-200-tab","data-bs-toggle":"tab",href:"#response-200",role:"tab","aria-controls":"response-200","aria-selected":"true"},"200")),e.createElement("li",{className:"nav-item",role:"presentation"},e.createElement("a",{className:"nav-link",id:"response-400-tab","data-bs-toggle":"tab",href:"#response-400",role:"tab","aria-controls":"response-400","aria-selected":"false"},"400"))),e.createElement("div",{className:"tab-content",id:"responseTabContent"},e.createElement("div",{className:"tab-pane fade show active",id:"response-200",role:"tabpanel","aria-labelledby":"response-200-tab"},e.createElement("pre",null,e.createElement("code",null,`{
  "status": 200,
  "message": "Se ha creado el lead correctamente"
}`))),e.createElement("div",{className:"tab-pane fade",id:"response-400",role:"tabpanel","aria-labelledby":"response-400-tab"},e.createElement("pre",null,e.createElement("code",null,`{
  "status": 400,
  "message": "Solicitud incorrecta. Faltan datos obligatorios."
}`))))))))))};c((t,a)=>{o(t).render(e.createElement(i,{...a,title:"API Keys"},e.createElement(p,{...a})))});