import React, { useRef, useState } from 'react'

const PasswordFormGroup = ({ col, label, eRef, placeholder, required = false, value }) => {
  if (!eRef) eRef = useRef()

  const [type, setType] = useState('password')
  const onChangeVisibility = () => {
    if (type == 'text') setType('password')
    else setType('text')
  }

  return <div className={`form-group ${col} mb-2`}>
    <label htmlFor=''>
      {label} {required && <b className="text-danger">*</b>}
    </label>
    <div className='input-group input-group-merge'>
      <input ref={eRef} type={type} className='form-control' placeholder={placeholder} required={required} defaultValue={value ?? ''} />
      <div className='input-group-text' data-password='true' onClick={onChangeVisibility}>
        <i className={type == 'text' ? 'mdi mdi-eye-off-outline' : 'mdi mdi-eye-outline'}></i>
      </div>
    </div>
  </div>
}

export default PasswordFormGroup