import React from 'react'

const MenuItemContainer = ({ title, icon, children }) => {

  const getHrefs = (children) => {
    let hrefs = [];
    React.Children.forEach(children, (child) => {
      if (!child) return;
      if (child.props && child.props.href) {
        hrefs.push(child.props.href);
      }
      if (child.props && child.props.children) {
        hrefs = hrefs.concat(getHrefs(child.props.children));
      }
    });
    return hrefs;
  };

  const refs = getHrefs(children);
  const isExpanded = refs.filter(Boolean).some(x => location.pathname === x || location.pathname.startsWith(x + '/'))

  const id = `item-${crypto.randomUUID()}`

  return (
    <li>
      <a href={`#${id}`} data-bs-toggle="collapse" aria-expanded={isExpanded} className='d-flex align-items-center gap-1'>
        <i className={`${icon} mdi-24px`}></i>
        <span style={{ fontSize: '16px' }}> {title} </span>
        <span className="menu-arrow"></span>
      </a>
      <div className={`collapse ${isExpanded && 'show'}`} id={id} style={{ paddingRight: '8px' }}>
        <ul className="nav-second-level">
          {children}
        </ul>
      </div>
    </li>
  )
}

export default MenuItemContainer