import React, { useEffect, useRef } from "react"

const SelectFormGroup = ({ id, col, className, label, eRef, required = false, children, dropdownParent, noMargin = false, multiple = false, disabled = false, onChange = () => { },
  templateResult,
  templateSelection,
  minimumResultsForSearch,
  tags
}) => {

  if (!eRef) eRef = useRef()
  if (!id) id = `select-${crypto.randomUUID()}`

  useEffect(() => {
    $(eRef.current).select2({
      dropdownParent,
      templateResult,
      templateSelection,
      minimumResultsForSearch,
      tags
    })
    $(eRef.current).on('change', onChange)
  }, [dropdownParent])

  return <div className={`form-group ${col} ${!noMargin && 'mb-2'}`}>
    <label htmlFor={id} className="mb-1">
      {label} {(label && required) && <b className="text-danger">*</b>}
    </label>
    <select ref={eRef} id={id} required={required} className={`form-control ${className}`} style={{ width: '100%' }} disabled={disabled} multiple={multiple}>
      {children}
    </select>
  </div>
}

export default SelectFormGroup