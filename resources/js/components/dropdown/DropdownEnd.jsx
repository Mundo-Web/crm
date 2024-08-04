import React from "react"

const DropdownEnd = ({ children }) => {
  return <div className="dropdown float-end">
    <a href="#" className="dropdown-toggle arrow-none card-drop" data-bs-toggle="dropdown" aria-expanded="false">
      <i className="mdi mdi-dots-vertical"></i>
    </a>
    <div className="dropdown-menu dropdown-menu-end">
      {children}
    </div>
  </div>
}

export default DropdownEnd