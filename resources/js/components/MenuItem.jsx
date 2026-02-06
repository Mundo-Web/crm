import React from 'react'

const MenuItem = ({ id, className = '', href, icon, children, badge }) => {
  return (
    <li className={`${location.pathname == href ? 'menuitem-active' : ''} ${className}`}>
      <a id={id} href={href} className={location.pathname == href ? 'active' : ''}>
        <i className={`${icon} mdi-18px`}></i>
        {
          badge && <span className="badge bg-info float-end text-truncate">{badge}</span>
        }
        <span style={{fontSize: '16px'}}> {children} </span>
      </a>
    </li>
  )
}

export default MenuItem