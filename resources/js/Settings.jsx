
import React, { useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import ReactAppend from './Utils/ReactAppend.jsx'
import SetQuillValue from './Utils/SetQuillValue.jsx'
import SettingsRest from './actions/SettingsRest.js'
import Adminto from './components/Adminto.jsx'
import Modal from './components/Modal.jsx'
import Table from './components/Table.jsx'
import InputFormGroup from './components/form/InputFormGroup.jsx'
import QuillFormGroup from './components/form/QuillFormGroup.jsx'
import TippyButton from './components/form/TippyButton.jsx'

const Settings = ({ can }) => {
  const gridRef = useRef()
  const modalRef = useRef()

  // Form elements ref
  const idRef = useRef()
  // const typeRef = useRef()
  const nameRef = useRef()
  const valueRef = useRef()
  const descriptionRef = useRef()

  const [isEditing, setIsEditing] = useState(false)

  const onModalOpen = (data) => {
    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    idRef.current.value = data?.id || null
    // SetSelectValue(typeRef.current, data?.table?.id, data?.table?.name)
    nameRef.current.value = data?.name || null
    SetQuillValue(valueRef.editor, data?.value || null)
    descriptionRef.current.value = data?.description || null

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      // type: typeRef.current.value,
      name: nameRef.current.value,
      value: valueRef.current.value,
      description: descriptionRef.current.value,
    }

    const result = await SettingsRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onStatusChange = async ({ id, status }) => {
    const result = await SettingsRest.status({ id, status })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (id) => {
    const result = await SettingsRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const defaultRows = [
    { name: 'whatsapp-new-lead-notification-message' },
    { name: 'whatsapp-new-lead-notification-waid' },
    { name: 'whatsapp-new-lead-notification-message-client' },
  ]

  return (<>
    <Table gridRef={gridRef} title='Configuracion' defaultRows={defaultRows} rest={SettingsRest}
      toolBar={(container) => {
        container.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'refresh',
            hint: 'Refrescar tabla',
            onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
          }
        });
        // container.unshift({
        //   widget: 'dxButton', location: 'after',
        //   options: {
        //     icon: 'plus',
        //     hint: 'Nuevo registro',
        //     onClick: () => onModalOpen()
        //   }
        // });
      }}
      columns={[
        {
          dataField: 'id',
          caption: 'ID',
          visible: false
        },
        {
          dataField: 'name',
          caption: 'Nombre de configuracion'
        },
        {
          dataField: 'description',
          caption: 'Descripcion',
          cellTemplate: (container, { value }) => {
            if (!value) ReactAppend(container, <i className='text-muted'>- Sin descripcion -</i>)
            else ReactAppend(container, value)
          }
        },
        {
          caption: 'Acciones',
          cellTemplate: (container, { data }) => {
            can('settings', 'root', 'all', 'update') && ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-primary' title='Editar' onClick={() => onModalOpen(data)}>
              <i className='fa fa-pen'></i>
            </TippyButton>)
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]} />
    <Modal modalRef={modalRef} title={isEditing ? 'Editar configuracion' : 'Agregar configuracion'} onSubmit={onModalSubmit} size='md'>
      <div className='row' id='settings-crud-container'>
        <input ref={idRef} type='hidden' />
        <InputFormGroup eRef={nameRef} label='Alias' col='col-12' required disabled readonly />
        <InputFormGroup eRef={descriptionRef} label='Descripcion' col='col-12' />
        <QuillFormGroup eRef={valueRef} label='Valor' col='col-12' theme='bubble' required />
      </div>
    </Modal>
  </>
  )
};

CreateReactScript((el, properties) => {
  if (!properties.can('settings', 'root', 'all', 'list')) return location.href = '/';
  createRoot(el).render(
    <Adminto {...properties} title='Constantes de configuracion'>
      <Settings {...properties} />
    </Adminto>
  );
})