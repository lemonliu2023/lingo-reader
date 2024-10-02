import { describe, expect, it } from 'vitest'
import { parseContainer, parseMimeType } from '../src/parseFiles'

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
    const containerXMl = `
      <?xml version='1.0' encoding='utf-8'?>
      <container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">
        <rootfiles>
          <rootfile media-type="application/oebps-package+xml" full-path="19033/content.opf"/>
        </rootfiles>
      </container>
    `
    expect(await parseContainer(containerXMl)).toBe('19033/content.opf')
  })

  it('should throw an error when rootfiles is not found', () => {
    const containerXMlWithNoRootFiles = `
      <?xml version='1.0' encoding='utf-8'?>
      <container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">
      </container>
    `
    expect(
      async () => await parseContainer(containerXMlWithNoRootFiles),
    ).rejects.toThrowError('No <rootfiles></rootfiles> tag found in meta-inf/container.xml')
  })

  it('media-type must be "application/oebps-package+xml"', () => {
    const containerXMlWithWrongMediaType = `
      <?xml version='1.0' encoding='utf-8'?>
      <container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">
        <rootfiles>
          <rootfile media-type="application/epub+zip" full-path="19033/content.opf"/>
        </rootfiles>
      </container>
    `
    expect(
      async () => await parseContainer(containerXMlWithWrongMediaType),
    ).rejects.toThrowError('media-type of <rootfile/> application/oebps-package+xml')
  })

  it('full-path must be a relative path', () => {
    const containerXMlWithAbsolutePath = `
      <?xml version='1.0' encoding='utf-8'?>
      <container xmlns="urn:oasis:names:tc:opendocument:xmlns:container" version="1.0">
        <rootfiles>
          <rootfile media-type="application/oebps-package+xml" full-path="/19033/content.opf"/>
        </rootfiles>
      </container>
    `
    expect(
      async () => await parseContainer(containerXMlWithAbsolutePath),
    ).rejects.toThrowError('full-path must be a relative path')
  })
})
