import Tippy from "@tippyjs/react";
import React from "react";

const DropdownItem = ({ onClick, children, className = 'p-2', tippy, ...props }) => {
  return <li className="dropdown-item p-0 position-relative">
    {
      tippy
        ? <Tippy content={tippy}>
          <a className={`dropdown-item ${className} d-block`} style={{
            cursor: 'pointer',
            width: '260px'
          }} onClick={onClick} {...props}>{children}</a>
        </Tippy>
        : <a className={`dropdown-item ${className} d-block`} style={{
          cursor: 'pointer',
          width: '260px'
        }} onClick={onClick} {...props}>{children}</a>
    }
  </li>
}

export default DropdownItem