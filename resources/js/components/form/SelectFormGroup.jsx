import React, { useEffect, useRef } from "react"

const SelectFormGroup = ({ col, label, eRef, required = false, children, dropdownParent }) => {

  if (!eRef) eRef = useRef()

  useEffect(() => {
    $(eRef.current).select2({
      dropdownParent
    })
  }, [dropdownParent])

  return <div className={`form-group ${col} mb-2`}>
    <label htmlFor=''>
      {label} {required && <b className="text-danger">*</b>}
    </label>
    <select ref={eRef} required={required} className='form-control' style={{ width: '100%' }}>
      {children}
    </select>
  </div>
}

export default SelectFormGroup