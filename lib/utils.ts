export const formatNumber = (num: string) => {
  const value = Number.parseFloat(num)
  return isNaN(value) ? "0" : value.toFixed(6)
}

export function cn(...inputs: (string | undefined | null)[]): string {
  return inputs.filter(Boolean).join(" ")
}

