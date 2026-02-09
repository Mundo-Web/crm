import React, { useEffect } from 'react';

const Modal = ({ modalRef, title = 'Modal', btnAcceptClass = '', isStatic = false, size = 'md', position = 'dialog-centered', children, bodyClass = '', btnCancelText, btnSubmitText, hideHeader, hideFooter, hideButtonSubmit, zIndex, width, onSubmit = (e) => { e.preventDefault(); $(modalRef.current).modal('hide') }, onClose = () => { }, loading = false }) => {
  const staticProp = isStatic ? { 'data-bs-backdrop': 'static' } : {}
  const modalId = crypto.randomUUID();

  useEffect(() => {
    modalRef.current.addEventListener('hidden.bs.modal', () => {
      onClose()
      console.log('Modal cerrado:', modalId)
    });
  }, [null])

  return (<form id={`modal-${modalId}`} className='modal fade' ref={modalRef} tabIndex='-1' aria-hidden='true' {...staticProp} onSubmit={onSubmit} autoComplete='off' style={{
    zIndex
  }}>
    <div className={`modal-dialog modal-${position} modal-${size ?? 'md'}`} style={{
      transition: '.25s all ease-in-out'
    }}>
      <div className='modal-content ' style={{ boxShadow: position == 'dialog-centered' && '0 0 10px rgba(0,0,0,0.25)', width }}>
        {
          !hideHeader &&
          <div className='modal-header'>
            <h4 className='modal-title'>{title}</h4>
            <button type='button' className='btn-close' data-bs-dismiss='modal' aria-label='Close'></button>
          </div>
        }
        <div className={`modal-body ${bodyClass ?? ''}`} >
          {children}
        </div>
        {
          !hideFooter && <div className='modal-footer'>
            <button className='btn btn-sm btn-danger pull-left' type='button'
              data-bs-dismiss='modal' disabled={loading}>{btnCancelText ?? 'Cerrar'}</button>
            {!hideButtonSubmit && <button className={`btn btn-sm btn-success pull-right ${btnAcceptClass}`} type='submit' disabled={loading}>{
              loading
                ? <><i className='mdi mdi-spin mdi-loading me-1' /> Procesando</>
                : <>{btnSubmitText ?? 'Aceptar'}</>
            }</button>}
          </div>
        }
      </div>
    </div>
  </form >
  )
}

export default Modal