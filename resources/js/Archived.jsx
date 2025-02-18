
import Tippy from '@tippyjs/react'
import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import ProjectStatusDropdown from './Reutilizables/Projects/ProjectStatusDropdown.jsx'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import ReactAppend from './Utils/ReactAppend.jsx'
import ClientsRest from './actions/ClientsRest.js'
import ProjectsRest from './actions/ProjectsRest.js'
import Adminto from './components/Adminto.jsx'
import Modal from './components/Modal.jsx'
import Table from './components/Table.jsx'
import DxBox from './components/dx/DxBox.jsx'
import Assigneds from './Reutilizables/Projects/Assigneds.jsx'
import Swal from 'sweetalert2'
import ArchivedRest from './actions/ArchivedRest.js'
import Global from './Utils/Global.js'
import DxPanelButton from './components/dx/DxPanelButton.jsx'
import TaskCard from './Reutilizables/Tasks/TaskCard.jsx'
import ClientNotesCard from './Reutilizables/ClientNotes/ClientNotesCard.jsx'
import ClientNotesRest from './actions/ClientNotesRest.js'
import ProductsByClients from './actions/ProductsByClientsRest.js'
import { renderToString } from 'react-dom/server'
import Number2Currency from './Utils/Number2Currency.jsx'
import TippyButton from './components/form/TippyButton.jsx'

const archivedRest = new ArchivedRest()
const clientsRest = new ClientsRest()
const clientNotesRest = new ClientNotesRest();
const productsByClients = new ProductsByClients()

const Archived = ({ projectStatuses, finishedProjectStatus, archived, can, session, noteTypes }) => {
  const gridRef = useRef()
  const detailModalRef = useRef()

  const [detailLoaded, setDetailLoaded] = useState(null)
  const [notes, setNotes] = useState([]);
  const [clientProducts, setClientProducts] = useState([])

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
      history.pushState(null, null, '/archived')
    });
    if (!archived) return

    clientsRest.get(archived).then(data => {
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
            container.html(renderToString(<b>{data.contact_name}</b>))
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
    />

    <Modal modalRef={detailModalRef} title='Detalles del archivado' btnSubmitText='Guardar' size='full-width' bodyClass='p-3 bg-light' isStatic onSubmit={(e) => e.preventDefault()} hideFooter>
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