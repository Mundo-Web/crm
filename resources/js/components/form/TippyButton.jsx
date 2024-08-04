import React from "react"
import Tippy from "@tippyjs/react"
import 'tippy.js/dist/tippy.css';

const TippyButton = ({ title, className, onClick, children, eRef, ...props }) => {
  return <Tippy content={title} arrow={true}>
    <button ref={eRef} className={className} onClick={onClick} {...props}>
      {children}
    </button>
  </Tippy>
}

export default TippyButton