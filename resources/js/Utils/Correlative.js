const Correlative = (text) => {
  return String(text).toLowerCase().split(' ').map(x => x.trim()).filter(Boolean).join('-')
}

export default Correlative