import React from "react"
import { renderToString } from "react-dom/server"

const DxPanelButton = ({ className = 'btn btn-xs btn-default rounded-pill', location = 'after', icon, text, title, onClick = () => { } }) => {
  return {
    widget: 'dxButton', location,
    options: {
      icon,
      text,
      hint: title,
      onClick,
      template: (data, container) => {
        container.parent().attr('style', 'border: none !important; background: transparent !important')
        container.attr('class', className)
        container.html(renderToString(<>
          {data.icon && <i className={`${data.icon} me-1`}></i>}
          {data.text}
        </>))
      }
    }
  }
}

export default DxPanelButton