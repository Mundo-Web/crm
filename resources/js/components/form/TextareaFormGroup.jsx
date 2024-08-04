import React from "react"

const TextareaFormGroup = ({ col, label, eRef, placeholder, required = false, rows = 3 }) => {
  return <div className={`form-group ${col} mb-2`}>
    <label htmlFor=''>
      {label} {required && <b className="text-danger">*</b>}
    </label>
    <textarea ref={eRef} className='form-control' placeholder={placeholder} required={required} rows={rows}/>
  </div>
}

export default TextareaFormGroup