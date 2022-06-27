export function formatCurrency(value, decimals, truncate = true) {
  // avoid false formatting of e - notated numbers
  if (value < Math.pow(10, decimals * -1)) {
    value = 0
  }

  return formatCurrencyMinMaxDecimals(value, {
    minDecimals: typeof decimals === 'number' ? decimals : 2,
    maxDecimals: typeof decimals === 'number' ? decimals : 5,
    truncate,
  })
}

export function formatCurrencyMinMaxDecimals(
  value,
  { minDecimals, maxDecimals, truncate, floorInsteadOfRound = false }
) {
  if (value === '') {
    return '0.00'
  } else if (Number.isNaN(parseFloat(value))) {
    return '0.00'
  }

  let valueToUse = value
  if (truncate) {
    valueToUse = truncateDecimals(value, maxDecimals)
  } else if (floorInsteadOfRound) {
    valueToUse =
      Math.floor(parseFloat(value) * Math.pow(10, maxDecimals)) /
      Math.pow(10, maxDecimals)
  }
  const options = {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  }

  return parseFloat(valueToUse).toLocaleString('en', options)
}

/**
 * Takes a number and truncates decimals values and
 * returns it as a string
 *
 * @param {String|Number} value Value to truncate
 * @param {Number} decimals Number of decimals to truncate to
 *
 * @returns {String} Truncated decimal value
 */
export function truncateDecimals(value, decimals = 6) {
  if (!value) return value
  const [whole, fraction] = value.toString().split('.')

  if (!fraction || fraction.length <= decimals) {
    // No change
    return value.toString()
  }

  // truncate decimals & return
  return `${whole}.${fraction.slice(0, decimals)}`
}