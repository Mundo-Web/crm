const SetSelectValue = (select, idOrValues, textOrId, label) => {
  $(select).empty()
  if (!idOrValues) return
  if (Array.isArray(idOrValues)) {
    idOrValues.forEach(({ [textOrId]: id, [label]: text }) => {
      const option = document.createElement('option')
      option.value = id
      option.text = text
      option.selected = true
      $(select).append(option)
    })
  } else {
    const option = document.createElement('option')
    option.value = idOrValues
    option.text = textOrId ?? idOrValues
    $(select).append(option)
    $(select).val(idOrValues)
  }
  $(select).trigger('change')
}

export default SetSelectValue