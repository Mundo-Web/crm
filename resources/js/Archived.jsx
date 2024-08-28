
import Tippy from '@tippyjs/react'
import React, { useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import ClientNotesModal from './Reutilizables/ClientNotes/ClientNotesModal.jsx'
import PaymentModal from './Reutilizables/Payments/PaymentModal.jsx'
import ProjectStatusDropdown from './Reutilizables/Projects/ProjectStatusDropdown.jsx'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import ReactAppend from './Utils/ReactAppend.jsx'
import ClientsRest from './actions/ClientsRest.js'
import ProjectsRest from './actions/ProjectsRest.js'
import Adminto from './components/Adminto.jsx'
import Modal from './components/Modal.jsx'
import Table from './components/Table.jsx'
import InputFormGroup from './components/form/InputFormGroup.jsx'
import TextareaFormGroup from './components/form/TextareaFormGroup.jsx'
import TippyButton from './components/form/TippyButton.jsx'
import Number2Currency from './Utils/Number2Currency.jsx'
import DxBox from './components/dx/DxBox.jsx'
import AssignUsersModal from './Reutilizables/Projects/AssignUsersModal.jsx'
import DateRange from './Reutilizables/Projects/DateRange.jsx'
import Assigneds from './Reutilizables/Projects/Assigneds.jsx'
import Dropdown from './components/dropdown/DropDown.jsx'
import DropdownItem from './components/dropdown/DropdownItem.jsx'
import Swal from 'sweetalert2'
import LeadsRest from './actions/LeadsRest.js'
import ArchivedRest from './actions/ArchivedRest.js'

const clientsRest = new ClientsRest()
const leadsRest = new LeadsRest()
const archivedRest = new ArchivedRest()

const Archived = ({ projectStatuses, can }) => {
  const gridRef = useRef()

  const onStatusChange = async ({ id, status }) => {
    const result = await archivedRest.status({ id, status })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: "Estas seguro de eliminar a esta persona?",
      text: `No podras revertir esta accion!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Continuar",
      cancelButtonText: `Cancelar`
    })
    if (!isConfirmed) return
    const result = await archivedRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  return (<>
    <Table gridRef={gridRef} title='Archivados' rest={archivedRest}
      toolBar={(container) => {
        container.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'refresh',
            hint: 'Refrescar tabla',
            onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
          }
        });
      }}
      columns={[
        {
          dataField: 'contact_name',
          caption: 'Lead',
          width: 250,
          cellTemplate: (container, { data }) => {
            ReactAppend(container, <div className='d-flex align-items-center' >
              <b>{data.contact_name}</b>
              {data.assigned_to && <Tippy content={`Atendido por ${data.assigned.name} ${data.assigned.lastname}`}>
                <img className='avatar-xs rounded-circle ms-1' src={`//${APP_DOMAIN}/api/profile/thumbnail/${data.assigned.relative_id}`} alt={data.assigned.name} />
              </Tippy>}
            </div>)
          }
        },
        {
          dataField: 'contact_email',
          caption: 'Correo'
        },
        {
          dataField: 'contact_phone',
          caption: 'Telefono'
        },
        {
          caption: 'Acciones',
          width: 235,
          cellTemplate: (container, { data }) => {
            container.attr('style', 'display: flex; gap: 4px; overflow: visible')

            can('clients', 'root', 'all', 'changestatus') && ReactAppend(container, <TippyButton className='btn btn-xs btn-light' title='Restaurar' onClick={() => onStatusChange(data)}>
              <i className='fas fa-trash-restore' />
            </TippyButton>)

            can('clients', 'root', 'all', 'delete') && ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-danger' title='Eliminar' onClick={() => onDeleteClicked(data.id)}>
              <i className='fa fa-trash-alt'></i>
            </TippyButton>)
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]}
      masterDetail={{
        enabled: false,
        template: async (container, { data: client, component }) => {
          container.css('padding', '10px')
          container.css('overflow', 'visible')
          container.css('background-color', '#323a46')

          let { data: dataSource } = await ProjectsRest.paginate({
            filter: ['client_id', '=', client.id],
            isLoadingAll: true
          })

          container.append(DxBox([
            <>
              <TippyButton title='Cerrar tabla' className='btn btn-xs btn-soft-danger waves-effect mb-1' onClick={() => component.collapseAll(-1)}>
                <i className='fa fa-times'></i>
              </TippyButton>
              <table className='table table-dark table-sm table-bordered mb-0' style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th scope='col'>Tipo</th>
                    <th scope='col'>Asignados</th>
                    <th scope='col'>Costo</th>
                    <th scope='col'>Pagos</th>
                    <th scope='col'>Fecha de desarrollo</th>
                    <th scope='col'>Estado del proyecto</th>
                    <th scope='col'>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {
                    dataSource.map(project => {
                      const percent = ((project.total_payments / project.cost) * 100).toFixed(2)
                      const payments = Number(project.total_payments).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })
                      const rest = Number(project.cost - project.total_payments).toLocaleString('en-US', { maximumFractionDigits: 2, minimumFractionDigits: 2 })
                      const relatives = (project.users || '').split('|').filter(Boolean)

                      return <tr key={`project-${project.id}`}>
                        <td valign='middle'>{project.type.name}</td>
                        <td valign='middle'>{Assigneds(relatives)}</td>
                        <td valign='middle'>{`S/. ${Number2Currency(project.cost)}`}</td>
                        <td valign='middle'>
                          <p className='mb-0 d-flex justify-content-between'>
                            <b className='text-success'><i className='fa fa-arrow-circle-up'></i> S/. {payments}</b>
                            <b className='float-end text-danger'><i className='fa fa-arrow-circle-down'></i> S/. {rest}</b>
                          </p>
                          <div className='progress progress-bar-alt-primary progress-sm mt-0 mb-0' style={{
                            width: '200px'
                          }}>
                            <div className='progress-bar bg-primary progress-animated wow animated' role='progressbar' aria-valuenow={project.total_payments} aria-valuemin='0' aria-valuemax={project.cost} style={{ width: `${percent}%`, visibility: 'visible', animationName: 'animationProgress' }}>
                            </div>
                          </div>
                        </td>
                        <td valign='middle'>{DateRange(project.starts_at, project.ends_at)}</td>
                        <td valign='middle'>
                          <ProjectStatusDropdown can={can} statuses={projectStatuses} data={project} onChange={() => {
                            $(gridRef.current).dxDataGrid('instance').refresh()
                          }} />
                        </td>
                        <td>
                          {
                            can('projects', 'root', 'all', 'assignUsers') && <TippyButton className='btn btn-xs btn-soft-info me-1'
                              title='Asignar usuarios'
                              icon='fa fa-user-plus'
                              onClick={() => setProject2Assign(project)}
                            >
                              <i className='fa fa-user-plus'></i>
                            </TippyButton>
                          }
                          {
                            can('projects', 'root', 'all', 'addpayment') && <TippyButton className='btn btn-xs btn-soft-success'
                              title='Ver/Agregar pagos'
                              icon='fas fa-money-check-alt'
                              onClick={() => setProjectLoaded(project)}
                            >
                              <i className='fas fa-money-check-alt'></i>
                            </TippyButton>
                          }
                        </td>
                      </tr>
                    })
                  }
                </tbody>
              </table>
            </>
          ]))
        }
      }}
    />
  </>
  )
};

CreateReactScript((el, properties) => {
  if (!properties.can('clients', 'root', 'all', 'list')) return location.href = '/';
  createRoot(el).render(
    <Adminto {...properties} title='Archivados'>
      <Archived {...properties} />
    </Adminto>
  );
})