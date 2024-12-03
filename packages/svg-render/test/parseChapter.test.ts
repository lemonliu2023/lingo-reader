import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type {
  ChapterCodeBlock,
  ChapterImage,
  ChapterOL,
  ChapterParagraph,
  ChapterTable,
  ChapterUL,
} from '../src'
import { ContentType, parseChapter } from '../src'
import { pureXmlContent } from '../src/parser/parseChapter'

describe('pureXmlContent', () => {
  it('useless tag', () => {
    const str = `<body><header><p>
<span style="font-size:16px;font-family:'PingFang SC';">
问题<b>上</b><i><b>水</b></span></i><i></i><i>r</i><u>sd</u><s>45</s>
</p></header><body>`
    expect(pureXmlContent(str)).toBe('<body><p>\n问题上水rsd45\n</p><body>')
  })

  it('self close tag', () => {
    const str = '<a class="link" href="http://www.epubbooks.com" target="_top">www.epubbooks.com</a>'
      + '<br /><hr /><img src="http://www.epubbooks.com" /><header />'

    expect(pureXmlContent(str)).toBe('www.epubbooks.com<img src="http://www.epubbooks.com" />')
  })

  it('class, id, style ... attrs', () => {
    const str = '<p class="p1" id="p1">content</p>'
      + '<table style="border: 0; " class="simplelist" epub:type="list">'
      + '<tr><td>When</td></table>'
    expect(pureXmlContent(str)).toBe('<p>content</p><table><tr><td>When</td></table>')
  })

  it('tag with no content', () => {
    const str2 = '<div id="chapter3.xhtml"></div>'
    expect(pureXmlContent(str2)).toBe('')
  })

  it('multiline', () => {
    const str = `
    
    `
    expect(pureXmlContent(str)).toBe(str)
  })
})

// see /packages/epub-parser/test/html/normal.html
describe('parseChapter normal', async () => {
  // @ts-expect-error __BROWSER__ is for build process
  globalThis.__BROWSER__ = false

  const normalPath = new URL('./html/normal.html', import.meta.url)
  const normalHtml = readFileSync(normalPath, 'utf-8')
  const { title, contents } = await parseChapter(normalHtml)

  it('normal.html', () => {
    expect(contents.length).toBe(19)
    expect(title).toBe('')
    expect(contents[0]).toEqual({
      type: ContentType.PARAGRAPH,
      text: 'What',
    })

    expect(contents[1]).toEqual({
      type: ContentType.HEADING3,
      heading: 'Right Tool for the Right Job',
    })

    expect(contents[2]).toEqual({
      type: ContentType.PARAGRAPH,
      text: '1',
    })

    expect(contents[5]).toEqual({
      type: ContentType.HEADING1,
      heading: '自序',
    })

    expect(contents[6]).toEqual({
      type: ContentType.PARAGRAPH,
      text: 'divdiv',
    })

    expect(contents[8]).toEqual({
      type: ContentType.IMAGE,
      src: '../images/cover.jpg',
      alt: 'Cover Image',
    })

    expect(contents[9]).toEqual({
      type: ContentType.IMAGE,
      src: 'graphics/f0058-01.jpg',
      alt: 'Images',
      width: 777,
      height: 48,
    })

    expect(contents[10]).toEqual({
      type: ContentType.IMAGE,
      src: '../images/cover.jpg',
      alt: 'Cover Image',
    })

    expect(contents[13]).toEqual({
      type: ContentType.IMAGE,
      src: 'graphics/pg400-01.jpg',
      alt: 'images',
      width: 1149,
      height: 1461,
    })

    expect(contents[15]).toEqual({
      type: ContentType.CENTERPARAGRAPH,
      text: 'FIGURE 2-6',
    })

    const lastContent = contents[18] as ChapterCodeBlock
    expect(lastContent.type).toBe(ContentType.CODEBLOCK)
    expect(lastContent.text.indexOf('\n')).toBeGreaterThan(0)
  })
})

// see /packages/epub-parser/test/html/ulAndTable.html
describe('parseChapter ulAndTable', async () => {
  // @ts-expect-error __BROWSER__ is for build process
  globalThis.__BROWSER__ = false

  const ulPath = new URL('./html/ulAndTable.html', import.meta.url)
  const ulHtml = readFileSync(ulPath, 'utf-8')
  const { contents: ChapterContent } = await parseChapter(ulHtml)
  it('table', () => {
    expect(ChapterContent.length).toBe(4)
    expect(ChapterContent[0].type).toBe(ContentType.UL)
    expect(ChapterContent[2].type).toBe(ContentType.OL)
    expect(ChapterContent[3].type).toBe(ContentType.TABLE)
  })

  it('table extract', () => {
    const tableContent = ChapterContent[3] as ChapterTable
    const tableLength = tableContent.table.length
    expect(tableLength).toBe(6)

    const firstRow = tableContent.table[0]
    expect(firstRow.length).toBe(4)
    expect(firstRow[0]).toBe('Action')
    expect(firstRow[firstRow.length - 1]).toBe('Worst')

    const lastRow = tableContent.table[tableLength - 1]
    expect(lastRow.length).toBe(4)
    expect(lastRow[0]).toBe('Memory')
    expect(lastRow[lastRow.length - 1]).toBe('O(n)')
  })

  it('ul extract', () => {
    const firstUl = ChapterContent[0] as ChapterUL
    expect(firstUl.list.length).toBe(4)

    const firstLi = firstUl.list[0] as ChapterImage
    expect(firstLi.type).toBe(ContentType.IMAGE)
    expect(firstLi.src).toBe('graphics/ask_a_question.jpg')
    expect(firstLi.caption).toBe('Ask a question: https://forum.kirupa.com')
    expect(firstLi.width).toBe(25)
    expect(firstLi.height).toBe(40)
    const lastLi = firstUl.list[3] as ChapterParagraph
    expect(lastLi.text).toBe('ulli')

    const secondUl = ChapterContent[1] as ChapterUL
    expect(secondUl.list.length).toBe(3)
  })

  it('ol list and sub list', () => {
    const ol = ChapterContent[2] as ChapterOL
    expect(ol.list.length).toBe(2)
    const subList = ol.list[0] as ChapterParagraph
    expect(subList.type).toBe(ContentType.PARAGRAPH)
    expect(subList.text).toBe('I Data Structures')
    expect(ol.list[1].type).toBe(ContentType.OL)

    const subOlList = (ol.list[1] as ChapterOL).list
    expect(subOlList.length).toBe(2)

    const subsubList = subOlList[1] as ChapterUL
    expect(subsubList.type).toBe(ContentType.UL)
    expect(subsubList.list.length).toBe(4)
    expect(subsubList.list[0].type).toBe(ContentType.PARAGRAPH)
    expect((subsubList.list[0] as ChapterParagraph).text).toBe('Right Tool for the Right Job')
  })
})
