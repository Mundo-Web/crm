
import React, { useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import ReactAppend from './Utils/ReactAppend.jsx'
import PermissionsRest from './actions/PermissionsRest.js'
import RolesRest from './actions/RolesRest.js'
import Adminto from './components/Adminto.jsx'
import Modal from './components/Modal.jsx'
import Table from './components/Table.jsx'
import Accordion from './components/accordion/Accordion.jsx'
import AccordionCard from './components/accordion/AccordionCard.jsx'
import CheckboxFormGroup from './components/form/CheckboxFormGroup.jsx'
import InputFormGroup from './components/form/InputFormGroup.jsx'
import TextareaFormGroup from './components/form/TextareaFormGroup.jsx'
import TippyButton from './components/form/TippyButton.jsx'

const Roles = ({ permissions }) => {
  permissions = Object.values(permissions.map((x) => {
    const [origin] = x.name.split('.')
    return { ...x, origin }
  }).reduce((acc, item) => {
    if (!acc[item.origin]) {
      acc[item.origin] = [];
    }
    acc[item.origin].push(item);
    return acc;
  }, {}))

  const gridRef = useRef()
  const modalRef = useRef()
  const modalPermissionRef = useRef()
  const permissionsRef = useRef()
  // const buttonPermissionsRef = useRef()

  // Form elements ref
  const idRef = useRef()
  const nameRef = useRef()
  const descriptionRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [rolActive, setRolActive] = useState({})

  const onModalOpen = (data) => {
    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    idRef.current.value = data?.id || null
    nameRef.current.value = data?.name || null
    descriptionRef.current.value = data?.description || null

    $(modalRef.current).modal('show')
  }

  const onPermissionsModalOpen = async (data) => {
    // buttonPermissionsRef.current.disabled = true
    setRolActive(data)
    const userPermissions = await PermissionsRest.byRole(data.id)
    // buttonPermissionsRef.current.disabled = false

    $('#permissions input').prop('checked', false)
    userPermissions.forEach(({ name }) => {
      $(`[name="${name}"]`).prop('checked', true)
    })

    $(modalPermissionRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      name: nameRef.current.value,
      description: descriptionRef.current.value
    }

    const result = await RolesRest.save(request)
    if (!result) return

    $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onPermissionsModalSubmit = async (e) => {
    e.preventDefault()

    const permissions = [...$('#permissions input:checked')].map(e => e.value)
    const request = {
      role_id: rolActive.id,
      permissions: permissions
    }

    const result = await PermissionsRest.massiveByRole(request)
    if (!result) return

    $(modalPermissionRef.current).modal('hide')
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (id) => {
    const result = await RolesRest.delete(id)
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  return (<>
    <Table gridRef={gridRef} title='Roles' rest={RolesRest}
      toolBar={(container) => {
        container.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'refresh',
            hint: 'Refrescar tabla',
            onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
          }
        });
        container.unshift({
          widget: 'dxButton', location: 'after',
          options: {
            icon: 'plus',
            hint: 'Nuevo registro',
            onClick: () => onModalOpen()
          }
        });
      }}
      columns={[
        {
          dataField: 'name',
          caption: 'Rol'
        },
        {
          dataField: 'description',
          caption: 'Descripcion'
        },
        {
          dataField: 'created_at',
          caption: 'Fecha creacion',
          dataType: 'date',
          width: '150px',
          cellTemplate: (container, { data }) => {
            ReactAppend(container, <span>{moment(data.created_at).format('LL')}</span>)
          }
        },
        {
          dataField: 'updated_at',
          caption: 'Fecha actualizacion',
          dataType: 'date',
          width: '150px',
          cellTemplate: (container, { data }) => {
            ReactAppend(container, <span>{moment(data.updated_at).format('LL')}</span>)
          }
        },
        {
          caption: 'Acciones',
          cellTemplate: (container, { data }) => {
            container.attr('style', 'display: flex; gap: 4px; overflow: unset')

            ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-primary' title='Editar' onClick={() => onModalOpen(data)}>
              <i className='fa fa-pen'></i>
            </TippyButton>)

            ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-dark' title='Modificar permisos' onClick={() => onPermissionsModalOpen(data)} data-loading-text='<i class="fa fa-spinner fa-spin"></i>'>
              <i className='fas fa-th-list'></i>
            </TippyButton>)

            ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-danger' title='Eliminar' onClick={() => onDeleteClicked(data.id)}>
              <i className='fa fa-trash-alt'></i>
            </TippyButton>)
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]} />
    <Modal modalRef={modalRef} title={isEditing ? 'Editar rol' : 'Agregar rol'} onSubmit={onModalSubmit}>
      <div className='row'>
        <input ref={idRef} type='hidden' />
        <InputFormGroup eRef={nameRef} label='Rol' col='col-12' required />
        <TextareaFormGroup eRef={descriptionRef} label='Descripcion' col='col-12' />
      </div>
    </Modal>
    <Modal modalRef={modalPermissionRef} title={`Permisos para ${rolActive.name}`} btnSubmitText='Guardar' onSubmit={onPermissionsModalSubmit} size='lg'>
      {/* <Accordion id='permissions'> */}
      <div id="permissions" className='row'>
        {permissions.map((children, i) => {
          const origin = children[0].origin
          return <div className="col-lg-4 col-md-6 col-sm-12">
            <AccordionCard key={`accordion-${i}`} id={`permission-${origin}`} title={origin} parent='permissions' className='d-flex gap-2 flex-wrap flex-row' isOpened>
              {children.map(({ id, name, description }) => <CheckboxFormGroup key={`permission-${id}`} className='mb-0' id={`permission-ck-${id}`} label={name.replace(`${origin}.`, '')} name={name} value={id} title={description} style={{ width: 'max-content' }} rounded />)}
            </AccordionCard>
          </div>
        })}
      </div>
      {/* </Accordion> */}
    </Modal>
  </>
  )
};

CreateReactScript((el, properties) => {
  createRoot(el).render(
    <Adminto {...properties} title='Roles'>
      <Roles {...properties} />
    </Adminto>
  );
})