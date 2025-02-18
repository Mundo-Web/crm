import React from "react"

const InputFormGroup = ({ col, className, parentClassName, children, label, eRef, type = 'text', placeholder, required = false, disabled = false, value, step, onBlur, ...props }) => {
  return <div className={`form-group ${col} mb-2 ${parentClassName}`}>
    <label htmlFor=''  className='form-label'>
      {label} {required && <b className="text-danger">*</b>}
    </label>
    <input ref={eRef} type={type} className={`form-control ${className}`} placeholder={placeholder} required={required} disabled={disabled} defaultValue={value ?? ''} step={step} onBlur={onBlur} {...props} />
  {children}
  </div>
}

export default InputFormGroup