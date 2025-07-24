import { existsSync, mkdirSync, unlink } from 'node:fs'
import type { FileInfo, InputFile } from '@lingo-reader/shared'
import { parsexml } from '@lingo-reader/shared'
import { extractFileName, inputFileToUint8Array, saveResource, saveStylesheet } from './utils'
import type { Fb2Metadata, Fb2ResourceMap } from './types'
import { parseBinary, parseDescription } from './parseXmlNodes'
import { STYLESHEET_ID } from './constant'

export async function initFb2File(
  fb2: InputFile,
  resourceSaveDir: string = './images',
) {
  const fb2Instance = new Fb2File(fb2, resourceSaveDir)
  await fb2Instance.loadFb2()

  return fb2Instance
}

export class Fb2File {
  // resource
  private resourceSaveDir: string
  private resourceMap!: Fb2ResourceMap
  private resourceCache: Map<string, string> = new Map()
  // stylesheet Url
  private stylesheetUrl: string = ''

  private metadata!: Fb2Metadata
  public getMetadata() {
    return this.metadata
  }

  private fileName!: string
  public getFileInfo(): FileInfo {
    return {
      fileName: this.fileName,
    }
  }

  private coverImageId!: string
  public getCoverImage() {
    if (this.resourceMap.has(this.coverImageId)) {
      const resourcePath = saveResource(this.resourceMap.get(this.coverImageId)!, this.resourceSaveDir)
      this.resourceCache.set(this.coverImageId, resourcePath)
      return resourcePath
    }
    return ''
  }

  constructor(
    private fb2: InputFile,
    resourceSaveDir: string = './images',
  ) {
    this.resourceSaveDir = resourceSaveDir
    if (!__BROWSER__ && !existsSync(this.resourceSaveDir)) {
      mkdirSync(this.resourceSaveDir, { recursive: true })
    }

    this.fileName = extractFileName(fb2)
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
    // TODO: metadata.history
    // description
    const { metadata, coverImageId } = parseDescription(fictionBook.description[0])
    this.metadata = metadata
    this.coverImageId = coverImageId
    // stylesheet
    if (fictionBook.stylesheet) {
      this.stylesheetUrl = saveStylesheet(fictionBook.stylesheet[0]._, this.resourceSaveDir)
      this.resourceCache.set(STYLESHEET_ID, this.stylesheetUrl)
    }
  }

  // getSpine: () => Spine
  // loadChapter: (id: string) => Promise<ProcessedChapter | undefined> | ProcessedChapter | undefined
  // getToc: () => Toc
  // resolveHref: (href: string) => ResolvedHref | undefined

  public destroy() {
    this.resourceCache.values().forEach((path) => {
      if (__BROWSER__) {
        URL.revokeObjectURL(path)
      }
      else {
        unlink(path, () => { })
      }
    })
    this.resourceCache.clear()
  }
}
