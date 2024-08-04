import React from 'react'

const MenuItemContainer = ({ title, icon, children }) => {
  
  const refs = []
  if (Array.isArray(children)) {
    children.forEach(child => refs.push(child?.props?.href))
  } else {
    refs.push(children?.props?.href)
  }
  const isExpanded = refs.filter(Boolean).some(x => location.pathname.includes(x))
  
  const id = `item-${crypto.randomUUID()}`
  return (
    <li>
      <a href={`#${id}`} data-bs-toggle="collapse" aria-expanded={isExpanded} >
        <i className={icon}></i>
        <span> {title} </span>
        <span className="menu-arrow"></span>
      </a>
      <div className={`collapse ${isExpanded && 'show'}`} id={id}>
        <ul className="nav-second-level">
          {children}
        </ul>
      </div>
    </li>
  )
}

export default MenuItemContainer