import path, { join, resolve } from 'node:path'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import process from 'node:process'
import type { ChapterOutput } from '@svg-ebook-reader/shared'
import { ZipFile, parsexml } from './utils'
import type { GuideReference, ManifestItem, Metadata, NavPoints, Spine, TOCOutput } from './types'
import { parseChapter } from './parseChapter'
import { parseContainer, parseManifest, parseMetadata, parseMimeType } from './parseFiles'
/*
  zip file process
  mimetype file

  meta-inf/container.xml
  opf file
    - metadata
    - manifest
    - spine
    - guide
    - toc
  read chapter through toc or manifest
  save image file when parse manifest / imagedir
*/

export class EpubFile {
  private fileNameWithoutExt: string
  public getFileName() {
    return this.fileNameWithoutExt
  }

  private imageSaveDir: string
  getImageSaveDir() {
    return this.imageSaveDir
  }

  private mimeType: string = ''
  public getMimeType() {
    return this.mimeType
  }

  private zip: ZipFile

  // meta-inf/container.xml full-path
  private rootFilePath: string = ''
  public getRootFilePath() {
    return this.rootFilePath
  }

  private contentBaseDir: string = ''
  public getContentBaseDir() {
    return this.contentBaseDir
  }

  private metadata?: Metadata
  public getMetadata() {
    return this.metadata!
  }

  private manifest: Record<string, ManifestItem> = {}
  public getManifest() {
    return this.manifest
  }

  public spine: Spine = {
    // table of contents
    tocPath: '',
    contents: [],
  }

  public guide: GuideReference[] = []
  // reference to the spine.contents
  public flow: ManifestItem[] = []
  // table of contents
  public toc: TOCOutput[] = []
  // remove duplicate href item in TOCOutput
  private hrefSet: Set<string> = new Set()

  constructor(private epubPath: string, imageRoot: string = './images') {
    this.fileNameWithoutExt = path.basename(epubPath, path.extname(epubPath))
    this.imageSaveDir = resolve(process.cwd(), imageRoot)
    if (!existsSync(this.imageSaveDir)) {
      mkdirSync(this.imageSaveDir, { recursive: true })
    }
    // TODO: link root
    this.zip = new ZipFile(this.epubPath)
    this.parse()
  }

  async parse() {
    // mimetype
    const mimetype = this.zip.readFile('mimetype')
    this.mimeType = parseMimeType(mimetype)

    // meta-inf/container.xml
    const containerXml = this.zip.readFile('meta-inf/container.xml')
    const containerAST = await parsexml(containerXml)
    this.rootFilePath = parseContainer(containerAST)
    this.contentBaseDir = this.rootFilePath.split('/').slice(0, -1).join('/')

    // .opf file
    await this.parseRootFile()
  }

  private async parseRootFile() {
    const rootFileOPF = this.zip.readFile(this.rootFilePath)
    const xml = await parsexml(rootFileOPF)
    const rootFile = xml.package

    for (const key in rootFile) {
      switch (key) {
        case 'metadata': {
          this.metadata = parseMetadata(rootFile[key][0])
          break
        }
        case 'manifest': {
          this.manifest = parseManifest(rootFile[key][0])
          // save element if it is an image,
          // which was determined by whether media-type starts with 'image'
          for (const key in this.manifest) {
            const manifestItem = this.manifest[key]
            // TODO: pad all href with content dir, include manifest and toc
            // manifestItem.href = this.padWithContentDir(manifestItem.href)

            if (manifestItem.mediaType.startsWith('image')) {
              const imageName: string = manifestItem.href.split('/').pop()!
              const imagePath = resolve(this.imageSaveDir, imageName)
              if (!existsSync(imagePath)) {
                writeFileSync(
                  imagePath,
                  // cannot assign Buffer to ArrayBufferView, so convert it to Uint8Array,
                  //  which is a subclass of ArrayBufferView
                  new Uint8Array(this.zip.readImage(this.padWithContentDir(manifestItem.href))),
                )
              }
            }
          }
          break
        }
        case 'spine': {
          this.parseSpine(rootFile[key][0])
          break
        }
        case 'guide': {
          this.parseGuide(rootFile[key][0])
          break
        }
      }
    }

    if (this.spine.tocPath.length > 0) {
      await this.parseTOC()
    }
  }

  private parseSpine(spine: Record<string, any>) {
    if (spine.$?.toc) {
      this.spine.tocPath = this.manifest[spine.$.toc].href || ''
    }

    const itemrefs = spine.itemref
    if (!itemrefs) {
      throw new Error('The spine element must contain one or more itemref elements')
    }
    for (const itemref of itemrefs) {
      const $ = itemref.$
      if ($.idref) {
        const element = this.manifest[$.idref]
        this.spine.contents.push(element)
      }
    }
    this.flow = this.spine.contents
  }

  private parseGuide(guide: Record<string, any>) {
    const references = guide.reference
    if (!references) {
      throw new Error('Within the package there may be one guide element, containing one or more reference elements.')
    }
    for (const reference of references) {
      const element = reference.$
      this.guide.push(element)
    }
  }

  private async parseTOC() {
    // href to id
    const idList: Record<string, string> = {}
    const ids = Object.keys(this.manifest)
    for (const id of ids) {
      idList[this.manifest[id].href] = id
    }
    const tocNcxFile = this.zip.readFile(this.padWithContentDir(this.spine.tocPath))
    const ncxXml = (await parsexml(tocNcxFile)).ncx
    if (!ncxXml.navMap || !ncxXml.navMap[0].navPoint) {
      throw new Error('navMap is a required element in the NCX')
    }

    this.toc = this.walkNavMap(ncxXml.navMap[0].navPoint, idList)
  }

  private walkNavMap(navPoints: NavPoints, idList: Record<string, string>, level: number = 0) {
    if (level > 7) {
      return []
    }
    const output: TOCOutput[] = []
    for (const navPoint of navPoints) {
      if (navPoint.navLabel) {
        const title = navPoint.navLabel[0]?.text[0]
        const order = Number.parseInt(navPoint.$?.playOrder)
        const href = navPoint.content[0].$?.src.split('#')[0]

        if (!this.hrefSet.has(href)) {
          const element: TOCOutput = {
            href,
            order,
            title,
            level,
            id: '',
            mediaType: '',
          }
          if (idList[href]) {
            Object.assign(element, this.manifest[idList[href]])
          }
          else {
            element.id = navPoint.$?.id || ''
          }
          output.push(element)
          this.hrefSet.add(href)
        }
      }

      if (navPoint.navPoint) {
        output.push(...this.walkNavMap(navPoint.navPoint, idList, level + 1))
      }
    }
    return output
  }

  getChapter(id: string): Promise<ChapterOutput> {
    const xmlHref = this.manifest[id].href
    return parseChapter(this.zip.readFile(this.padWithContentDir(xmlHref)))
  }

  private padWithContentDir(href: string) {
    return join(this.contentBaseDir, href).replace(/\\/g, '/')
  }

  public getToc(): (TOCOutput | ManifestItem)[] {
    return this.toc.length ? this.toc : this.flow
  }
}

// wrapper for async constructor, because EpubFile constructor has async code
export function initEpubFile(epubPath: string, imageRoot?: string): Promise<EpubFile> {
  return new Promise((resolve) => {
    const epub = new EpubFile(epubPath, imageRoot)
    setTimeout(() => {
      resolve(epub)
    }, 0)
  })
}
