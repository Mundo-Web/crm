
import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import ReactAppend from './Utils/ReactAppend.jsx'
import Adminto from './components/Adminto.jsx'
import Modal from './components/Modal.jsx'
import Table from './components/Table.jsx'
import InputFormGroup from './components/form/InputFormGroup.jsx'
import TextareaFormGroup from './components/form/TextareaFormGroup.jsx'
import TippyButton from './components/form/TippyButton.jsx'
import DxPanelButton from './components/dx/DxPanelButton.jsx'
import DefaultMessagesRest from './actions/DefaultMessagesRest.js'
import Swal from 'sweetalert2'
import SelectFormGroup from './components/form/SelectFormGroup.jsx'
import { renderToString } from 'react-dom/server'
import QuillFormGroup from './components/form/QuillFormGroup';
import RepositoryDropzone from './Reutilizables/Repository/RepositoryDropzone.jsx'

const defaultMessagesRest = new DefaultMessagesRest()

const DefaultMessages = ({ title }) => {
  const gridRef = useRef()
  const modalRef = useRef()
  const repositoryModalRef = useRef()

  // Form elements ref
  const idRef = useRef()
  const nameRef = useRef()
  const descriptionRef = useRef()
  const typeRef = useRef()
  const bodyRef = useRef() // For email rich text editor
  const [isEditing, setIsEditing] = useState(false)
  const [messageType, setMessageType] = useState('whatsapp')

  // Add new state and ref
  const fileRef = useRef()
  const [attachments, setAttachments] = useState([])

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

    if (data?.type === 'email') {
      bodyRef.current.value = data?.description || ''
      bodyRef.editor.root.innerHTML = data?.description || ''
    } else {
      descriptionRef.current.value = data?.description || null
    }

    setAttachments(data?.attachments || [])
    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value,
      name: nameRef.current.value,
      type: typeRef.current.value,
      description: messageType === 'email' ? bodyRef.current.value : descriptionRef.current.value,
      attachments
    }

    const result = await defaultMessagesRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  // In the Modal JSX, add after QuillFormGroup:

  const onTypeChange = (e) => {
    const type = $(typeRef.current).val()
    setMessageType(type)
    // Clear message content when switching types
    if (type === 'email') {
      descriptionRef.current.value = ''
      bodyRef.editor.root.innerHTML = ''
    } else {
      bodyRef.current.value = ''
      descriptionRef.current.value = ''
    }
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

  return (<>
    <Table gridRef={gridRef} title={title} rest={defaultMessagesRest}
      toolBar={(container) => {
        container.unshift(DxPanelButton({
          className: 'btn btn-xs btn-soft-dark',
          text: 'Actualizar',
          title: 'Refrescar tabla',
          icon: 'fas fa-undo-alt',
          onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
        }))
        container.unshift(DxPanelButton({
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
          caption: 'Descripcion',
          width: '60%',
          cellTemplate: (container, { value, data }) => {
            if (!value) container.html(renderToString(<i className='text-muted'>- Sin descripcion -</i>))
            else if (data.type === 'email') {
              container.text($(`<div>${value}</div>`).text().trim())
            } else {
              container.text(value)
            }
          }
        },
        {
          caption: 'Acciones',
          width: '120px',
          cellTemplate: (container, { data }) => {
            container.attr('style', 'display: flex; gap: 4px; overflow: unset')
            ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-primary' title='Editar' onClick={() => onModalOpen(data)}>
              <i className='fa fa-pen'></i>
            </TippyButton>)

            ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-danger' title='Eliminar' onClick={() => onDeleteClicked(data.id)}>
              <i className='fa fa-trash-alt'></i>
            </TippyButton>)
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]} />
    <Modal modalRef={modalRef} title={isEditing ? 'Editar mensaje predeterminado' : 'Agregar mensaje predeterminado'} onSubmit={onModalSubmit} size={messageType == 'email' ? 'lg' : 'md'}>
      <div className='row' id='default-messages-container'>
        <input ref={idRef} type='hidden' />
        <SelectFormGroup
          eRef={typeRef}
          label='Tipo mensaje'
          dropdownParent='#default-messages-container'
          minimumResultsForSearch={-1}
          onChange={onTypeChange}
          disabled={isEditing}
          required>
          <option value="whatsapp">WhatsApp</option>
          <option value="email">Email</option>
        </SelectFormGroup>
        <InputFormGroup eRef={nameRef} label='Alias' col='col-12' required />
        <div hidden={messageType === 'email'}>
          <TextareaFormGroup eRef={descriptionRef} label='Mensaje' col='col-12' />
        </div>
        <div hidden={messageType === 'whatsapp'}>
          <QuillFormGroup eRef={bodyRef} label='Mensaje' col='col-12' />
        </div>
        {/* File attachments section - Common for both types */}
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

          {/* Attachments preview */}
          {attachments.length > 0 && (
            <div className="border rounded p-2 mb-3">
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
        selectable />
    </Modal>
  </>
  )
};

CreateReactScript((el, properties) => {
  properties.title = 'Mensajes Predeterminados'
  createRoot(el).render(
    <Adminto {...properties}>
      <DefaultMessages {...properties} />
    </Adminto>
  );
})