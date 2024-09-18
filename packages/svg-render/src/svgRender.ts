import { resolve } from 'node:path'
import process from 'node:process'
import type { Content, UlOrOlList } from '@svg-ebook-reader/shared'
import { ContentType } from '@svg-ebook-reader/shared'
import { measureFont } from './measureFont'
import type { ParagraphOptions, SvgRenderOptions } from './types'
import { charMap, headingRatioMap, isEnglish, isPunctuation, isSpace } from './utils'
import { measureImage } from './measureImage'
import {
  svgImage,
  svgLine,
  svgRect,
  svgText,
} from './svgTags'

const defaultSvgRenderOptions: SvgRenderOptions = {
  width: 1474,
  height: 743,
  fontFamily: 'Lucida Console, Courier, monospace',
  fontSize: 20,
  imageRoot: './images',
  lineHeightRatio: 1.5,
  padding: '40',
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
  remoteFontCSSURL: '',
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
      ...options,
    } as Required<SvgRenderOptions>

    this.options.imageRoot = resolve(process.cwd(), this.options.imageRoot)
    this.parsePadding()

    const {
      paddingTop,
      paddingLeft,
      fontSize,
      lineHeightRatio,
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
        lineHeight: this.lineHeight,
      })
    }
    else if (
      contentType === ContentType.HEADING1
      || contentType === ContentType.HEADING2
      || contentType === ContentType.HEADING3
      || contentType === ContentType.HEADING4
      || contentType === ContentType.HEADING5
      || contentType === ContentType.HEADING6
    ) {
      const levelRatio = headingRatioMap.get(contentType)!
      const headingFontSize = this.options.fontSize * levelRatio
      const headingLineHeight = headingFontSize * this.options.lineHeightRatio

      this.newLine(headingLineHeight)
      await this.addParagraph(content.heading, {
        fontWeight: 'bold',
        fontSize: headingFontSize,
        lineHeight: headingLineHeight,
      })
    }
    else if (contentType === ContentType.IMAGE) {
      await this.addImage(
        content.src,
        content.alt,
        content.width,
        content.height,
        content.caption,
      )
    }
    else if (contentType === ContentType.CENTERPARAGRAPH) {
      // this.newLine() in addCenterParagraph's inner
      await this.addCenterParagraph(content.text)
    }
    else if (contentType === ContentType.CODEBLOCK) {
      const codeLines = await this.splitCode(content.text)
      await this.addCode(codeLines)
    }
    else if (contentType === ContentType.TABLE) {
      await this.addTable(content.table)
    }
    else if (contentType === ContentType.OL) {
      await this.addUlList('ol', content.list)
    }
    else if (contentType === ContentType.UL) {
      await this.addUlList('ul', content.list)
    }
    this.commitToPage()
  }

  private async addCode(codeLines: string[]) {
    const {
      height,
      paddingBottom,
    } = this.options
    const remainLineNum = Math.floor((height - this.y - paddingBottom) / this.lineHeight)
    if (codeLines.length > remainLineNum) {
      await this.addCodeInOnePage(codeLines.slice(0, remainLineNum - 1))
      this.commitToPage()
      this.newPage()
      await this.addCode(codeLines.slice(remainLineNum - 1))
    }
    else {
      await this.addCodeInOnePage(codeLines)
    }
  }

  private async addCodeInOnePage(codeLines: string[]) {
    const {
      width,
      paddingLeft,
      paddingRight,
    } = this.options
    this.pageText.push(
      svgRect(
        paddingLeft,
        this.y + 0.2 * this.lineHeight,
        width - paddingLeft - paddingRight,
        this.lineHeight * codeLines.length + 0.1 * this.lineHeight,
        '#e6e5e3',
      ),
    )

    for (const line of codeLines) {
      this.newLine(this.lineHeight)
      await this.addParagraph(line, {
        lineHeight: this.lineHeight,
      })
      this.pageText.push(
        svgText(
          this.x,
          this.y,
          '\u21B5',
          { fontSize: 0 },
        ),
      )
    }
  }

  private async splitCode(code: string) {
    const {
      width,
      paddingLeft,
      paddingRight,
    } = this.options
    const res: string[] = []
    const codeSplit = code.split(/\r?\n/)
    for (const line of codeSplit) {
      const splited = await this.splitCenterText(
        line,
        width - paddingLeft - paddingRight,
        false,
      )
      res.push(...splited)
    }
    return res
  }

  private async addTable(table: string[][]) {
    const {
      width,
      height,
      paddingLeft,
      paddingRight,
      paddingBottom,
    } = this.options
    const contentWidth = width - paddingLeft - paddingRight
    const tableColNum = table[0].length
    const cellWidth = contentWidth / tableColNum

    for (let j = 0; j < table.length; j++) {
      const line = table[j]
      this.newLine(this.lineHeight)
      if (this.y + this.lineHeight > height - paddingBottom) {
        this.commitToPage()
        this.newPage()
        this.newLine(this.lineHeight)
      }
      if (j === 0) {
        // top line
        this.pageText.push(
          svgLine(
            paddingLeft,
            this.y - this.lineHeight,
            paddingLeft + contentWidth,
            this.y - this.lineHeight,
          ),
        )
        // middle line
        this.pageText.push(
          svgLine(
            paddingLeft,
            this.y,
            paddingLeft + contentWidth,
            this.y,
          ),
        )
      }
      for (let i = 0; i < line.length; i++) {
        const cell = line[i]
        const cellStrWidth = await this.measureMultiCharWidth(cell)
        this.newLine(0, i * cellWidth + (cellWidth - cellStrWidth) / 2)
        await this.addParagraph(cell, {
          lineHeight: this.lineHeight,
        })
      }
    }
    this.pageText.push(
      svgLine(
        paddingLeft,
        this.y,
        paddingLeft + contentWidth,
        this.y,
      ),
    )
  }

  private async addUlList(type: string, list: UlOrOlList, index: number = 0) {
    for (let i = 0; i < list.length; i++) {
      const li = list[i]
      const pad = type === 'ul' ? '· ' : `${i + 1}.`
      if (li.type === ContentType.PARAGRAPH) {
        this.newLine(this.lineHeight, index * this.options.fontSize)
        await this.addParagraph(pad + li.text, {
          lineHeight: this.lineHeight,
        })
      }
      else if (li.type === ContentType.IMAGE) {
        await this.addImage(
          li.src,
          li.alt,
          li.width,
          li.height,
        )
        if (li.caption) {
          this.newLine(this.lineHeight)
          await this.addParagraph(pad + li.caption, {
            lineHeight: this.lineHeight,
          })
        }
      }
      else if (li.type === ContentType.UL) {
        await this.addUlList('ul', li.list, index + 1)
      }
      else if (li.type === ContentType.OL) {
        await this.addUlList('ol', li.list, index + 1)
      }
    }
  }

  private async addCenterParagraph(text: string) {
    const {
      width,
      paddingLeft,
      paddingRight,
    } = this.options
    const contentWidth = width - paddingLeft - paddingRight
    const lines = await this.splitCenterText(text, contentWidth)
    // normal paragraph
    for (let i = 0; i < lines.length - 1; i++) {
      this.newLine(this.lineHeight)
      await this.addParagraph(lines[i], {
        lineHeight: this.lineHeight,
      })
    }
    // center
    const lastLine = lines[lines.length - 1]
    const centerStrWidth = await this.measureMultiCharWidth(lastLine)
    const indent = (contentWidth - centerStrWidth) / 2
    this.newLine(this.lineHeight, indent)
    await this.addParagraph(lastLine, {
      lineHeight: this.lineHeight,
    })
  }

  private async splitCenterText(
    text: string,
    contentWidth: number,
    isText: boolean = true,
  ) {
    const res: string[] = []
    let strWidth = 0
    let str = ''
    for (let i = 0; i < text.length; i++) {
      const char = text[i]
      const { width: charWidth } = await this.measureFont(char)
      if (strWidth + charWidth > contentWidth) {
        if (isText && isEnglish(text[i])) {
          str += '-'
        }
        res.push(str)
        str = char
        strWidth = charWidth
      }
      else {
        str += char
        strWidth += charWidth
      }
    }
    res.push(str)
    return res
  }

  private async addParagraph(text: string, paraOptions: ParagraphOptions) {
    const textLen = text.length
    const fontSize = paraOptions?.fontSize || this.options.fontSize
    const lineHeight = paraOptions.lineHeight || this.lineHeight
    const {
      width,
      height,
      paddingRight,
      paddingBottom,
    } = this.options

    for (let i = 0; i < textLen; i++) {
      const char = text[i]
      if (char === '\n') {
        this.newLine(lineHeight)
        continue
      }

      const {
        width: charWidth,
      } = await this.measureFont(char, fontSize, paraOptions.fontWeight)

      // newLine
      if (this.x + charWidth > width - paddingRight) {
        const prevChar = text[i - 1]
        if (!isSpace(prevChar) && isSpace(char)) {
          this.newLine(lineHeight)
          continue
        }
        else if (isEnglish(prevChar) && isEnglish(char)) {
          this.pageText.push(
            // <text x="x" y="y">-</text>
            svgText(this.x, this.y, '-', paraOptions),
          )
          this.newLine(lineHeight)
        }
        else if (isEnglish(prevChar) && isPunctuation(char)) {
          this.pageText.push(
            // <text x="x" y="y">char</text>
            svgText(this.x, this.y, char, paraOptions),
          )
          continue
        }
        else {
          this.newLine(lineHeight)
        }
      }

      // newPage
      // if this 'if' is this.y + lineHeight > height - paddingBottom,
      //  it will not render last line in the page
      if (this.y > height - paddingBottom) {
        this.commitToPage()
        this.newPage()
        this.newLine(this.lineHeight)
      }
      if (charMap.has(char)) {
        // <text x="x" y="y">charMap.get(char)</text>
        this.pageText.push(
          svgText(this.x, this.y, charMap.get(char)!, paraOptions),
        )
      }
      else {
        // <text x="x" y="y">char</text>
        this.pageText.push(
          svgText(this.x, this.y, char, paraOptions),
        )
      }
      this.x += charWidth
    }
  }

  private async addImage(
    src: string,
    alt: string = '',
    imageWidth?: number,
    imageHeight?: number,
    caption?: string,
  ) {
    // TODO: handle imageWidth and imageHeight
    const {
      imageRoot,
      height,
      width,
      paddingLeft,
      paddingRight,
      paddingTop,
      paddingBottom,
    } = this.options
    src = resolve(imageRoot, src)
    const contentWidth = width - paddingLeft - paddingRight
    const contentHeight = height - paddingTop - paddingBottom
    const remainHeight = contentHeight - this.y
    // complete imageWidth and imageHeight
    if (!imageWidth || !imageHeight) {
      const { width: w, height: h } = await measureImage(src)
      imageWidth = w
      imageHeight = h
    }

    // first to condense image width
    if (imageWidth > contentWidth) {
      imageWidth = contentWidth
      const ratio = contentWidth / imageWidth
      imageHeight = imageHeight * ratio
    }

    // then to handle image height
    if (remainHeight >= imageHeight) {
      // leave blank space at the top
      this.newLine(0.5 * this.lineHeight)
      // center image
      const renderX = (width - imageWidth) / 2
      this.pageText.push(
        svgImage(renderX, this.y, src, alt, imageHeight, imageWidth),
      )
      this.newLine(imageHeight)
    }
    else {
      this.commitToPage()
      this.newPage()
      if (imageHeight > contentHeight) {
        imageHeight = contentHeight
        const ratio = contentHeight / imageHeight
        imageWidth = imageWidth * ratio
      }
      const renderX = (width - imageWidth) / 2
      this.pageText.push(
        svgImage(renderX, this.y, src, alt, imageHeight, imageWidth),
      )
      this.newLine(imageHeight)
    }

    if (caption) {
      await this.addCenterParagraph(caption)
    }
  }

  public newLine(lineHeight: number, indent: number = 0) {
    this.x = this.options.paddingLeft + indent
    this.y += lineHeight
  }

  private commitToPage() {
    if (this.pageText.length) {
      this.pages[this.pageIndex] = this.svg.replace(
        SVGPlaceholder,
        this.pageText.join(''),
      )
    }
  }

  private newPage() {
    const {
      paddingLeft,
      paddingTop,
    } = this.options

    this.pageText = []
    this.x = paddingLeft
    this.y = paddingTop
    this.pageIndex++
  }

  private async measureFont(
    char: string,
    fontSize: number = this.options.fontSize,
    fontWeight?: string,
  ) {
    const { fontFamily } = this.options
    if (!fontSize) {
      fontSize = this.options.fontSize
    }
    return await measureFont(char, {
      fontFamily,
      fontSize,
      fontWeight,
    })
  }

  private async measureMultiCharWidth(
    text: string,
  ) {
    let textWidth = 0
    for (const char of text) {
      const { width } = await this.measureFont(char)
      textWidth += width
    }
    return textWidth
  }

  private generateSvg() {
    const { width, height, fontSize, fontFamily, backgroundColor } = this.options
    const svgId = `svg${Math.random().toString(36).substring(2, 9)}`
    return `<svg id="${svgId}" xmlns="http://www.w3.org/2000/svg" version="1.1" font-size="${fontSize}px" `
      + `viewBox="0 0 ${width} ${height}" width="${width}px" height="${height}px" font-family="${fontFamily}">${this.generateStyle(svgId)
      }${svgRect(0, 0, width, height, backgroundColor)
      }${SVGPlaceholder
      }</svg>`
  }

  private generateStyle(svgId: string) {
    const {
      borderRadius,
      cursor,
      opacity,
      selectionbgColor,
      selectionColor,
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

  // similar to css style padding
  private parsePadding() {
    const paddingSplit = this.options.padding!.split(' ').map(val => Number.parseInt(val))
    if (paddingSplit.length > 4) {
      throw new Error('padding should be 1-4 values with " " separated')
    }
    let paddingArr = [0, 0, 0, 0]
    if (paddingSplit.length === 1) {
      paddingArr = [paddingSplit[0], paddingSplit[0], paddingSplit[0], paddingSplit[0]]
    }
    else if (paddingSplit.length === 2) {
      paddingArr = [paddingSplit[0], paddingSplit[1], paddingSplit[0], paddingSplit[1]]
    }
    else if (paddingSplit.length === 3) {
      paddingArr = [paddingSplit[0], paddingSplit[1], paddingSplit[2], paddingSplit[1]]
    }
    else if (paddingSplit.length === 4) {
      paddingArr = paddingSplit
    }
    this.options.paddingTop = paddingArr[0]
    this.options.paddingRight = paddingArr[1]
    this.options.paddingBottom = paddingArr[2]
    this.options.paddingLeft = paddingArr[3]
  }
}
