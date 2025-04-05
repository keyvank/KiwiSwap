/**
 * Simple utility to generate a deterministic color from a string (like an address)
 */
export function stringToColor(str: string): string {
  // Use a simple hash function to get a number from the string
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }

  // Convert the hash to a color
  const c = (hash & 0x00ffffff).toString(16).toUpperCase()

  // Pad with zeros
  return "#" + "00000".substring(0, 6 - c.length) + c
}

/**
 * Generate a simple SVG identicon based on an address
 */
export function generateIdenticon(address: string): string {
  // Normalize the address
  const normalizedAddress = address.toLowerCase()

  // Generate a background color from the address
  const backgroundColor = stringToColor(normalizedAddress)

  // Generate a foreground color (contrasting with background)
  const foregroundColor = getContrastingColor(backgroundColor)

  // Create a 5x5 grid of cells that will be either on or off
  const grid = []
  for (let i = 0; i < 25; i++) {
    // Use the address characters to determine if a cell is on or off
    // This ensures the pattern is deterministic based on the address
    const charIndex = i % normalizedAddress.length
    const charCode = normalizedAddress.charCodeAt(charIndex)
    grid.push(charCode % 2 === 0)
  }

  // Create an SVG with the grid
  let svg = `<svg width="64" height="64" viewBox="0 0 5 5" xmlns="http://www.w3.org/2000/svg">
    <rect width="5" height="5" fill="${backgroundColor}" />`

  // Add cells to the SVG
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      // Only draw the left half and mirror it for symmetry
      if (j < 3) {
        const index = i * 5 + j
        if (grid[index]) {
          svg += `<rect x="${j}" y="${i}" width="1" height="1" fill="${foregroundColor}" />`
          // Mirror the left side to the right for symmetry (except the middle column)
          if (j < 2) {
            svg += `<rect x="${4 - j}" y="${i}" width="1" height="1" fill="${foregroundColor}" />`
          }
        }
      }
    }
  }

  svg += "</svg>"

  // Convert SVG to a data URL
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

/**
 * Get a contrasting color (black or white) based on the background color
 */
function getContrastingColor(hexColor: string): string {
  // Convert hex to RGB
  const r = Number.parseInt(hexColor.slice(1, 3), 16)
  const g = Number.parseInt(hexColor.slice(3, 5), 16)
  const b = Number.parseInt(hexColor.slice(5, 7), 16)

  // Calculate luminance - a measure of how bright the color appears
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  // Return black for bright colors, white for dark colors
  return luminance > 0.5 ? "#000000" : "#FFFFFF"
}

