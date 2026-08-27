import{C as d,c as o,j as e,r as i,G as t,m}from"./CreateReactScript-DA0R8dkY.js";import{A as h,i as x}from"./Adminto-B-HNi5wQ.js";import{S as r}from"./sweetalert2.esm.all-CnpI_ZcI.js";import"./Logout-C4R5Bi9h.js";const p=({apikey:a,breadkowns:s})=>{const l=i.useRef();i.useEffect(()=>{},[null]);const n=()=>{m.Clipboard.copy(c,()=>{r.fire({title:"Correcto!",text:"Se ha copiado el script en el portapapeles",timer:2e3})},u=>{r.fire({title:"Ooops!",text:error,timer:2e3})})},c=`<!-- Atalaya Tracking Pixel -->
<script>
  (function(){
    const p = new URLSearchParams(window.location.search);
    const getCookie = (name) => {
      const v = "; " + document.cookie;
      const parts = v.split("; " + name + "=");
      return parts.length === 2 ? parts.pop().split(";").shift() : null;
    };
    const breakdownId = getCookie("X-Breakdown-ID");
    const q = new URLSearchParams();
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach(k => {
      const val = p.get(k);
      if (val) q.append(k, val);
    });
    if (breakdownId) q.append("x-breakdown-id", breakdownId);
    const query = q.toString();
    const s = "https://${t.APP_CORRELATIVE}.${t.APP_DOMAIN}/free/pixel/${a}" + (query ? "?" + query : "");
    const a = document.createElement("script");
    a.type = "text/javascript";
    a.async = !0;
    a.src = s;
    const i = document.getElementsByTagName("script")[0];
    i.parentNode.insertBefore(a, i);
  })();
<\/script>`;return e.jsx(e.Fragment,{children:e.jsxs("div",{className:"row",children:[e.jsx("div",{className:"col-lg-4 col-md-6 col-sm-12",children:e.jsxs("div",{className:"card",children:[e.jsx("div",{className:"card-header",children:e.jsx("h4",{className:"header-title mb-0",children:"Instala tu Pixel de Atalaya"})}),e.jsxs("div",{className:"card-body",children:[e.jsxs("p",{className:"sub-header",children:["Copia y pega el siguiente script en el ",e.jsx("code",{children:"<head>"})," de tu sitio web para comenzar a trackear visitas automáticamente."]}),e.jsxs("div",{className:"mb-3",children:[e.jsx("h5",{children:"Script de Seguimiento:"}),e.jsx("pre",{ref:l,className:"mb-2",style:{whiteSpace:"pre-wrap",wordBreak:"break-all"},children:e.jsx("code",{children:c})}),e.jsx("div",{className:"d-flex justify-content-end",children:e.jsx(x,{content:"Copiar Script",children:e.jsxs("button",{className:"btn btn-sm btn-dark waves-effect waves-light",type:"button",onClick:n,children:[e.jsx("i",{className:"fa fa-clipboard me-2"}),"Copiar Script"]})})}),e.jsxs("p",{className:"sub-header mt-2",children:[e.jsx("b",{children:"Nota"}),": El script es compatible con cualquier sitio web. No modifiques nada dentro del script."]})]})]})]})}),e.jsx("div",{className:"col-lg-8 col-md-6 col-sm-12",children:e.jsxs("div",{className:"card",children:[e.jsx("div",{className:"card-header",children:e.jsx("h4",{className:"header-title mb-0",children:"Datos que Captura el Pixel"})}),e.jsxs("div",{className:"card-body",children:[e.jsx("p",{className:"sub-header",children:"Una vez instalado, el pixel recopilará automáticamente la siguiente información de cada visita:"}),e.jsxs("div",{className:"mb-3",children:[e.jsx("h5",{children:"Parámetros Recolectados:"}),e.jsxs("ul",{className:"list-unstyled",children:[e.jsxs("li",{children:[e.jsx("i",{className:"fa fa-check-circle text-success me-2"}),e.jsx("b",{children:"IP del visitante"})]}),e.jsxs("li",{children:[e.jsx("i",{className:"fa fa-check-circle text-success me-2"}),e.jsx("b",{children:"Navegador y versión"})]}),e.jsxs("li",{children:[e.jsx("i",{className:"fa fa-check-circle text-success me-2"}),e.jsx("b",{children:"Sistema operativo"})]}),e.jsxs("li",{children:[e.jsx("i",{className:"fa fa-check-circle text-success me-2"}),e.jsx("b",{children:"Dispositivo (móvil o escritorio)"})]}),e.jsxs("li",{children:[e.jsx("i",{className:"fa fa-check-circle text-success me-2"}),e.jsx("b",{children:"Parámetros UTM completos (utm_source, utm_medium, utm_campaign, utm_term, utm_content)"})]}),e.jsxs("li",{children:[e.jsx("i",{className:"fa fa-check-circle text-success me-2"}),e.jsx("b",{children:"Fecha y hora de la visita"})]})]})]}),e.jsxs("div",{className:"mb-3",children:[e.jsx("h5",{children:"Ejemplo de URL con UTM:"}),e.jsx("pre",{children:e.jsx("code",{children:"https://tusitio.com/?utm_source=googleads&utm_medium=cpc&utm_campaign=Busqueda"})})]}),e.jsxs("div",{className:"mb-3",children:[e.jsx("h5",{children:"Conteo de visitas:"}),e.jsxs("p",{className:"my-0",children:[s," ",s==1?"visita":"visitas"]})]})]})]})})]})})};d((a,s)=>{if(!s.can("integrations","pixel","all"))return location.href="/";o(a).render(e.jsx(h,{...s,title:"Pixel de Seguimiento",children:e.jsx(p,{...s})}))});
