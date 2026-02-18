import React, { useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import ReactAppend from './Utils/ReactAppend.jsx'
import Adminto from './components/Adminto.jsx'
import Modal from './components/Modal.jsx'
import Table from './components/Table.jsx'
import InputFormGroup from './components/form/InputFormGroup.jsx'
import TextareaFormGroup from './components/form/TextareaFormGroup.jsx'
import SelectFormGroup from './components/form/SelectFormGroup.jsx'
import TippyButton from './components/form/TippyButton.jsx'
import DxPanelButton from './components/dx/DxPanelButton.jsx'
import CampaignsRest from './actions/CampaignsRest.js'
import DxButton from './components/dx/DxButton.jsx'
import Swal from 'sweetalert2'
import sourceOptions from './Reutilizables/Campaigns/socials.json'

const campaignsRest = new CampaignsRest();

const Campaigns = ({ can }) => {

  const gridRef = useRef()
  const modalRef = useRef()

  // Form elements ref
  const idRef = useRef()
  const codeRef = useRef()
  const sourceRef = useRef()
  const titleRef = useRef()
  const linkRef = useRef()
  const notesRef = useRef()

  const [isEditing, setIsEditing] = useState(false)

  const onModalOpen = (data) => {
    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    idRef.current.value = data?.id || null
    codeRef.current.value = data?.code || null
    $(sourceRef.current).val(data?.source || null).trigger('change')
    titleRef.current.value = data?.title || null
    linkRef.current.value = data?.link || null
    notesRef.current.value = data?.notes || null

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      code: codeRef.current.value,
      source: $(sourceRef.current).val(),
      title: titleRef.current.value,
      link: linkRef.current.value,
      notes: notesRef.current.value
    }

    const result = await campaignsRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar campaña',
      text: '¿Está seguro de eliminar esta campaña?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, eliminar!',
      cancelButtonText: 'Cancelar'
    })

    if (!isConfirmed) return
    const result = await campaignsRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  return (<>
    <Table gridRef={gridRef} title='Campaña' rest={campaignsRest}
      toolBar={(container) => {
        container.unshift(DxPanelButton({
          className: 'btn btn-xs btn-soft-dark',
          text: 'Actualizar',
          title: 'Refrescar tabla',
          icon: 'fas fa-undo-alt',
          onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
        }))
        can('campaigns', 'all', 'create') && container.unshift(DxPanelButton({
          className: 'btn btn-xs btn-soft-primary',
          text: 'Nuevo',
          title: 'Agregar registro',
          icon: 'fa fa-plus',
          onClick: () => onModalOpen()
        }))
      }}
      columns={[
        {
          dataField: 'code',
          caption: 'Código',
          dataType: 'string',
          cssClass: 'font-monospace'
        },
        {
          dataField: 'source',
          caption: 'Fuente',
          dataType: 'string',
          lookup: {
            dataSource: sourceOptions,
            valueExpr: 'id',
            displayExpr: 'label'
          }
        },
        {
          dataField: 'title',
          caption: 'Título',
          dataType: 'string'
        },
        {
          dataField: 'link',
          caption: 'Enlace',
          dataType: 'string'
        },
        {
          dataField: 'notes',
          caption: 'Notas',
          dataType: 'string'
        },
        {
          caption: 'Acciones',
          cellTemplate: (container, { data }) => {
            if (data.protected) return
            // can('campaigns', 'root', 'all', 'update') && 
            container.append(DxButton({
              className: 'btn btn-xs btn-soft-primary',
              title: 'Editar',
              icon: 'fa fa-pen',
              onClick: () => onModalOpen(data)
            }))
            // can('campaigns', 'root', 'all', 'delete') &&
            container.append(DxButton({
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
    <Modal modalRef={modalRef} title={isEditing ? 'Editar campaña' : 'Agregar campaña'} onSubmit={onModalSubmit}>
      <div className='row' id='campaign-form'>
        <input ref={idRef} type='hidden' />
        <InputFormGroup eRef={codeRef} label='Código' col='col-12' required />
        <SelectFormGroup eRef={sourceRef} label='Fuente' col='col-12' required dropdownParent='#campaign-form' >
          {sourceOptions.map(opt => (
            <option key={opt.id} value={opt.id}>{opt.label}</option>
          ))}
        </SelectFormGroup>
        <InputFormGroup eRef={titleRef} label='Título' col='col-12' required />
        <InputFormGroup eRef={linkRef} label='Enlace' col='col-12' />
        <TextareaFormGroup eRef={notesRef} label='Notas' col='col-12' />
      </div>
    </Modal>
  </>
  )
};

CreateReactScript((el, properties) => {
  // if (!properties.can('campaigns', 'root', 'all', 'list')) return location.href = '/';
  createRoot(el).render(
    <Adminto {...properties} title='Campañas' showTitle={false}>
      <Campaigns {...properties} />
    </Adminto>
  );
})