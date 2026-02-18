
import React, { useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import SetSelectValue from './Utils/SetSelectValue.jsx'
import StatusesRest from './actions/StatusesRest.js'
import Adminto from './components/Adminto.jsx'
import Modal from './components/Modal.jsx'
import InputFormGroup from './components/form/InputFormGroup.jsx'
import SelectAPIFormGroup from './components/form/SelectAPIFormGroup.jsx'
import TextareaFormGroup from './components/form/TextareaFormGroup.jsx'
import Swal from 'sweetalert2'
import CheckboxFormGroup from './components/form/CheckboxFormGroup.jsx'

const statusesRest = new StatusesRest()

const Statuses = ({ statuses: statusesFromDB, tables }) => {

  const [statuses, setStatuses] = useState(statusesFromDB);

  const gridRef = useRef()
  const modalRef = useRef()

  // Form elements ref
  const idRef = useRef()
  const tableRef = useRef()
  const nameRef = useRef()
  const colorRef = useRef()
  const orderRef = useRef()
  const descriptionRef = useRef()
  const requireRef = useRef()

  const [isEditing, setIsEditing] = useState(false)
  const [require, setRequire] = useState(false)
  const [pipeline, setPipeline] = useState(false)
  const [showPipeline, setShowPipeline] = useState(false)

  const onModalOpen = (data) => {
    if (data?.id) setIsEditing(true)
    else setIsEditing(false)

    setShowPipeline(data?.table?.id == 'e05a43e5-b3a6-46ce-8d1f-381a73498f33')
    setPipeline(data?.pipeline ?? false)
    idRef.current.value = data?.id || null
    SetSelectValue(tableRef.current, data?.table?.id, data?.table?.name)
    if (data?.table?.id) {
      $(tableRef.current).parents('.form-group').hide();
    } else {
      $(tableRef.current).parents('.form-group').show();
    }
    nameRef.current.value = data?.name || null
    colorRef.current.value = data?.color || '#343a40'
    orderRef.current.value = data?.order || ''
    descriptionRef.current.value = data?.description || null
    setRequire(data?.require || false)

    $(modalRef.current).modal('show')
  }

  const onModalSubmit = async (e) => {
    e.preventDefault()

    const request = {
      id: idRef.current.value || undefined,
      table_id: tableRef.current.value,
      name: nameRef.current.value,
      color: colorRef.current.value,
      order: orderRef.current.value,
      description: descriptionRef.current.value,
      require: require,
      action_required: require ? 'product' : null,
      pipeline: pipeline
    }

    const result = await statusesRest.save(request)
    if (!result) return

    if (statuses.find(x => x.id == result.id)) {
      setStatuses(old => {
        const index = old.findIndex(x => x.id == result.id)
        old[index] = result
        return [...old]
      })
    } else {
      setStatuses(old => [...old, result])
    }

    // $(gridRef.current).dxDataGrid('instance').refresh()
    $(modalRef.current).modal('hide')
  }

  const onStatusChange = async ({ id, status }) => {
    const result = await statusesRest.status({ id, status })
    if (!result) return
    $(gridRef.current).dxDataGrid('instance').refresh()
  }

  const onDeleteClicked = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: "Estas seguro de eliminar este estado?",
      text: `No podras revertir esta accion!`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Continuar",
      cancelButtonText: `Cancelar`
    })

    if (!isConfirmed) return
    const result = await statusesRest.delete(id)
    if (!result) return
    setStatuses(old => [...old.filter(x => x.id != id)])
    // $(gridRef.current).dxDataGrid('instance').refresh()
  }

  return (<>
    {/* <Table gridRef={gridRef} title='Estados' rest={statusesRest}
      toolBar={(container) => {
        container.unshift(DxPanelButton({
          className: 'btn btn-xs btn-soft-dark',
          text: 'Actualizar',
          title: 'Refrescar tabla',
          icon: 'fas fa-undo-alt',
          onClick: () => $(gridRef.current).dxDataGrid('instance').refresh()
        }))
        can('statuses', 'all', 'create') && container.unshift(DxPanelButton({
          className: 'btn btn-xs btn-soft-primary',
          text: 'Nuevo',
          title: 'Agregar registro',
          icon: 'fa fa-plus',
          onClick: () => onOpenModal()
        }))
      }}
      columns={[
        {
          dataField: 'id',
          caption: 'ID',
          visible: false
        },
        {
          dataField: 'table.name',
          caption: 'Tabla',
          dataType: 'string'
        },
        {
          dataField: 'name',
          caption: 'Estado de tabla'
        },
        {
          dataField: 'color',
          caption: 'Color',
          cellTemplate: (container, { data }) => {
            ReactAppend(container, <span className={`badge rounded-pill`} style={{ backgroundColor: data.color || '#343a40' }}>{data.color}</span>)
          }
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
          dataField: 'status',
          caption: 'Estado',
          dataType: 'boolean',
          cellTemplate: (container, { data }) => {
            switch (data.status) {
              case 1:
                ReactAppend(container, <span className='badge bg-success rounded-pill'>Activo</span>)
                break
              case 0:
                ReactAppend(container, <span className='badge bg-danger rounded-pill'>Inactivo</span>)
                break
              default:
                ReactAppend(container, <span className='badge bg-dark rounded-pill'>Eliminado</span>)
                break
            }
          }
        },
        {
          caption: 'Acciones',
          cellTemplate: (container, { data }) => {
            container.attr('style', 'display: flex; gap: 4px; overflow: unset')

            ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-primary' title='Editar' onClick={() => onModalOpen(data)}>
              <i className='fa fa-pen'></i>
            </TippyButton>)

            ReactAppend(container, <TippyButton className='btn btn-xs btn-light' title={data.status === null ? 'Restaurar' : 'Cambiar estado'} onClick={() => onStatusChange(data)}>
              {
                data.status === 1
                  ? <i className='fa fa-toggle-on text-success' />
                  : data.status === 0 ?
                    <i className='fa fa-toggle-off text-danger' />
                    : <i className='fas fa-trash-restore' />
              }
            </TippyButton>)

            ReactAppend(container, <TippyButton className='btn btn-xs btn-soft-danger' title='Eliminar' onClick={() => onDeleteClicked(data.id)}>
              <i className='fa fa-trash-alt'></i>
            </TippyButton>)
          },
          allowFiltering: false,
          allowExporting: false
        }
      ]} /> */}
    <div className="container">
      {/* <div className='text-center'>
        <button className="btn btn-primary mb-4 rounded-pill" onClick={() => onModalOpen()}>Nuevo Estado</button>
      </div> */}

      <div className="row align-items-start justify-content-center">
        {tables.map((table, index) => (
          <div key={index} className="col-md-6">
            <div className="card">
              <div className="card-header">
                <div className='d-flex align-items-center justify-content-between'>
                  {/* {
                    table.id == '9c27e649-574a-47eb-82af-851c5d425434'
                      ? */}
                       <h5 className="my-0 text-capitalize">{table.name}</h5>
                      {/* : <h5 className="my-0 text-capitalize">Estados de {table.name}</h5>
                  } */}
                  <button className='btn btn-xs btn-primary rounded-pill' onClick={() => onModalOpen({ table })}>Nuevo estado</button>
                </div>
              </div>
              <div className="card-body d-flex align-items-start justify-content-center gap-2" style={{ flexWrap: 'wrap', minHeight: '200px', maxHeight: '300px', overflowY: 'auto' }}>
                {statuses.filter(status => status.table_id === table.id).sort((a, b) => a.order - b.order).map((status, index) => (
                  <div key={index} className="btn-group dropup col-auto">
                    <span type="button" className="btn btn-sm btn-white d-flex gap-2 align-items-center" style={{ cursor: 'default' }}>
                      <h4 className='my-0'>{status.order}</h4>
                      <div className='flex-1'>
                        <div>
                          <i className='mdi mdi-circle me-1' style={{ color: status.color }}></i>
                          {status.name}
                          {
                            status.require &&
                            <span className='text-danger ms-1'>*</span>
                          }
                          <span className='badge rounded-pill bg-secondary ms-1'>{status.children_count}</span>
                        </div>
                        <small className='text-muted' style={{ fontSize: '10px' }}>Ult. uso: {status.last_used_at}</small>
                      </div>
                    </span>
                    <button type="button" className="btn btn-sm btn-white dropdown-toggle" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                      <i className="mdi mdi-dots-vertical"></i>
                    </button>
                    <div className="dropdown-menu">
                      <span className="dropdown-item" style={{ cursor: 'pointer' }} onClick={() => onModalOpen(status)}>Editar</span>
                      <span className="dropdown-item" style={{ cursor: 'pointer' }} onClick={() => onDeleteClicked(status.id)}>Eliminar</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
    <Modal modalRef={modalRef} title={isEditing ? 'Editar estado' : 'Agregar estado'} onSubmit={onModalSubmit} size='sm'>
      <div className='row' id='status-crud-container'>
        <input ref={idRef} type='hidden' />
        <InputFormGroup eRef={nameRef} label='Nombre de estado' col='col-12' required />
        <SelectAPIFormGroup eRef={tableRef} label='Tabla' col='col-12' dropdownParent='#status-crud-container' searchAPI='/api/tables/paginate' searchBy='name' required />
        <InputFormGroup eRef={colorRef} type='color' label='Color' col='col-6' required />
        <InputFormGroup eRef={orderRef} type='number' label='Orden' col='col-6' required />
        <TextareaFormGroup eRef={descriptionRef} label='Descripcion' col='col-12' />
        <div className="col-12">
          <CheckboxFormGroup eRef={requireRef} label='¿Requerir producto?' id='require' title='Obliga al usuario a escoger un producto antes de cambiar a este estado' checked={require} setChecked={setRequire} />
        </div>
        <div className="col-12 mt-2" hidden={!showPipeline}>
          <CheckboxFormGroup eRef={requireRef} label='¿Mostrar en Pipeline?' id='pipeline' title='Si está activo, este estado aparecerá en el pipeline de leads; si no, permanecerá oculto' checked={pipeline} setChecked={setPipeline} />
        </div>
      </div>
    </Modal>
  </>
  )
};

CreateReactScript((el, properties) => {
  if (!properties.can('statuses', 'root', 'all', 'list')) return location.href = '/';
  createRoot(el).render(
    <Adminto {...properties} title='Gestor de estados'>
      <Statuses {...properties} />
    </Adminto>
  );
})