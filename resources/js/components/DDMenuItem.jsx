import React, { useState, useEffect, useRef } from 'react'

const DDMenuItem = ({ id, className = '', href, icon, children, badge, pinned, setPinned, pinLabel }) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const itemRef = useRef(null)

  const handleContextMenu = (e) => {
    e.preventDefault()
    setShowDropdown(true)
  }

  const handlePin = () => {
    const exists = pinned.some(p => p.href === href);
    if (exists) {
      setPinned(prev => prev.filter(p => p.href !== href));
    } else {
      setPinned(prev => [...prev, { icon, href, name: pinLabel ?? children }]);
    }
    setShowDropdown(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (itemRef.current && !itemRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const isPinned = pinned.some(p => p.href === href);

  return (
    <div
      ref={itemRef}
      className={`dropdown-item notify-item ${location.pathname == href ? 'menuitem-active' : ''} ${className}`}
      onContextMenu={handleContextMenu}
      style={{ position: 'relative' }}
    >
      <a href={href} style={{color: 'unset'}}>
        <i className={`${icon} me-1`} />
        <span>{children}</span>
      </a>
      {showDropdown && (
        <div
          className="dropdown-menu show"
          style={{
            position: 'absolute',
            top: '100%',
            left: 20,
            zIndex: 1000,
            display: 'block',
            float: 'left',
            minWidth: '8rem',
            padding: '0.125rem 0',
            margin: '0.125rem 0 0',
            fontSize: '1rem',
            color: '#212529',
            textAlign: 'left',
            listStyle: 'none',
            backgroundColor: '#fff',
            backgroundClip: 'padding-box',
            border: '1px solid rgba(0,0,0,.15)',
            borderRadius: '0.25rem'
          }}
        >
          <button className="dropdown-item" onClick={handlePin}>
            <i className={`mdi ${isPinned ? 'mdi-pin-off' : 'mdi-pin'} me-1`} />
            {isPinned ? 'Desfijar' : 'Fijar'}
          </button>
        </div>
      )}
    </div>
  )
}

export default DDMenuItem