import { writeFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { Reader } from '../src/reader'

// @ts-expect-error __BROWSER__ is defined in rollup options
globalThis.__BROWSER__ = false

describe('reader', () => {
  it('alice', async () => {
    const reader = Reader(
      './example/alice.epub',
    )
    const {
      toPrevPage,
      toNextPage,
      getPageIndex,
      getChapterIndex,
      getCurrChapterPageCount,
    } = reader

    const currentPage = await reader.init()
    expect(currentPage.length).toBeGreaterThan(10)
    expect(getPageIndex()).toBe(0)
    expect(getChapterIndex()).toBe(0)

    const prevPage = toPrevPage()
    expect(prevPage).toBe(undefined)
    expect(getPageIndex()).toBe(0)
    expect(getChapterIndex()).toBe(0)

    const nextPage = await toNextPage()
    expect(nextPage).not.toBe(undefined)
    expect(getPageIndex()).toBe(1)
    expect(getChapterIndex()).toBe(0)

    // go to last page of the first chapter
    let lastPage = nextPage
    while (lastPage) {
      lastPage = await toNextPage()
    }
    expect(getPageIndex()).toBe(getCurrChapterPageCount() - 1)
    expect(getChapterIndex()).toBe(0)
    lastPage = await toNextPage()
    expect(lastPage).toBe(undefined)
    expect(getPageIndex()).toBe(getCurrChapterPageCount() - 1)
    expect(getChapterIndex()).toBe(0)
  })

  it('future', async () => {
    const reader = Reader(
      './example/future.epub',
    )
    const {
      toNextPage,
    } = reader

    await reader.init()
    let nextPage = await toNextPage()
    nextPage = await toNextPage()
    nextPage = await toNextPage()
    writeFileSync(`./example/future-0.svg`, nextPage!)
  })
})
