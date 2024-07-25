import { describe, expect, it } from 'vitest'
import { Reader } from '../src/reader'

// @ts-ignore
globalThis.__BROWSER__ = false

describe('reader', () => {
  it('create', async () => {
    const reder = Reader(
      './example/alice.epub',
    )
    const {
      toPrevPage,
      toNextPage,
      getPageIndex,
      getChapterIndex,
    } = reder

    const currentPage = await reder.init()
    expect(currentPage.length).toBeGreaterThan(10)
    expect(getPageIndex()).toBe(0)
    expect(getChapterIndex()).toBe(0)

    const prevPage = await toPrevPage()
    expect(prevPage).toBe(undefined)
    expect(getPageIndex()).toBe(0)
    expect(getChapterIndex()).toBe(0)

    const nextPage = await toNextPage()
    expect(nextPage).not.toBe(undefined)
    expect(getPageIndex()).toBe(1)
    expect(getChapterIndex()).toBe(0)
  })
})
