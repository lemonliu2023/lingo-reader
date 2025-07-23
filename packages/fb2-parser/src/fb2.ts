import { existsSync, mkdirSync } from 'node:fs'
import type { InputFile } from '@lingo-reader/shared'
import { parsexml } from '@lingo-reader/shared'
import { inputFileToUint8Array } from './utils'
import type { Fb2Metadata, Fb2ResourceMap } from './types'
import { parseBinary, parseDescription } from './parseXmlNodes'

export async function initFb2File(
  fb2: InputFile,
  resourceSaveDir: string = './images',
) {
  const fb2Instance = new Fb2File(fb2, resourceSaveDir)
  await fb2Instance.loadFb2()

  return fb2Instance
}

export class Fb2File {
  private resourceSaveDir: string
  private resourceMap!: Fb2ResourceMap
  private metadata!: Fb2Metadata
  private coverImageId!: string

  constructor(
    private fb2: InputFile,
    resourceSaveDir: string = './images',
  ) {
    this.resourceSaveDir = resourceSaveDir
    if (!__BROWSER__ && !existsSync(this.resourceSaveDir)) {
      mkdirSync(this.resourceSaveDir, { recursive: true })
    }
  }

  public async loadFb2() {
    // load fb2
    const fb2Uint8Array = await inputFileToUint8Array(this.fb2)
    const res = await parsexml(fb2Uint8Array, {
      charsAsChildren: true,
      preserveChildrenOrder: true,
      explicitChildren: true,
      childkey: 'children',
      trim: true,
    })
    const fictionBook = res.FictionBook

    // parse xml node
    this.resourceMap = parseBinary(fictionBook.binary)
    const { metadata, coverImageId } = parseDescription(fictionBook.description[0])
    this.metadata = metadata
    this.coverImageId = coverImageId
  }

  // getSpine: () => Spine
  // loadChapter: (id: string) => Promise<ProcessedChapter | undefined> | ProcessedChapter | undefined
  // getToc: () => Toc
  // getMetadata: () => Metadata
  // getFileInfo: () => FileInfo
  // getCoverImage?: () => string
  // resolveHref: (href: string) => ResolvedHref | undefined
  // destroy: () => void
}
