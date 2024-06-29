import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { EpubFile } from '../src/epub.ts'

describe('epubFile', () => {
  // alice.epub file path
  const currentDir = path.dirname(fileURLToPath(import.meta.url))
  const epubPath = path.resolve(currentDir, './example/alice.epub')
  const epub = new EpubFile(epubPath)

  it('mimeType', async () => {
    expect(epub.mimeType).toBe('application/epub+zip')
  })

  it('container file fullpath', () => {
    expect(epub.rootFile).toBe('19033/content.opf')
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
    const path = epub.rootFile.split('/')
    path.pop()
    const rootPath = path.join('/')

    // 33 items in manifest
    expect(Object.keys(manifest).length).toBe(33)
    expect(manifest.item1).toEqual({
      'id': 'item1',
      'href': `${rootPath}/www.gutenberg.org@files@19033@19033-h@images@cover_th.jpg`,
      'media-type': 'image/jpeg',
    })
  })
})
