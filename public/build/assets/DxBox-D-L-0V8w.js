import{r as a,c as o}from"./CreateReactScript-Cr76lECz.js";import{r as d}from"./server.browser-xmOcUVG_.js";const f=(s,n=!0)=>$("<div>").css({display:"flex",gap:"8px",alignItems:"flex-center",justifyContent:"flex-start"}).dxBox({direction:"row",items:s.filter(Boolean).map(t=>({ratio:0,baseSize:"auto",template:function(i,p,r){if(n)if(a.isValidElement(t)){const e=document.createElement("div");o(e).render(t),r.append(e)}else{const e=document.createElement("div");e.style.width=t.width,e.style.height=t.height,o(e).render(t.children),r.append(e)}else r.append(d(t))}}))});export{f as D};