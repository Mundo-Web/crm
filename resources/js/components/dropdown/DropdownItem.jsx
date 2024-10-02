import React from "react";

const DropdownItem = ({ onClick, children, className = 'p-2', ...props }) => {
  return <li className="dropdown-item p-0 position-relative">
    <a className={`dropdown-item ${className} d-block`} style={{
      cursor: 'pointer',
      width: '260px'
    }} onClick={onClick} {...props}>{children}</a>
  </li>
}

export default DropdownItem