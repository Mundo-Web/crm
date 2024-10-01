import React from "react";

const DropdownItem = ({ onClick, children, ...props }) => {
  return <li className="dropdown-item p-0">
    <a className="dropdown-item p-2 d-block" style={{ cursor: 'pointer' }} onClick={onClick} {...props}>{children}</a>
  </li>
}

export default DropdownItem