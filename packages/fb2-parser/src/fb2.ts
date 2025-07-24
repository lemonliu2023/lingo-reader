import { existsSync, mkdirSync, unlink } from 'node:fs'
import type { FileInfo, InputFile } from '@lingo-reader/shared'
import { parsexml } from '@lingo-reader/shared'
import { buildFb2Href, extractFileName, getFirstXmlNodeText, inputFileToUint8Array, saveResource, saveStylesheet } from './utils'
import type { Fb2ChapterMap, Fb2Metadata, Fb2RemainingBodys, Fb2ResolvedHref, Fb2ResourceMap, Fb2Spine, Fb2Toc } from './types'
import { parseBinary, parseDescription } from './parseXmlNodes'
import { HREF_PREFIX, ID_PREFIX, STYLESHEET_ID } from './constant'

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

  // chapters
  private chapterMap: Fb2ChapterMap = new Map()
  // Toc
  private tableOfContent: Fb2Toc = []
  public getToc() {
    return this.tableOfContent
  }

  // spine
  private spine: Fb2Spine = []
  public getSpine() {
    return this.spine
  }

  private remainingBody: Fb2RemainingBodys = []
  public getRemainingBodys() {
    return this.remainingBody
  }

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

    // TODO: buildIdToChapterMap
    // body
    for (const body of fictionBook.body) {
      // body that stores chapters
      if (!body.$?.name) {
        for (let i = 0; i < body.section.length; i++) {
          const id = ID_PREFIX + i
          const sectionNode = body.section[i]
          // innner chapter
          this.chapterMap.set(id, {
            id,
            sectionNode,
          })
          // spine
          this.spine.push({ id })
          // toc
          const sectionLabel = getFirstXmlNodeText(sectionNode.title)
          this.tableOfContent.push({
            label: sectionLabel,
            href: buildFb2Href(id),
          })
        }
      }
      else {
        // remaining body with name
        const name = body.$.name
        this.remainingBody.push({
          name,
          sectionNode: body.section[0],
        })
      }
    }
  }

  // loadChapter: (id: string) => Promise<ProcessedChapter | undefined> | ProcessedChapter | undefined

  public resolveHref(fb2Href: string): Fb2ResolvedHref | undefined {
    if (!fb2Href.startsWith(HREF_PREFIX)) {
      return undefined
    }
    // remove 'fb2:'
    fb2Href = fb2Href.slice(HREF_PREFIX.length).trim()
    const [chapterId, globalId] = fb2Href.split('#')
    const id = this.chapterMap.get(chapterId)?.id
    if (!id) {
      return undefined
    }
    let selector = ''
    if (globalId) {
      selector = `[id="${globalId}"]`
    }
    return {
      id,
      selector,
    }
  }

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
