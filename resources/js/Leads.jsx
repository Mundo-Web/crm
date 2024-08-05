import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import Adminto from './components/Adminto.jsx'
import Modal from './components/Modal.jsx'
import LeadsRest from './actions/LeadsRest.js'
import Tippy from '@tippyjs/react'
import Correlative from './Utils/Correlative.js'
import ClientNotesRest from './actions/ClientNotesRest.js'
import Swal from 'sweetalert2'
import ClientNotesCard from './Reutilizables/ClientNotes/ClientNotesCard.jsx'
import Table from './components/Table.jsx'
import { Local } from 'sode-extend-react'
import '../css/leads.css'
import TippyButton from './components/form/TippyButton.jsx'
import ReactAppend from './Utils/ReactAppend.jsx'
import Dropdown from './components/dropdown/DropDown.jsx'
import DropdownItem from './components/dropdown/DropdownItem.jsx'
import TasksRest from './actions/TasksRest.js'
import TaskCard from './Reutilizables/Tasks/TaskCard.jsx'
import InputFormGroup from './components/form/InputFormGroup.jsx'
import TextareaFormGroup from './components/form/TextareaFormGroup.jsx'

const leadsRest = new LeadsRest()
const clientNotesRest = new ClientNotesRest()
const taskRest = new TasksRest()

const Leads = ({ statuses, defaultClientStatus, manageStatuses, noteTypes, session, can, APP_DOMAIN }) => {

  const modalRef = useRef()
  const newLeadModalRef = useRef()
  const gridRef = useRef()
  const taskTitleRef = useRef()
  const taskEndsAtRef = useRef()

  // Form Ref
  const idRef = useRef()
  const contactNameRef = useRef()
  const contactEmailRef = useRef()
  const contactPhoneRef = useRef()
  const nameRef = useRef()
  const webUrlRef = useRef()
  const messageRef = useRef()


  const [leads, setLeads] = useState([])
  const [leadLoaded, setLeadLoaded] = useState(null)
  const [notes, setNotes] = useState([]);
  const [defaultView, setDefaultView] = useState(Local.get('default-view') ?? 'kanban')

  const typeRefs = {};
  noteTypes.forEach(type => {
    typeRefs[type.id] = useRef()
  })

  useEffect(() => {
    $(modalRef.current).on('hidden.bs.modal', () => setLeadLoaded(null));
  }, [null])

  useEffect(() => {
    const ids = statuses.map(x => `#status-${Correlative(x.name)}`).join(', ');
    $(ids).sortable({
      connectWith: '.taskList',
      placeholder: 'task-placeholder',
      forcePlaceholderSize: true,
      receive: async function ({ target }, { item }) {
        const ul = target;
        const li = item.get(0);
        const items = $(ul).sortable('toArray');
        if (!items.includes(li.id)) return;
        const result = await leadsRest.leadStatus({ status: ul.getAttribute('data-id'), lead: li.id });
        if (!result) return;
        // await getLeads();
      },
      update: function (event, ui) {
        if (this === ui.item.parent()[0]) {
          return;
        }
      }
    }).disableSelection();

    noteTypes.forEach(type => {

      new Quill(`#editor-${type.id}`, { theme: "bubble", modules: { toolbar: [[{ font: [] }, { size: [] }], ["bold", "italic", "underline", "strike"], [{ color: [] }, { background: [] }], [{ script: "super" }, { script: "sub" }], [{ header: [!1, 1, 2, 3, 4, 5, 6] }, "blockquote", "code-block"], [{ list: "ordered" }, { list: "bullet" }, { indent: "-1" }, { indent: "+1" }], ["direction", { align: [] }], ["link", "image", "video"], ["clean"]] } })
    })

    setLeads([])
    if (defaultView == 'kanban') {
      getLeads();
    }
  }, [defaultView]);

  useEffect(() => {
    getNotes()
  }, [leadLoaded]);

  const getLeads = async () => {
    const newLeads = await leadsRest.all()
    setLeads(newLeads)
  }

  const getNotes = async () => {
    const newNotes = await clientNotesRest.byClient(leadLoaded?.id);
    setNotes(newNotes ?? [])
  }

  const onLeadClicked = async (lead) => {
    setLeadLoaded(lead)
    setNotes([])
    $(modalRef.current).modal('show')
  }

  const onSaveNote = async (e) => {
    const type = e.target.value
    const quill = typeRefs[type].current
    const editor = $(quill).find('.ql-editor')
    const text = editor.text().trim()
    const content = editor.html()
    if (!content.trim()) return Swal.fire({
      title: 'Ooops!',
      text: 'Ingresa un valor valido',
      timer: 2000
    })
    let title = ''
    let isTask = false
    switch (type) {
      case 'ed37659f-f9dc-49c1-9d0e-6a2effe9bd54':
        title = `${session.service_user.fullname} → ${leadLoaded.contact_name}`
        break
      case 'e20c7891-1ef8-4388-8150-4c1028cc4525':
        isTask = true
        title = `Nueva tarea`
        if (!taskEndsAtRef.current.value) return Swal.fire({
          title: 'Oops',
          text: 'Ingresa la fecha de finalizacion de la tarea',
          timer: 2000
        })
        break
      default:
        title = `Nota de ${session.service_user.fullname}`
        break
    }

    const result = await clientNotesRest.save({
      note_type_id: type,
      name: title,
      description: !isTask ? content : undefined,
      client_id: leadLoaded.id,
      tasks: isTask ? [{
        name: taskTitleRef.current.value,
        description: text ? content : undefined,
        ends_at: taskEndsAtRef.current.value
      }] : []
    })
    if (!result) return

    editor.empty()
    const newNotes = structuredClone(notes)
    newNotes.push(result)
    setNotes(newNotes)
  }

  const onDefaultViewClicked = (view) => {
    Local.set('default-view', view)
    setDefaultView(view)
  }

  const onClientStatusClicked = async (lead, status) => {
    await leadsRest.leadStatus({ lead, status })
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onAttendClient = async (lead, attend) => {
    await leadsRest.attend(lead, attend)
    if (defaultView == 'kanban') getLeads()
    else $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onTaskStatusChange = async (id, status) => {
    const result = await taskRest.status({ id, status })
    if (!result) return
    if (result?.data?.refresh) {
      if (defaultView == 'kanban') getLeads()
      else $(gridRef.current).dxDataGrid('instance').refresh()
    }
    getNotes()
  }

  const onManageStatusChange = async (lead, status) => {
    await leadsRest.manageStatus({ lead: lead.id, status: status.id })
    const newLeadLoaded = structuredClone(lead)
    newLeadLoaded.manage_status = status;
    setLeadLoaded(newLeadLoaded)
    if (defaultView == 'kanban') getLeads()
    else $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (data) => {
    const { isConfirmed } = await Swal.fire({
      title: "Estas seguro de eliminar este lead?",
      text: `No podras revertir esta accion!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Continuar",
      cancelButtonText: `Cancelar`
    })
    if (!isConfirmed) return
    await leadsRest.delete(data.id)
    if (defaultView == 'kanban') {
      $(`[id="${data.id}"]`).remove()
    } else $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value,
      contact_name: contactNameRef.current.value,
      contact_email: contactEmailRef.current.value,
      contact_phone: contactPhoneRef.current.value,
      name: nameRef.current.value,
      web_url: webUrlRef.current.value,
      message: messageRef.current.value,
      client_width: window.screen.width,
      client_height: window.screen.height,
      client_system: navigator.platform ?? 'Linux'
    }

    const result = await leadsRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(newLeadModalRef.current).modal('hide')
  }


  const tasks = []
  notes?.forEach(note => tasks.push(...note.tasks))

  const pendingTasks = []
  notes?.forEach(note => pendingTasks.push(...note.tasks.filter(x => x.status != 'Realizado')))

  return (<>
    <div className='d-flex mb-2 gap-1'>
      <input id='view-as-table' type="radio" name='view-as' defaultChecked={defaultView == 'table'} onClick={() => onDefaultViewClicked('table')} />
      <label htmlFor="view-as-table">Tabla</label>
      <input id='view-as-kanban' type="radio" name='view-as' defaultChecked={defaultView == 'kanban'} onClick={() => onDefaultViewClicked('kanban')} />
      <label htmlFor="view-as-kanban">Pipelines</label>
    </div>
    {
      defaultView == 'table' ?
        <Table gridRef={gridRef} title='Leads' rest={leadsRest}
          toolBar={(container) => {
            container.unshift({
              widget: 'dxButton', location: 'after',
              options: {
                icon: 'refresh',
                hint: 'Refrescar tabla',
                onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
              }
            });
            can('leads', 'all', 'create') && container.unshift({
              widget: 'dxButton', location: 'after',
              options: {
                icon: 'plus',
                hint: 'Nuevo registro',
                onClick: () => $(newLeadModalRef.current).modal('show')
              }
            });
          }}
          columns={[
            {
              dataField: 'contact_name',
              caption: 'Cliente',
              width: 250,
              cellTemplate: (container, { data }) => {
                ReactAppend(container, <div className='d-flex align-items-center' style={{ cursor: 'pointer' }} onClick={() => onLeadClicked(data)}>
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
              dataField: 'status.name',
              caption: 'Estado del lead',
              dataType: 'string',
              cellTemplate: (container, { data }) => {
                container.attr('style', 'overflow: visible')
                ReactAppend(container, <Dropdown className='btn btn-xs btn-white rounded-pill' title={data.status.name} icon={{ icon: 'fa fa-circle', color: data.status.color }} tippy='Actualizar estado'>
                  {
                    statuses.map(({ id, name, color }) => {
                      return <DropdownItem key={id} onClick={() => onClientStatusClicked(data.id, id)}>
                        <i className='fa fa-circle' style={{ color }}></i> {name}
                      </DropdownItem>
                    })
                  }
                </Dropdown>)
              }
            },
            {
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
            },
            {
              dataField: 'origin',
              caption: 'Origen',
              dataType: 'string'
            },
            {
              dataField: 'created_at',
              caption: 'Fecha creacion',
              dataType: 'datetime',
              cellTemplate: (container, { data }) => {
                container.text(moment(data.created_at).format('lll'))
              },
              sortOrder: 'desc',
            },
            {
              caption: 'Acciones',
              width: 240,
              cellTemplate: (container, { data }) => {
                container.attr('style', 'display: flex; gap: 4px; overflow: visible')

                ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-primary' title='Ver detalles' onClick={() => onLeadClicked(data)}>
                  <i className='fa fa-eye'></i>
                </TippyButton>)

                if (!data.assigned_to) {
                  ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-dark' title="Atender lead"
                    onClick={() => onAttendClient(data.id, true)}>
                    <i className='fas fa-hands-helping'></i>
                  </TippyButton>)
                } else if (data.assigned_to == session.service_user.id) {
                  ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-danger' title="Dejar de atender"
                    onClick={() => onAttendClient(data.id, false)}>
                    <i className='fas fa-hands-wash'></i>
                  </TippyButton>)
                }

                ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-success' title='Convertir en cliente' onClick={async () => {
                  const { isConfirmed } = await Swal.fire({
                    title: "Estas seguro?",
                    text: `${data.contact_name} pasara a ser un cliente!`,
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Continuar",
                    cancelButtonText: `Cancelar`
                  })
                  if (isConfirmed) onClientStatusClicked(data.id, defaultClientStatus)
                }}>
                  <i className='fa fa-user-plus'></i>
                </TippyButton>)
                ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-danger' title='Eliminar lead' onClick={() => onDeleteClicked(data)}>
                  <i className='fa fa-trash'></i>
                </TippyButton>)
              },
              allowFiltering: false,
              allowExporting: false
            }
          ]} />
        : (<div className="d-flex gap-2" style={{ overflowX: 'auto', minHeight: 'calc(100vh - 135px)' }}>
          {
            statuses.sort((a, b) => a.order - b.order).map((status, i) => {
              const correlative = Correlative(status.name)
              return (<div key={`status-${i}`} style={{ minWidth: '360px', maxWidth: '360px' }}>
                <div className="card">
                  <div className="card-body taskboard-box" style={{ minHeight: '200px' }}>
                    <h4 className="header-title mt-0 mb-3" style={{ color: status.color }}>{status.name}</h4>
                    <ul className="sortable-list list-unstyled taskList" id={`status-${correlative}`} data-id={status.id}>
                      {
                        leads.filter(x => x.status_id == status.id).sort((a, b) => {
                          return a.assigned_to == session.service_user.id ? -1 : 1
                        }).map((lead, i) => {
                          return <li id={`${lead.id}`} key={`lead-${i}`} style={{ cursor: 'move' }} className={lead.assigned_to == session.service_user.id ? 'border border-primary' : ''}>
                            <div className="kanban-box" >
                              <div className="kanban-detail ms-0">
                                <span className="badge float-end" style={{
                                  backgroundColor: lead?.manage_status?.color || '#6c757d'
                                }}>{lead?.manage_status?.name ?? 'Sin estado'}</span>
                                <h5 className="mt-0">
                                  <a href="#" onClick={() => onLeadClicked(lead)}
                                    className="text-dark">
                                    {lead.contact_name}
                                  </a>
                                </h5>
                                <ul className="list-inline d-flex align-items-center gap-1">
                                  <li className="list-inline-item">
                                    {
                                      !lead.assigned_to
                                        ? <TippyButton className='btn btn-xs btn-soft-dark rounded-pill' title="Atender lead"
                                          onClick={() => onAttendClient(lead.id, true)}>
                                          <i className='fas fa-hands-helping'></i>
                                        </TippyButton>
                                        : (
                                          lead.assigned_to == session.service_user.id
                                            ? <TippyButton className='btn btn-xs btn-soft-danger' title="Dejar de atender"
                                              onClick={() => onAttendClient(lead.id, false)}>
                                              <i className='fas fa-hands-wash'></i>
                                            </TippyButton>
                                            : <Tippy content={`Atendido por ${lead?.assigned?.fullname}`}>
                                              <a href="" data-bs-toggle="tooltip" data-bs-placement="top"
                                                title="Username">
                                                <img src={`//${APP_DOMAIN}/api/profile/${lead?.assigned?.relative_id}`} alt="img"
                                                  className="avatar-sm rounded-circle" />
                                              </a>
                                            </Tippy>
                                        )
                                    }
                                  </li>
                                  <li className="list-inline-item">
                                    <Tippy content={`${lead.pending_tasks_count} tareas pendientes`}>
                                      <span style={{ position: 'relative' }}
                                        title="5 Tasks">
                                        <i className="mdi mdi-format-align-left"></i>
                                        {
                                          lead.notes_count > 0 &&
                                          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.5rem' }}>
                                            {lead.pending_tasks_count}<span className="visually-hidden">
                                              Tareas pendientes
                                            </span>
                                          </span>
                                        }
                                      </span>
                                    </Tippy>
                                  </li>
                                  <li className="list-inline-item">
                                    <Tippy content={`${lead.notes_count} registros de actividad`}>
                                      <span style={{ position: 'relative' }}>
                                        <i className="mdi mdi-comment-outline"></i>
                                        {
                                          lead.notes_count > 0 &&
                                          <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.5rem' }}>
                                            {lead.notes_count}<span className="visually-hidden">
                                              Notas de {lead.contact_name}
                                            </span>
                                          </span>
                                        }
                                      </span>
                                    </Tippy>
                                  </li>
                                  <li className="list-inline-item">
                                    <Tippy content={`Eliminar lead`}>
                                      <b style={{ cursor: 'pointer' }} onClick={() => onDeleteClicked(lead)}>
                                        <i className="mdi mdi-trash-can-outline text-danger"></i>
                                      </b>
                                    </Tippy>
                                  </li>
                                </ul>
                              </div>
                            </div>
                          </li>
                        })
                      }
                    </ul>
                  </div>
                </div>

              </div>)
            })
          }

        </div>)
    }
    <Modal modalRef={modalRef} title='Detalles del lead' btnSubmitText='Guardar' size='full-width' bodyClass='p-3 bg-light' isStatic onSubmit={(e) => e.preventDefault()}>
      <div className="row">
        <div className="col-lg-3 col-md-4 col-sm-6 col-xs-12">
          <div className="d-flex mb-3">
            <img className="flex-shrink-0 me-3 rounded-circle avatar-md" alt={leadLoaded?.contact_name}
              src={`//${APP_DOMAIN}/api/profile/null`} />
            <div className="flex-grow-1">
              <h4 className="media-heading mt-0">{leadLoaded?.contact_name}</h4>
              <span className="badge bg-primary me-1">{leadLoaded?.contact_position || 'Trabajador'}</span> <small className='text-muted'>desde <b>{leadLoaded?.origin}</b></small>
            </div>
          </div>
          <div className="btn-group mb-0">
            <button className="btn btn-light btn-sm dropdown-toggle" type="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false" style={{ color: '#ffffff', backgroundColor: leadLoaded?.manage_status?.color || '#6c757d' }}>
              {leadLoaded?.manage_status?.name || 'Sin estado'} <i className="mdi mdi-chevron-down"></i>
            </button>
            <div className="dropdown-menu">
              {manageStatuses.map((status, i) => {
                return <span key={`status-${i}`} className="dropdown-item" style={{ cursor: 'pointer' }} onClick={() => onManageStatusChange(leadLoaded, status)}>{status.name}</span>
              })}
            </div>
          </div>
          <hr />
          <h4>Datos del contacto</h4>
          <h5 className="font-600 mb-0">Correo electronico</h5>
          <p className='mb-2 text-truncate'> {leadLoaded?.contact_email} </p>
          <h5 className="font-600 mb-0">Tefono / Celular</h5>
          <p className='mb-2'> {leadLoaded?.contact_phone} </p>
          <h5 className="font-600 mb-0">Mensaje</h5>
          <p className='mb-2'> {leadLoaded?.message} </p>
          <h5 className="font-600 mb-0">Fecha de registro</h5>
          <p className='mb-2'>
            {moment(leadLoaded?.created_at).format('LL')}<br />
            <small className="text-muted">{moment(leadLoaded?.created_at).format('LTS')}</small>
          </p>
          <hr />
          <h4>Datos de la empresa</h4>

          <h5 className="font-600 mb-0">Nombre comercial</h5>
          <p className='mb-2'> {leadLoaded?.tradename ?? <i className='text-muted'>No especifica</i>} </p>

          <h5 className="font-600 mb-0">RUC</h5>
          <p className='mb-2'> {leadLoaded?.ruc ?? <i className='text-muted'>No especifica</i>} </p>

          <h5 className="font-600 mb-0">N° trabajadores</h5>
          <p className='mb-2'> {leadLoaded?.workers ?? <i className='text-muted'>No especifica</i>} </p>

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
                    <a href={`#note-type-${type.id}`} data-bs-toggle="tab" aria-expanded="false" className="nav-link">
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
                    return <ClientNotesCard key={`note-${i}`} {...note} onTaskChange={onTaskStatusChange} />
                  })
                }

              </div>
              {
                noteTypes.sort((a, b) => a.order - b.order).map((type, i) => {
                  return <div key={`tab-note-type-${i}`} className='tab-pane' id={`note-type-${type.id}`}>
                    <h4 className='header-title mb-2'>Lista de {type.name}</h4>
                    <div className="row">
                      {
                        type.id == '37b1e8e2-04c4-4246-a8c9-838baa7f8187' && <>
                          <div className="col-md-6 col-sm-12 form-group mb-2">
                            <label className='mb-1' htmlFor="">Asunto</label>
                            <input type="text" className='form-control' />
                          </div>
                          <div className="col-md-6 col-sm-12 form-group mb-2">
                            <label className='mb-1' htmlFor="">Para</label>
                            <input type="text" className='form-control' />
                          </div>
                          <div className="col-md-6 col-sm-12 form-group mb-2">
                            <label className='mb-1' htmlFor="">CC</label>
                            <input type="text" className='form-control' />
                          </div>
                          <div className="col-md-6 col-sm-12 form-group mb-2">
                            <label className='mb-1' htmlFor="">CCO</label>
                            <input type="text" className='form-control' />
                          </div>
                        </>
                      }
                      {
                        type.id == 'e20c7891-1ef8-4388-8150-4c1028cc4525' &&
                        <>
                          <div className="col-lg-7 col-md-12 form-group mb-2">
                            <label className='mb-1' htmlFor="task-title">Titulo de la tarea</label>
                            <input ref={taskTitleRef} id='task-title' type="text" className='form-control' />
                          </div>
                          <div className="col-lg-5 col-md-12 form-group mb-2">
                            <label className='mb-1' htmlFor="task-ends-at">Fecha finalización <b className='text-danger'>*</b></label>
                            <input ref={taskEndsAtRef} id='task-ends-at' type="date" className='form-control' />
                          </div>
                        </>
                      }
                      <div className="col-12 mb-2">
                        <label className='mb-1' htmlFor="">Contenido</label>
                        <div ref={typeRefs[type.id]} id={`editor-${type.id}`} style={{ height: '120px' }}> </div>
                      </div>
                      <div className="col-12">
                        <button className='btn btn-sm btn-success' type='button' value={type.id} onClick={onSaveNote}>{type.id == '37b1e8e2-04c4-4246-a8c9-838baa7f8187' ? 'Guardar y enviar' : 'Guardar'}</button>
                      </div>
                    </div>
                    <hr />
                    {
                      notes.filter(x => x.note_type_id == type.id).sort((a, b) => b.created_at > a.created_at ? 1 : -1).map((note, i) => {
                        return <ClientNotesCard key={`note-${i}`} {...note} />
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
                    return <TaskCard key={`task-${i}`} {...task} onChange={onTaskStatusChange} />
                  })
                  : <i className='text-muted'>- No hay tareas pendientes -</i>
              }
            </div>
          </div>
        </div>
      </div>
    </Modal>

    <Modal modalRef={newLeadModalRef} title='Nuevo lead' btnSubmitText='Guardar' onSubmit={onModalSubmit}>
      <div className="row mb-0">
        <input ref={idRef} type="hidden" />
        <InputFormGroup eRef={contactNameRef} label='Nombre completo' required />
        <InputFormGroup eRef={contactEmailRef} label='Correo electronico' type="email" col='col-md-6' />
        <InputFormGroup eRef={contactPhoneRef} label='Telefono' type="tel" col='col-md-6' required />
        <InputFormGroup eRef={nameRef} label='Empresa / Marca' col='col-md-6' required />
        <InputFormGroup eRef={webUrlRef} label='Link de WEB' col='col-md-6' />
        <TextareaFormGroup eRef={messageRef} label='Mensaje' placeholder='Ingresa tu mensaje' rows={4} required />
      </div>
    </Modal>

  </>
  )
};

CreateReactScript((el, properties) => {
  createRoot(el).render(
    <Adminto {...properties} title='Leads'>
      <Leads {...properties} />
    </Adminto>
  );
})