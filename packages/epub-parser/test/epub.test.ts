import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'
import process from 'node:process'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { initEpubFile } from '../src'
import { EpubFile } from '../src/epub'

describe('parse epubFile', async () => {
  // @ts-expect-error __BROWSER__ is for build process
  globalThis.__BROWSER__ = false

  // alice.epub file path
  const epub = await initEpubFile('./example/alice.epub')

  it('file name', () => {
    expect(epub.getFileName()).toBe('alice.epub')
  })

  it('imageSaveDir', () => {
    expect(epub.getResourceSaveDir()).toBe('./images')
  })

  it('mimeType', async () => {
    expect(epub.getMimeType()).toBe('application/epub+zip')
  })

  it('container file fullpath', () => {
    expect(epub.getRootFilePath()).toBe('19033/content.opf')
    expect(epub.getContentBaseDir()).toBe('19033')
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
    expect(Object.keys(manifest).length).toBe(33)
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
      mediaOverlay: '',
    })
  })

  it('parseSpine', () => {
    const spine = epub.getSpine()

    expect(spine.length).toBe(1)
    expect(spine[0]).toEqual({
      id: 'item32',
      href: '19033/www.gutenberg.org@files@19033@19033-h@19033-h-0.htm',
      mediaType: 'application/xhtml+xml',
      mediaOverlay: '',
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
      href: '19033/www.gutenberg.org@files@19033@19033-h@images@cover_th.jpg',
    }])
  })

  it('parseCollection: alice.epub has no collection', () => {
    const collection = epub.getCollection()
    expect(collection.length).toBe(0)
  })

  // .ncx file
  it('.ncx navMap', () => {
    const navMap = epub.getNavMap()
    expect(navMap.length).toBe(14)
    expect(navMap[13]).toEqual({
      depth: 1,
      label: 'X—ALICE\'S EVIDENCE',
      src: '19033/www.gutenberg.org@files@19033@19033-h@19033-h-0.htm#pgepubid00058',
      correspondId: 'item32',
      playOrder: '59',
    })
  })

  it('.ncx pageList', () => {
    const pageList = epub.getPageList()
    expect(pageList.label).toBe('Pages')
    expect(pageList.pageTargets.length).toBe(48)
    expect(pageList.pageTargets[47]).toEqual({
      label: '[Pg 48]',
      value: '48',
      src: '19033/www.gutenberg.org@files@19033@19033-h@19033-h-0.htm#Page_48',
      playOrder: '62',
      type: 'normal',
      correspondId: 'item32',
    })
  })

  it('alice epub has no navList in toc.ncx', () => {
    const navList = epub.getNavList()
    expect(navList.label).toBe('')
    expect(navList.navTargets.length).toBe(0)
  })

  it('getToc', () => {
    const toc = epub.getToc()
    expect(toc.length).toBe(1)
  })

  it('getHTML', async () => {
    const { css, html } = (await epub.getHTML('item32'))
    // html
    const imageTags = html.match(/<img[^>]*>/g)
    const srcs = imageTags?.map((imgTag) => {
      const src = imgTag.match(/src="([^"]*)"/)!
      return src[1]
    })
    const cwd = process.cwd()
    expect(srcs?.every(src => src.startsWith(cwd))).toBe(true)
    // css
    expect(css.length).toBe(3)
    expect(css.every(cssPath => cssPath.startsWith(cwd))).toBe(true)
  })

  it('revoke image urls', () => {
    expect(() => epub.destroy()).not.toThrow()
  })
})

describe('parse epubFile in browser', async () => {
  let epub: EpubFile
  beforeAll(async () => {
    // @ts-expect-error __BROWSER__ is for build process
    globalThis.__BROWSER__ = true

    const currentDir = path.dirname(fileURLToPath(import.meta.url))
    const epubPath = path.resolve(currentDir, '../../../example/alice.epub')
    const fileReaderResult = fs.readFileSync(epubPath)

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

    // TODO: the parameter of initEpubFile should be a File object in browser env
    //  but here we use a string path for test, it can process File when we use it in browser
    // alice.epub file path
    epub = await initEpubFile('./example/alice.epub')
  })

  afterAll(() => {
    // @ts-expect-error simulate FileReader in browser
    delete globalThis.FileReader
  })

  it('image src should be a blob url in browser env when epub.getHTML()', async () => {
    const { css, html } = await epub.getHTML('item32')
    // html
    const imageTags = html.match(/<img[^>]*>/g)
    const srcs = imageTags?.map((imgTag) => {
      const src = imgTag.match(/src="([^"]*)"/)!
      return src[1]
    })
    expect(srcs?.every(src => src.startsWith('blob:'))).toBe(true)
    // css
    expect(css.length).toBe(3)
    expect(css.every(cssPath => cssPath.startsWith('blob'))).toBe(true)
  })

  // simulate File
  class FileSimulated {
    constructor(public name: string) {}
  }

  it('read file name of File', () => {
    const fileName = 'alice.epub'
    const file = new FileSimulated(fileName)
    const epub = new EpubFile(file as unknown as File)
    expect(epub.getFileName()).toBe(fileName)
  })

  it('revoke image urls', () => {
    expect(() => epub.destroy()).not.toThrow()
  })
})
