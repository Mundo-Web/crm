import{C as x,c as C,R as t,r as s}from"./CreateReactScript-DiMSE74L.js";import{a as k,S as I}from"./SetSelectValue-CewST6hL.js";import{S as j}from"./StatusesRest-Dou1qYX1.js";import{A,S as F}from"./Adminto-uiiCHfAT.js";import{M as T,T as q}from"./TextareaFormGroup-5IfCmnyj.js";import{I as g}from"./InputFormGroup-TM-cwmw7.js";const w=new j,B=({statuses:i,tables:o})=>{const[v,m]=s.useState(i);s.useRef();const u=s.useRef(),d=s.useRef(),c=s.useRef(),f=s.useRef(),p=s.useRef(),E=s.useRef(),[y,R]=s.useState(!1);s.useState(null);const b=e=>{var l,r,n;e!=null&&e.id?R(!0):R(!1),d.current.value=(e==null?void 0:e.id)||null,I(c.current,(l=e==null?void 0:e.table)==null?void 0:l.id,(r=e==null?void 0:e.table)==null?void 0:r.name),(n=e==null?void 0:e.table)!=null&&n.id?$(c.current).parents(".form-group").hide():$(c.current).parents(".form-group").show(),f.current.value=(e==null?void 0:e.name)||null,p.current.value=(e==null?void 0:e.color)||"#343a40",E.current.value=(e==null?void 0:e.description)||null,$(u.current).modal("show")},h=async e=>{e.preventDefault();const l={id:d.current.value||void 0,table_id:c.current.value,name:f.current.value,color:p.current.value,description:E.current.value},r=await w.save(l);r&&(v.find(n=>n.id==r.id)?m(n=>{const a=n.findIndex(S=>S.id==r.id);return console.log(a),n[a]=r,[...n]}):m(n=>[...n,r]),$(u.current).modal("hide"))},N=async e=>{const{isConfirmed:l}=await F.fire({title:"Estas seguro de eliminar este estado?",text:"No podras revertir esta accion!",icon:"warning",showCancelButton:!0,confirmButtonText:"Continuar",cancelButtonText:"Cancelar"});!l||!await w.delete(e)||m(n=>[...n.filter(a=>a.id!=e)])};return t.createElement(t.Fragment,null,t.createElement("div",{className:"container"},t.createElement("div",{className:"text-center"},t.createElement("button",{className:"btn btn-primary mb-4 rounded-pill",onClick:()=>b()},"Nuevo Estado")),t.createElement("div",{className:"row align-items-start justify-content-center"},o.map((e,l)=>t.createElement("div",{key:l,className:"col-md-6"},t.createElement("div",{className:"card"},t.createElement("div",{className:"card-header"},t.createElement("div",{className:"d-flex align-items-center justify-content-between"},t.createElement("h5",{className:"my-0 text-capitalize"},"Estados de ",e.name),t.createElement("button",{className:"btn btn-xs btn-primary rounded-pill",onClick:()=>b({table:e})},"Nuevo estado"))),t.createElement("div",{className:"card-body d-flex align-items-start justify-content-center gap-2",style:{flexWrap:"wrap",minHeight:"200px"}},v.filter(r=>r.table_id===e.id).map((r,n)=>t.createElement(t.Fragment,null,t.createElement("div",{key:n,class:"btn-group dropup col-auto"},t.createElement("span",{type:"button",class:"btn btn-sm btn-white",style:{cursor:"default"}},t.createElement("i",{className:"mdi mdi-circle me-1",style:{color:r.color}}),r.name),t.createElement("button",{type:"button",class:"btn btn-sm btn-white dropdown-toggle","data-bs-toggle":"dropdown","aria-haspopup":"true","aria-expanded":"false"},t.createElement("i",{class:"mdi mdi-dots-vertical"})),t.createElement("div",{class:"dropdown-menu"},t.createElement("a",{class:"dropdown-item",href:"javascript:void(0)",onClick:()=>b(r)},"Editar"),t.createElement("a",{class:"dropdown-item",href:"javascript:void(0)",onClick:()=>N(r.id)},"Eliminar"))))))))))),t.createElement(T,{modalRef:u,title:y?"Editar estado":"Agregar estado",onSubmit:h,size:"sm"},t.createElement("div",{className:"row",id:"status-crud-container"},t.createElement("input",{ref:d,type:"hidden"}),t.createElement(g,{eRef:f,label:"Nombre de estado",col:"col-12",required:!0}),t.createElement(k,{eRef:c,label:"Tabla",col:"col-12",dropdownParent:"#status-crud-container",searchAPI:"/api/tables/paginate",searchBy:"name",required:!0}),t.createElement(g,{eRef:p,type:"color",label:"Color",col:"col-12",required:!0}),t.createElement(q,{eRef:E,label:"Descripcion",col:"col-12"}))))};x((i,o)=>{if(!o.can("statuses","root","all","list"))return location.href="/";C(i).render(t.createElement(A,{...o,title:"Gestor de estados"},t.createElement(B,{...o})))});