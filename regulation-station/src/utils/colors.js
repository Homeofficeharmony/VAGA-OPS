export const ACCENT_HEX = {
  red:   '#c4604a',
  amber: '#c8a040',
  green: '#52b87e',
}

export const getAccentHex = (accent) => ACCENT_HEX[accent] ?? '#52b87e'
