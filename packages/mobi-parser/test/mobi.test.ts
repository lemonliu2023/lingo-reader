import { readFileSync } from 'node:fs'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { type Mobi, initMobiFile } from '../src/mobi'

describe('mobi class', () => {
  let mobi: Mobi
  beforeAll(async () => {
    // @ts-expect-error globalThis.__BROWSER__
    globalThis.__BROWSER__ = false
    mobi = await initMobiFile('./example/taoyong.mobi')
  })

  it('getSpine', () => {
    const spine = mobi.getSpine()
    expect(spine.length).toBe(33)
    const lastlastSpine = spine[spine.length - 2]
    expect(lastlastSpine.id).toBe(31)
    expect(lastlastSpine.start).toBe(338161)
    expect(lastlastSpine.end).toBe(340617)
    expect(lastlastSpine.size).toBe(2440)
  })

  it('getToc', () => {
    const toc = mobi.getToc()
    expect(toc.length).toBe(30)
    expect(toc[toc.length - 1]).toEqual({ title: '后记', href: 'filepos:335070' })
  })

  it('loadChapter', () => {
    const spine = mobi.getSpine()
    const chapter = spine[0]
    const { html, css } = mobi.loadChapter(chapter.id)!
    const htmlSrc = html.match(/src="(.+?)"/)![1]
    expect(htmlSrc).toBe(path.resolve('./images/4.jpg'))
    expect(css.length).toBe(0)
    // cache
    const { html: html2, css: css2 } = mobi.loadChapter(chapter.id)!
    expect(html2).toBe(html)
    expect(css2).toEqual(css2)
  })

  it('load unexisted chapter', () => {
    expect(mobi.loadChapter(50)).toBeUndefined()
  })

  it('resolveHref', () => {
    const toc = mobi.getToc()
    const href = toc[2].href
    const resolvedHref = mobi.resolveHref(href)
    expect(resolvedHref).toEqual({ id: 3, selector: '[id="filepos:8520"]' })
  })

  it('resolve incorrect href', () => {
    // incorrect href
    expect(mobi.resolveHref('incorrectHref:1')).toBeUndefined()
    // out of range filepos
    expect(mobi.resolveHref('filepos:8520000')).toBeUndefined()
  })

  // mobi has no guide

  it('getMetaData', () => {
    const metadata = mobi.getMetadata()
    expect(metadata).toEqual({
      identifier: '3279154688',
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

  it('getCoverImage', () => {
    const coverUrl = mobi.getCoverImage()
    expect(coverUrl).toBe(path.resolve('./images/cover.jpg'))
  })

  it('destroy', () => {
    expect(() => mobi.destroy()).not.toThrowError()
  })
})

describe('init mobi in browser', () => {
  let mobi: Mobi
  beforeAll(async () => {
    const fileBuffer = readFileSync('./example/taoyong.mobi')
    const arrayBuffer = fileBuffer.buffer.slice(fileBuffer.byteOffset, fileBuffer.byteOffset + fileBuffer.byteLength)
    // @ts-expect-error globalThis.__BROWSER__
    globalThis.__BROWSER__ = true
    // @ts-expect-error File mock
    globalThis.File = class {
      async arrayBuffer() {
        return arrayBuffer
      }
    }
    mobi = await initMobiFile(new File([], 'taoyong.mobi'))
  })
  afterAll(() => {
    // @ts-expect-error globalThis.__BROWSER__
    delete globalThis.__BROWSER__
    // @ts-expect-error File mock
    delete globalThis.File
  })

  it('loadChapter in browser', () => {
    const { html, css } = mobi.loadChapter(0)!
    const htmlSrc = html.match(/src="(.+?)"/)![1]
    expect(htmlSrc.startsWith('blob')).toBe(true)
    expect(css.length).toBe(0)
  })

  it('destroy', () => {
    expect(() => mobi.destroy()).not.toThrowError()
  })
})
