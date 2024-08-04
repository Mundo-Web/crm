import Tippy from "@tippyjs/react";
import React from "react";

const CheckboxFormGroup = ({ title, label, id, name, value, checked, required, rounded = false, style, className }) => {
  return (
    <Tippy content={title} arrow={true}>
      <div className={`form-check form-check-success ${className}`} style={{ ...style, cursor: 'pointer' }}>
        <input className={`form-check-input ${rounded && 'rounded-circle'}`} type="checkbox" value={value} name={name} id={id} defaultChecked={checked} required={required} style={{ cursor: 'pointer' }} />
        <label className="form-check-label" htmlFor={id} style={{ cursor: 'pointer' }}>{label}</label>
      </div>
    </Tippy>
  );
};

export default CheckboxFormGroup;