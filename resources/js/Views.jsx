
import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import CreateReactScript from './Utils/CreateReactScript.jsx'
import Adminto from './components/Adminto.jsx'
import Tippy from '@tippyjs/react'
import Modal from './components/Modal.jsx'
import InputFormGroup from './components/form/InputFormGroup.jsx'
import TextareaFormGroup from './components/form/TextareaFormGroup.jsx'
import ViewsRest from './actions/ViewsRest.js'

const viewsRest = new ViewsRest()

const Views = ({ tables, views, statuses }) => {

  const viewRef = useRef()
  const modalRef = useRef()

  const idRef = useRef()
  const nameRef = useRef()
  const descriptionRef = useRef()

  const [view, setView] = useState(null)

  useEffect(() => {
    onViewChange()
  }, [null])

  const onModalOpen = () => {
    idRef.current.value = null;
    nameRef.current.value = null;
    descriptionRef.current.value = null;

    $('[name="ck-status"]').prop('checked', false)

    $(modalRef.current).modal('show')
  }

  const onViewChange = (e) => {
    setView(viewRef?.current?.value)
  }

  const onViewSubmit = async (e) => {
    e.preventDefault()
    const request = {
      id: idRef.current.value ?? undefined,
      table_id: viewRef.current.value,
      name: nameRef.current.value,
      description: descriptionRef.current.value,
      statuses: [...$('[name="ck-status"]:checked')].map(e => e.value)
    }

    const result = await viewsRest.save(request)
    if (!result) return

    location.reload()
  }

  const onDeleteViewClicked = async (view) => {
    const result = await viewsRest.delete(view.id)
    if (!result) return
    location.reload()
  }

  return (<>
    <div className='d-flex align-items-center justify-content-center' style={{ minHeight: 'calc(100vh - 135px)' }}>
      <div style={{ width: '100%' }}>
        <div className='mx-auto form-group' style={{ width: '240px' }}>
          <div className="form-floating mb-3">
            <select ref={viewRef} className="form-select" id="view-select" aria-label="Crea vistas para" onChange={onViewChange}>
              {
                tables.map((table, i) => {
                  return <option key={`table-${i}`} value={table.id}>{table.name}</option>
                })
              }
            </select>
            <label htmlFor="view-select">Crea vistas para</label>
          </div>
        </div>

        <hr className='mx-auto' style={{ width: '180px' }} />
        <button className='d-block m-auto btn btn-white rounded-pill mb-3' onClick={onModalOpen}>
          <i className='mdi mdi-plus'></i> Nuevo
        </button>
        <div className='d-flex flex-wrap align-items-center justify-content-center gap-3 mb-3' style={{ width: '100%' }}>
          {views.filter(x => x.table_id == view).map((view, i) => {
            return <div key={`service-${i}`} className="card mb-0" style={{ width: '100%', maxWidth: '360px' }}>
              <div className="card-body project-box">
                <div className="float-end">
                  <button className='btn btn-xs btn-white ms-1'>
                    <i className='fa fa-pen'></i>
                  </button>
                  <button className='btn btn-xs btn-danger ms-1' onClick={() => onDeleteViewClicked(view)}>
                    <i className='fa fa-trash'></i>
                  </button>
                </div>
                <h4 className="mt-0"><a href={`/clients/${view.id}`} className="text-dark" >{view.name} <i className="mdi mdi-arrow-top-right"></i></a></h4>
                <div className='mb-2'>
                  <code>{view.id}</code>
                </div>
                <p className="text-muted font-13" style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  textOverflow: 'ellipsis',
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  height: '38px'
                }}>
                  {view.description || <i className='text-muted'>- Sin descripcion -</i>}
                </p>

                <div className="project-members mb-0">

                  <h5 className="mb-1">Estados filtrados:</h5>
                  <div className='d-flex flex-wrap gap-2'>
                    <p key={`status-${i}`} className='mb-0 font-13' style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      textOverflow: 'ellipsis',
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      height: '38px'
                    }}>
                      {view.statuses.length > 0 ? view.statuses.map(({ name }) => name).join(', ') : <i className='text-muted'>No se han seleccionado filtros de estado para esta vista</i>}.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          })}

        </div>
      </div>
    </div>
    <Modal modalRef={modalRef} title='Agregar vista' size='sm' onSubmit={onViewSubmit}>
      <input ref={idRef} type="hidden" />
      <InputFormGroup eRef={nameRef} label='Nombre' required />
      <TextareaFormGroup eRef={descriptionRef} label='Descripcion' />
      <hr className='my-2' />
      <h5>Filtro de estados <small className='text-muted' style={{ fontWeight: 'normal' }}>Que estados quieres filtrar en esta vista</small></h5>
      <div className='d-flex flex-wrap justify-content-center gap-2'>
        {statuses.filter(x => x.table.id == view).map((status, i) => {
          return <div key={`status-${i}`} className="form-check form-check-success">
            <input className="form-check-input" type="checkbox" name='ck-status' value={status.id} id={`status-${i}`} style={{ cursor: 'pointer' }} />
            <label className="form-check-label" htmlFor={`status-${i}`} style={{ cursor: 'pointer' }}>{status.name}</label>
          </div>
        })}
      </div>
    </Modal>
  </>
  )
};

CreateReactScript((el, properties) => {
  createRoot(el).render(
    <Adminto {...properties} title='Vistas de usuario'>
      <Views {...properties} />
    </Adminto>
  );
})