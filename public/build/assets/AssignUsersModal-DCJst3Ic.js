var Y=Object.defineProperty;var k=(n,e,r)=>e in n?Y(n,e,{enumerable:!0,configurable:!0,writable:!0,value:r}):n[e]=r;var E=(n,e,r)=>(k(n,typeof e!="symbol"?e+"":e,r),r);import{m as u,r as a,R as t,c as x}from"./CreateReactScript-vbGM1frk.js";import{M as _}from"./TextareaFormGroup-CVxf9OLI.js";import{I as R}from"./InputFormGroup-HYuIwuxN.js";import{i as q,S as U}from"./Adminto-BnJUw0zT.js";import{a as D}from"./Table-B8PCrxA3.js";import{D as z}from"./Dropdown-sbEYK7N4.js";import{D as J}from"./DropdownItem-SxBzees4.js";import{P as G,r as V,U as C}from"./Assigneds-BeJvl-Mp.js";import{S as M,a as H}from"./SetSelectValue-BojEVN_p.js";class p{}E(p,"paginate",async e=>{const{result:r}=await u.Fetch("/api/payments/paginate",{method:"POST",headers:{Accept:"application/json","Content-Type":"application/json"},body:JSON.stringify(e)});return r}),E(p,"byProject",async e=>{const{result:r}=await u.Fetch(`/api/payments/project/${e}`);return(r==null?void 0:r.data)??[]}),E(p,"save",async e=>{try{const{status:r,result:l}=await u.Fetch("/api/payments",{method:"POST",body:JSON.stringify(e)});if(!r)throw new Error((l==null?void 0:l.message)||"Ocurrio un error inesperado");return u.Notify.add({icon:"/assets/img/logo-login.svg",title:"Correcto",body:l.message,type:"success"}),!0}catch(r){return u.Notify.add({icon:"/assets/img/logo-login.svg",title:"Error",body:r.message,type:"danger"}),!1}}),E(p,"status",async({id:e,status:r})=>{try{const{status:l,result:c}=await u.Fetch("/api/payments/status",{method:"PATCH",body:JSON.stringify({id:e,status:r})});if(!l)throw new Error((c==null?void 0:c.message)??"Ocurrio un error inesperado");return u.Notify.add({icon:"/assets/img/logo-login.svg",title:"Correcto",body:c.message,type:"success"}),!0}catch(l){return u.Notify.add({icon:"/assets/img/logo-login.svg",title:"Error",body:l.message,type:"danger"}),!1}}),E(p,"delete",async e=>{try{const{status:r,result:l}=await u.Fetch(`/api/payments/${e}`,{method:"DELETE"});if(!r)throw new Error((l==null?void 0:l.message)??"Ocurrio un error inesperado");return u.Notify.add({icon:"/assets/img/logo-login.svg",title:"Correcto",body:l.message,type:"success"}),!0}catch(r){return u.Notify.add({icon:"/assets/img/logo-login.svg",title:"Error",body:r.message,type:"danger"}),!1}});const ne=({can:n,dataLoaded:e,setDataLoaded:r,grid2refresh:l})=>{const c=a.useRef(),o=a.useRef(),i=a.useRef(),y=a.useRef(),g=a.useRef(),m=a.useRef(),[b,h]=a.useState([]),[N,S]=a.useState(!1),[v,P]=a.useState(Number(e==null?void 0:e.remaining_amount));a.useEffect(()=>{e.id&&B(),$(c.current).on("hidden.bs.modal",()=>{r({}),h([]),S(!1),o.current.value=null,i.current.value=null,y.current.value=null,m.current.value=null})},[e]);const B=async()=>{const s=await p.byProject(e==null?void 0:e.id);h(s),P(Number(e==null?void 0:e.remaining_amount)),i.current.value=(e==null?void 0:e.id)||null,$(c.current).modal("show")},A=async s=>{s.preventDefault();const f={id:o.current.value||void 0,payment_id:i.current.value,project_id:e.id,payment_type:y.current.value,amount:m.current.value,date:g.current.value};await p.save(f)&&(o.current.value=null,g.current.value=null,y.current.value=null,m.current.value=null,await j(),l.refresh())},j=async()=>{const s=await p.byProject(e.id),f=s.reduce((T,I)=>Number(T)+Number(I.amount),0),w={...e,total_payments:f,remaining_amount:e.cost-f};r(w),h(s)},F=async s=>{o.current.value=s.id,y.current.value=s.payment_type,m.current.value=s.amount,g.current.value=s.date||moment(s.created_at).format("YYYY-MM-DD"),P(Number(e==null?void 0:e.remaining_amount)+Number(s.amount)),S(!0)};console.log(v);const O=async s=>{const{isConfirmed:f}=await U.fire({title:"Estas seguro de eliminar este pago?",text:"No podras revertir esto!",icon:"warning",showCancelButton:!0,confirmButtonText:"Continuar",cancelButtonText:"Cancelar"});!f||!await p.delete(s)||(await j(),l.refresh())};return t.createElement(_,{modalRef:c,title:`Pagos de ${e==null?void 0:e.name} - S/.${e==null?void 0:e.cost}`,onSubmit:A,hideButtonSubmit:!0},t.createElement("div",{className:`row ${!n("projects","all","addpayment","editpayment")&&"d-none"}`},t.createElement("input",{ref:i,type:"hidden"}),t.createElement("input",{ref:o,type:"hidden"}),t.createElement(R,{eRef:y,label:"Concepto",col:"col-12",required:!0}),t.createElement(R,{eRef:g,type:"date",label:"Fecha",col:"col-md-7",required:!0}),t.createElement("div",{className:"form-group col-md-5"},t.createElement("label",null,"Monto ",t.createElement("b",{className:"text-danger"},"*")),t.createElement("div",{className:"input-group"},t.createElement("input",{ref:m,type:"number",className:"form-control",placeholder:`Max: ${v}`,min:0,max:v||0,step:.01}),t.createElement(q,{content:N?"Actualizar pago":"Agregar pago"},t.createElement("button",{className:"btn input-group-text btn-dark waves-effect waves-light",type:"submit"},t.createElement("i",{className:`fa ${N?"fa-save":"fa-plus"}`})))))),t.createElement("hr",{className:"mb-2 mt-0"}),t.createElement("table",{className:"table table-bordered table-sm table-responsive table-striped mb-2"},t.createElement("thead",null,t.createElement("tr",null,n("projects","all","editpayment","deletepayment")&&t.createElement("th",null),t.createElement("th",null,"Concepto"),t.createElement("th",null,"Fecha"),t.createElement("th",null,"Monto"))),t.createElement("tbody",null,b.map(s=>(s.date||(s.date=moment(s.created_at).format("YYYY-MM-DD")),s)).sort((s,f)=>new Date(s.date)-new Date(f.date)).map(s=>t.createElement("tr",{key:`project-payment-${s.id}`},n("projects","all","editpayment","deletepayment")&&t.createElement("td",null,t.createElement("div",{className:"d-flex align-items-center gap-1"},n("projects","all","editpayment")&&t.createElement(D,{title:"Editar pago",className:"btn btn-xs btn-soft-primary",type:"button",onClick:()=>F(s)},t.createElement("i",{className:"fa fa-pen"})),n("projects","all","deletepayment")&&t.createElement(D,{title:"Eliminar pago",className:"btn btn-xs btn-soft-danger",type:"button",onClick:()=>O(s.id)},t.createElement("i",{className:"fa fa-trash"})))),t.createElement("td",null,s.payment_type),t.createElement("td",null,moment(s.date).format("LL")),t.createElement("td",null,"S/.",s.amount))))),t.createElement("table",{className:"table table-bordered table-sm table-responsive table-striped mb-0",style:{width:"max-content",float:"right"}},t.createElement("tbody",null,t.createElement("tr",null,t.createElement("th",{colSpan:3,className:"text-end"},"Pagado"),t.createElement("td",null,"S/.",e==null?void 0:e.total_payments)),t.createElement("tr",null,t.createElement("th",{colSpan:3,className:"text-end"},"Por pagar"),t.createElement("td",null,"S/.",e==null?void 0:e.remaining_amount)))))},se=({statuses:n,data:e,onChange:r})=>{const l=async(c,o)=>{await G.projectStatus(c,o)&&r()};return t.createElement(t.Fragment,null,t.createElement(z,{className:"btn btn-xs btn-light rounded-pill",title:e.status.name,tippy:"Actualizar estado",icon:{icon:"fa fa-circle",color:e.status.color}},n.map(({id:c,name:o,color:i})=>t.createElement(J,{key:c,onClick:()=>l(e.id,c)},t.createElement("i",{className:"fa fa-circle",style:{color:i}})," ",o))))},le=(n,e=!0)=>$("<div>").css({display:"flex",gap:"8px",alignItems:"flex-center",justifyContent:"flex-start"}).dxBox({direction:"row",items:n.filter(Boolean).map(r=>({ratio:0,baseSize:"auto",template:function(l,c,o){if(e)if(a.isValidElement(r)){const i=document.createElement("div");x(i).render(r),o.append(i)}else{const i=document.createElement("div");i.style.width=r.width,i.style.height=r.height,x(i).render(r.children),o.append(i)}else o.append(V(r))}}))}),ce=({dataLoaded:n,setDataLoaded:e,grid2refresh:r})=>{var g;const l=a.useRef(),c=a.useRef(),o=a.useRef();a.useEffect(()=>{n.id&&i(),$(l.current).on("hidden.bs.modal",()=>{c.current.value=null,M(o.current,null,null),e({})})},[n]);const i=async()=>{const m=await C.byProject(n==null?void 0:n.id);c.current.value=(n==null?void 0:n.id)||null,M(o.current,m,"id","fullname"),$(l.current).modal("show")},y=async m=>{m.preventDefault();const b={project_id:c.current.value,users:$(o.current).val()};console.log(b),await C.massiveByProject(b)&&($(l.current).modal("hide"),r.refresh())};return t.createElement(_,{modalRef:l,title:"Asignar usuarios al proyecto",onSubmit:y},t.createElement("div",{id:"assign-users-container"},t.createElement("p",null,"Que usuarios deseas asignar al proyecto ",t.createElement("b",null,n==null?void 0:n.name)," de ",t.createElement("b",null,(g=n==null?void 0:n.client)==null?void 0:g.name)),t.createElement("input",{ref:c,type:"hidden"}),t.createElement(H,{eRef:o,label:"Usuarios a asignar",col:"col-12",dropdownParent:"#assign-users-container",searchAPI:"/api/users/paginate",searchBy:"fullname",multiple:!0})))};export{ce as A,le as D,se as P,ne as a};