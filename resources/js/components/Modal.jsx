import React from 'react';

const Modal = ({ modalRef, title = 'Modal', isStatic = false, size = 'md', children, bodyClass = '', btnCancelText, btnSubmitText, hideFooter, hideButtonSubmit, onSubmit = (e) => { e.preventDefault(); $(modalRef.current).modal('hide') } }) => {
  const staticProp = isStatic ? { 'data-bs-backdrop': 'static' } : {}
  return (<form className='modal fade' ref={modalRef} tabIndex='-1' aria-hidden='true' {...staticProp} onSubmit={onSubmit} autoComplete='off'>
    <div className={`modal-dialog modal-dialog-centered modal-${size ?? 'md'}`}>
      <div className='modal-content ' style={{ boxShadow: '0 0 10px rgba(0,0,0,0.25)' }}>
        <div className='modal-header'>
          <h4 className='modal-title'>{title}</h4>
          <button type='button' className='btn-close' data-bs-dismiss='modal' aria-label='Close'></button>
        </div>
        <div className={`modal-body ${bodyClass ?? ''}`} >
          {children}
        </div>
        {
          !hideFooter && <div className='modal-footer'>
            <button className='btn btn-sm btn-danger pull-left' type='button'
              data-bs-dismiss='modal'>{btnCancelText ?? 'Cerrar'}</button>
            {!hideButtonSubmit && <button className='btn btn-sm btn-success pull-right' type='submit'>{btnSubmitText ?? 'Aceptar'}</button>}
          </div>
        }
      </div>
    </div>
  </form >
  )
}

export default Modal