const DxButton = ({ className, title, icon, onClick, ...props }) => {
  return $("<div>").dxButton({
    hint: title,
    template: (element, content) => {
      content.addClass(`${icon} d-block`)
    },
    elementAttr: {
      class: `${className} position-relative me-1 px-1 py-0 tippy-here`,
      ...props
    },
    onClick
  })
}

export default DxButton