import{C as Y,c as G,R as t,r as n,m as k}from"./CreateReactScript-Cr76lECz.js";import{A as q,S as I}from"./Adminto-BlzcUb4S.js";import{P as L,A as U}from"./AssignUsersModal-D1FeFNQZ.js";import{P as V}from"./ProjectStatusDropdown-CenSfql4.js";import{P as F,A as H,N as O,D as z}from"./Assigneds-DyTBt26D.js";import{a as T,S as A}from"./SetSelectValue-CfjBp_ib.js";import{M as J,T as K}from"./TextareaFormGroup-DpQiZCGF.js";import{T as Q}from"./Table-DyL-cwJJ.js";import{I as u}from"./InputFormGroup-DfllSyoc.js";import{D as g}from"./DxBox-CyhaKWwR.js";import{S as W}from"./SelectFormGroup-8kFfSArR.js";import"./TippyButton-v15Bj3sT.js";import"./Dropdown-HnL06DgH.js";import"./DropdownItem-Dd6zonp_.js";import"./server.browser-Dt1gYAOJ.js";const y=({className:a,title:o,icon:s,onClick:i,...c})=>$("<div>").dxButton({hint:o,template:(p,m)=>{m.addClass(`${s} d-block`)},elementAttr:{class:`${a} position-relative me-1 px-1 py-0 tippy-here`,...c},onClick:i}),X=({statuses:a,can:o})=>{const s=n.useRef(),i=n.useRef(),c=n.useRef(),p=n.useRef(),m=n.useRef(),b=n.useRef(),v=n.useRef(),h=n.useRef(),E=n.useRef(),R=n.useRef(),x=n.useRef(),w=n.useRef(),[P,D]=n.useState(!1),[C,_]=n.useState({}),[j,N]=n.useState({}),S=e=>{var r,l,d,f;e!=null&&e.id?D(!0):D(!1),$(c.current).val(null).trigger("change"),p.current.value=(e==null?void 0:e.id)||null,A(m.current,(r=e==null?void 0:e.client)==null?void 0:r.id,(l=e==null?void 0:e.client)==null?void 0:l.name),A(b.current,(d=e==null?void 0:e.type)==null?void 0:d.id,(f=e==null?void 0:e.type)==null?void 0:f.name),v.current.value=(e==null?void 0:e.name)||null,h.current.value=(e==null?void 0:e.description)||null,E.current.value=e==null?void 0:e.cost,R.current.value=e!=null&&e.sign_at?moment(e.sign_at).format("YYYY-MM-DD"):null,x.current.value=e!=null&&e.starts_at?moment(e.starts_at).format("YYYY-MM-DD"):null,w.current.value=e!=null&&e.ends_at?moment(e.ends_at).format("YYYY-MM-DD"):null,$(i.current).modal("show")},M=async e=>{e.preventDefault();const r={status_id:c.current.value,id:p.current.value||void 0,client_id:m.current.value,type_id:b.current.value,name:v.current.value,description:h.current.value,cost:E.current.value??void 0,sign_at:R.current.value??void 0,starts_at:x.current.value,ends_at:w.current.value};await F.save(r)&&($(s.current).dxDataGrid("instance").refresh(),$(i.current).modal("hide"))},B=async e=>{const{isConfirmed:r}=await I.fire({title:"Estas seguro?",text:"Esta acción no se puede deshacer",icon:"warning",showCancelButton:!0,confirmButtonText:"Continuar",cancelButtonText:"Cancelar"});!r||!await F.delete(e)||$(s.current).dxDataGrid("instance").refresh()};return t.createElement(t.Fragment,null,t.createElement(Q,{gridRef:s,title:"Proyectos",rest:F,toolBar:e=>{e.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",hint:"Refrescar tabla",onClick:()=>$(s.current).dxDataGrid("instance").refresh()}}),o("projects","root","all","create")&&e.unshift({widget:"dxButton",location:"after",options:{icon:"plus",hint:"Nuevo registro",onClick:()=>S()}})},filterValue:void 0,columns:[{dataField:"client.tradename",caption:"Nombre comercial",filterValue:k.GET.client||void 0,fixed:!0,fixedPosition:"left"},{dataField:"type.name",caption:"Tipo"},{dataField:"name",caption:"Proyecto",visible:!1},{dataField:"users",caption:"Asignados",dataType:"string",cellTemplate:(e,{data:r})=>{const l=(r.users||"").split("|").filter(Boolean);e.append(g([H(l)]))}},{dataField:"cost",caption:"Costo",dataType:"number",cellTemplate:(e,{data:r})=>{e.text(`S/. ${O(r.cost)}`)}},{dataField:"remaining_amount",caption:"Pagos",dataType:"number",cellTemplate:(e,{data:r})=>{const l=(r.total_payments/r.cost*100).toFixed(2),d=Number(r.total_payments).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}),f=Number(r.cost-r.total_payments).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2});e.append(g([t.createElement(t.Fragment,null,t.createElement("p",{className:"mb-0 d-flex justify-content-between"},t.createElement("b",{className:"text-success"},t.createElement("i",{className:"fa fa-arrow-circle-up"})," S/. ",d),t.createElement("b",{className:"float-end text-danger"},t.createElement("i",{className:"fa fa-arrow-circle-down"})," S/. ",f)),t.createElement("div",{className:"progress progress-bar-alt-primary progress-sm mt-0 mb-0",style:{width:"200px"}},t.createElement("div",{className:"progress-bar bg-primary progress-animated wow animated animated",role:"progressbar","aria-valuenow":r.total_payments,"aria-valuemin":"0","aria-valuemax":r.cost,style:{width:`${l}%`,visibility:"visible",animationName:"animationProgress"}})))],!1))}},{dataField:"start_at",caption:"Fecha inicio proyecto",visible:!1},{dataField:"ends_at",caption:"Fecha fin proyecto",dataType:"date",cellTemplate:(e,{data:r})=>{e.append(g([{width:"200px",height:"30px",children:z(r.starts_at,r.ends_at)}]))},sortOrder:"asc"},{dataField:"last_payment_date",caption:"Fecha ultimo pago",dataType:"datetime",format:"yyyy-MM-dd HH:mm:ss",visible:!1},o("projects","root","all","changestatus")?{dataField:"status.name",caption:"Estado del proyecto",dataType:"string",cellTemplate:(e,{data:r})=>{e.attr("style","overflow: visible"),e.append(g([{height:"28px",children:t.createElement(V,{can:o,statuses:a,data:r,onChange:()=>{$(s.current).dxDataGrid("instance").refresh()}})}]))}}:null,{caption:"Acciones",cellTemplate:(e,{data:r})=>{o("projects","root","all","update")&&e.append(y({className:"btn btn-xs btn-soft-primary",title:"Editar",icon:"fa fa-pen",onClick:()=>S(r)})),o("projects","root","all","assignUsers")&&e.append(y({className:"btn btn-xs btn-soft-info",title:"Asignar usuarios",icon:"fa fa-user-plus",onClick:()=>N(r)})),o("projects","root","all","addpayment")&&e.append(y({className:"btn btn-xs btn-soft-success",title:"Ver/Agregar pagos",icon:"fas fa-money-check-alt",onClick:()=>_(r)})),o("projects","root","all","delete")&&e.append(y({className:"btn btn-xs btn-soft-danger",title:"Eliminar",icon:"fa fa-trash-alt",onClick:()=>B(r.id)}))},allowFiltering:!1,allowExporting:!1}]}),t.createElement(J,{modalRef:i,title:P?"Editar proyecto":"Agregar proyecto",onSubmit:M},t.createElement("div",{className:"row",id:"project-crud-container"},t.createElement("div",{className:"col-12"},t.createElement("div",{className:"row justify-content-center"},t.createElement(W,{eRef:c,label:"Estado del proyecto",dropdownParent:"#project-crud-container",col:"col-md-6 col-sm-12",required:!0},a.map((e,r)=>t.createElement("option",{key:`status-${r}`,value:e.id},e.name))))),t.createElement("input",{ref:p,type:"hidden"}),t.createElement(T,{eRef:m,label:"Cliente",col:"col-12",dropdownParent:"#project-crud-container",searchAPI:"/api/clients/paginate",searchBy:"name",required:!0}),t.createElement(T,{eRef:b,label:"Tipo del proyecto",col:"col-md-4",dropdownParent:"#project-crud-container",searchAPI:"/api/types/paginate",searchBy:"name",filter:["table_id","=","cd8bd48f-c73c-4a62-9935-024139f3be5f"],required:!0}),t.createElement(u,{eRef:v,label:"Nombre del proyecto",col:"col-md-8",required:!0}),t.createElement(K,{eRef:h,label:"Descripcion del proyecto",col:"col-12"}),t.createElement(u,{eRef:E,label:"Costo",col:"col-md-6",type:"number",step:.01,required:!0}),t.createElement(u,{eRef:R,label:"Fecha firma",col:"col-md-6",type:"date"}),t.createElement(u,{eRef:x,label:"Fecha inicio",col:"col-md-6",type:"date",required:!0}),t.createElement(u,{eRef:w,label:"Fecha fin",col:"col-md-6",type:"date",required:!0}))),t.createElement(L,{can:o,dataLoaded:C,setDataLoaded:_,grid2refresh:$(s.current).dxDataGrid("instance")}),t.createElement(U,{dataLoaded:j,setDataLoaded:N,grid2refresh:$(s.current).dxDataGrid("instance")}))};Y((a,o)=>{if(!o.can("projects","root","all","list"))return location.href="/";G(a).render(t.createElement(q,{...o,title:"Proyectos"},t.createElement(X,{...o})))});