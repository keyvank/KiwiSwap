/**
 * Converts a number to its Persian representation
 * @param num The number to convert
 * @returns The Persian representation of the number
 */
export function toPersianRepresentation(num: string | number): string {
  if (!num || isNaN(Number(num))) return ""

  const value = Number(num)

  // Convert to Persian digits
  const persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"]

  // Handle different scales
  if (value >= 1_000_000_000) {
    const billions = value / 1_000_000_000
    return `${convertToPersianDigits(billions.toFixed(1))} میلیارد`
  } else if (value >= 1_000_000) {
    const millions = value / 1_000_000
    return `${convertToPersianDigits(millions.toFixed(1))} میلیون`
  } else if (value >= 1_000) {
    const thousands = value / 1_000
    return `${convertToPersianDigits(thousands.toFixed(1))} هزار`
  } else {
    return convertToPersianDigits(value.toString())
  }

  // Helper function to convert digits to Persian
  function convertToPersianDigits(str: string): string {
    return str.replace(/[0-9]/g, (d) => persianDigits[Number.parseInt(d)])
  }
}

