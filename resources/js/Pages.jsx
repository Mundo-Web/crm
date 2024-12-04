
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
import Swal from 'sweetalert2'
import SelectFormGroup from './components/form/SelectFormGroup.jsx'
import { renderToString } from 'react-dom/server'
import PagesRest from './actions/PagesRest.js'
import Tippy from '@tippyjs/react'
import ImageFormGroup from './components/form/ImageFormGroup.jsx'

const pagesRest = new PagesRest();

const Pages = ({ subdomains, subdomain, can }) => {

  const gridRef = useRef()
  const modalRef = useRef()
  // const buttonPermissionsRef = useRef()

  // Form elements ref
  const idRef = useRef()
  const nameRef = useRef()
  const pathRef = useRef()
  const descriptionRef = useRef()
  const imgDesktopRef = useRef()
  const imgTabletRef = useRef()
  const imgMobileRef = useRef()

  const [isEditing, setIsEditing] = useState(false)

  const onModalOpen = (data) => {
    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    console.log(data)

    idRef.current.value = data?.id || null
    pathRef.current.value = data?.path || ''
    nameRef.current.value = data?.name || ''
    descriptionRef.current.value = data?.description || ''

    imgDesktopRef.image.src = `/api/pages/media/${data.img_desktop}`
    imgTabletRef.image.src = `/api/pages/media/${data.img_tablet}`
    imgMobileRef.image.src = `/api/pages/media/${data.img_mobile}`

    imgDesktopRef.current.value = null
    imgTabletRef.current.value = null
    imgMobileRef.current.value = null

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      path: pathRef.current.value,
      name: nameRef.current.value,
      description: descriptionRef.current.value ?? undefined
    }

    const formData = new FormData()
    for (const key in request) {
      formData.append(key, request[key])
    }

    const imgDektop = imgDesktopRef.current.files?.[0] ?? null
    const imgTablet = imgTabletRef.current.files?.[0] ?? null
    const imgMobile = imgMobileRef.current.files?.[0] ?? null

    if (imgDektop) formData.append('img_desktop', imgDektop)
    if (imgTablet) formData.append('img_tablet', imgTablet)
    if (imgMobile) formData.append('img_mobile', imgMobile)

    const result = await pagesRest.save(formData)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: 'Eliminar rol',
      text: '¿Está seguro de eliminar este rol?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Si, eliminar!',
      cancelButtonText: 'Cancelar'
    })
    if (!isConfirmed) return
    const result = await pagesRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const monthTemplate = ({
    id,
    text,
    element
  }) => {
    if (!id) return text
    const data = $(element).data('option')
    return $(renderToString(<div>
      <b className='d-block'>{text} <code>{data.correlative}</code></b>
      <small className='d-block text-truncate w-100'>
        {data.description || 'Sin descripción larga larguisima de todos modos larog'}
      </small>
    </div>))
  }

  return (<>
    <div className="row">
      <div className='col-xl-3 col-lg-4 col-md-6 col-sm-8 col-12 mb-2'>
        <SelectFormGroup minimumResultsForSearch={-1} templateResult={monthTemplate} templateSelection={monthTemplate} onChange={e => setSelectedMonth(e.target.value)}>
          {
            subdomains.map((sd, index) => {
              return <option key={index} value={sd.correlative} data-option={JSON.stringify(sd)}>{sd.name}</option>
            })
          }
        </SelectFormGroup>
      </div>
    </div>
    <Table gridRef={gridRef} title={`Páginas - ${subdomain.name}`} rest={pagesRest}
      toolBar={(container) => {
        container.unshift(DxPanelButton({
          className: 'btn btn-xs btn-soft-dark',
          text: 'Actualizar',
          title: 'Refrescar tabla',
          icon: 'fas fa-undo-alt',
          onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
        }))
        can('roles', 'all', 'create') && container.unshift(DxPanelButton({
          className: 'btn btn-xs btn-soft-primary',
          text: 'Nuevo',
          title: 'Agregar registro',
          icon: 'fa fa-plus',
          onClick: () => onModalOpen()
        }))
      }}
      filterValue={['subdomain_id', '=', subdomain.id]}
      columns={[
        {
          dataField: 'subdomain_id',
          visible: false
        },
        {
          dataField: 'path',
          caption: 'Ruta'
        },
        {
          dataField: 'name',
          caption: 'Nombre'
        },
        {
          dataField: 'description',
          caption: 'Descripcion'
        },
        {
          dataField: 'images',
          caption: 'Imagenes',
          allowFiltering: false,
          width: '200px',

          cellTemplate: (container, { data }) => {
            ReactAppend(container, <div className='d-flex gap-1'>
              <Tippy content="Desktop">
                <img src={`/api/pages/media/${data.img_desktop}`} className='border' style={{
                  height: '40px',
                  aspectRatio: 16 / 9,
                  objectFit: 'cover',
                  objectPosition: 'top center'
                }} />
              </Tippy>
              <Tippy content="Tablet">
                <img src={`/api/pages/media/${data.img_tablet || data.img_desktop}`} className='border' style={{
                  height: '40px',
                  aspectRatio: 4 / 3,
                  objectFit: 'cover',
                  objectPosition: 'top center'
                }} />
              </Tippy>
              <Tippy content="Mobile">
                <img src={`/api/pages/media/${data.img_mobile || data.img_tablet || data.img_desktop}`} className='border' style={{
                  height: '40px',
                  aspectRatio: 9 / 16,
                  objectFit: 'cover',
                  objectPosition: 'top center'
                }} />
              </Tippy>
            </div>)
          }
        },
        {
          caption: 'Acciones',
          cellTemplate: (container, { data }) => {
            container.attr('style', 'display: flex; gap: 4px; overflow: unset; height: 51px')

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
    <Modal modalRef={modalRef} title={isEditing ? 'Editar página' : 'Agregar página'} onSubmit={onModalSubmit} size='sm'>
      <input ref={idRef} type='hidden' />
      <InputFormGroup eRef={pathRef} label='Ruta' col='col-12' required />
      <InputFormGroup eRef={nameRef} label='Nombre' col='col-12' required />
      <TextareaFormGroup eRef={descriptionRef} label='Descripcion' col='col-12' rows={2} />
      <div className='d-flex flex-wrap justify-content-start gap-2'>
        <ImageFormGroup eRef={imgDesktopRef} label='Desktop' aspect={16 / 9} height='50px' width='auto' containerStyle={{ width: 'max-content' }} onError='/api/pages/media/undefined' />
        <ImageFormGroup eRef={imgTabletRef} label='Tablet' aspect={4 / 3} height='50px' width='auto' containerStyle={{ width: 'max-content' }} onError='/api/pages/media/undefined' />
        <ImageFormGroup eRef={imgMobileRef} label='Mobile' aspect={9 / 16} height='50px' width='auto' containerStyle={{ width: 'max-content' }} onError='/api/pages/media/undefined' />
      </div>
    </Modal>
  </>
  )
};

CreateReactScript((el, properties) => {
  createRoot(el).render(
    <Adminto {...properties} title='Páginas'>
      <Pages {...properties} />
    </Adminto>
  );
})