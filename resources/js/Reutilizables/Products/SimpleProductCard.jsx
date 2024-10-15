import Tippy from "@tippyjs/react"
import React, { useState, useRef, useEffect } from "react"
import Number2Currency from "../../Utils/Number2Currency"

const SimpleProductCard = ({ onChange = () => { }, onDelete = () => { }, ...product }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [price, setPrice] = useState(product.pivot_price)
  const inputRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (inputRef.current && !inputRef.current.contains(event.target)) {
        setIsEditing(false)
        if (price !== product.price) {
          console.log('cambio a:', price)
          onChange({ ...product, price })
        }
      }
    }
    if (isEditing) {
      document.addEventListener("mousedown", handleClickOutside)
    } else {
      document.removeEventListener("mousedown", handleClickOutside)
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isEditing, price, product, onChange])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      setIsEditing(false)
      if (price !== product.price) {
        console.log('cambio a:', price)
        onChange({ ...product, price })
      }
    }
  }

  return (
    <>
      <div
        className="card mb-0"
        style={{
          border: `1px solid ${product.color}44`,
          backgroundColor: `${product.color}11`,
        }}
      >
        <div className="card-body p-2">
          <div className="float-end">
            <Tippy content="Quitar producto">
              <i
                className="fa fa-times"
                onClick={() => onDelete(product)}
                style={{ cursor: "pointer" }}
              ></i>
            </Tippy>
          </div>

          <h5
            className="header-title mt-0 mb-1"
            style={{ fontSize: "14.4px", color: product.color }}
          >
            {product.name}
          </h5>
          {isEditing ? (
            <input
              ref={inputRef}
              className="form-control form-control-sm"
              type="number"
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              onKeyDown={handleKeyDown}
            />
          ) : (
            <small
              onClick={() => setIsEditing(true)}
              style={{ cursor: "text" }}
            >
              S/. {Number2Currency(price)}
            </small>
          )}
        </div>
      </div>
    </>
  )
}

export default SimpleProductCard
