import React, { useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { GET } from 'sode-extend-react'
import 'tippy.js/dist/tippy.css'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import Number2Currency from './Utils/Number2Currency.jsx'
import ProjectsArchivedRest from './actions/ProjectsArchivedRest.js'
import Adminto from './components/Adminto.jsx'
import Table from './components/Table.jsx'
import DxButton from './components/dx/DxButton.jsx'
import DxBox from './components/dx/DxBox.jsx'
import DateRange from './Reutilizables/Projects/DateRange.jsx'
import Assigneds from './Reutilizables/Projects/Assigneds.jsx'
import DxPanelButton from './components/dx/DxPanelButton.jsx'
import ReactAppend from './Utils/ReactAppend.jsx'
import ProjectsRest from './actions/ProjectsRest.js'
import Swal from 'sweetalert2'

const projectsArchivedRest = new ProjectsArchivedRest()

const ProjectsArchived = ({ can }) => {

  const gridRef = useRef()

  const onStatusChange = async ({ id, status }) => {
    const result = await ProjectsRest.status({ id, status })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: "¿Estás seguro de eliminar este proyecto?",
      text: "Esta accion es irreversible, se eliminara el proyecto por completo",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Continuar",
      cancelButtonText: "Cancelar"
    })
    if (!isConfirmed) return

    const result = await projectsArchivedRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  return (<>
    <Table gridRef={gridRef} title='Proyectos Archivados' rest={projectsArchivedRest} exportable
      toolBar={(container) => {
        container.unshift(DxPanelButton({
          className: 'btn btn-xs btn-soft-dark',
          text: 'Actualizar',
          title: 'Refrescar tabla',
          icon: 'fas fa-undo-alt',
          onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
        }))
      }}
      filterValue={undefined}
      columns={[
        {
          dataField: 'client.tradename',
          caption: 'Nombre comercial',
          filterValue: GET.client || undefined,
          fixed: true,
          fixedPosition: 'left'
        },
        {
          dataField: 'type.name',
          caption: 'Tipo',
          visible: false
        },
        {
          dataField: 'name',
          caption: 'Proyecto',
        },
        {
          dataField: 'users',
          caption: 'Asignados',
          dataType: 'string',
          cellTemplate: (container, { data }) => {
            const relatives = (data.users || '').split('|').filter(Boolean)
            container.append(DxBox([Assigneds(relatives)]))
          },
          visible: false,
          allowExporting: false,
        },
        can('projects', 'root', 'all', 'addpayment') &&
        {
          dataField: 'cost',
          caption: 'Costo total',
          dataType: 'number',
          cellTemplate: (container, { data }) => {
            container.text(`S/. ${Number2Currency(data.cost)}`)
          }
        },
        can('projects', 'root', 'all', 'addpayment') &&
        {
          dataField: 'remaining_amount',
          caption: 'Debe',
          dataType: 'number',
          cellTemplate: (container, { data }) => {
            const percent = ((data.total_payments / data.cost) * 100).toFixed(2)
            const payments = Number(data.total_payments).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })
            const rest = Number(data.cost - data.total_payments).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })
            container.append(DxBox([
              <>
                <p className='mb-0 d-flex justify-content-between'>
                  <b className='text-success'><i className='fa fa-arrow-circle-up'></i> S/. {payments}</b>
                  <b className='float-end text-danger'><i className='fa fa-arrow-circle-down'></i> S/. {rest}</b>
                </p>
                <div className='progress progress-bar-alt-primary progress-sm mt-0 mb-0' style={{
                  width: '200px'
                }}>
                  <div className='progress-bar bg-primary progress-animated wow animated animated animated' role='progressbar' aria-valuenow={data.total_payments} aria-valuemin='0' aria-valuemax={data.cost} style={{ width: `${percent}%`, visibility: 'visible', animationName: 'animationProgress' }}>
                  </div>
                </div>
              </>
            ], false))
          },
          allowExporting: false,
        },
        {
          dataField: 'starts_at',
          caption: 'Fecha inicio proyecto',
          dataType: 'date',
          format: 'yyyy-MM-dd',
          cellTemplate: (container, { data }) => {
            container.text(moment(data.starts_at).format('LL'))
          }
        },
        {
          dataField: 'ends_at',
          caption: 'Fecha fin proyecto',
          dataType: 'date',
          format: 'yyyy-MM-dd',
          cellTemplate: (container, { data }) => {
            container.append(DxBox([{
              width: '200px',
              height: '30px',
              children: DateRange(data.starts_at, data.ends_at)
            }]))
          },
          sortOrder: 'asc'
        },
        {
          dataField: 'last_payment_date',
          dataType: 'datetime',
          visible: false,
        },
        {
          dataField: 'last_payment.date',
          caption: 'Fecha ultimo pago',
          dataType: 'date',
          format: 'yyyy-MM-dd',
          cellTemplate: (container, { data }) => {
            if (!data?.last_payment_date) return container.html('<i class="text-muted">- No hay pagos -</i>')
            container.text(moment(data?.last_payment_date).format('LL'))
          }
        },
        can('projects', 'root', 'all', 'changestatus') ? {
          dataField: 'status.name',
          caption: 'Estado del proyecto',
          dataType: 'string',
          cellTemplate: (container, { data }) => {
            container.attr('style', 'overflow: visible')
            ReactAppend(container, <button className="btn btn-xs btn-light rounded-pill" disabled>
              <i class="fa fa-circle me-1" style={{ color: data.status.color }}></i>
              {data.status.name}
            </button>)
          }
        } : null,
        {
          caption: 'Acciones',
          cellTemplate: (container, { data }) => {
            can('projects', 'root', 'all', 'changestatus') && container.append(DxButton({
              className: 'btn btn-xs btn-soft-dark',
              title: 'Restaurar',
              icon: 'fas fa-trash-restore',
              onClick: () => onStatusChange(data)
            }))
            can('projects', 'root', 'all', 'delete') && container.append(DxButton({
              className: 'btn btn-xs btn-soft-danger',
              title: 'Eliminar definitivamente',
              icon: 'fas fa-trash',
              onClick: () => onDeleteClicked(data.id)
            }))
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]} />
  </>
  )
};

CreateReactScript((el, properties) => {
  if (!properties.can('projects', 'root', 'all', 'list')) return location.href = '/';
  createRoot(el).render(
    <Adminto {...properties} title='Proyectos archivados'>
      <ProjectsArchived {...properties} />
    </Adminto>
  );
})