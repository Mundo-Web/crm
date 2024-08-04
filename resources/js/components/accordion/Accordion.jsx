import React from "react"

const Accordion = ({ id, children, className }) => {
  return <div id={id} className={`accordion custom-accordion ${className}`}>
    {children}
  </div>
}

export default Accordion