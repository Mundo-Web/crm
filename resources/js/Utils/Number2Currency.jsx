const Number2Currency = (number, currency = 'en-US') => {
  return (Number(number) || 0)
    .toLocaleString(currency, {
      maximumFractionDigits: 2,
      minimumFractionDigits: 2
    })
}

export default Number2Currency