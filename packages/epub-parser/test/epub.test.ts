import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { EpubFile } from '../src/epub.ts'

describe('epubFile', () => {
  it('will not throw error when checkMimeType', async () => {
    // alice.epub file path
    const currentDir = path.dirname(fileURLToPath(import.meta.url))
    const epubPath = path.resolve(currentDir, './example/alice.epub')
    expect(() => new EpubFile(epubPath)).not.toThrow()
  })
})
