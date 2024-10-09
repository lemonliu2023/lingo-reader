import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { initEpubFile } from '../src/epub.ts'

describe('epubFile', async () => {
  // alice.epub file path
  const epub = await initEpubFile('./example/alice.epub')

  it('file name', () => {
    expect(epub.getFileName()).toBe('alice')
  })

  it('imageSaveDir', () => {
    const dir = path.resolve(process.cwd(), './images')
    expect(epub.getImageSaveDir()).toBe(dir)
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

  // it('getChapter', async () => {
  //   const chapterContents = await epub.getChapter('item32')
  //   expect(chapterContents.title).toBe('The Project Gutenberg eBook of Alice\'s Adventures in Wonderland, by Lewis Carroll')
  //   // has image and paragraph tag
  //   const types = new Set(chapterContents.contents.map(content => content.type))
  //   expect(types.has(ContentType.IMAGE)).toBe(true)
  //   expect(types.has(ContentType.PARAGRAPH)).toBe(true)
  //   // image src should start with contentDir
  //   const imgElement = chapterContents.contents.filter(content => content.type === ContentType.IMAGE)[0]
  //   expect(imgElement.src.startsWith(`${epub.contentDir}/`)).toBe(false)
  // })
})
