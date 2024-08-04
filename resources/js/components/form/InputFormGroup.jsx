import React from "react"

const InputFormGroup = ({ col, label, eRef, type = 'text', placeholder, required = false, disabled = false, value, step }) => {
  return <div className={`form-group ${col} mb-2`}>
    <label htmlFor=''>
      {label} {required && <b className="text-danger">*</b>}
    </label>
    <input ref={eRef} type={type} className='form-control' placeholder={placeholder} required={required} disabled={disabled} defaultValue={value ?? ''} step={step} />
  </div>
}

export default InputFormGroup