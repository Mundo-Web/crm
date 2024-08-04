import Tippy from "@tippyjs/react"
import React from "react"

const Dropdown = ({ className, title, icon = {}, children, tippy }) => {
  const dropdown = <div className="btn-group">
    <button className={`${className} dropdown-toggle tippy-here`} data-bs-toggle="dropdown">
      {icon?.icon ? <i className={icon?.icon} style={{ color: icon?.color ?? '#343a40' }}></i> : ''} {title}
    </button>
    <ul className="dropdown-menu">
      {children}
    </ul>
  </div>
  if (!tippy) {
    return dropdown
  }
  return <Tippy content={tippy} arrow={true}>
    {dropdown}
  </Tippy>
}

export default Dropdown