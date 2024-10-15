
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
import Global from './Utils/Global.js'
import DxPanelButton from './components/dx/DxPanelButton.jsx'
import { GET } from 'sode-extend-react'
import ClientNotesRest from './actions/ClientNotesRest.js'
import ClientNotesCard from './Reutilizables/ClientNotes/ClientNotesCard.jsx'
import TaskCard from './Reutilizables/Tasks/TaskCard.jsx'
import ProductsByClients from './actions/ProductsByClientsRest.js'
import { renderToString } from 'react-dom/server'

const clientsRest = new ClientsRest()
const leadsRest = new LeadsRest()
const clientNotesRest = new ClientNotesRest();
const productsByClients = new ProductsByClients()

const Clients = ({ projectStatuses, clientStatuses, products = [], manageStatuses, session, can, noteTypes, defaultClientStatus, client }) => {
  const gridRef = useRef()
  const modalRef = useRef()
  const detailModalRef = useRef()

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

  const [detailLoaded, setDetailLoaded] = useState({})
  const [notes, setNotes] = useState([]);
  const [clientProducts, setClientProducts] = useState([])

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

  const onDetailLoaded = async (lead) => {
    setDetailLoaded(lead)
    history.pushState(null, null, `/clients/${lead.id}`)
    setNotes([])
    setClientProducts([])
    $(detailModalRef.current).modal('show')
  }

  useEffect(() => {
    getNotes()
    getClientProducts()
  }, [detailLoaded]);

  const getNotes = async () => {
    const newNotes = await clientNotesRest.byClient(detailLoaded?.id);
    setNotes(newNotes ?? [])
  }

  const getClientProducts = async () => {
    const newClientProducts = await productsByClients.byClient(detailLoaded?.id)
    setClientProducts(newClientProducts)
  }

  useEffect(() => {
    $(detailModalRef.current).on('hidden.bs.modal', () => {
      setDetailLoaded(null)
      history.pushState(null, null, '/clients')
    });
    if (!client) return

    clientsRest.get(client).then(data => {
      if (!data) return
      setDetailLoaded(data)
      setNotes([])
      setClientProducts([])
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
    <Table gridRef={gridRef} title='Clientes' rest={clientsRest}
      toolBar={(container) => {
        container.unshift(DxPanelButton({
          className: 'btn btn-xs btn-soft-dark',
          text: 'Actualizar',
          title: 'Refrescar tabla',
          icon: 'fas fa-undo-alt',
          onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
        }))
        can('clients', 'all', 'create') && container.unshift(DxPanelButton({
          className: 'btn btn-xs btn-soft-primary',
          text: 'Nuevo',
          title: 'Agregar registro',
          icon: 'fa fa-plus',
          onClick: () => onOpenModal()
        }))
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
          caption: 'RUC',
          cellTemplate: (container, { data }) => {
            container.attr('style', 'height: 48px; cursor: pointer')
            container.on('click', () => onDetailLoaded(data))
            container.html(data.ruc || `<i class="text-muted">- Sin RUC -</i>`)
          }
        },
        {
          dataField: 'tradename',
          caption: 'Nombre comercial',
          width: 250,
          cellTemplate: (container, { data }) => {
            container.attr('style', 'height: 48px; cursor: pointer')
            container.on('click', () => onDetailLoaded(data))
            ReactAppend(container, <div className='d-flex align-items-center'>
              {data.assigned_to && <Tippy content={`Atendido por ${data.assigned.name} ${data.assigned.lastname}`}>
                <img className='avatar-xs rounded-circle me-1' src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${data.assigned.relative_id}`} alt={data.assigned.name} />
              </Tippy>}
              <div>{data.tradename || <i className='text-muted'>- Sin nombre -</i>}</div>
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
          caption: 'Nombre de contacto',
          width: 250,
          cellTemplate: (container, { data }) => {
            container.attr('style', 'height: 48px; cursor: pointer')
            container.on('click', () => onDetailLoaded(data))
            container.html(renderToString(<b>{data.contact_name}</b>))
          },
        },
        {
          dataField: 'contact_phone',
          caption: 'Telefono'
        },
        {
          dataField: 'contact_email',
          caption: 'Correo'
        },
        can('clients', 'root', 'all', 'changestatus') ? {
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
        can('clients', 'root', 'all', 'changestatus') ? {
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
        can('clients', 'root', 'all', 'list', 'update', 'changestatus', 'delete') ? {
          caption: 'Acciones',
          width: 235,
          cellTemplate: (container, { data }) => {
            container.attr('style', 'display: flex; gap: 4px; overflow: visible')

            // can('projects', 'root', 'all', 'list') && ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-dark' title={`Ver ${data.projects} proyectos en una nueva ventana`} onClick={() => location.href = `/projects/?client=${data.name}`}>
            //   <i className='mdi mdi-page-next'></i>
            // </TippyButton>)


            ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-primary' title='Ver detalles' onClick={() => onDetailLoaded(data)}>
              <i className='fa fa-eye'></i>
            </TippyButton>)

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

    <Modal modalRef={detailModalRef} title='Detalles del cliente' btnSubmitText='Guardar' size='full-width' bodyClass='p-3 bg-light' isStatic onSubmit={(e) => e.preventDefault()} hideFooter>
      <div className="row">
        <div className="col-lg-3 col-md-4 col-sm-6 col-xs-12">
          <div className="d-flex mb-3">
            <div className="flex-grow-1">
              <h4 className="media-heading mt-0">
                {detailLoaded?.contact_name}
              </h4>
              <span className="badge bg-primary me-1">{detailLoaded?.contact_position || 'Trabajador'}</span>
              <small className='text-muted'>desde <b>{detailLoaded?.origin}</b></small>
            </div>
          </div>

          <hr />

          <h4>Estados</h4>

          <div className='d-flex flex-wrap gap-2 justify-content-between mb-2'>
            <div>
              <b className='d-block'>Estado de gestión</b>
              <span className="btn btn-light btn-sm" style={{ cursor: 'default', color: '#ffffff', backgroundColor: detailLoaded?.status?.color || '#6c757d' }}>
                {detailLoaded?.status?.name || 'Sin estado'}
              </span>
            </div>

            <div>
              <b className='d-block'>Estado del lead</b>
              <span className="btn btn-light btn-sm" style={{ cursor: 'default', color: '#ffffff', backgroundColor: detailLoaded?.manage_status?.color || '#6c757d' }}>
                {detailLoaded?.manage_status?.name || 'Sin estado'}
              </span>
            </div>
          </div>
          {
            detailLoaded?.assigned_to && (
              <>
                <b className='d-block mb-1'>Atendido por:</b>
                <div className="d-flex align-items-start">
                  <img className="d-flex me-2 rounded-circle"
                    src={`//${Global.APP_DOMAIN}/api/profile/thumbnail/${detailLoaded?.assigned?.relative_id}`}
                    alt={detailLoaded?.assigned?.name} height="32" />
                  <div className="w-100">
                    <h5 className='m-0 font-14'>{detailLoaded?.assigned?.name}</h5>
                    <span className="font-12 mb-0">{detailLoaded?.assigned?.email}</span>
                  </div>
                </div>
              </>
            )
          }
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
            <div className="card-header bg-danger">
              <h5 className="header-title my-0 text-white">Tareas</h5>
            </div>
            <div className="card-body">
              {
                pendingTasks.length > 0
                  ? pendingTasks.sort((a, b) => a.ends_at > b.ends_at ? 1 : -1).map((task, i) => {
                    return <TaskCard key={`task-${i}`} {...task} />
                  })
                  : <i className='text-muted'>- No hay tareas pendientes -</i>
              }
            </div>
          </div>
          <div className="card">
            <div className="card-header bg-primary">
              <div className="float-end text-white">
                S/. {Number2Currency(clientProducts.reduce((total, product) => total + Number(product.price), 0))}
              </div>
              <h5 className="header-title my-0 text-white">Productos</h5>
            </div>
            <div className="card-body">

              {
                clientProducts.length > 0
                  ?
                  <div className='mt-2 d-flex flex-column gap-2'>
                    {
                      clientProducts.map((product, index) => {
                        return <div className='card mb-0' key={index} style={{
                          border: `1px solid ${product.color}44`,
                          backgroundColor: `${product.color}11`
                        }}>
                          <div className="card-body p-2">
                            <div className="float-end">
                              <Tippy content='Quitar producto'>
                                <i className='fa fa-times' onClick={() => deleteClientProduct(product)} style={{ cursor: 'pointer' }}></i>
                              </Tippy>
                            </div>

                            <h5 className="header-title mt-0 mb-1" style={{ fontSize: '14.4px', color: product.color }}>{product.name}</h5>
                            <small>S/. {Number2Currency(product.price)}</small>
                          </div>
                        </div>
                      })
                    }
                  </div>
                  : <i className='text-muted'>- Sin productos -</i>
              }
            </div>
          </div>
        </div>
      </div>
    </Modal>

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