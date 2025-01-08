import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Azw3 } from '../src/azw3'
import { initAzw3File } from '../src/azw3'

describe('azw3 class', () => {
  let azw3: Azw3
  beforeAll(async () => {
    // @ts-expect-error globalThis.__BROWSER__
    globalThis.__BROWSER__ = false
    azw3 = await initAzw3File('./example/taoyong.azw3')
  })

  it('getSpine', () => {
    const spine = azw3.getSpine()
    expect(spine.length).toBe(32)
    const lastSpine = spine[spine.length - 1]
    expect(lastSpine).toEqual({
      id: 31,
      skel: {
        index: 31,
        name: 'SKEL0000000031',
        numFrag: 1,
        offset: 358611,
        length: 284,
      },
      frags: [
        {
          index: 61,
          insertOffset: 358879,
          length: 3100,
          offset: 0,
          selector: 'P-//*[@aid=\'TI1E0\']',
        },
      ],
      fragEnd: 62,
      length: 3384,
      totalLength: 361995,
    })
  })

  it('getToc', () => {
    const toc = azw3.getToc()
    expect(toc!.length).toBe(30)
    const lastToc = toc![toc!.length - 1]
    expect(lastToc).toEqual({
      label: '后记',
      href: 'kindle:pos:fid:001S:off:0000000000',
      subitems: undefined,
    })
  })

  it('loadChapter when id exist in spine', () => {
    const spine = azw3.getSpine()
    const chapter = spine[0]
    // test cache
    const { html, css } = azw3.loadChapter(chapter.id)!
    const { html: html2, css: css2 } = azw3.loadChapter(chapter.id)!
    expect(html).toBe(html2)
    expect(css).toEqual(css2)
    // html src should be replaced
    const htmlSrc = html.match('src="(.+?)"')![1]
    expect(htmlSrc).toBe(path.resolve('./images', '0007.jpg'))
    // css href
    expect(css).toEqual([
      {
        id: 2,
        href: path.resolve('./images', '0002.css'),
      },
      {
        id: 1,
        href: path.resolve('./images', '0001.css'),
      },
    ])
    // fileExist
    expect(existsSync(htmlSrc)).toBeTruthy()
    expect(existsSync(css[0].href)).toBeTruthy()
    expect(existsSync(css[1].href)).toBeTruthy()
  })

  it('loadChapter when id not exist in spine', () => {
    const chapter = azw3.loadChapter(100)
    expect(chapter).toBeUndefined()
  })

  it('resolveHref when href format is correct', () => {
    const toc = azw3.getToc()
    // kindle:pos:fid:0000:off:0000000000
    const href = toc![0].href
    const resolvedHref = azw3.resolveHref(href)
    expect(resolvedHref).toEqual({
      id: 0,
      selector: '[id="calibre_pb_0"]',
    })
    // cache
    const resolvedHref2 = azw3.resolveHref(href)
    expect(resolvedHref).toEqual(resolvedHref2)
  })

  it('resolveHref when href format is incorrect', () => {
    const resolvedHref = azw3.resolveHref('wrong:href')
    expect(resolvedHref).toBeUndefined()
    // chapter not exist
    const resolvedHref2 = azw3.resolveHref('kindle:pos:fid:0032:off:0000000000')
    expect(resolvedHref2).toBeUndefined()
  })

  it('getGuide', () => {
    const guide = azw3.getGuide()
    expect(guide).toEqual([
      {
        label: 'Table of Contents',
        type: ['toc'],
        href: 'kindle:pos:fid:001T:off:0000000000',
      },
    ])
  })

  it('getMetadata', () => {
    const metadata = azw3.getMetadata()
    expect(metadata).toEqual({
      identifier: '2681144926',
      title: '自造',
      author: ['陶勇'],
      publisher: 'www.huibooks.com',
      language: ['zh'],
      published: '2021-11-30 16:00:00+00:00',
      description: '',
      subject: ['汇书网'],
      rights: '',
      contributor: ['calibre (7.0.0) [https://calibre-ebook.com]'],
    })
  })

  it('getCover', () => {
    const coverSrc = azw3.getCoverImage()
    expect(coverSrc).toBe(path.resolve('./images', 'cover.jpg'))
    // for cache
    const coverSrc2 = azw3.getCoverImage()
    expect(coverSrc).toBe(coverSrc2)
  })

  it('destroy', () => {
    expect(() => azw3.destroy()).not.toThrowError()
  })
})

describe('init azw3 in browser', () => {
  let azw3: Azw3
  beforeAll(async () => {
    const fileBuffer = readFileSync('./example/taoyong.azw3')
    const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength)
    // @ts-expect-error globalThis.__BROWSER__
    globalThis.__BROWSER__ = true
    // @ts-expect-error File mock
    globalThis.File = class {
      async arrayBuffer() {
        return arrayBuffer
      }
    }
    azw3 = await initAzw3File(new File([], 'taoyong.azw3'))
  })
  afterAll(() => {
    // @ts-expect-error globalThis.__BROWSER__
    delete globalThis.__BROWSER__
    // @ts-expect-error File mock
    delete globalThis.File
  })
  it('azw3 class', () => {
    expect(azw3).toBeDefined()
  })

  it('loadChapter in browser', () => {
    const spine = azw3.getSpine()
    const chapter = spine[0]
    const { html, css } = azw3.loadChapter(chapter.id)!
    // html src should be replaced
    const htmlSrc = html.match('src="(.+?)"')![1]
    expect(htmlSrc.startsWith('blob')).toBe(true)
    // css href
    const cssHrefs = css.map(item => item.href)
    cssHrefs.forEach((href) => {
      expect(href.startsWith('blob')).toBe(true)
    })
  })

  it('destroy', () => {
    expect(() => azw3.destroy()).not.toThrowError()
  })
})
