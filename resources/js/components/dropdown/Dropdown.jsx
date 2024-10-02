import Tippy from "@tippyjs/react"
import React from "react"

const Dropdown = ({ ddRef, className, title, icon = {}, children, tippy, show = true, style = {} }) => {
  const dropdown = <div className="btn-group" ref={ddRef}>
    <button className={`${className} dropdown-toggle tippy-here`} data-bs-toggle={show && "dropdown"} style={style}>
      {icon?.icon ? <i className={icon?.icon} style={{ color: icon?.color ?? '#343a40' }}></i> : ''} {title}
    </button>
    {
      show &&
      <ul className="dropdown-menu">
        {children}
      </ul>
    }
  </div>
  if (!tippy) {
    return dropdown
  }
  return <Tippy content={tippy} arrow={true}>
    {dropdown}
  </Tippy>
}

export default Dropdown