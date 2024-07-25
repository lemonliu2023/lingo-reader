import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { ContentType } from '@svg-ebook-reader/shared'
import { EpubFile } from '../src/epub.ts'

describe('epubFile', () => {
  // alice.epub file path
  const currentDir = path.dirname(fileURLToPath(import.meta.url))
  const epubPath = path.resolve(currentDir, '../../../example/alice.epub')
  const epub = new EpubFile(epubPath)

  it('mimeType', async () => {
    expect(epub.mimeType).toBe('application/epub+zip')
  })

  it('imageSaveDir', () => {
    const matchResult = epubPath.match(/[\\/](\w+)\.epub/)
    const epubImageDirName = matchResult ? matchResult[1] : null
    const currentDir = path.dirname(fileURLToPath(import.meta.url))
    const imageDir = path.resolve(currentDir, `../../../example/${epubImageDirName}`)
    expect(epub.imageSaveDir).toBe(imageDir)
  })

  it('container file fullpath', () => {
    expect(epub.rootFile).toBe('19033/content.opf')
    expect(epub.contentDir).toBe('19033')
  })

  it('parseMetadata', () => {
    const metadata = epub.metadata
    expect(metadata.rights).toBe('Public domain in the USA.')
    expect(metadata.URI).toBe('http://www.gutenberg.org/ebooks/19033')
    expect(metadata.contributor).toEqual({
      contributor: 'Gordon Robinson',
      fileAs: 'Robinson, Gordon',
      role: 'ill',
    })
    expect(metadata.creator).toEqual({
      creator: 'Lewis Carroll',
      fileAs: 'Carroll, Lewis',
    })
    expect(metadata.title).toBe(`Alice's Adventures in Wonderland`)
    expect(metadata.language).toBe('en')
    expect(metadata.subject).toBe('Fantasy')
    expect(metadata.date).toEqual({
      publication: '2006-08-12',
      conversion: '2010-02-16T12:34:12.754941+00:00',
    })
    expect(metadata.source).toBe('http://www.gutenberg.org/files/19033/19033-h/19033-h.htm')
    expect(metadata.cover).toBe('item32')
  })

  it('parseManifest', () => {
    const manifest = epub.manifest

    // 33 items in manifest
    expect(Object.keys(manifest).length).toBe(33)
    expect(manifest.item1).toEqual({
      'id': 'item1',
      'href': 'www.gutenberg.org@files@19033@19033-h@images@cover_th.jpg',
      'media-type': 'image/jpeg',
    })
  })

  it('parseGuide', () => {
    const guide = epub.guide

    // 1 reference in guide
    expect(Object.keys(guide).length).toBe(1)
    expect(guide).toEqual([{
      title: 'Cover Image',
      type: 'cover',
      href: 'www.gutenberg.org@files@19033@19033-h@images@cover_th.jpg',
    }])
  })

  it('parseSpine', () => {
    const spine = epub.spine

    expect(spine.tocPath).toBe('toc.ncx')
    expect(spine.contents.length).toBe(1)
    expect(epub.flow.length).toBe(spine.contents.length)
    expect(spine.contents[0]).toEqual({
      'id': 'item32',
      'href': 'www.gutenberg.org@files@19033@19033-h@19033-h-0.htm',
      'media-type': 'application/xhtml+xml',
    })
  })

  it('walkNavMap', () => {
    expect(epub.toc.length).toBe(1)
    expect(epub.toc[0]).toEqual({
      'id': 'item32',
      'href': 'www.gutenberg.org@files@19033@19033-h@19033-h-0.htm',
      'order': 1,
      'title': 'THE "STORYLAND" SERIES',
      'level': 0,
      'media-type': 'application/xhtml+xml',
    })
  })

  it('getChapter', async () => {
    const chapterContents = await epub.getChapter('item32')
    expect(chapterContents.title).toBe('The Project Gutenberg eBook of Alice\'s Adventures in Wonderland, by Lewis Carroll')
    // has image and paragraph tag
    const types = new Set(chapterContents.contents.map(content => content.type))
    expect(types.has(ContentType.IMAGE)).toBe(true)
    expect(types.has(ContentType.PARAGRAPH)).toBe(true)
    // image src should start with contentDir
    const imgElement = chapterContents.contents.filter(content => content.type === ContentType.IMAGE)[0]
    expect(imgElement.src.startsWith(`${epub.contentDir}/`)).toBe(false)
  })
})
