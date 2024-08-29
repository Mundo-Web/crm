
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
import Global from './Utils/Global.js'

const clientsRest = new ClientsRest()
const leadsRest = new LeadsRest()

const Clients = ({ projectStatuses, clientStatuses, manageStatuses, session, can, defaultClientStatus }) => {
  const gridRef = useRef()
  const modalRef = useRef()

  // Form elements ref
  const idRef = useRef()
  const rucRef = useRef()
  const nameRef = useRef()
  const tradenameRef = useRef()
  const webUrlRef = useRef()
  const messageRef = useRef()
  // const descriptionRef = useRef()
  const contactNameRef = useRef()
  const contactPhoneRef = useRef()
  const contactEmailRef = useRef()
  const contactAddressRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [projectLoaded, setProjectLoaded] = useState({})
  const [project2Assign, setProject2Assign] = useState({})
  const [projectsGrid, setProjectsGrid] = useState({})
  const [clientLoaded, setClientLoaded] = useState({})
  const [projects, setProjects] = useState([])

  const onModalOpen = (data) => {
    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    $('[href="#client-data"]').addClass('active')
    $('[href="#contact-data"]').removeClass('active')

    $('#client-data').addClass('active')
    $('#contact-data').removeClass('active')

    idRef.current.value = data?.id || null
    rucRef.current.value = data?.ruc || null
    nameRef.current.value = data?.name || null
    tradenameRef.current.value = data?.tradename || null
    webUrlRef.current.value = data?.web_url || null
    messageRef.current.value = data?.message || 'Cliente creado desde Atalaya'
    // descriptionRef.current.value = data?.description || null
    contactNameRef.current.value = data?.contact_name || null
    contactPhoneRef.current.value = data?.contact_phone || null
    contactEmailRef.current.value = data?.contact_email || null
    contactAddressRef.current.value = data?.contact_address || null

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      ruc: rucRef.current.value,
      name: nameRef.current.value,
      tradename: tradenameRef.current.value,
      web_url: webUrlRef.current.value,
      message: messageRef.current.value ?? 'Cliente creado desde Atalaya',
      // description: descriptionRef.current.value ?? '',
      contact_name: contactNameRef.current.value ?? '',
      contact_phone: contactPhoneRef.current.value ?? '',
      contact_email: contactEmailRef.current.value ?? '',
      contact_address: contactAddressRef.current.value ?? '',
      status_id: !idRef.current.value ? defaultClientStatus : undefined
    }

    const result = await clientsRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onStatusChange = async ({ id, status }) => {
    const result = await clientsRest.status({ id, status })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: "Estas seguro de eliminar este lead?",
      text: `No podras revertir esta accion!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Continuar",
      cancelButtonText: `Cancelar`
    })
    if (!isConfirmed) return
    const result = await clientsRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onAssignLeadClicked = async (client_id, assign) => {
    const result = await clientsRest.assign(client_id, assign)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onClientStatusClicked = async (lead, status) => {
    await leadsRest.leadStatus({ lead, status })
    $(gridRef.current).dxDataGrid('instance').refresh()
  }
  const onManageStatusChange = async (lead, status) => {
    await leadsRest.manageStatus({ lead: lead.id, status: status.id })
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  return (<>
    <Table gridRef={gridRef} title='Clientes' rest={clientsRest}
      toolBar={(container) => {
        container.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'refresh',
            hint: 'Refrescar tabla',
            onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
          }
        });
        can('clients', 'root', 'all', 'create') && container.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'plus',
            hint: 'Nuevo registro',
            onClick: () => onModalOpen()
          }
        });
      }}
      columns={[
        can('projects', 'root', 'all', 'list') ? {
          dataField: 'id',
          caption: 'ID',
          dataType: 'number',
          cellTemplate: (container, { data, value, ...otherParams }) => {
            ReactAppend(container, <TippyButton className='btn btn-xs btn-white' title={`Ver ${data.projects_count} proyectos`} onClick={() => {
              otherParams.component.collapseAll(-1);
              otherParams.component.expandRow(otherParams.row.data)
            }}>
              <i className='fas fa-shapes'></i> {data.projects_count}
            </TippyButton>)
          },
          sortOrder: 'desc'
        } : null,
        {
          dataField: 'ruc',
          caption: 'RUC'
        },
        {
          dataField: 'tradename',
          caption: 'Nombre comercial',
          width: 250,
          cellTemplate: (container, { data }) => {
            ReactAppend(container, <div className='d-flex align-items-center'>
              {data.assigned_to && <Tippy content={`Atendido por ${data.assigned.name} ${data.assigned.lastname}`}>
                <img className='avatar-xs rounded-circle me-1' src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${data.assigned.relative_id}`} alt={data.assigned.name} />
              </Tippy>}
              <div>{data.tradename}</div>
            </div>)
          }
        },
        {
          dataField: 'name',
          caption: 'Razon social',
          visible: false
        },
        {
          dataField: 'contact_name',
          caption: 'Nombre de contacto'
        },
        {
          dataField: 'contact_phone',
          caption: 'Telefono'
        },
        {
          dataField: 'contact_email',
          caption: 'Correo'
        },
        can('leads', 'root', 'all', 'changestatus') ? {
          dataField: 'status.name',
          caption: 'Estado del cliente',
          dataType: 'string',
          cellTemplate: (container, { data }) => {
            container.attr('style', 'overflow: visible')
            ReactAppend(container, <Dropdown className='btn btn-xs btn-white rounded-pill' title={data.status.name} icon={{ icon: 'fa fa-circle', color: data.status.color }} tippy='Actualizar estado'>
              {clientStatuses.map(({ id, name, color }) => {
                return <DropdownItem key={id} onClick={() => onClientStatusClicked(data.id, id)}>
                  <i className='fa fa-circle' style={{ color }}></i> {name}
                </DropdownItem>
              })}
            </Dropdown>)
          }
        } : null,
        can('leads', 'root', 'all', 'changestatus') ? {
          dataField: 'manage_status.name',
          caption: 'Estado de gestion',
          dataType: 'string',
          cellTemplate: (container, { data }) => {
            container.attr('style', 'overflow: visible')
            ReactAppend(container, <Dropdown className='btn btn-xs btn-white rounded-pill' title={data?.manage_status?.name} icon={{ icon: 'fa fa-circle', color: data?.manage_status?.color }} tippy='Actualizar estado'>
              {manageStatuses.map((status, i) => {
                return <DropdownItem key={`status-${i}`} onClick={() => onManageStatusChange(data, status)}>
                  <i className='fa fa-circle' style={{ color: status.color }}></i> {status.name}
                </DropdownItem>
              })}
            </Dropdown>)
          }
        } : null,
        can('projects', 'root', 'all', 'list', 'update', 'changestatus', 'delete') ? {
          caption: 'Acciones',
          width: 235,
          cellTemplate: (container, { data }) => {
            container.attr('style', 'display: flex; gap: 4px; overflow: visible')

            // can('projects', 'root', 'all', 'list') && ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-dark' title={`Ver ${data.projects} proyectos en una nueva ventana`} onClick={() => location.href = `/projects/?client=${data.name}`}>
            //   <i className='mdi mdi-page-next'></i>
            // </TippyButton>)

            can('clients', 'root', 'all', 'update') && ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-primary' title='Editar' onClick={() => onModalOpen(data)}>
              <i className='fa fa-pen'></i>
            </TippyButton>)

            if (!data.assigned_to) {
              ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-dark' title="Atender lead"
                onClick={() => onAssignLeadClicked(data.id, true)}>
                <i className='fas fa-hands-helping'></i>
              </TippyButton>)
            } else if (data.assigned_to == session.id) {
              ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-danger' title="Dejar de atender"
                onClick={() => onAssignLeadClicked(data.id, false)}>
                <i className='fas fa-hands-wash'></i>
              </TippyButton>)
            }

            // can('leads', 'root', 'all', 'addnotes') && ReactAppend(container, <TippyButton className="btn btn-xs btn-soft-primary position-relative" title="Ver/Agregar notas" onClick={() => setClientLoaded(data)}>
            //   <i className="fas fa-sticky-note" />
            //   {
            //     data.notes > 0 && <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
            //       {data.notes}
            //       <span className="visually-hidden">Notas de {data.name}</span>
            //     </span>
            //   }
            // </TippyButton>)

            // can('clients', 'root', 'all', 'changestatus') && ReactAppend(container, <TippyButton className='btn btn-xs btn-light' title={data.status === null ? 'Restaurar' : 'Cambiar estado'} onClick={() => onStatusChange(data)}>
            //   {
            //     data.status === 1
            //       ? <i className='fa fa-toggle-on text-success' />
            //       : data.status === 0 ?
            //         <i className='fa fa-toggle-off text-danger' />
            //         : <i className='fas fa-trash-restore' />
            //   }
            // </TippyButton>)

            can('clients', 'root', 'all', 'delete') && ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-danger' title='Eliminar' onClick={() => onDeleteClicked(data.id)}>
              <i className='fa fa-trash-alt'></i>
            </TippyButton>)
          },
          allowFiltering: false,
          allowExporting: false
        } : null
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
    <Modal modalRef={modalRef} title={isEditing ? 'Editar cliente' : 'Agregar cliente'} onSubmit={onModalSubmit} size='md'>
      <input ref={idRef} type='hidden' />
      <ul className="nav nav-pills navtab-bg nav-justified">
        <li className="nav-item">
          <Tippy content='Datos del negocio'>
            <a href="#client-data" data-bs-toggle="tab" aria-expanded="false" className="nav-link active">
              Negocio
            </a>
          </Tippy>
        </li>
        <li className="nav-item">
          <Tippy content='Datos de contacto'>
            <a href="#contact-data" data-bs-toggle="tab" aria-expanded="true" className="nav-link">
              Contacto
            </a>
          </Tippy>
        </li>
      </ul>
      <div className="tab-content">
        <div className="tab-pane active" id="client-data">
          <div className="row">
            <InputFormGroup eRef={rucRef} label='RUC' col='col-4' required />
            <InputFormGroup eRef={tradenameRef} label='Nombre comercial' col='col-8' required />
            <InputFormGroup eRef={nameRef} label='Razon social' col='col-md-6' required />
            <InputFormGroup eRef={webUrlRef} label='URL Web' col='col-md-6' />
            <TextareaFormGroup eRef={messageRef} label='Mensaje' col='col-12' required />
          </div>
        </div>
        <div className="tab-pane show" id="contact-data">
          <div className="row">
            <InputFormGroup eRef={contactNameRef} label='Nombre de contacto' col='col-6' />
            <InputFormGroup eRef={contactPhoneRef} label='Celular de contacto' type="tel" col='col-6' />
            <InputFormGroup eRef={contactEmailRef} label='Email de contacto' col='col-12' type='email' />
            <TextareaFormGroup eRef={contactAddressRef} label='Direccion de contacto' col='col-12' />
          </div>
        </div>
      </div>
    </Modal>

    <PaymentModal can={can} dataLoaded={projectLoaded} setDataLoaded={setProjectLoaded} grid2refresh={projectsGrid} />

    <ClientNotesModal can={can} client={clientLoaded} setClient={setClientLoaded} grid2refresh={gridRef} page='clients' />

    <AssignUsersModal dataLoaded={project2Assign} setDataLoaded={setProject2Assign} grid2refresh={$(gridRef.current).dxDataGrid('instance')} />
  </>
  )
};

CreateReactScript((el, properties) => {
  if (!properties.can('clients', 'root', 'all', 'list')) return location.href = '/';
  createRoot(el).render(
    <Adminto {...properties} title='Clientes'>
      <Clients {...properties} />
    </Adminto>
  );
})