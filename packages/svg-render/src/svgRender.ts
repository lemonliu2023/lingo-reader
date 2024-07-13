import { measureFont } from "./measureFont"
import { SvgRenderOptions } from "./types"
import { Content, ContentType } from "@svg-ebook-reader/shared"

// TODO: handle svg style options
const defaultSvgRenderOptions: SvgRenderOptions = {
  width: 500,
  height: 500,
  fontFamily: 'Lucida Console, Courier, monospace',
  fontSize: 20,

  // svg style
  opacity: 1,
  lineHeightRatio: -1,
  backgroundColor: '#f0f0f0',
  borderRadius: 0,
  selectionbgColor: '#b4d5ea',
  selectionColor: '',
  cursor: 'default',
  padding: '20',
  paddingLeft: 0,
  paddingRight: 0,
  paddingTop: 0,
  paddingBottom: 0,

  // used for playwright font loading
  remoteFontCSSURL: ''
}

const charMap = new Map<string, string>([
  // space will not be rendered in the beginning of the text
  [' ', '&#xA0;'],
  ['<', '&lt;'],
  ['>', '&gt;'],
  ['&', '&amp;'],
  ['"', '&quot;'],
  ['\'', '&#39;'],
])

export class SvgRender {
  options: Required<SvgRenderOptions>
  background: string = ''
  // svg>text position, left bottom corner
  x: number = 0
  y: number = 0
  deltaY: number = 0
  pageIndex: number = 0
  pages: string[] = []
  // text content in the svg
  pageText: string[] = []
  constructor(options: SvgRenderOptions) {
    this.options = {
      ...defaultSvgRenderOptions,
      ...options
    } as Required<SvgRenderOptions>

    this.parsePadding()
    this.x = this.options.paddingLeft
    this.y = this.options.paddingTop + this.options.fontSize
    this.deltaY = this.options.fontSize
    this.background = this.generateRect()
  }

  async addContents(contents: Content[]) {
    for (const content of contents) {
      await this.addContent(content)
    }
  }

  async addContent(content: Content) {
    if (content.type === ContentType.PARAGRAPH) {
      await this.addParagraph(content.text)
    }
    this.commitToPage()
  }

  async addParagraph(text: string) {
    for (const char of text) {
      if (charMap.has(char)) {
        this.pageText.push(`<text x="${this.x}" y="${this.y}">${charMap.get(char)}</text>`)
      } else {
        this.pageText.push(`<text x="${this.x}" y="${this.y}">${char}</text>`)
      }
      const {
        width: charWidth
      } = await this.measureFont(char)
      this.x += charWidth
      // newLine
      if (this.x > this.options.width - this.options.paddingRight) {
        this.newLine()
      }
      // newPage
      if (this.y > this.options.height - this.options.paddingBottom) {
        this.commitToPage()
        this.newPage()
      }
    }
  }

  newLine() {
    this.x = this.options.paddingLeft
    this.y += this.deltaY
  }

  commitToPage() {
    this.pages[this.pageIndex] = this.generateSvg(this.pageText.join(''))
  }

  newPage() {
    this.pageText = []
    this.x = this.options.paddingLeft
    this.y = this.options.paddingTop + this.options.fontSize
    this.pageIndex++
  }

  generateSvg(content: string) {
    const { width, height, fontSize, fontFamily } = this.options
    return `<svg xmlns="http://www.w3.org/2000/svg" version="1.1" font-size="${fontSize}px" `
      + `viewBox="0 0 ${width} ${height}" width="${width}px" height="${height}px" font-family="${fontFamily}">`
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

  async measureFont(char: string) {
    const { fontFamily, fontSize } = this.options
    return await measureFont(char, {
      fontFamily,
      fontSize
    })
  }
}
