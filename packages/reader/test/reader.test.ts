import { describe, expect, it } from 'vitest'
import { __test__pageIndex, init, toNextPage, toPrevPage } from '../src/reader'

// @ts-ignore
globalThis.__BROWSER__ = false

describe('reader', () => {
  it('create', async () => {
    const currentPage = await init()
    expect(currentPage.length).toBeGreaterThan(10)
    expect(__test__pageIndex()).toBe(0)
    const prevPage = await toPrevPage()
    expect(prevPage).toBe(undefined)
    expect(__test__pageIndex()).toBe(0)

    const nextPage = await toNextPage()
    expect(nextPage).not.toBe(undefined)
    expect(__test__pageIndex()).toBe(1)

    // new Reader()
    // const epub = await initEpubFile()
    // const chapter = await epub.getChapter(epub.toc[0].id)
    // const renderer = new SvgRender({
    //   padding: '40',
    //   width: 1000,
    //   height: 700,
    // })
    // await renderer.addContents(chapter.contents)
    // fs.writeFileSync('./alice.svg', renderer.pages[2])
    // expect(1).toBe(1)
  })
})
