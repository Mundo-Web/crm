
import React, { useRef, useState } from 'react'
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
import ProcessesRest from './actions/ProcessesRest.js'
import DxButton from './components/dx/DxButton.jsx'
import Swal from 'sweetalert2'

const processesRest = new ProcessesRest();

const Processes = ({ can }) => {

  const gridRef = useRef()
  const modalRef = useRef()

  // Form elements ref
  const idRef = useRef()
  const nameRef = useRef()
  const descriptionRef = useRef()

  const [isEditing, setIsEditing] = useState(false)

  const onModalOpen = (data) => {
    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    idRef.current.value = data?.id || null
    nameRef.current.value = data?.name || null
    descriptionRef.current.value = data?.description || null

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      name: nameRef.current.value,
      description: descriptionRef.current.value
    }

    const result = await processesRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar proceso',
      text: '¿Está seguro de eliminar este proceso?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, eliminar!',
      cancelButtonText: 'Cancelar'
    })

    if (!isConfirmed) return
    const result = await processesRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  return (<>
    <Table gridRef={gridRef} title='Procesos' rest={processesRest}
      toolBar={(container) => {
        container.unshift(DxPanelButton({
          className: 'btn btn-xs btn-soft-dark',
          text: 'Actualizar',
          title: 'Refrescar tabla',
          icon: 'fas fa-undo-alt',
          onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
        }))
        can('processes', 'all', 'create') && container.unshift(DxPanelButton({
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
          caption: 'Proceso'
        },
        {
          dataField: 'description',
          caption: 'Descripcion'
        },
        {
          caption: 'Acciones',
          cellTemplate: (container, { data }) => {
            can('processes', 'root', 'all', 'update') && container.append(DxButton({
              className: 'btn btn-xs btn-soft-primary',
              title: 'Editar',
              icon: 'fa fa-pen',
              onClick: () => onModalOpen(data)
            }))
            can('processes', 'root', 'all', 'delete') && container.append(DxButton({
              className: 'btn btn-xs btn-soft-danger',
              title: 'Eliminar',
              icon: 'fa fa-trash-alt',
              onClick: () => onDeleteClicked(data.id)
            }))
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]} />
    <Modal modalRef={modalRef} title={isEditing ? 'Editar proceso' : 'Agregar proceso'} onSubmit={onModalSubmit}>
      <div className='row'>
        <input ref={idRef} type='hidden' />
        <InputFormGroup eRef={nameRef} label='Proceso' col='col-12' required />
        <TextareaFormGroup eRef={descriptionRef} label='Descripción' col='col-12' />
      </div>
    </Modal>
  </>
  )
};

CreateReactScript((el, properties) => {
  if (!properties.can('processes', 'root', 'all', 'list')) return location.href = '/';
  createRoot(el).render(
    <Adminto {...properties} title='Procesos'>
      <Processes {...properties} />
    </Adminto>
  );
})