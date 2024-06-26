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
})
