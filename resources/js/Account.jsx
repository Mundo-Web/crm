import React, { useRef } from 'react';
import { createRoot } from 'react-dom/client';
import Adminto from './components/Adminto';
import CreateReactScript from './Utils/CreateReactScript';
import InputFormGroup from './components/form/InputFormGroup';
import PasswordFormGroup from './components/form/PasswordFormGroup';
import 'tippy.js/dist/tippy.css';
import Logout from './actions/Logout';
import AccountRest from './actions/AccountRest';
import JSEncrypt from 'jsencrypt'

const Account = ({ session, PUBLIC_RSA_KEY }) => {
  const jsEncrypt = new JSEncrypt()
  jsEncrypt.setPublicKey(PUBLIC_RSA_KEY)

  const emailRef = useRef()
  const confirmPasswordRef = useRef()
  const lastPasswordRef = useRef()
  const newPasswordRef = useRef()
  const repeatPasswordRef = useRef()

  const onEmailFormSubmit = async (e) => {
    e.preventDefault()
    const request = {
      email: emailRef.current.value,
      password: jsEncrypt.encrypt(confirmPasswordRef.current.value)
    }
    const result = await AccountRest.email(request)
    if (!result) return
    Logout()
  }

  const onPasswordFormSubmit = async (e) => {
    e.preventDefault()
    const request = {
      password: jsEncrypt.encrypt(lastPasswordRef.current.value),
      newPassword: jsEncrypt.encrypt(newPasswordRef.current.value),
      confirmPassword: jsEncrypt.encrypt(repeatPasswordRef.current.value)
    }
    const result = await AccountRest.password(request)
    if (!result) return
    Logout()
  }

  return <div className='row justify-content-center align-items-center' style={{ height: 'calc(100vh - 135px)' }}>
    <div className='col-lg-6 col-md-8 col-sm-12'>
      <div className='card'>
        <div className='card-header'>
          <h4 className='card-title mb-0'>Cuenta de usuario</h4>
        </div>
        <div className='card-body'>
          <div className='row'>
            <div className='col-sm-4'>
              <div className='nav flex-column nav-pills nav-pills-tab' id='v-pills-tab' role='tablist' aria-orientation='vertical'>
                <a className='nav-link active show mb-1' id='email-container-tab' data-bs-toggle='pill' href='#email-container' role='tab' aria-controls='email-container' aria-selected='true'>
                  Correo
                </a>
                <a className='nav-link mb-1' id='password-container-tab' data-bs-toggle='pill' href='#password-container' role='tab' aria-controls='password-container' aria-selected='false'>
                  Contraseña
                </a>
              </div>
            </div>
            <div className='col-sm-8'>
              <div className='tab-content pt-0'>
                <form className='tab-pane fade active show' id='email-container' role='tabpanel' aria-labelledby='email-container-tab'
                  onSubmit={onEmailFormSubmit}>
                  <h4 className='mt-0'>Actualizar correo de usuario</h4>
                  <InputFormGroup eRef={emailRef} label='Correo de usuario' type='email' value={session.email} required />
                  <PasswordFormGroup eRef={confirmPasswordRef} label='Contraseña de confirmacion' type='password' value={null} required />
                  <button className='btn btn-primary btn-block' type='submit'>
                    <i className='fa fa-save'></i> Actualizar
                  </button>
                </form>
                <form className='tab-pane fade' id='password-container' role='tabpanel' aria-labelledby='password-container-tab'
                  onSubmit={onPasswordFormSubmit}>
                  <h4 className='mt-0'>Actualizar contraseña de usuario</h4>
                  <PasswordFormGroup eRef={lastPasswordRef} label='Contraseña anterior' type='password' value={null} required />
                  <PasswordFormGroup eRef={newPasswordRef} label='Contraseña nueva' type='password' value={null} required />
                  <PasswordFormGroup eRef={repeatPasswordRef} label='Repita la contraseña nueva' type='password' value={null} required />
                  <button className='btn btn-primary btn-block' type='submit'>
                    <i className='fa fa-save'></i> Actualizar
                  </button>
                </form>
              </div>
            </div>
          </div>
          <hr className='mt-3 mb-2' />
          <p className='card-text text-center'>
            <small className='text-muted'>Ultima actualizacion {moment(session.updated_at).fromNow()}</small>
          </p>
        </div>
      </div>
    </div>
  </div>
}

CreateReactScript((el, properties) => {
  createRoot(el).render(<Adminto {...properties} title='Cuenta de usuario'>
    <Account {...properties} />
  </Adminto>);
})