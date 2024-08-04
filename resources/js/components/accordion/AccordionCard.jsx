import React from "react";

const AccordionCard = ({ title, id, parent, children, className, isOpened }) => {
  return <div className="card mb-1">
    <div className="card-header p-0" id={`heading-${id}`}>
      <h5 className="m-0">
        <a className={`d-block text-dark ${!isOpened && 'collapsed'} p-2`} data-bs-toggle="collapse" href={`#${id}`} aria-expanded="false">
          {title}
        </a>
      </h5>
    </div>

    <div id={id} className={`collapse ${isOpened && 'show'}`} aria-labelledby={`heading-${id}`} data-bs-parent={`#${parent}`}>
      <div className={`card-body p-2 ${className}`}>
        {children}
      </div>
    </div>
  </div>
}

export default AccordionCard