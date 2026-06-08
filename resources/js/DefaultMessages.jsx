
import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import ReactAppend from './Utils/ReactAppend.jsx'
import Adminto from './components/Adminto.jsx'
import Modal from './components/Modal.jsx'
import Table from './components/Table.jsx'
import InputFormGroup from './components/form/InputFormGroup.jsx'
import TippyButton from './components/form/TippyButton.jsx'
import DxPanelButton from './components/dx/DxPanelButton.jsx'
import DefaultMessagesRest from './actions/DefaultMessagesRest.js'
import WhatsAppRest from './actions/WhatsAppRest.js'
import Swal from 'sweetalert2'
import SelectFormGroup from './components/form/SelectFormGroup.jsx'
import { renderToString } from 'react-dom/server'
import QuillFormGroup from './components/form/QuillFormGroup';
import RepositoryDropzone from './Reutilizables/Repository/RepositoryDropzone.jsx'

const defaultMessagesRest = new DefaultMessagesRest()
const whatsAppRest = new WhatsAppRest()

const DefaultMessages = ({ title, clientFields, can }) => {
  const gridRef = useRef()
  const modalRef = useRef()
  const repositoryModalRef = useRef()

  // Form elements ref
  const idRef = useRef()
  const nameRef = useRef()
  const typeRef = useRef()
  const bodyRef = useRef()
  const [isEditing, setIsEditing] = useState(false)
  const [messageType, setMessageType] = useState('whatsapp')

  // Add new state and ref
  const fileRef = useRef()
  const [attachments, setAttachments] = useState([])

  const [activeTab, setActiveTab] = useState('local')

  // Meta templates states
  const [metaTemplates, setMetaTemplates] = useState([])
  const [isMetaTemplatesLoading, setIsMetaTemplatesLoading] = useState(false)
  const metaModalRef = useRef()
  const metaNameRef = useRef()
  const metaCategoryRef = useRef()
  const metaLanguageRef = useRef()
  const metaTextRef = useRef()
  const [isCreatingMetaTemplate, setIsCreatingMetaTemplate] = useState(false)

  const loadMetaTemplates = async () => {
    setIsMetaTemplatesLoading(true)
    const data = await whatsAppRest.getTemplates()
    setMetaTemplates(data || [])
    setIsMetaTemplatesLoading(false)
  }

  useEffect(() => {
    if (activeTab === 'meta') {
      loadMetaTemplates()
    }
  }, [activeTab])

  const onMetaDeleteClicked = async (name) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar plantilla de Meta',
      text: `¿Desea eliminar la plantilla "${name}" en Meta? Esta acción no se puede deshacer y afectará a las campañas activas.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    })
    if (!isConfirmed) return

    setIsMetaTemplatesLoading(true)
    const result = await whatsAppRest.deleteTemplate(name)
    setIsMetaTemplatesLoading(false)

    if (result) {
      Swal.fire('Eliminado', 'La plantilla ha sido eliminada con éxito en Meta.', 'success')
      loadMetaTemplates()
    }
  }

  const onMetaModalSubmit = async (e) => {
    e.preventDefault()
    setIsCreatingMetaTemplate(true)

    const name = metaNameRef.current.value
    const category = metaCategoryRef.current.value
    const language = metaLanguageRef.current.value
    const text = metaTextRef.current.value

    const result = await whatsAppRest.createTemplate(name, category, language, text)
    setIsCreatingMetaTemplate(false)

    if (result) {
      $(metaModalRef.current).modal('hide')
      Swal.fire({
        title: 'Plantilla enviada',
        text: 'La plantilla ha sido enviada a Meta para su revisión. Normalmente se aprueba en unos minutos.',
        icon: 'success'
      })
      loadMetaTemplates()
    }
  }

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return <span className="badge bg-success"><i className="mdi mdi-check-circle-outline me-1"></i>Aprobada</span>
      case 'PENDING':
        return <span className="badge bg-warning text-dark"><i className="mdi mdi-clock-outline me-1"></i>Pendiente</span>
      case 'REJECTED':
        return <span className="badge bg-danger"><i className="mdi mdi-alert-circle-outline me-1"></i>Rechazada</span>
      default:
        return <span className="badge bg-secondary">{status}</span>
    }
  }

  const getTemplateBodyText = (tpl) => {
    const bodyComponent = tpl.components?.find(c => c.type === 'BODY')
    return bodyComponent?.text || ''
  }

  const onFileChange = (e) => {
    const files = Array.from(e.target.files)
    if (messageType === 'whatsapp') {
      // For WhatsApp, only keep the last file
      setAttachments([files[0]])
    } else {
      // For email, allow multiple files
      setAttachments(prev => [...prev, ...files])
    }
    fileRef.current.value = null
  }

  // Add after QuillFormGroup in the Modal:

  const removeAttachment = (fileId) => {
    setAttachments(prev => prev.filter(x => x.id !== fileId))
  }

  const onModalOpen = (data) => {
    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    idRef.current.value = data?.id || null
    nameRef.current.value = data?.name || null
    $(typeRef.current).val(data?.type || 'whatsapp').trigger('change.select2')
    setMessageType(data?.type || 'whatsapp')

    bodyRef.current.value = data?.description || ''
    bodyRef.editor.root.innerHTML = data?.description || ''

    setAttachments(data?.attachments || [])
    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value,
      name: nameRef.current.value,
      type: typeRef.current.value,
      description: bodyRef.current.value,
      attachments
    }

    const result = await defaultMessagesRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onStatusChange = async ({ id, status }) => {
    const result = await defaultMessagesRest.status({ id, status })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar registro',
      text: '¿Desea eliminar el registro?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    })
    if (!isConfirmed) return
    const result = await defaultMessagesRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  useEffect(() => {
    if (messageType === 'whatsapp' && attachments.length > 1) {
      setAttachments([attachments[0]])
    }
  }, [messageType])

  return (
    <>
      <div className="card">
        <div className="card-header pb-0 border-bottom-0">
          <ul className="nav nav-tabs nav-bordered" role="tablist">
            <li className="nav-item" role="presentation">
              <a className={`nav-link ${activeTab === 'local' ? 'active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setActiveTab('local')}>
                Respuestas Predeterminadas (Locales)
              </a>
            </li>
            <li className="nav-item" role="presentation">
              <a className={`nav-link ${activeTab === 'meta' ? 'active' : ''}`} style={{ cursor: 'pointer' }} onClick={() => setActiveTab('meta')}>
                Plantillas de Meta (WhatsApp)
              </a>
            </li>
          </ul>
        </div>
        <div className="card-body pt-2">
          {activeTab === 'local' ? (
            <Table
              gridRef={gridRef}
              title={null}
              rest={defaultMessagesRest}
              toolBar={(container) => {
                container.unshift(DxPanelButton({
                  className: 'btn btn-xs btn-soft-dark',
                  text: 'Actualizar',
                  title: 'Refrescar tabla',
                  icon: 'fas fa-undo-alt',
                  onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
                }))
                can('default-messages', 'create') && container.unshift(DxPanelButton({
                  className: 'btn btn-xs btn-soft-primary',
                  text: 'Nuevo',
                  title: 'Agregar registro',
                  icon: 'fa fa-plus',
                  onClick: () => onModalOpen()
                }))
              }}
              columns={[
                {
                  dataField: 'name',
                  caption: 'Alias'
                },
                {
                  dataField: 'type',
                  caption: 'Tipo',
                  width: '100px',
                  cellTemplate: (container, { value }) => {
                    container.html(renderToString(
                      <span className={`badge bg-${value === 'email' ? 'info' : 'success'}`}>
                        {value === 'email' ? <i className='mdi mdi-email'></i> : <i className='mdi mdi-whatsapp'></i>}
                        <span className='ms-1'>{value === 'email' ? 'Email' : 'WhatsApp'}</span>
                      </span>
                    ))
                  }
                },
                {
                  dataField: 'description',
                  caption: 'Contenido',
                  width: '60%',
                  cellTemplate: (container, { value, data }) => {
                    if (!value) container.html(renderToString(<i className='text-muted'>- Sin descripcion -</i>))
                    container.text($(`<div>${value}</div>`).text().trim())
                  }
                },
                {
                  caption: 'Acciones',
                  width: '120px',
                  cellTemplate: (container, { data }) => {
                    container.attr('style', 'display: flex; gap: 4px; overflow: unset')
                    can('default-messages', 'update') && ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-primary' title='Editar' onClick={() => onModalOpen(data)}>
                      <i className='fa fa-pen'></i>
                    </TippyButton>)

                    can('default-messages', 'delete') && ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-danger' title='Eliminar' onClick={() => onDeleteClicked(data.id)}>
                      <i className='fa fa-trash-alt'></i>
                    </TippyButton>)
                  },
                  allowFiltering: false,
                  allowExporting: false
                }
              ]}
            />
          ) : (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="my-0">Plantillas Oficiales de WhatsApp (Meta)</h5>
                <div className="d-flex gap-2">
                  <button className="btn btn-xs btn-soft-dark" onClick={loadMetaTemplates} disabled={isMetaTemplatesLoading}>
                    <i className="fas fa-undo-alt me-1"></i> Actualizar
                  </button>
                  <button className="btn btn-xs btn-soft-primary" onClick={() => {
                    metaNameRef.current.value = ''
                    metaTextRef.current.value = ''
                    $(metaModalRef.current).modal('show')
                  }}>
                    <i className="fa fa-plus me-1"></i> Nueva Plantilla Meta
                  </button>
                </div>
              </div>

              {isMetaTemplatesLoading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                  </div>
                  <div className="mt-2 text-muted">Consultando plantillas oficiales de Meta...</div>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-bordered table-centered mb-0 font-13">
                    <thead className="table-light">
                      <tr>
                        <th>Nombre de Plantilla</th>
                        <th>Categoría</th>
                        <th>Idioma</th>
                        <th>Estado</th>
                        <th style={{ width: '45%' }}>Cuerpo de Mensaje</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {metaTemplates.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center text-muted py-4">No se encontraron plantillas de Meta configuradas o activas</td>
                        </tr>
                      ) : (
                        metaTemplates.map((tpl, i) => (
                          <tr key={i}>
                            <td className="fw-bold">{tpl.name}</td>
                            <td><span className="badge bg-soft-info text-info">{tpl.category}</span></td>
                            <td><span className="badge bg-light text-dark">{tpl.language}</span></td>
                            <td>{getStatusBadge(tpl.status)}</td>
                            <td className="text-wrap" style={{ whiteSpace: 'pre-wrap' }}>{getTemplateBodyText(tpl)}</td>
                            <td>
                              <button className="btn btn-xs btn-soft-danger" onClick={() => onMetaDeleteClicked(tpl.name)}>
                                <i className="fa fa-trash-alt"></i>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <Modal modalRef={modalRef} title={isEditing ? 'Editar mensaje predeterminado' : 'Agregar mensaje predeterminado'} onSubmit={onModalSubmit} size={messageType == 'email' ? 'lg' : 'md'}>
        <div className='row' id='default-messages-container'>
          <input ref={idRef} type='hidden' />
          <SelectFormGroup
            eRef={typeRef}
            label='Tipo mensaje'
            dropdownParent='#default-messages-container'
            minimumResultsForSearch={-1}
            onChange={(e) => setMessageType(e.target.value)}
            disabled={isEditing}
            required>
            <option value="whatsapp">WhatsApp</option>
            <option value="email">Email</option>
          </SelectFormGroup>
          <InputFormGroup eRef={nameRef} label={messageType === 'whatsapp' ? 'Alias' : 'Asunto'} col='col-12' required />

          <QuillFormGroup eRef={bodyRef} label='Mensaje' col='col-12' mention
            mentionDenotationChars={['#']}
            mentionSource={(searchTerm, renderList, denotationChar) => {
              renderList(clientFields
                .filter(x => x.name.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(x => ({
                  id: x.field,
                  label: x.field,
                  value: `${x.name}`
                })))
            }} information="Nota: puedes agregar variables usando # (Ej. #Nombre)" />

          <div className="col-12">
            <input
              ref={fileRef}
              type="file"
              className="d-none"
              multiple={messageType === 'email'}
              onChange={onFileChange}
            />
            <div className="d-flex align-items-center gap-2 mb-2">
              <button className="btn btn-sm btn-soft-primary mb-0" style={{ cursor: 'pointer' }} onClick={() => $(repositoryModalRef.current).modal('show')} type='button'>
                <i className="mdi mdi-paperclip me-1"></i>
                Adjuntar {messageType === 'whatsapp' ? 'archivo' : 'archivos'}
              </button>
              {messageType === 'whatsapp' && attachments.length > 0 && (
                <small className="text-muted">
                  Solo se permite un archivo para WhatsApp
                </small>
              )}
            </div>

            {attachments.length > 0 && (
              <div className="border rounded p-2">
                <div className="d-flex align-items-center mb-2">
                  <i className="mdi mdi-paperclip me-1"></i>
                  <small className="text-muted">
                    {messageType === 'whatsapp' ? 'Archivo adjunto' : `Archivos adjuntos (${attachments.length})`}
                  </small>
                </div>
                <div className="d-flex flex-wrap gap-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="border rounded p-1 d-flex align-items-center gap-2" style={{ fontSize: '0.8rem' }}>
                      <i className="mdi mdi-file"></i>
                      <span>{file.name}</span>
                      <button
                        type="button"
                        className="btn btn-xs btn-soft-danger py-0 px-1"
                        onClick={() => removeAttachment(file.id)}
                      >
                        <i className="mdi mdi-close"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Modal>

      <Modal modalRef={repositoryModalRef} title='Repositorio' size='full-width' hideFooter zIndex={1060}>
        <RepositoryDropzone height='calc(100vh - 300px)'
          multiple={messageType !== 'whatsapp'}
          selectedFiles={attachments}
          setSelectedFiles={setAttachments}
          selectable can={can}/>
      </Modal>

      <Modal modalRef={metaModalRef} title="Nueva Plantilla de WhatsApp (Meta)" onSubmit={onMetaModalSubmit} loading={isCreatingMetaTemplate}>
        <div className='row' id='meta-template-container'>
          <div className="col-12 mb-3">
            <label className="form-label fw-bold">Nombre de la plantilla</label>
            <input
              ref={metaNameRef}
              type="text"
              className="form-control"
              placeholder="ej: mensaje_bienvenida (solo minúsculas, números y guión bajo)"
              pattern="[a-z0-9_]+"
              title="Solo letras minúsculas, números y guiones bajos"
              required
            />
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label fw-bold">Categoría</label>
            <select ref={metaCategoryRef} className="form-select" required>
              <option value="UTILITY">Utilidad (UTILITY)</option>
              <option value="MARKETING">Marketing (MARKETING)</option>
            </select>
          </div>

          <div className="col-md-6 mb-3">
            <label className="form-label fw-bold">Idioma</label>
            <select ref={metaLanguageRef} className="form-select" required>
              <option value="es">Español (es)</option>
              <option value="en">Inglés (en)</option>
              <option value="pt_BR">Portugués (pt_BR)</option>
            </select>
          </div>

          <div className="col-12 mb-3">
            <label className="form-label fw-bold">Texto del mensaje (Cuerpo)</label>
            <textarea
              ref={metaTextRef}
              className="form-control"
              rows={5}
              placeholder="Escribe el mensaje de la plantilla. Utiliza {{1}}, {{2}}, etc. para definir variables dinámicas."
              required
            />
            <div className="small text-muted mt-1">
              Ejemplo: <em>Hola {"{{1}}"}, tu código de confirmación de {"{{2}}"} es {"{{3}}"}.</em>
            </div>
          </div>
        </div>
      </Modal>
    </>
  )
};

CreateReactScript((el, properties) => {
  properties.title = 'Mensajes Predeterminados'
  if (!properties.can('default-messages', 'list')) return location.href = '/';
  createRoot(el).render(
    <Adminto {...properties}>
      <DefaultMessages {...properties} />
    </Adminto>
  );
})