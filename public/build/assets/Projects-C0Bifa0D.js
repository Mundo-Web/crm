import{C as Y,c as G,R as r,r as n,m as L}from"./CreateReactScript-Cr76lECz.js";import{A as k,S as q}from"./Adminto-BlzcUb4S.js";import{P as I,A as U}from"./AssignUsersModal-D1FeFNQZ.js";import{P as V}from"./ProjectStatusDropdown-CenSfql4.js";import{P as F,A as H,N as O,D as z}from"./Assigneds-DyTBt26D.js";import{a as S,S as A}from"./SetSelectValue-CfjBp_ib.js";import{M as J,T as K}from"./TextareaFormGroup-DpQiZCGF.js";import{T as Q}from"./Table-CZPmbb4w.js";import{I as u}from"./InputFormGroup-DfllSyoc.js";import{D as y}from"./DxBox-CyhaKWwR.js";import{S as W}from"./SelectFormGroup-8kFfSArR.js";import"./TippyButton-v15Bj3sT.js";import"./Dropdown-HnL06DgH.js";import"./DropdownItem-Dd6zonp_.js";import"./server.browser-Dt1gYAOJ.js";const g=({className:l,title:o,icon:s,onClick:i,...c})=>$("<div>").dxButton({hint:o,template:(p,m)=>{m.addClass(`${s} d-block`)},elementAttr:{class:`${l} position-relative me-1 px-1 py-0 tippy-here`,...c},onClick:i}),X=({statuses:l,can:o})=>{const s=n.useRef(),i=n.useRef(),c=n.useRef(),p=n.useRef(),m=n.useRef(),b=n.useRef(),v=n.useRef(),E=n.useRef(),h=n.useRef(),x=n.useRef(),R=n.useRef(),w=n.useRef(),[P,D]=n.useState(!1),[C,_]=n.useState({}),[j,T]=n.useState({}),N=e=>{var t,a,d,f;e!=null&&e.id?D(!0):D(!1),$(c.current).val(null).trigger("change"),p.current.value=(e==null?void 0:e.id)||null,A(m.current,(t=e==null?void 0:e.client)==null?void 0:t.id,(a=e==null?void 0:e.client)==null?void 0:a.name),A(b.current,(d=e==null?void 0:e.type)==null?void 0:d.id,(f=e==null?void 0:e.type)==null?void 0:f.name),v.current.value=(e==null?void 0:e.name)||null,E.current.value=(e==null?void 0:e.description)||null,h.current.value=e==null?void 0:e.cost,x.current.value=e!=null&&e.sign_at?moment(e.sign_at).format("YYYY-MM-DD"):null,R.current.value=e!=null&&e.starts_at?moment(e.starts_at).format("YYYY-MM-DD"):null,w.current.value=e!=null&&e.ends_at?moment(e.ends_at).format("YYYY-MM-DD"):null,$(i.current).modal("show")},M=async e=>{e.preventDefault();const t={status_id:c.current.value,id:p.current.value||void 0,client_id:m.current.value,type_id:b.current.value,name:v.current.value,description:E.current.value,cost:h.current.value??void 0,sign_at:x.current.value??void 0,starts_at:R.current.value,ends_at:w.current.value};await F.save(t)&&($(s.current).dxDataGrid("instance").refresh(),$(i.current).modal("hide"))},B=async e=>{const{isConfirmed:t}=await q.fire({title:"Estas seguro?",text:"Esta acción no se puede deshacer",icon:"warning",showCancelButton:!0,confirmButtonText:"Continuar",cancelButtonText:"Cancelar"});!t||!await F.delete(e)||$(s.current).dxDataGrid("instance").refresh()};return r.createElement(r.Fragment,null,r.createElement(Q,{gridRef:s,title:"Proyectos",rest:F,exportable:!0,toolBar:e=>{e.unshift({widget:"dxButton",location:"after",options:{icon:"refresh",hint:"Refrescar tabla",onClick:()=>$(s.current).dxDataGrid("instance").refresh()}}),o("projects","root","all","create")&&e.unshift({widget:"dxButton",location:"after",options:{icon:"plus",hint:"Nuevo registro",onClick:()=>N()}})},filterValue:void 0,columns:[{dataField:"client.tradename",caption:"Nombre comercial",filterValue:L.GET.client||void 0,fixed:!0,fixedPosition:"left"},{dataField:"type.name",caption:"Tipo",visible:!1},{dataField:"name",caption:"Proyecto",visible:!1},{dataField:"users",caption:"Asignados",dataType:"string",cellTemplate:(e,{data:t})=>{const a=(t.users||"").split("|").filter(Boolean);e.append(y([H(a)]))},visible:!1,allowExporting:!1},{dataField:"cost",caption:"Costo",dataType:"number",cellTemplate:(e,{data:t})=>{e.text(`S/. ${O(t.cost)}`)}},{dataField:"remaining_amount",caption:"Pagos",dataType:"number",cellTemplate:(e,{data:t})=>{const a=(t.total_payments/t.cost*100).toFixed(2),d=Number(t.total_payments).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2}),f=Number(t.cost-t.total_payments).toLocaleString("en-US",{maximumFractionDigits:2,minimumFractionDigits:2});e.append(y([r.createElement(r.Fragment,null,r.createElement("p",{className:"mb-0 d-flex justify-content-between"},r.createElement("b",{className:"text-success"},r.createElement("i",{className:"fa fa-arrow-circle-up"})," S/. ",d),r.createElement("b",{className:"float-end text-danger"},r.createElement("i",{className:"fa fa-arrow-circle-down"})," S/. ",f)),r.createElement("div",{className:"progress progress-bar-alt-primary progress-sm mt-0 mb-0",style:{width:"200px"}},r.createElement("div",{className:"progress-bar bg-primary progress-animated wow animated animated",role:"progressbar","aria-valuenow":t.total_payments,"aria-valuemin":"0","aria-valuemax":t.cost,style:{width:`${a}%`,visibility:"visible",animationName:"animationProgress"}})))],!1))},allowExporting:!1},{dataField:"starts_at",caption:"Fecha inicio proyecto",dataType:"date",format:"yyyy-MM-dd",cellTemplate:(e,{data:t})=>{e.text(moment(t.starts_at).format("LL"))}},{dataField:"ends_at",caption:"Fecha fin proyecto",dataType:"date",format:"yyyy-MM-dd",cellTemplate:(e,{data:t})=>{e.append(y([{width:"200px",height:"30px",children:z(t.starts_at,t.ends_at)}]))},sortOrder:"asc"},{dataField:"last_payment_date",caption:"Fecha ultimo pago",dataType:"datetime",format:"yyyy-MM-dd HH:mm:ss",cellTemplate:(e,{data:t})=>{e.text(moment(t.last_payment_date).format("LLL"))}},o("projects","root","all","changestatus")?{dataField:"status.name",caption:"Estado del proyecto",dataType:"string",cellTemplate:(e,{data:t})=>{e.attr("style","overflow: visible"),e.append(y([{height:"28px",children:r.createElement(V,{can:o,statuses:l,data:t,onChange:()=>{$(s.current).dxDataGrid("instance").refresh()}})}]))}}:null,{caption:"Acciones",cellTemplate:(e,{data:t})=>{o("projects","root","all","update")&&e.append(g({className:"btn btn-xs btn-soft-primary",title:"Editar",icon:"fa fa-pen",onClick:()=>N(t)})),o("projects","root","all","assignUsers")&&e.append(g({className:"btn btn-xs btn-soft-info",title:"Asignar usuarios",icon:"fa fa-user-plus",onClick:()=>T(t)})),o("projects","root","all","addpayment")&&e.append(g({className:"btn btn-xs btn-soft-success",title:"Ver/Agregar pagos",icon:"fas fa-money-check-alt",onClick:()=>_(t)})),o("projects","root","all","delete")&&e.append(g({className:"btn btn-xs btn-soft-danger",title:"Eliminar",icon:"fa fa-trash-alt",onClick:()=>B(t.id)}))},allowFiltering:!1,allowExporting:!1}]}),r.createElement(J,{modalRef:i,title:P?"Editar proyecto":"Agregar proyecto",onSubmit:M},r.createElement("div",{className:"row",id:"project-crud-container"},r.createElement("div",{className:"col-12"},r.createElement("div",{className:"row justify-content-center"},r.createElement(W,{eRef:c,label:"Estado del proyecto",dropdownParent:"#project-crud-container",col:"col-md-6 col-sm-12",required:!0},l.map((e,t)=>r.createElement("option",{key:`status-${t}`,value:e.id},e.name))))),r.createElement("input",{ref:p,type:"hidden"}),r.createElement(S,{eRef:m,label:"Cliente",col:"col-12",dropdownParent:"#project-crud-container",searchAPI:"/api/clients/paginate",searchBy:"name",required:!0}),r.createElement(S,{eRef:b,label:"Tipo del proyecto",col:"col-md-4",dropdownParent:"#project-crud-container",searchAPI:"/api/types/paginate",searchBy:"name",filter:["table_id","=","cd8bd48f-c73c-4a62-9935-024139f3be5f"],required:!0}),r.createElement(u,{eRef:v,label:"Nombre del proyecto",col:"col-md-8",required:!0}),r.createElement(K,{eRef:E,label:"Descripcion del proyecto",col:"col-12"}),r.createElement(u,{eRef:h,label:"Costo",col:"col-md-6",type:"number",step:.01,required:!0}),r.createElement(u,{eRef:x,label:"Fecha firma",col:"col-md-6",type:"date"}),r.createElement(u,{eRef:R,label:"Fecha inicio",col:"col-md-6",type:"date",required:!0}),r.createElement(u,{eRef:w,label:"Fecha fin",col:"col-md-6",type:"date",required:!0}))),r.createElement(I,{can:o,dataLoaded:C,setDataLoaded:_,grid2refresh:$(s.current).dxDataGrid("instance")}),r.createElement(U,{dataLoaded:j,setDataLoaded:T,grid2refresh:$(s.current).dxDataGrid("instance")}))};Y((l,o)=>{if(!o.can("projects","root","all","list"))return location.href="/";G(l).render(r.createElement(k,{...o,title:"Proyectos"},r.createElement(X,{...o})))});