import type { ParagraphOptions } from './types'

export function svgRect(
  x: number = 0,
  y: number = 0,
  width: number,
  height: number,
  backgroundColor: string,
) {
  return `<rect x="${x}" y="${y}" width="${width}" height="${height}" `
    + `fill="${backgroundColor}" pointer-events="none"/>`
}

export function svgLine(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  strokeWidth: number = 1,
  stroke: string = 'black',
) {
  return `<line x1="${x1}" y1="${y1 + strokeWidth + 1}" x2="${x2}" `
    + `y2="${y2 + strokeWidth + 1}" stroke="${stroke}" `
    + `stroke-width="${strokeWidth}" pointer-events="none"/>`
}

export function svgImage(
  x: number,
  y: number,
  src: string,
  offset: string,
  alt: string,
  height: number,
  width: number,
) {
  const altStr = alt.length ? ` alt="${alt}"` : ''
  return `<image x="${x}" y="${y}" offset="${offset}" height="${height}" width="${width}" href="${src}"${altStr}/>`
}

// text tag in svg
export function svgText(
  x: number,
  y: number,
  char: string,
  offset: string,
  options: ParagraphOptions,
) {
  const styleArr = []
  if (options.fontWeight) {
    styleArr.push(`font-weight:${options.fontWeight};`)
  }
  if (
    typeof options.fontSize !== 'undefined'
    && options.fontSize >= 0
  ) {
    styleArr.push(`font-size:${options.fontSize}px;`)
  }
  let style = ''
  if (styleArr.length) {
    style = `style="${styleArr.join('')}"`
  }
  return `<text x="${x}" y="${y}" offset="${offset}" ${style}>${char}</text>`
}
