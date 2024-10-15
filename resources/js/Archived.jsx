
import Tippy from '@tippyjs/react'
import React, { useEffect, useRef, useState } from 'react'
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
import Global from './Utils/Global.js'
import DxPanelButton from './components/dx/DxPanelButton.jsx'
import TaskCard from './Reutilizables/Tasks/TaskCard.jsx'
import ClientNotesCard from './Reutilizables/ClientNotes/ClientNotesCard.jsx'
import ClientNotesRest from './actions/ClientNotesRest.js'

const archivedRest = new ArchivedRest()
const clientsRest = new ClientsRest()
const clientNotesRest = new ClientNotesRest();

const Archived = ({ projectStatuses, archived, products = [], can, session, defaultLeadStatus, noteTypes }) => {
  const gridRef = useRef()
  const detailModalRef = useRef()

  const [detailLoaded, setDetailLoaded] = useState(null)
  const [notes, setNotes] = useState([]);

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

  const onDetailLoaded = async (lead) => {
    setDetailLoaded(lead)
    history.pushState(null, null, `/archived/${lead.id}`)
    setNotes([])
    $(detailModalRef.current).modal('show')
  }

  useEffect(() => {
    getNotes()
  }, [detailLoaded]);

  const getNotes = async () => {
    const newNotes = await clientNotesRest.byClient(detailLoaded?.id);
    setNotes(newNotes ?? [])
  }

  useEffect(() => {
    $(detailModalRef.current).on('hidden.bs.modal', () => {
      setDetailLoaded(null)
      history.pushState(null, null, '/archived')
    });
    if (!archived) return

    clientsRest.get(archived).then(data => {
      if (!data) return
      setDetailLoaded(data)
      setNotes([])
      $(detailModalRef.current).modal('show')
      if (GET.annotation) {
        $(`[data-name="${GET.annotation}"]`).click()
      }
    })
  }, [null])

  const tasks = []
  notes?.forEach(note => tasks.push(...note.tasks))

  const pendingTasks = []
  notes?.forEach(note => pendingTasks.push(...note.tasks.filter(x => x.status != 'Realizado')))

  return (<>
    <Table gridRef={gridRef} title='Archivados' rest={archivedRest}
      toolBar={(container) => {
        container.unshift(DxPanelButton({
          className: 'btn btn-xs btn-soft-dark',
          text: 'Actualizar',
          title: 'Refrescar tabla',
          icon: 'fas fa-undo-alt',
          onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
        }))
      }}
      columns={[
        {
          dataField: 'contact_name',
          caption: 'Lead',
          width: 250,
          cellTemplate: (container, { data }) => {
            container.attr('style', 'height: 48px; cursor: pointer')
            container.on('click', () => onDetailLoaded(data))
            container.html(data.status_id == defaultLeadStatus ? `<b>${data.contact_name}</b>` : data.contact_name)
          },
          fixed: true,
          fixedPosition: 'left'
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

    <Modal modalRef={detailModalRef} title='Detalles del archivado' btnSubmitText='Guardar' size='full-width' bodyClass='p-3 bg-light' isStatic onSubmit={(e) => e.preventDefault()} hideFooter>
      <div className="row">
        <div className="col-lg-3 col-md-4 col-sm-6 col-xs-12">
          <div className="d-flex mb-3">
            <img className="flex-shrink-0 me-3 rounded-circle avatar-md" alt={detailLoaded?.contact_name}
              src={`//${Global.APP_DOMAIN}/api/profile/null`} />
            <div className="flex-grow-1">
              <h4 className="media-heading mt-0">
                {detailLoaded?.contact_name}
              </h4>
              <span className="badge bg-primary me-1">{detailLoaded?.contact_position || 'Trabajador'}</span> <small className='text-muted'>desde <b>{detailLoaded?.origin}</b></small>
            </div>
          </div>
          <div className="btn-group mb-0">
            <span className="btn btn-light btn-sm" style={{ cursor: 'default', color: '#ffffff', backgroundColor: detailLoaded?.manage_status?.color || '#6c757d' }}>
              {detailLoaded?.manage_status?.name || 'Sin estado'}
            </span>
          </div>
          <hr />
          <h4>Datos del contacto</h4>
          <h5 className="font-600 mb-0">Correo electronico</h5>
          <p className='mb-2 text-truncate'> {detailLoaded?.contact_email} </p>
          <h5 className="font-600 mb-0">Tefono / Celular</h5>
          <p className='mb-2'> {detailLoaded?.contact_phone} </p>
          <h5 className="font-600 mb-0">Mensaje</h5>
          <p className='mb-2'> {detailLoaded?.message} </p>
          <h5 className="font-600 mb-0">Fecha de registro</h5>
          <p className='mb-2'>
            {moment(detailLoaded?.created_at).format('LL')}<br />
            <small className="text-muted">{moment(detailLoaded?.created_at).format('LTS')}</small>
          </p>
          <hr />
          <h4>Datos de la empresa</h4>

          <h5 className="font-600 mb-0">Nombre comercial</h5>
          <p className='mb-2'> {detailLoaded?.tradename ?? <i className='text-muted'>No especifica</i>} </p>

          <h5 className="font-600 mb-0">RUC</h5>
          <p className='mb-2'> {detailLoaded?.ruc ?? <i className='text-muted'>No especifica</i>} </p>

          <h5 className="font-600 mb-0">N° trabajadores</h5>
          <p className='mb-2'> {detailLoaded?.workers ?? <i className='text-muted'>No especifica</i>} </p>

        </div>

        <div className="col-lg-6 col-md-4 col-sm-6 col-xs-12">
          <div className="card card-body">
            <ul className="nav nav-tabs" style={{ flexWrap: 'nowrap', overflowX: 'auto' }}>
              <li key={`note-type-activity`} className="nav-item">
                <a href="#note-type-activity" data-bs-toggle="tab" aria-expanded="false" className="nav-link active">
                  <i className="mdi mdi-clock"></i> Actividad
                </a>
              </li>
              {
                noteTypes.sort((a, b) => a.order - b.order).map((type, i) => {
                  if (type.name == 'Correos') return
                  return <li key={`note-type-${i}`} className="nav-item">
                    <a href={`#note-type-${type.id}`} data-name={type.name} data-bs-toggle="tab" aria-expanded="false" className="nav-link">
                      <i className={type.icon}></i> {type.name}
                    </a>
                  </li>
                })
              }
            </ul>
            <div className="tab-content">
              <div key={`tab-note-type-activity`} className='tab-pane active' id={`note-type-activity`}>
                {
                  notes.sort((a, b) => b.created_at > a.created_at ? 1 : -1).map((note, i) => {
                    return <ClientNotesCard key={`note-${i}`} {...note} showOptions={false} session={session} />
                  })
                }

              </div>
              {
                noteTypes.sort((a, b) => a.order - b.order).map((type, i) => {
                  return <div key={`tab-note-type-${i}`} className='tab-pane' id={`note-type-${type.id}`}>
                    <h4 className='header-title mb-2'>Lista de {type.name}</h4>
                    {
                      notes.filter(x => x.note_type_id == type.id).sort((a, b) => b.created_at > a.created_at ? 1 : -1).map((note, i) => {
                        return <ClientNotesCard key={`note-${i}`} {...note} session={session} />
                      })
                    }
                  </div>
                })
              }
            </div>
          </div>
        </div>

        <div className="col-lg-3 col-md-4 col-sm-6 col-xs-12">
          <div className="card">
            <div className="card-body">
              <h5 className="header-title">Lista de tareas</h5>
              <hr />
              {
                pendingTasks.length > 0
                  ? pendingTasks.sort((a, b) => a.ends_at > b.ends_at ? 1 : -1).map((task, i) => {
                    return <TaskCard key={`task-${i}`} {...task} />
                  })
                  : <i className='text-muted'>- No hay tareas pendientes -</i>
              }
            </div>
          </div>
        </div>
      </div>
    </Modal>
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