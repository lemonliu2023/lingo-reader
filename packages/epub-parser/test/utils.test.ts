import path from 'node:path'
import fs from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { createZipFile } from '../src/utils.ts'

const aliceEpubNames = [
  '19033/',
  '19033/0.css',
  '19033/1.css',
  '19033/12997454.mp4',
  '19033/audios/',
  '19033/audios/mp3_700kb.mp3',
  '19033/audios/mp3_700kb2.mp3',
  '19033/content.opf',
  '19033/pgepub.css',
  '19033/toc.ncx',
  '19033/www.gutenberg.org@files@19033@19033-h@19033-h-0.htm',
  '19033/www.gutenberg.org@files@19033@19033-h@19033-h-0.smil',
  '19033/www.gutenberg.org@files@19033@19033-h@images@cover_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i001_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i002_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i003_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i004_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i005_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i006_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i007_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i008_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i009_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i010_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i011_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i012_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i013_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i014_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i015_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i016_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i017_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i018_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i019_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i020_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i021_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@i022_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@plate01_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@plate02_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@plate03_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@plate04_th.jpg',
  '19033/www.gutenberg.org@files@19033@19033-h@images@title.jpg',
  'META-INF/',
  'META-INF/container.xml',
  'mimetype',
]

describe('createZipFile in Node', async () => {
  // @ts-expect-error __BROWSER__ is for build process
  globalThis.__BROWSER__ = false

  const epubPath = path.resolve('./example/alice.epub')
  const epubFile = await createZipFile(epubPath)

  it('names in epub', () => {
    expect(epubFile.getNames()).toEqual(aliceEpubNames)
  })

  it('readFile', async () => {
    const fileContent = await epubFile.readFile('mimetype')
    expect(fileContent).toEqual('application/epub+zip')
  })

  it('readFile if file not exit', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { })
    expect(await epubFile.readFile('not-exist')).toBe('')
    expect(warnSpy).toBeCalled()
    warnSpy.mockRestore()
  })

  it('readImage', async () => {
    const imageContent = await epubFile.readResource(
      '19033/www.gutenberg.org@files@19033@19033-h@images@i022_th.jpg',
    )
    expect(imageContent.length).toBeGreaterThan(0)
  })

  it('readImage if file not exit', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { })
    const res = await epubFile.readResource('not-exist')
    expect(res.length).toBe(0)
    expect(warnSpy).toBeCalled()
    warnSpy.mockRestore()
  })
})

describe('createZipFile in Browser', async () => {
  // @ts-expect-error __BROWSER__ is for build process
  globalThis.__BROWSER__ = true

  const epubPath = path.resolve('./example/alice.epub')
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
      }, 10)
    }
  }
  // @ts-expect-error simulate FileReader in browser
  globalThis.FileReader = FileReader

  it('can parse .zip file through FileReader', async () => {
    const epubFile = await createZipFile(epubPath)
    expect(epubFile.getNames()).toEqual(aliceEpubNames)
  })
})
