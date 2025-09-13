import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import process from 'node:process'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { initEpubFile } from '../src'
import { EpubFile } from '../src/epub'

describe('initEpubFile interface', () => {
  it('init epub from memory in nodejs', async () => {
    // @ts-expect-error __BROWSER__ is for build process
    globalThis.__BROWSER__ = false

    const epub = await initEpubFile(new Uint8Array(readFileSync('./example/alice.epub')))

    expect(epub.getFileInfo()).toEqual({
      fileName: '',
      mimetype: 'application/epub+zip',
    })

    expect(epub.getSpine().length).toBe(1)
  })
})

describe('parse epubFile in node', async () => {
  // @ts-expect-error __BROWSER__ is for build process
  globalThis.__BROWSER__ = false

  // alice.epub file path
  const epub = await initEpubFile('./example/alice.epub')

  it('getFileInfo', () => {
    expect(epub.getFileInfo()).toEqual({
      fileName: 'alice.epub',
      mimetype: 'application/epub+zip',
    })
  })

  it('parseMetadata', () => {
    const metadata = epub.getMetadata()!
    expect(metadata.rights).toBe('Public domain in the USA.')
    expect(metadata.packageIdentifier).toEqual({
      id: 'http://www.gutenberg.org/ebooks/19033',
      scheme: 'URI',
    })
    expect(metadata.contributor).toEqual([{
      contributor: 'Gordon Robinson',
      fileAs: 'Robinson, Gordon',
      role: 'ill',
    }])
    expect(metadata.creator).toEqual([{
      contributor: 'Lewis Carroll',
      fileAs: 'Carroll, Lewis',
      role: '',
    }])
    expect(metadata.title).toBe(`Alice's Adventures in Wonderland`)
    expect(metadata.language).toBe('en')
    expect(metadata.subject).toEqual([
      {
        subject: 'Fantasy',
        authority: '',
        term: '',
      },
      {
        subject: 'Fantasy fiction, English',
        authority: '',
        term: '',
      },
    ])
    expect(metadata.date).toEqual({
      publication: '2006-08-12',
      conversion: '2010-02-16T12:34:12.754941+00:00',
    })
    expect(metadata.source).toBe('http://www.gutenberg.org/files/19033/19033-h/19033-h.htm')
    expect(metadata.metas).toEqual({
      cover: 'item32',
    })
  })

  it('parseManifest', () => {
    const manifest = epub.getManifest()

    // 33 items in manifest
    expect(Object.keys(manifest).length).toBe(37)
    expect(manifest.item1).toEqual({
      id: 'item1',
      href: '19033/www.gutenberg.org@files@19033@19033-h@images@cover_th.jpg',
      mediaType: 'image/jpeg',
      properties: '',
      mediaOverlay: '',
    })
    expect(manifest.ncx).toEqual({
      id: 'ncx',
      href: '19033/toc.ncx',
      mediaType: 'application/x-dtbncx+xml',
      properties: '',
      mediaOverlay: '',
    })
    expect(manifest.item32).toEqual({
      id: 'item32',
      href: '19033/www.gutenberg.org@files@19033@19033-h@19033-h-0.htm',
      mediaType: 'application/xhtml+xml',
      properties: '',
      mediaOverlay: 'item35',
    })
    expect(manifest.item33.id).toBe('item33')
    expect(manifest.item33.href).toBe('19033/12997454.mp4')
  })

  it('parseSpine', () => {
    const spine = epub.getSpine()

    expect(spine.length).toBe(1)
    expect(spine[0]).toEqual({
      id: 'item32',
      href: 'epub:19033/www.gutenberg.org@files@19033@19033-h@19033-h-0.htm',
      mediaType: 'application/xhtml+xml',
      mediaOverlay: 'item35',
      properties: '',
      linear: 'yes',
    })
  })

  it('parseGuide', () => {
    const guide = epub.getGuide()

    expect(guide.length).toBe(1)
    expect(guide).toEqual([{
      title: 'Cover Image',
      type: 'cover',
      href: 'epub:19033/www.gutenberg.org@files@19033@19033-h@images@cover_th.jpg',
    }])
  })

  it('parseCollection: alice.epub has no collection', () => {
    const collection = epub.getCollection()
    expect(collection.length).toBe(1)
    expect(collection[0].links[0]).toBe('19033/subjectIndex01.xhtml')
  })

  // .ncx file
  it('getToc: .ncx navMap', () => {
    const navMap = epub.getToc()
    expect(navMap.length).toBe(2)
    expect(navMap[1].children!.length).toBe(11)
    expect(navMap[0]).toEqual({
      label: 'THE \"STORYLAND\" SERIES',
      href: 'epub:19033/www.gutenberg.org@files@19033@19033-h@19033-h-0.htm#pgepubid00000',
      id: 'item32',
      playOrder: '1',
    })
  })

  it('getPageList: .ncx pageList', () => {
    const pageList = epub.getPageList()
    expect(pageList.label).toBe('Pages')
    expect(pageList.pageTargets.length).toBe(48)
    expect(pageList.pageTargets[47]).toEqual({
      label: '[Pg 48]',
      value: '48',
      href: 'epub:19033/www.gutenberg.org@files@19033@19033-h@19033-h-0.htm#Page_48',
      playOrder: '62',
      type: 'normal',
      correspondId: 'item32',
    })
  })

  it('getNavList: alice epub has no navList in toc.ncx', () => {
    const navList = epub.getNavList()
    expect(navList.label).toBe('List of Illustrations')
    expect(navList.navTargets.length).toBe(1)
    expect(navList.navTargets[0].href).toBe('epub:19033/content.html#ill1')
  })

  it('loadChapter', async () => {
    const { css, html, mediaOverlays } = await epub.loadChapter('item32')
    // html
    const imageTags = html.match(/<(img|source)[^>]*>/g)
    const srcs = imageTags?.map((imgTag) => {
      const src = imgTag.match(/src="([^"]*)"/)!
      return src[1]
    })
    const cwd = process.cwd()
    expect(srcs?.every(src => src.startsWith(cwd))).toBe(true)
    // css
    expect(css.length).toBe(3)
    expect(css.every(css => css.href.startsWith(cwd))).toBe(true)

    // url() in css should be replaced with absolute path
    const cssFileContent = readFileSync(css[0].href).toString()
    const matchedUrl = cssFileContent.match(/url\(([^)]*)\)/)![1]
    expect(path.isAbsolute(matchedUrl)).toBe(true)

    // cache
    const { css: css2, html: html2 } = await epub.loadChapter('item32')
    expect(css2.length).toBe(css.length)
    expect(html2.length).toEqual(html.length)

    // media-overlay
    expect(mediaOverlays!.length).toBe(2)
    expect(mediaOverlays![1].audioSrc.endsWith('mp3')).toBe(true)
    expect(mediaOverlays![0].pars.length).toBe(1)
    expect(mediaOverlays![1].pars.length).toBe(9)
  })

  it('resolveHref', () => {
    const tocItem = epub.getToc()[0]
    const resolvedHref = epub.resolveHref(tocItem.href)!
    expect(resolvedHref.id).toBe('item32')
    expect(resolvedHref.selector).toBe('[id="pgepubid00000"]')
  })

  it('resolveHref with no corresponding id', () => {
    const href = 'https://www.baidu.com/path#temp'
    const resolvedHref = epub.resolveHref(href)
    expect(resolvedHref).toBeUndefined()
  })

  it('resolveHref with no selector', () => {
    const href = 'epub:19033/www.gutenberg.org@files@19033@19033-#'
    const resolvedHref = epub.resolveHref(href)!
    expect(resolvedHref).toBeUndefined()
  })

  it('getCoverImage', () => {
    const coverImage = epub.getCoverImage()
    expect(coverImage.endsWith('.jpg')).toBe(true)
  })

  it('destroy', () => {
    expect(() => epub.destroy()).not.toThrow()
  })
})

describe('parse epubFile in browser', async () => {
  let epub2: EpubFile
  beforeAll(async () => {
    // @ts-expect-error __BROWSER__ is for build process
    globalThis.__BROWSER__ = true

    const currentDir = path.dirname(fileURLToPath(import.meta.url))
    const epubPath = path.resolve(currentDir, '../../../example/alice.epub')
    const fileReaderResult = readFileSync(epubPath)

    // simulate FileReader in browser
    class FileReader {
      result: any
      onload = () => { }
      onerror = () => { }
      readAsArrayBuffer = () => { }
      constructor() {
        this.result = fileReaderResult
        setTimeout(() => {
          this.onload()
        }, 0)
      }
    }
    // @ts-expect-error simulate FileReader in browser
    globalThis.FileReader = FileReader

    epub2 = await initEpubFile(new Uint8Array(readFileSync('./example/alice.epub')))
  })

  afterAll(() => {
    // @ts-expect-error simulate FileReader in browser
    delete globalThis.FileReader
  })

  it('loadChapter', async () => {
    const { css, html, mediaOverlays } = await epub2.loadChapter('item32')
    // html
    const imageTags = html.match(/<(img|source)[^>]*>/g)
    const srcs = imageTags?.map((imgTag) => {
      const src = imgTag.match(/src="([^"]*)"/)!
      return src[1]
    })
    expect(srcs?.every(src => src.startsWith('blob:'))).toBe(true)
    // css
    expect(css.length).toBe(3)
    expect(css.every(css => css.href.startsWith('blob'))).toBe(true)

    // url() in css should be replaced with blob url
    const cssFileContent = await fetch(css[0].href).then(res => res.text())
    const matchedUrl = cssFileContent.match(/url\(([^)]*)\)/)![1]
    expect(matchedUrl.startsWith('blob')).toBe(true)

    // media-overlay
    expect(mediaOverlays!.length).toBe(2)
    expect(mediaOverlays![1].audioSrc.startsWith('blob')).toBe(true)
    expect(mediaOverlays![0].pars.length).toBe(1)
    expect(mediaOverlays![1].pars.length).toBe(9)
  })

  // simulate File
  class FileSimulated {
    constructor(public name: string) { }
  }

  it('getFileInfo', () => {
    const fileName = 'alice.epub'
    const file = new FileSimulated(fileName)
    const epub = new EpubFile(file as unknown as File)

    expect(epub.getFileInfo()).toEqual({
      fileName,
      mimetype: '',
    })
  })

  it('getCoverImage', () => {
    const coverImage = epub2.getCoverImage()
    expect(coverImage.startsWith('blob')).toBe(true)
  })

  it('destroy', () => {
    expect(() => epub2.destroy()).not.toThrow()
  })
})

describe('alice-corner-case.epub in node', async () => {
  // @ts-expect-error __BROWSER__ is for build process
  globalThis.__BROWSER__ = false

  // alice.epub file path
  const epub = await initEpubFile('./example/alice-corner-case.epub')

  it('getCoverImage should return ""', () => {
    const coverImage = epub.getCoverImage()
    expect(coverImage).toBe('')
  })

  it('destroy', () => {
    expect(() => epub.destroy()).not.toThrow()
  })
})

describe('alice-corner-case.epub in browser', async () => {
  // @ts-expect-error __BROWSER__ is for build process
  globalThis.__BROWSER__ = true
  let epub: EpubFile
  beforeAll(async () => {
    // @ts-expect-error __BROWSER__ is for build process
    globalThis.__BROWSER__ = true

    const currentDir = path.dirname(fileURLToPath(import.meta.url))
    const epubPath = path.resolve(currentDir, '../../../example/alice-corner-case.epub')
    const fileReaderResult = readFileSync(epubPath)

    // simulate FileReader in browser
    class FileReader {
      result: any
      onload = () => { }
      onerror = () => { }
      readAsArrayBuffer = () => { }
      constructor() {
        this.result = fileReaderResult
        setTimeout(() => {
          this.onload()
        }, 0)
      }
    }
    // @ts-expect-error simulate FileReader in browser
    globalThis.FileReader = FileReader

    // There is no need to pass real epub uint8array, because the FileReader is simulated
    epub = await initEpubFile(new Uint8Array())
  })

  afterAll(() => {
    // @ts-expect-error simulate FileReader in browser
    delete globalThis.FileReader
  })

  it('getCoverImage should return ""', () => {
    const coverImage = epub.getCoverImage()
    expect(coverImage).toBe('')
  })

  it('destroy', () => {
    expect(() => epub.destroy()).not.toThrow()
  })
})
