import React from "react"

const ProductCard = ({ className, ribbon, children, ...props }) => {
  return <article className={`pricing-column ${className} mb-0`} {...props}>
    {
      ribbon
        ? <div className="ribbon" style={{ left: -5 }}><span>{ribbon}</span></div>
        : ''
    }
    <div className="card mb-0">
      <div className="inner-box card-body p-2">
        {children}
      </div>
    </div>
  </article>
}

export default ProductCard