import{R as e,r as h}from"./CreateReactScript-Cc5DohIO.js";import{i as v}from"./Adminto-upJjYWRu.js";const x=({title:a,className:o,onClick:l,children:n,eRef:i,...s})=>e.createElement(v,{content:a,arrow:!0},e.createElement("button",{ref:i,className:o,onClick:l,...s},n)),w=({gridRef:a,rest:o,columns:l,toolBar:n,masterDetail:i,filterValue:s,defaultRows:c})=>(h.useEffect(()=>{DevExpress.localization.locale(navigator.language),$(a.current).dxDataGrid({language:"es",dataSource:{load:async r=>{const t=await o.paginate(r)??{};let d=(t==null?void 0:t.data)||[];if(c){const p=c.map(u=>Object.keys(u)),g=d.concat(c.filter(u=>!d.some(b=>p.some(f=>f.every(m=>b[m]==u[m])))));t.data=g}return t}},onToolbarPreparing:r=>{const{items:t}=r.toolbarOptions;n(t)},remoteOperations:!0,columnResizingMode:"widget",allowColumnResizing:!0,allowColumnReordering:!0,columnAutoWidth:!0,scrollbars:"auto",filterPanel:{visible:!0},searchPanel:{visible:!0},headerFilter:{visible:!0,search:{enabled:!0}},height:"calc(100vh - 185px)",filterValue:s,rowAlternationEnabled:!0,showBorders:!0,filterRow:{visible:!0,applyFilter:"auto"},filterBuilderPopup:{visible:!1,position:{of:window,at:"top",my:"top",offset:{y:10}}},paging:{pageSize:10},pager:{visible:!0,allowedPageSizes:[5,10,25,50,100],showPageSizeSelector:!0,showInfo:!0,showNavigationButtons:!0},allowFiltering:!0,scrolling:{mode:"standard",useNative:!0,preloadEnabled:!0,rowRenderingMode:"standard"},columnChooser:{title:"Mostrar/Ocultar columnas",enabled:!0,mode:"select",search:{enabled:!0}},columns:l,masterDetail:i,onContentReady:(...r)=>{tippy(".tippy-here",{arrow:!0,animation:"scale"})}}).dxDataGrid("instance"),tippy(".dx-button",{arrow:!0})},[null]),e.createElement("div",{ref:a})),N=({title:a,gridRef:o,rest:l,columns:n,toolBar:i,masterDetail:s,filterValue:c=[],defaultRows:r})=>e.createElement("div",{className:"row"},e.createElement("div",{className:"col-12"},e.createElement("div",{className:"card"},e.createElement("div",{className:"card-body"},e.createElement("h4",{className:"header-title"},e.createElement("div",{id:"header-title-options",className:"float-end"}),e.createElement("span",{id:"header-title-prefix"})," Lista de ",a," ",e.createElement("span",{id:"header-title-suffix"})),e.createElement(w,{gridRef:o,rest:l,columns:n.filter(Boolean),toolBar:i,masterDetail:s,filterValue:c,defaultRows:r})))));export{N as T,x as a};