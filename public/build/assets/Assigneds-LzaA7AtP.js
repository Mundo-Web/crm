var p=Object.defineProperty;var f=(i,t,e)=>t in i?p(i,t,{enumerable:!0,configurable:!0,writable:!0,value:e}):i[t]=e;var n=(i,t,e)=>(f(i,typeof t!="symbol"?t+"":t,e),e);import{m as o,R as r}from"./CreateReactScript-Cr76lECz.js";import{i as y}from"./Adminto-CdtgOShQ.js";import{r as b}from"./server.browser-Dt1gYAOJ.js";class l{}n(l,"paginate",async t=>{const{result:e}=await o.Fetch("/api/projects/paginate",{method:"POST",headers:{Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify(t)});return e}),n(l,"save",async t=>{try{const{status:e,result:a}=await o.Fetch("/api/projects",{method:"POST",body:JSON.stringify(t)});if(!e)throw new Error((a==null?void 0:a.message)||"Ocurrio un error inesperado");return o.Notify.add({icon:"/assets/img/logo-login.svg",title:"Correcto",body:a.message,type:"success"}),!0}catch(e){return o.Notify.add({icon:"/assets/img/logo-login.svg",title:"Error",body:e.message,type:"danger"}),!1}}),n(l,"status",async({id:t,status:e})=>{try{const{status:a,result:s}=await o.Fetch("/api/projects/status",{method:"PATCH",body:JSON.stringify({id:t,status:e})});if(!a)throw new Error((s==null?void 0:s.message)??"Ocurrio un error inesperado");return o.Notify.add({icon:"/assets/img/logo-login.svg",title:"Correcto",body:s.message,type:"success"}),!0}catch(a){return o.Notify.add({icon:"/assets/img/logo-login.svg",title:"Error",body:a.message,type:"danger"}),!1}}),n(l,"projectStatus",async(t,e)=>{try{const{status:a,result:s}=await o.Fetch("/api/projects/project-status",{method:"PATCH",body:JSON.stringify({project:t,status:e})});if(!a)throw new Error((s==null?void 0:s.message)??"Ocurrio un error inesperado");return o.Notify.add({icon:"/assets/img/logo-login.svg",title:"Correcto",body:s.message,type:"success"}),!0}catch(a){return o.Notify.add({icon:"/assets/img/logo-login.svg",title:"Error",body:a.message,type:"danger"}),!1}}),n(l,"delete",async t=>{try{const{status:e,result:a}=await o.Fetch(`/api/projects/${t}`,{method:"DELETE"});if(!e)throw new Error((a==null?void 0:a.message)??"Ocurrio un error inesperado");return o.Notify.add({icon:"/assets/img/logo-login.svg",title:"Correcto",body:a.message,type:"success"}),!0}catch(e){return o.Notify.add({icon:"/assets/img/logo-login.svg",title:"Error",body:e.message,type:"danger"}),!1}});const v=(i,t="en-US")=>(Number(i)||0).toLocaleString(t,{maximumFractionDigits:2,minimumFractionDigits:2});class g{}n(g,"getUser",async t=>{const{result:e}=await o.Fetch(`/api/users-by-projects/${t}`);return(e==null?void 0:e.data)??null}),n(g,"byProject",async t=>{const{result:e}=await o.Fetch(`/api/users-by-projects/project/${t}`);return(e==null?void 0:e.data)??[]}),n(g,"massiveByProject",async t=>{try{const{status:e,result:a}=await o.Fetch("/api/users-by-projects/project",{method:"PATCH",body:JSON.stringify(t)});if(!e)throw new Error((a==null?void 0:a.message)||"Ocurrio un error inesperado");return o.Notify.add({icon:"/assets/img/logo-login.svg",title:"Correcto",body:a.message,type:"success"}),!0}catch(e){return o.Notify.add({icon:"/assets/img/logo-login.svg",title:"Error",body:e.message,type:"danger"}),!1}});const x=(i,t)=>{const e=moment(i),a=moment(t),s=moment();let m=r.createElement(r.Fragment,null);if(s.isBefore(e)){const c=s.diff(e,"hours")>12?e.format("LL"):e.fromNow();m=r.createElement("i",{className:"text-muted"},"Empieza ",c)}else if(s.isAfter(a)){const c=s.diff(a,"hours")>12?a.format("LL"):a.fromNow();m=r.createElement("i",{className:"text-muted"},"Finalizo ",c)}else{const d=a.diff(e),u=s.diff(e)/d*100;m=r.createElement("div",{style:{width:"200px"}},r.createElement("p",{className:"mb-0 d-flex justify-content-between"},r.createElement("span",null,moment(i).format("DD MMM YYYY")),r.createElement("span",{className:"float-end"},moment(t).format("DD MMM YYYY"))),r.createElement("div",{className:"progress progress-bar-alt-primary progress-xl mb-0 mt-0"},r.createElement("div",{className:"progress-bar progress-bar-primary progress-bar-animated",role:"progressbar","aria-valuenow":"75","aria-valuemin":"0","aria-valuemax":"100",style:{width:`${u}%`}},u.toFixed(2),"%")))}return m},D=i=>r.createElement("div",{className:"avatar-group m-0"},i.map(t=>r.createElement(y,{key:`user-${t}`,content:"Cargando...",allowHTML:!0,onShow:async e=>{const a=await g.getUser(t),s=moment(a.created_at),c=moment().diff(s,"hours")>12?s.format("lll"):s.fromNow();$(e.popper).find(".tippy-content").addClass("p-0"),e.setContent(b(r.createElement("div",{className:"card mb-0",style:{boxShadow:"0 0 10px rgba(0, 0, 0, 0.25)"}},r.createElement("div",{className:"card-body widget-user p-2"},r.createElement("div",{className:"d-flex align-items-center"},r.createElement("div",{className:"avatar-lg me-3 flex-shrink-0"},r.createElement("img",{src:`/api/profile/thumbnail/${t}`,className:"img-fluid rounded-circle",alt:"user"})),r.createElement("div",{className:"flex-grow-1 overflow-hidden"},r.createElement("h5",{className:"text-blue mt-0 mb-1"}," ",a.name," ",a.lastname),r.createElement("p",{className:"text-dark mb-1 font-13 text-truncate"},a.email),r.createElement("small",{className:"text-muted"},"Asignado: ",r.createElement("b",null,c))))))))}},r.createElement("img",{className:"avatar-group-item avatar-xs rounded-circle mb-0",src:`/api/profile/thumbnail/${t}`,style:{backdropFilter:"blur(40px)",marginRight:"6px"}}))));export{D as A,x as D,v as N,l as P,g as U};