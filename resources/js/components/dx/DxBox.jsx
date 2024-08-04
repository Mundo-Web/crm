import React, { isValidElement } from "react"
import { createRoot } from "react-dom/client"
import { renderToString } from "react-dom/server"

const DxBox = (items, hasHooks = true) => {
  return $("<div>")
    .css({
      display: "flex",
      gap: '8px',
      alignItems: "flex-center",
      justifyContent: "flex-start"
    })
    .dxBox({
      direction: "row",
      items: items.filter(Boolean).map(item => ({
        ratio: 0,
        baseSize: "auto",
        template: function (props, pos, container) {
          if (hasHooks) {
            if (isValidElement(item)) {
              const div = document.createElement('div')
              createRoot(div).render(item)
              container.append(div)
            } else {
              const div = document.createElement('div')
              div.style.width = item.width
              div.style.height = item.height
              createRoot(div).render(item.children)
              container.append(div)
            }
          } else {
            container.append(renderToString(item))
          }
        }
      }))
    })
}

export default DxBox