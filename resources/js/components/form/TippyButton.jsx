import React from "react"
import Tippy from "@tippyjs/react"
import 'tippy.js/dist/tippy.css';

const TippyButton = ({ title, className, onClick, children, eRef, ...props }) => {
  return <Tippy content={title} arrow={true}>
    <span ref={eRef} className={className} onClick={onClick} {...props} style={{
      ...props.style,
      backgroundColor: 'transparent',
      border: 0,
      padding: 0,
      fontSize: '14px',
      color: '#71b6f9'
    }} >
      {children}
    </span>
  </Tippy>
}

export default TippyButton