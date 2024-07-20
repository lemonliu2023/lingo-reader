import { measureFont } from "./measureFont"
import { SvgRenderOptions, ParagraphOptions } from "./types"
import { Content, ContentType } from "@svg-ebook-reader/shared"
import { isEnglish, isSpace, charMap, headingRatioMap, isPunctuation } from "./utils"
import { fileURLToPath } from "url"
import path from "path"

const currDir = fileURLToPath(import.meta.url)
const imageDir = path.resolve(currDir, '../../images/')

// TODO: handle svg style options
const defaultSvgRenderOptions: SvgRenderOptions = {
  width: 1000,
  height: 1000,
  fontFamily: 'Lucida Console, Courier, monospace',
  fontSize: 20,
  imageRoot: imageDir,
  lineHeightRatio: 1.5,
  padding: '20',
  paddingLeft: 0,
  paddingRight: 0,
  paddingTop: 0,
  paddingBottom: 0,

  // svg style
  opacity: 1,
  backgroundColor: '#f0f0f0',
  borderRadius: 0,
  selectionbgColor: '#b4d5ea',
  selectionColor: '',
  cursor: 'default',

  // used for playwright to font loading
  remoteFontCSSURL: ''
}

const SVGPlaceholder = '##{content}##'

export class SvgRender {
  public options: Required<SvgRenderOptions>
  public svg: string = ''
  // svg>text position, left bottom corner
  private x: number = 0
  private y: number = 0
  public lineHeight: number = 0
  private pageIndex: number = 0
  public pages: string[] = []
  // text content in the svg
  private pageText: string[] = []
  constructor(options: SvgRenderOptions) {
    this.options = {
      ...defaultSvgRenderOptions,
      ...options
    } as Required<SvgRenderOptions>

    this.parsePadding()

    const {
      paddingTop,
      paddingLeft,
      fontSize,
      lineHeightRatio
    } = this.options
    this.x = paddingLeft
    this.y = paddingTop
    this.lineHeight = fontSize * lineHeightRatio

    this.svg = this.generateSvg()
  }

  public async addContents(contents: Content[]) {
    for (const content of contents) {
      await this.addContent(content)
    }
    this.commitToPage()
  }

  public async addContent(content: Content) {
    // 1.new line
    // 2.render content
    const contentType = content.type
    if (contentType === ContentType.PARAGRAPH) {
      this.newLine(this.lineHeight)
      await this.addParagraph(content.text, {
        lineHeight: this.lineHeight
      })
    } else if (
      contentType === ContentType.HEADING1 ||
      contentType === ContentType.HEADING2 ||
      contentType === ContentType.HEADING3 ||
      contentType === ContentType.HEADING4 ||
      contentType === ContentType.HEADING5 ||
      contentType === ContentType.HEADING6
    ) {
      const levelRatio = headingRatioMap.get(contentType)!
      const headingFontSize = this.options.fontSize * levelRatio
      const headingLineHeight = headingFontSize * this.options.lineHeightRatio

      this.newLine(headingLineHeight)
      await this.addParagraph(content.heading, {
        fontWeight: 'bold',
        fontSize: headingFontSize,
        lineHeight: headingLineHeight
      })
    } else if (contentType === ContentType.IMAGE) {
      const occupyHeight = 3.5 * this.lineHeight
      this.newLine(occupyHeight)
      this.addImage(
        content.src,
        content.alt,
        content.width,
        content.height
      )
    }
    this.commitToPage()
  }

  private async addParagraph(text: string, paraOptions: ParagraphOptions) {
    const textLen = text.length
    const fontSize = paraOptions?.fontSize || this.options.fontSize
    const lineHeight = paraOptions.lineHeight || this.lineHeight
    const {
      width,
      height,
      paddingLeft,
      paddingBottom,
    } = this.options

    for (let i = 0; i < textLen; i++) {
      const char = text[i]
      if (char === '\n') {
        this.newLine(lineHeight)
        continue
      }

      const {
        width: charWidth
      } = await this.measureFont(char, fontSize, paraOptions.fontWeight)

      // newLine
      if (this.x + charWidth > width - paddingLeft) {
        const prevChar = text[i - 1]
        if (!isSpace(prevChar) && isSpace(char)) {
          this.newLine(lineHeight)
          continue
        } else if (isEnglish(prevChar) && isEnglish(char)) {
          this.pageText.push(
            // <text x="x" y="y">-</text>
            this.generateText(this.x, this.y, '-', paraOptions)
          )
          this.newLine(lineHeight)
        } else if (isEnglish(prevChar) && isPunctuation(char)) {
          this.pageText.push(
            // <text x="x" y="y">char</text>
            this.generateText(this.x, this.y, char, paraOptions)
          )
          continue
        } else {
          this.newLine(lineHeight)
        }
      }

      // newPage
      if (this.y + this.lineHeight > height - paddingBottom) {
        this.commitToPage()
        this.newPage()
        this.newLine(this.lineHeight)
      }
      if (charMap.has(char)) {
        // <text x="x" y="y">charMap.get(char)</text>
        this.pageText.push(
          this.generateText(this.x, this.y, charMap.get(char)!, paraOptions)
        )
      } else {
        // <text x="x" y="y">char</text>
        this.pageText.push(
          this.generateText(this.x, this.y, char, paraOptions)
        )
      }
      this.x += charWidth
    }
  }

  private addImage(
    src: string,
    alt: string = '',
    imageWidth?: number,
    imageHeight?: number,
  ) {
    if (!path.isAbsolute(src)) {
      src = path.resolve(this.options.imageRoot, src)
    }
    const remainHeight = this.options.height - this.y + this.lineHeight
    const renderHeight = 3 * this.lineHeight
    if (remainHeight < renderHeight) {
      this.commitToPage()
      this.newPage()
    }
    const renderY = this.y - renderHeight
    let renderX = this.x
    if (imageWidth && imageHeight) {
      const scale = renderHeight / imageHeight
      const renderWidth = imageWidth * scale
      renderX = (this.options.width - renderWidth) / 2
    }
    this.pageText.push(
      this.generateImage(renderX, renderY, src, alt, renderHeight)
    )
  }

  private generateText(
    x: number,
    y: number,
    char: string,
    options: ParagraphOptions
  ) {
    let styleArr = []
    if (options.fontWeight) {
      styleArr.push(`font-weight:${options.fontWeight};`)
    }
    if (options.fontSize) {
      styleArr.push(`font-size:${options.fontSize}px;`)
    }
    let style = ''
    if (styleArr.length) {
      style = ` style="${styleArr.join('')}"`
    }
    return `<text x="${x}" y="${y}"${style}>${char}</text>`
  }

  private generateImage(
    x: number,
    y: number,
    src: string,
    alt: string,
    height: number
  ) {
    const altStr = alt.length ? ' alt="${alt}"' : ''
    return `<image x="${x}" y="${y}" height="${height}" href="${src}"${altStr}/>`
  }

  private newLine(lineHeight: number) {
    this.x = this.options.paddingLeft
    this.y += lineHeight
  }

  private commitToPage() {
    if (this.pageText.length) {
      this.pages[this.pageIndex] = this.svg.replace(
        SVGPlaceholder, 
        this.pageText.join('')
      )
    }
  }

  private newPage() {
    const {
      paddingLeft,
      paddingTop
    } = this.options

    this.pageText = []
    this.x = paddingLeft
    this.y = paddingTop
    this.pageIndex++
  }

  private async measureFont(
    char: string,
    fontSize: number = this.options.fontSize,
    fontWeight?: string
  ) {
    const { fontFamily } = this.options
    if (!fontSize) {
      fontSize = this.options.fontSize
    }
    return await measureFont(char, {
      fontFamily,
      fontSize,
      fontWeight
    })
  }

  private generateSvg() {
    const { width, height, fontSize, fontFamily } = this.options
    const svgId = 'svg' + Math.random().toString(36).substring(2, 9)
    return `<svg id="${svgId}" xmlns="http://www.w3.org/2000/svg" version="1.1" font-size="${fontSize}px" `
      + `viewBox="0 0 ${width} ${height}" width="${width}px" height="${height}px" font-family="${fontFamily}">`
      + this.generateStyle(svgId)
      + this.generateRect()
      + SVGPlaceholder
      + '</svg>'
  }
  
  private generateStyle(svgId: string) {
    const {
      borderRadius,
      cursor,
      opacity,
      selectionbgColor,
      selectionColor
    } = this.options

    // svg css
    let svgStyle = `#${svgId}{`
    svgStyle += `cursor:${cursor};`
    if (opacity < 1 && opacity >= 0) {
      svgStyle += `opacity:${opacity};`
    }
    if (borderRadius > 0) {
      svgStyle += `border-radius:${borderRadius}px;`
    }
    svgStyle += '}'
    // selection css
    let svgSelectionStyle = `#${svgId} text::selection{`
    svgSelectionStyle += `background-color:${selectionbgColor};`
    if (selectionColor.length > 0) {
      svgSelectionStyle += `fill:${selectionColor};`
    }
    svgSelectionStyle += '}'
    return `<style>${svgStyle}${svgSelectionStyle}</style>`
  }

  private generateRect() {
    const { width, height, backgroundColor } = this.options
    return `<rect width="${width}" height="${height}" `
      + `fill="${backgroundColor}" pointer-events="none"/>`
  }

  private parsePadding() {
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
