import{C as n,c as o,j as e,r,G as i,m as d}from"./CreateReactScript-FT9riFD6.js";import{A as m,i as x}from"./Adminto-bTfDgDo8.js";import{S as t}from"./sweetalert2.esm.all-BLfQoUmi.js";import"./Logout-Djwh9QSR.js";const h=({apikey:c})=>{const s=r.useRef();r.useEffect(()=>{},[null]);const l=()=>{d.Clipboard.copy(a,()=>{t.fire({title:"Correcto!",text:"Se ha copiado el script en el portapapeles",timer:2e3})},p=>{t.fire({title:"Ooops!",text:error,timer:2e3})})},a=`<!-- Atalaya Tracking Pixel -->
<script>
(function() {
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source') || '';

    const getCookie = (name) => {
        const value = '; ' + document.cookie;
        const parts = value.split('; ' + name + '=');
        return parts.length === 2 ? parts.pop().split(';').shift() : null;
    };

    const xBreakdownId = getCookie('X-Breakdown-ID');

    const queryParams = new URLSearchParams();
    if (utmSource) queryParams.append('utm_source', utmSource);
    if (xBreakdownId) queryParams.append('x-breakdown-id', xBreakdownId);

    const queryString = queryParams.toString();

    const srcUrl = \`https://${i.APP_CORRELATIVE}.${i.APP_DOMAIN}/free/pixel/${c}\${queryString ? '?' + queryString : ''}\`;

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = srcUrl;

    const firstScript = document.getElementsByTagName('script')[0];
    firstScript.parentNode.insertBefore(script, firstScript);
})();
<\/script>`;return e.jsx(e.Fragment,{children:e.jsxs("div",{className:"row",children:[e.jsx("div",{className:"col-lg-4 col-md-6 col-sm-12",children:e.jsxs("div",{className:"card",children:[e.jsx("div",{className:"card-header",children:e.jsx("h4",{className:"header-title mb-0",children:"Instala tu Pixel de Atalaya"})}),e.jsxs("div",{className:"card-body",children:[e.jsxs("p",{className:"sub-header",children:["Copia y pega el siguiente script en el ",e.jsx("code",{children:"<head>"})," de tu sitio web para comenzar a trackear visitas automáticamente."]}),e.jsxs("div",{className:"mb-3",children:[e.jsx("h5",{children:"Script de Seguimiento:"}),e.jsx("pre",{ref:s,className:"mb-2",style:{whiteSpace:"pre-wrap",wordBreak:"break-all"},children:e.jsx("code",{children:a})}),e.jsx("div",{className:"d-flex justify-content-end",children:e.jsx(x,{content:"Copiar Script",children:e.jsxs("button",{className:"btn btn-sm btn-dark waves-effect waves-light",type:"button",onClick:l,children:[e.jsx("i",{className:"fa fa-clipboard me-2"}),"Copiar Script"]})})}),e.jsxs("p",{className:"sub-header mt-2",children:[e.jsx("b",{children:"Nota"}),": El script es compatible con cualquier sitio web. No modifiques nada dentro del script."]})]})]})]})}),e.jsx("div",{className:"col-lg-8 col-md-6 col-sm-12",children:e.jsxs("div",{className:"card",children:[e.jsx("div",{className:"card-header",children:e.jsx("h4",{className:"header-title mb-0",children:"Datos que Captura el Pixel"})}),e.jsxs("div",{className:"card-body",children:[e.jsx("p",{className:"sub-header",children:"Una vez instalado, el pixel recopilará automáticamente la siguiente información de cada visita:"}),e.jsxs("div",{className:"mb-3",children:[e.jsx("h5",{children:"Parámetros Recolectados:"}),e.jsxs("ul",{className:"list-unstyled",children:[e.jsxs("li",{children:[e.jsx("i",{className:"fa fa-check-circle text-success me-2"}),e.jsx("b",{children:"IP del visitante"})]}),e.jsxs("li",{children:[e.jsx("i",{className:"fa fa-check-circle text-success me-2"}),e.jsx("b",{children:"Navegador y versión"})]}),e.jsxs("li",{children:[e.jsx("i",{className:"fa fa-check-circle text-success me-2"}),e.jsx("b",{children:"Sistema operativo"})]}),e.jsxs("li",{children:[e.jsx("i",{className:"fa fa-check-circle text-success me-2"}),e.jsx("b",{children:"Dispositivo (móvil o escritorio)"})]}),e.jsxs("li",{children:[e.jsx("i",{className:"fa fa-check-circle text-success me-2"}),e.jsx("b",{children:"UTM Source (Facebook, Instagram)"})]}),e.jsxs("li",{children:[e.jsx("i",{className:"fa fa-check-circle text-success me-2"}),e.jsx("b",{children:"Fecha y hora de la visita"})]})]})]}),e.jsxs("div",{className:"mb-3",children:[e.jsx("h5",{children:"Ejemplo de URL con UTM:"}),e.jsx("pre",{children:e.jsx("code",{children:"https://tusitio.com/?utm_source=facebook"})})]})]})]})})]})})};n((c,s)=>{o(c).render(e.jsx(m,{...s,title:"Pixel de Seguimiento",children:e.jsx(h,{...s})}))});
