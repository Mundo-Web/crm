var C=Object.defineProperty;var T=(n,s,a)=>s in n?C(n,s,{enumerable:!0,configurable:!0,writable:!0,value:a}):n[s]=a;var d=(n,s,a)=>(T(n,typeof s!="symbol"?s+"":s,a),a);import{m as l,C as x,c as F,R as t,r as u}from"./CreateReactScript-BRq5AIp1.js";import{R as c}from"./ReactAppend-B4YmZSlH.js";import{a as S,S as k}from"./SetSelectValue-mUW3TCQI.js";import{A}from"./Adminto-CC0omXyl.js";import{M as D}from"./Modal-CaWdaIln.js";import{T as O,a as b}from"./Table-BophARE-.js";import{I as h}from"./InputFormGroup-B8zl06vh.js";import{T as G}from"./TextareaFormGroup-CZCSKSGq.js";class m{}d(m,"paginate",async s=>{const{result:a}=await l.Fetch("/api/statuses/paginate",{method:"POST",headers:{Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify(s)});return a}),d(m,"save",async s=>{try{const{status:a,result:o}=await l.Fetch("/api/statuses",{method:"POST",body:JSON.stringify(s)});if(!a)throw new Error((o==null?void 0:o.message)||"Ocurrio un error inesperado");return l.Notify.add({icon:"/assets/img/logo-login.svg",title:"Correcto",body:o.message,type:"success"}),!0}catch(a){return l.Notify.add({icon:"/assets/img/logo-login.svg",title:"Error",body:a.message,type:"danger"}),!1}}),d(m,"status",async({id:s,status:a})=>{try{const{status:o,result:i}=await l.Fetch("/api/statuses/status",{method:"PATCH",body:JSON.stringify({id:s,status:a})});if(!o)throw new Error((i==null?void 0:i.message)??"Ocurrio un error inesperado");return l.Notify.add({icon:"/assets/img/logo-login.svg",title:"Correcto",body:i.message,type:"success"}),!0}catch(o){return l.Notify.add({icon:"/assets/img/logo-login.svg",title:"Error",body:o.message,type:"danger"}),!1}}),d(m,"delete",async s=>{try{const{status:a,result:o}=await l.Fetch(`/api/statuses/${s}`,{method:"DELETE"});if(!a)throw new Error((o==null?void 0:o.message)??"Ocurrio un error inesperado");return l.Notify.add({icon:"/assets/img/logo-login.svg",title:"Correcto",body:o.message,type:"success"}),!0}catch(a){return l.Notify.add({icon:"/assets/img/logo-login.svg",title:"Error",body:a.message,type:"danger"}),!1}});const I=()=>{const n=u.useRef(),s=u.useRef(),a=u.useRef(),o=u.useRef(),i=u.useRef(),p=u.useRef(),g=u.useRef(),[v,y]=u.useState(!1),E=e=>{var r,f;e!=null&&e.id?y(!0):y(!1),a.current.value=(e==null?void 0:e.id)||null,k(o.current,(r=e==null?void 0:e.table)==null?void 0:r.id,(f=e==null?void 0:e.table)==null?void 0:f.name),i.current.value=(e==null?void 0:e.name)||null,p.current.value=(e==null?void 0:e.color)||"#343a40",g.current.value=(e==null?void 0:e.description)||null,$(s.current).modal("show")},N=async e=>{e.preventDefault();const r={id:a.current.value||void 0,table_id:o.current.value,name:i.current.value,color:p.current.value,description:g.current.value};await m.save(r)&&($(n.current).dxDataGrid("instance").refresh(),$(s.current).modal("hide"))},R=async({id:e,status:r})=>{await m.status({id:e,status:r})&&$(n.current).dxDataGrid("instance").refresh()},w=async e=>{await m.delete(e)&&$(n.current).dxDataGrid("instance").refresh()};return t.createElement(t.Fragment,null,t.createElement(O,{gridRef:n,title:"Estados",rest:m,toolBar:e=>{e.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",hint:"Refrescar tabla",onClick:()=>$(n.current).dxDataGrid("instance").refresh()}}),e.unshift({widget:"dxButton",location:"after",options:{icon:"plus",hint:"Nuevo registro",onClick:()=>E()}})},columns:[{dataField:"id",caption:"ID",visible:!1},{dataField:"table.name",caption:"Tabla",dataType:"string"},{dataField:"name",caption:"Estado de tabla"},{dataField:"color",caption:"Color",cellTemplate:(e,{data:r})=>{c(e,t.createElement("span",{className:"badge rounded-pill",style:{backgroundColor:r.color||"#343a40"}},r.color))}},{dataField:"description",caption:"Descripcion",cellTemplate:(e,{value:r})=>{r?c(e,r):c(e,t.createElement("i",{className:"text-muted"},"- Sin descripcion -"))}},{dataField:"status",caption:"Estado",dataType:"boolean",cellTemplate:(e,{data:r})=>{switch(r.status){case 1:c(e,t.createElement("span",{className:"badge bg-success rounded-pill"},"Activo"));break;case 0:c(e,t.createElement("span",{className:"badge bg-danger rounded-pill"},"Inactivo"));break;default:c(e,t.createElement("span",{className:"badge bg-dark rounded-pill"},"Eliminado"));break}}},{caption:"Acciones",cellTemplate:(e,{data:r})=>{e.attr("style","display: flex; gap: 4px; overflow: unset"),c(e,t.createElement(b,{className:"btn btn-xs btn-soft-primary",title:"Editar",onClick:()=>E(r)},t.createElement("i",{className:"fa fa-pen"}))),c(e,t.createElement(b,{className:"btn btn-xs btn-light",title:r.status===null?"Restaurar":"Cambiar estado",onClick:()=>R(r)},r.status===1?t.createElement("i",{className:"fa fa-toggle-on text-success"}):r.status===0?t.createElement("i",{className:"fa fa-toggle-off text-danger"}):t.createElement("i",{className:"fas fa-trash-restore"}))),c(e,t.createElement(b,{className:"btn btn-xs btn-soft-danger",title:"Eliminar",onClick:()=>w(r.id)},t.createElement("i",{className:"fa fa-trash-alt"})))},allowFiltering:!1,allowExporting:!1}]}),t.createElement(D,{modalRef:s,title:v?"Editar estado de proyecto":"Agregar estado de proyecto",onSubmit:N,size:"sm"},t.createElement("div",{className:"row",id:"status-crud-container"},t.createElement("input",{ref:a,type:"hidden"}),t.createElement(h,{eRef:i,label:"Estado de proyecto",col:"col-12",required:!0}),t.createElement(S,{eRef:o,label:"Tabla",col:"col-12",dropdownParent:"#status-crud-container",searchAPI:"/api/tables/paginate",searchBy:"name",required:!0}),t.createElement(h,{eRef:p,type:"color",label:"Color",col:"col-12",required:!0}),t.createElement(G,{eRef:g,label:"Descripcion",col:"col-12"}))))};x((n,s)=>{if(!s.can("statuses","root","all","list"))return location.href="/";F(n).render(t.createElement(A,{...s,title:"Estados"},t.createElement(I,{...s})))});