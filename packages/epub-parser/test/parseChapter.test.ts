import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { ChapterCodeBlock, ChapterImage, ChapterOL, ChapterParagraph, ChapterTable, ChapterUL } from '@svg-ebook-reader/shared'
import { ContentType } from '@svg-ebook-reader/shared'
import { parseChapter } from '../src/parseChapter'

describe('parseChapter normal', async () => {
  const normalPath = new URL('./html/normal.html', import.meta.url)
  const normalHtml = readFileSync(normalPath, 'utf-8')
  const normalChapter = await parseChapter(normalHtml)

  it('normal.html', () => {
    expect(normalChapter.contents.length).toBe(19)
    expect(normalChapter.title).toBe('')
    expect(normalChapter.contents[0]).toEqual({
      type: ContentType.PARAGRAPH,
      text: 'What',
    })

    expect(normalChapter.contents[1]).toEqual({
      type: ContentType.HEADING3,
      heading: 'Right Tool for the Right Job',
    })

    expect(normalChapter.contents[2]).toEqual({
      type: ContentType.PARAGRAPH,
      text: '1',
    })

    expect(normalChapter.contents[5]).toEqual({
      type: ContentType.HEADING1,
      heading: '自序',
    })

    expect(normalChapter.contents[6]).toEqual({
      type: ContentType.PARAGRAPH,
      text: 'divdiv',
    })

    expect(normalChapter.contents[8]).toEqual({
      type: ContentType.IMAGE,
      src: '../images/cover.jpg',
      alt: 'Cover Image',
    })

    expect(normalChapter.contents[9]).toEqual({
      type: ContentType.IMAGE,
      src: 'graphics/f0058-01.jpg',
      alt: 'Images',
      width: 777,
      height: 48,
    })

    expect(normalChapter.contents[10]).toEqual({
      type: ContentType.IMAGE,
      src: '../images/cover.jpg',
      alt: 'Cover Image',
    })

    expect(normalChapter.contents[13]).toEqual({
      type: ContentType.IMAGE,
      src: 'graphics/pg400-01.jpg',
      alt: 'images',
      width: 1149,
      height: 1461,
    })

    expect(normalChapter.contents[15]).toEqual({
      type: ContentType.CENTERPARAGRAPH,
      text: 'FIGURE 2-6',
    })

    const lastContent = normalChapter.contents[18] as ChapterCodeBlock
    expect(lastContent.type).toBe(ContentType.CODEBLOCK)
    expect(lastContent.text.indexOf('\n')).toBeGreaterThan(0)
  })
})

describe('parseChapter ulAndTable', async () => {
  const ulPath = new URL('./html/ulAndTable.html', import.meta.url)
  const ulHtml = readFileSync(ulPath, 'utf-8')
  const chapter = await parseChapter(ulHtml)
  it('table', () => {
    expect(chapter.contents.length).toBe(4)
    expect(chapter.contents[0].type).toBe(ContentType.UL)
    expect(chapter.contents[2].type).toBe(ContentType.OL)
    expect(chapter.contents[3].type).toBe(ContentType.TABLE)
  })

  it('table extract', () => {
    const tableContent = chapter.contents[3] as ChapterTable
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
    const firstUl = chapter.contents[0] as ChapterUL
    expect(firstUl.list.length).toBe(3)

    const firstLi = firstUl.list[0] as ChapterImage
    expect(firstLi.type).toBe(ContentType.IMAGE)
    expect(firstLi.src).toBe('graphics/ask_a_question.jpg')
    expect(firstLi.caption).toBe('Ask a question: https://forum.kirupa.com')
    expect(firstLi.width).toBe(25)
    expect(firstLi.height).toBe(40)

    const secondUl = chapter.contents[1] as ChapterUL
    expect(secondUl.list.length).toBe(3)
  })

  it('ol list and sub list', () => {
    const ol = chapter.contents[2] as ChapterOL
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
