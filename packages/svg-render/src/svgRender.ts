import type { Content, UlOrOlList } from './parser/parserTypes'
import { ContentType } from './parser/parserTypes'
import { measureFont } from './measureFont'
import type { Page, ParagraphOptions, SvgRenderOptions } from './types'
import {
  charMap,
  headingRatioMap,
  isEnglish,
  isPunctuation,
  isSpace,
  iterateWithStr,
  parsePadding,
} from './utils'
import { measureImage } from './measureImage'
import {
  svgImage,
  svgLine,
  svgRect,
  svgText,
} from './svgTags'
import { CONTENTPLACEHOLDER } from './constants'

const defaultSvgRenderOptions: SvgRenderOptions = {
  width: 1474,
  height: 743,
  fontFamily: 'Lucida Console, Courier, monospace',
  fontSize: 20,
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

export class SvgRender {
  private chapterId: string

  private options: Required<SvgRenderOptions>
  public getRenderOptions() {
    return this.options
  }

  private svgId: string = ''
  private styleText: string = ''
  private svgTemplate: string = ''
  public getSvgTemplate() {
    return this.svgTemplate
  }

  // svg>text position, left top corner
  private x: number = 0
  private y: number = 0
  private lineHeight: number = 0
  public getLineHeight() {
    return this.lineHeight
  }

  private rightBoundry: number = 0
  private bottomBoundry: number = 0
  private contentWidth: number = 0
  private contentHeight: number = 0
  private originX: number = 0
  private originY: number = 0

  // for assign unique id to svg text and image
  private contentIndex: number = -1
  private offset: number = -1

  private pageIndex: number = 0
  private pages: Page[] = []
  public getPages() {
    return this.pages
  }

  // text content in the svg
  private pageText: string[] = []
  constructor(chapterId: string, options: SvgRenderOptions) {
    this.chapterId = chapterId

    this.options = {
      ...defaultSvgRenderOptions,
      ...options,
    } as Required<SvgRenderOptions>

    this.parsePadding()

    const {
      width,
      height,
      paddingTop,
      paddingLeft,
      paddingRight,
      paddingBottom,
      fontSize,
      lineHeightRatio,
    } = this.options
    this.lineHeight = fontSize * lineHeightRatio

    this.rightBoundry = width - paddingRight
    this.bottomBoundry = height - paddingBottom

    this.contentWidth = width - paddingLeft - paddingRight
    this.contentHeight = height - paddingTop - paddingBottom

    this.originX = paddingLeft
    this.originY = paddingTop

    this.x = this.originX
    this.y = this.originY

    this.svgId = `svg${Math.random().toString(36).substring(2, 9)}`
    this.styleText = this.generateStyle()
    this.svgTemplate = this.generateSvg()
  }

  public async addContents(contents: Content[]) {
    for (const content of contents) {
      await this.addContent(content)
    }
    this.commitToPage()
  }

  private resetOffset() {
    this.contentIndex++
    this.offset = -1
  }

  public async addContent(content: Content) {
    this.resetOffset()

    // 1.new line
    // 2.render content
    const contentType = content.type
    if (contentType === ContentType.PARAGRAPH) {
      this.newLine(this.lineHeight, this.options.fontSize * 2)
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
    const remainLineNum = Math.floor((this.bottomBoundry - this.y) / this.lineHeight)
    if (codeLines.length > remainLineNum) {
      await this.addCodeInOnePage(codeLines.slice(0, remainLineNum))
      this.commitToPage()
      this.newPage()
      await this.addCode(codeLines.slice(remainLineNum))
    }
    else {
      await this.addCodeInOnePage(codeLines)
    }
  }

  private async addCodeInOnePage(codeLines: string[]) {
    this.pageText.push(
      svgRect(
        this.originY,
        this.y + 0.2 * this.lineHeight,
        this.contentWidth,
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
        // add ↵ which fontsize is 0
        this.generateSvgText(this.x, this.y, '\u21B5', { fontSize: 0 }),
      )
    }
  }

  private async splitCode(code: string) {
    const res: string[] = []
    const codeSplit = code.split(/\r?\n/)
    for (const line of codeSplit) {
      const splited = await this.splitCenterText(
        line,
        this.contentWidth,
        false,
      )
      res.push(...splited)
    }
    return res
  }

  private async addTable(table: string[][]) {
    const tableColNum = table[0].length
    const cellWidth = this.contentWidth / tableColNum

    for (let j = 0; j < table.length; j++) {
      const line = table[j]
      this.newLine(this.lineHeight)
      if (this.y + this.lineHeight > this.bottomBoundry) {
        this.commitToPage()
        this.newPage()
        this.newLine(this.lineHeight)
      }
      if (j === 0) {
        // top line
        this.pageText.push(
          svgLine(
            this.originX,
            this.y - this.lineHeight,
            this.rightBoundry,
            this.y - this.lineHeight,
          ),
        )
        // middle line
        this.pageText.push(
          svgLine(
            this.originX,
            this.y,
            this.rightBoundry,
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
        this.originX,
        this.y,
        this.rightBoundry,
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
    const lines = await this.splitCenterText(text, this.contentWidth)
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
    const indent = (this.contentWidth - centerStrWidth) / 2
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
    for (const char of text) {
      const { width: charWidth } = await this.measureFont(char)
      if (strWidth + charWidth > contentWidth) {
        if (isText && isEnglish(char)) {
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

  /**
   * when currentX + charWidth > rightBoundry, newLine, the last char will render to next line
   * when currentY + lineheight > bottomBoundry, newPage, the last line will render to next page
   */
  private async addParagraph(text: string, paraOptions: ParagraphOptions) {
    const fontSize = paraOptions?.fontSize || this.options.fontSize
    const lineHeight = paraOptions.lineHeight || this.lineHeight

    for (const [i, char] of iterateWithStr(text)) {
      if (char === '\n') {
        this.newLine(lineHeight)
        continue
      }

      const {
        width: charWidth,
      } = await this.measureFont(char, fontSize, paraOptions.fontWeight)

      // newLine
      if (this.x + charWidth > this.rightBoundry) {
        const prevChar = text[i - 1]
        if (!isSpace(prevChar) && isSpace(char)) {
          this.newLine(lineHeight)
          continue
        }
        else if (isEnglish(prevChar) && isEnglish(char)) {
          this.pageText.push(
            // <text x="x" y="y">-</text>
            this.generateSvgText(this.x, this.y, '-', paraOptions),
          )
          this.newLine(lineHeight)
        }
        else if (isEnglish(prevChar) && isPunctuation(char)) {
          this.pageText.push(
            // <text x="x" y="y">char</text>
            this.generateSvgText(this.x, this.y, char, paraOptions),
          )
          continue
        }
        else {
          this.newLine(lineHeight)
        }
      }

      // newPage
      // if this 'if' is this.y + lineHeight > height - paddingBottom,
      //  it will not render last line in the page.
      // Currently, this.y has been added lineHeight.
      if (this.y > this.bottomBoundry) {
        this.commitToPage()
        this.newPage()
        this.newLine(this.lineHeight)
      }
      if (charMap.has(char)) {
        // <text x="x" y="y">charMap.get(char)</text>
        this.pageText.push(
          this.generateSvgText(this.x, this.y, charMap.get(char)!, paraOptions),
        )
      }
      else {
        // <text x="x" y="y">char</text>
        this.pageText.push(
          this.generateSvgText(this.x, this.y, char, paraOptions),
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
    const {
      width,
    } = this.options

    const remainHeight = this.bottomBoundry - this.y

    // complete imageWidth and imageHeight
    if (!imageWidth || !imageHeight) {
      const { width: w, height: h } = await measureImage(src)
      imageWidth = w
      imageHeight = h
    }

    // first to condense image width
    if (imageWidth > this.contentWidth) {
      imageWidth = this.contentWidth
      const ratio = this.contentWidth / imageWidth
      imageHeight = imageHeight * ratio
    }

    // then to handle image height
    if (remainHeight >= imageHeight) {
      // leave blank space at the top
      this.newLine(0.5 * this.lineHeight)
      // center image
      const renderX = (width - imageWidth) / 2
      this.pageText.push(
        this.generateSvgImage(renderX, this.y, src, alt, imageHeight, imageWidth),
      )
      this.newLine(imageHeight)
    }
    else {
      this.commitToPage()
      this.newPage()
      if (imageHeight > this.contentHeight) {
        imageHeight = this.contentHeight
        const ratio = this.contentHeight / imageHeight
        imageWidth = imageWidth * ratio
      }
      const renderX = (width - imageWidth) / 2
      this.pageText.push(
        this.generateSvgImage(renderX, this.y, src, alt, imageHeight, imageWidth),
      )
      this.newLine(imageHeight)
    }

    if (caption) {
      await this.addCenterParagraph(caption)
    }
  }

  private commitToPage() {
    if (this.pageText.length) {
      this.pages[this.pageIndex] = {
        chapterId: this.chapterId,
        svg: this.svgTemplate.replace(
          CONTENTPLACEHOLDER,
          this.pageText.join(''),
        ),
        pageIndex: this.pageIndex,
        lastContentIndexOfPage: this.contentIndex,
      }
    }
  }

  public newLine(lineHeight: number, indent: number = 0) {
    this.x = this.originX + indent
    this.y += lineHeight
  }

  public newPage() {
    this.pageText = []
    this.x = this.originX
    this.y = this.originY
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
    const measureRes = await Promise.all(
      text.split('').map(char => this.measureFont(char)),
    )
    return measureRes.reduce((acc, cur) => acc + cur.width, 0)
  }

  private generateSvgText(
    x: number,
    y: number,
    char: string,
    options: ParagraphOptions,
  ) {
    this.offset++
    const key = `${this.chapterId}_${this.contentIndex}_${this.offset}`
    return svgText(x, y, char, key, options)
  }

  private generateSvgImage(
    x: number,
    y: number,
    src: string,
    alt: string,
    height: number,
    width: number,
  ) {
    this.offset++
    const key = `${this.chapterId}_${this.contentIndex}_${this.offset}`
    return svgImage(x, y, src, key, alt, height, width)
  }

  private generateSvg() {
    const { width, height, fontSize, fontFamily, backgroundColor } = this.options
    return `<svg id="${this.svgId}" xmlns="http://www.w3.org/2000/svg" version="1.1" font-size="${fontSize}px" `
      + `viewBox="0 0 ${width} ${height}" width="${width}px" height="${height}px" font-family="${fontFamily}">${this.styleText
      }${svgRect(0, 0, width, height, backgroundColor)
      }${CONTENTPLACEHOLDER}</svg>`
  }

  private generateStyle() {
    const {
      borderRadius,
      cursor,
      opacity,
      selectionbgColor,
      selectionColor,
    } = this.options

    // svg css
    let svgStyle = `#${this.svgId}{`
    svgStyle += `cursor:${cursor};`
    if (opacity < 1 && opacity >= 0) {
      svgStyle += `opacity:${opacity};`
    }
    if (borderRadius > 0) {
      svgStyle += `border-radius:${borderRadius}px;`
    }
    svgStyle += '}'
    // selection css
    let svgSelectionStyle = `#${this.svgId} text::selection{`
    svgSelectionStyle += `background-color:${selectionbgColor};`
    if (selectionColor.length > 0) {
      svgSelectionStyle += `fill:${selectionColor};`
    }
    svgSelectionStyle += '}'
    return `<style>${svgStyle}${svgSelectionStyle}</style>`
  }

  // similar to css style padding
  private parsePadding() {
    const [
      paddingTop,
      paddingRight,
      paddingBottom,
      paddingLeft,
    ] = parsePadding(this.options.padding)

    Object.assign(this.options, {
      paddingTop,
      paddingRight,
      paddingBottom,
      paddingLeft,
    })
  }
}
