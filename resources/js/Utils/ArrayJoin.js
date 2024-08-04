const ArrayJoin = (array = [], separator) => {
  const newArray = []
  array.forEach((x, i) => {
    if (i == 0) {
      newArray.push(x)
    } else {
      newArray.push(separator, x)
    }
  })
  return newArray
}

export default ArrayJoin