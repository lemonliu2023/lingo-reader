import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import { describe, expect, it, vi } from 'vitest'
import { parseContainer, parseMetadata, parseMimeType } from '../src/parseFiles'
import { parsexml } from '../src/utils'

describe('parseFiles', () => {
  it('should return application/epub+zip', () => {
    const file = 'application/epub+zip'
    expect(parseMimeType(file)).toBe('application/epub+zip')
  })

  it('should throw an error when file content is not \'application/epub\'', () => {
    const file = 'application/epub'
    expect(() => parseMimeType(file)).toThrowError('Unsupported mime type')
  })
})

describe('parseContainer', () => {
  it('full-path is "19033/content.opf"', async () => {
    const containerXML = `
      <?xml version='1.0' encoding='utf-8'?>
      <container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">
        <rootfiles>
          <rootfile media-type="application/oebps-package+xml" full-path="19033/content.opf"/>
        </rootfiles>
      </container>
    `
    const containerAST = await parsexml(containerXML)
    expect(await parseContainer(containerAST)).toBe('19033/content.opf')
  })

  it('should throw an error when rootfiles is not found', () => {
    const containerXMLWithNoRootFiles = `
      <?xml version='1.0' encoding='utf-8'?>
      <container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">
      </container>
    `
    expect(
      async () => {
        const containerAST = await parsexml(containerXMLWithNoRootFiles)
        await parseContainer(containerAST)
      },
    ).rejects.toThrowError('No <rootfiles></rootfiles> tag found in meta-inf/container.xml')
  })

  it('media-type must be "application/oebps-package+xml"', () => {
    const containerXMLWithWrongMediaType = `
      <?xml version='1.0' encoding='utf-8'?>
      <container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">
        <rootfiles>
          <rootfile media-type="application/epub+zip" full-path="19033/content.opf"/>
        </rootfiles>
      </container>
    `
    expect(
      async () => {
        const containerAST = await parsexml(containerXMLWithWrongMediaType)
        await parseContainer(containerAST)
      },
    ).rejects.toThrowError('media-type of <rootfile/> application/oebps-package+xml')
  })

  it('full-path must be a relative path', () => {
    const containerXMLWithAbsolutePath = `
      <?xml version='1.0' encoding='utf-8'?>
      <container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">
        <rootfiles>
          <rootfile media-type="application/oebps-package+xml" full-path="/19033/content.opf"/>
        </rootfiles>
      </container>
    `
    expect(
      async () => {
        const containerAST = await parsexml(containerXMLWithAbsolutePath)
        await parseContainer(containerAST)
      },
    ).rejects.toThrowError('full-path must be a relative path')
  })
})

describe('parseMetadata', async () => {
  // refines="noId"
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { })

  const metadataFilePath = path.resolve(fileURLToPath(import.meta.url), '../fixtures/metadata.opf')
  const fileContent = readFileSync(metadataFilePath, 'utf-8')
  const metadataAST = await parsexml(fileContent)
  const metadata = parseMetadata(metadataAST.package.metadata[0])
  it('simple field', () => {
    expect(metadata.rights).toBe('Public domain in the USA.')
    expect(metadata.coverage).toBe('United States')
    expect(metadata.description).toBe('Alice\'s')
    expect(metadata.format).toBe('application/epub+zip')
    expect(metadata.publisher).toBe('Project Gutenberg')
    expect(metadata.relation).toBe('http://www.gutenberg.org/ebooks/19033')
    expect(metadata.source).toBe('http://www.gutenberg.org/files/19033/19033-h/19033-h.htm')
    expect(metadata.type).toBe('text')
    expect(metadata.title).toBe('Alice\'s Adventures in Wonderland')
    expect(metadata.language).toBe('en')
  })

  it('date field', () => {
    expect(metadata.date).toEqual({
      publication: '2006-08-12',
      conversion: '2010-02-16T12:34:12.754941+00:00',
    })
  })

  it('identifier field', () => {
    expect(metadata.identifier).toEqual({
      id: 'http://www.gutenberg.org/ebooks/19033',
      scheme: 'URI',
    })
    expect(metadata.packageIdentifier).toEqual({
      id: 'uuid:19c0c5cb-002b-476f-baa7-fcf510414f95',
      identifierType: '06',
      scheme: 'onix:codelist5',
    })
  })

  it('subject field', () => {
    expect(metadata.subject![0]).toEqual({
      subject: 'Fantasy',
      authority: 'BISAC',
      term: 'FIC024000',
    })
    expect(metadata.subject![1]).toEqual({
      subject: 'Fantasy fiction, English',
      authority: '',
      term: '',
    })
  })

  it('creator field', () => {
    expect(metadata.creator![0]).toEqual({
      contributor: 'creator',
      fileAs: 'Murakami, Haruki',
      alternateScript: '上',
      role: '',
    })
    expect(metadata.creator![1]).toEqual({
      contributor: 'Rev. Dr. Martin Luther King Jr.',
      fileAs: 'King, Martin Luther Jr.',
      role: 'aut',
    })
  })

  it('contributor field', () => {
    expect(metadata.contributor![0]).toEqual({
      contributor: 'author',
      fileAs: '',
      role: '',
    })
    expect(metadata.contributor![1]).toEqual({
      contributor: 'Gordon Robinson',
      fileAs: 'Robinson, Gordon',
      role: 'ill',
    })
  })

  it('refined id does not exist', () => {
    expect(warnSpy).toBeCalledWith('No element with id noId found when parsing <metadata>')
  })

  it('metas field', () => {
    expect(metadata.metas).toEqual({
      'cover': 'item32',
      'dcterms:modified': '2016-02-29T12:34:56Z',
    })
  })
})
