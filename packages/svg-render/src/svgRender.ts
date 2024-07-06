import { SvgRenderOptions } from "./types"

// TODO: handle svg style options
const defaultSvgRenderOptions: SvgRenderOptions = {
  width: 500,
  height: 500,
  fontFamily: '"Lucida Console", Courier, monospace',
  fontSize: 20,

  // svg style
  opacity: 1,
  lineHeightRatio: -1,
  backgroundColor: '#f0f0f0',
  borderRadius: 0,
  selectionbgColor: '#b4d5ea',
  selectionColor: '',
  cursor: 'default',
  padding: '10',
  paddingLeft: 0,
  paddingRight: 0,
  paddingTop: 0,
  paddingBottom: 0,

  // used for playwright font loading
  remoteFontCSSURL: ''
}

export class SvgRender {
  options: Required<SvgRenderOptions>
  background: string = ''
  constructor(options: SvgRenderOptions) {
    this.options = {
      ...defaultSvgRenderOptions,
      ...options
    } as Required<SvgRenderOptions>
    this.parsePadding()
    this.background = this.generateRect()
  }

  generateSvg(content: string) {
    const { width, height, fontSize } = this.options
    return `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" font-size="${fontSize}px" `
      + `viewBox="0 0 ${width} ${height}" width="${width}px" height="${height}px">`
      + this.background
      + `${content}`
      + '</svg>'
  }

  generateRect() {
    const { width, height, backgroundColor } = this.options
    return `<rect width="${width}" height="${height}"`
      + ` fill="${backgroundColor}" pointer-events="none"/>`
  }

  parsePadding() {
    const paddingSplit = this.options.padding!.split(' ').map(val => parseInt(val))
    if (paddingSplit.length > 4) {
      throw new Error('padding should be 1-4 values with " " separated')
    }
    let paddingArr = [0, 0, 0, 0]
    if (paddingSplit.length === 1) {
      paddingArr = [paddingSplit[0], paddingSplit[0], paddingSplit[0], paddingSplit[0]]
    } else if (paddingSplit.length === 2) {
      paddingArr = [paddingSplit[0], paddingSplit[1], paddingSplit[0], paddingSplit[1]]
    } else if (paddingSplit.length === 3) {
      paddingArr = [paddingSplit[0], paddingSplit[1], paddingSplit[2], paddingSplit[1]]
    } else if (paddingSplit.length === 4) {
      paddingArr = paddingSplit
    }
    this.options.paddingTop = paddingArr[0]
    this.options.paddingRight = paddingArr[1]
    this.options.paddingBottom = paddingArr[2]
    this.options.paddingLeft = paddingArr[3]
  }
}
