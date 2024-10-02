import path, { join, resolve } from 'node:path'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import process from 'node:process'
import type { ChapterOutput } from '@svg-ebook-reader/shared'
import { ZipFile, camelCase, parsexml } from './utils'
import type { GuideReference, ManifestItem, NavPoints, Spine, TOCOutput } from './types'
import { parseChapter } from './parseChapter'
import { parseContainer, parseMimeType } from './parseFiles'
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

  public metadata: Record<string, any> = {}
  public manifest: Record<string, ManifestItem> = {}
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
    this.rootFilePath = await parseContainer(containerXml)
    this.contentBaseDir = this.rootFilePath.split('/').slice(0, -1).join('/')

    await this.parseRootFile()
  }

  // opf file package
  private async parseRootFile() {
    const rootFileOPF = this.zip.readFile(this.rootFilePath)
    const xml = await parsexml(rootFileOPF)
    const rootKeys = Object.keys(xml)
    let rootFile
    if (rootKeys.length === 1) {
      rootFile = xml[rootKeys[0]]
    }
    else {
      rootFile = xml[rootKeys.length - 1]
    }
    for (const key in rootFile) {
      switch (key) {
        case 'metadata': {
          this.parseMetadata(rootFile[key][0])
          break
        }
        case 'manifest': {
          await this.parseManifest(rootFile[key][0])
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

  private parseMetadata(metadata: Record<string, any>) {
    for (const key in metadata) {
      const keyName = key.split(':').pop()!
      switch (keyName) {
        case 'title':
        case 'subject':
        case 'description':
        case 'publisher':
        case 'type':
        case 'format':
        case 'source':
        case 'language':
        case 'relation':
        case 'rights':
        case 'coverage': {
          this.metadata[keyName] = metadata[key][0]._ || metadata[key][0] || ''
          break
        }

        case 'creator':
        case 'contributor': {
          this.metadata[keyName] = { [keyName]: metadata[key][0]._ || '' }
          const $: Record<string, string> = metadata[key][0].$
          for (const attr in $) {
            const attrName = camelCase(attr.split(':').pop()!)
            this.metadata[keyName][attrName] = $[attr]
          }
          break
        }

        case 'date': {
          if (!metadata[key][0].$) {
            this.metadata[keyName] = metadata[key][0] || ''
          }
          else {
            this.metadata[keyName] = {}
            for (const event of metadata[key]) {
              const key = event.$['opf:event']
              const value = event._
              this.metadata[keyName][key] = value
            }
          }
          break
        }

        case 'identifier': {
          const $OfIdentifier = metadata[key][0].$
          const content = metadata[key][0]._
          if ($OfIdentifier['opf:scheme']) {
            this.metadata[$OfIdentifier['opf:scheme'].toUpperCase()] = content
          }
          else {
            const contentSplit = content.split(':')
            if (content.startsWith('urn') && contentSplit.length > 1) {
              this.metadata[contentSplit[1].toUpperCase()] = contentSplit[2]
            }
            else {
              this.metadata.identifier = content
            }
          }
          break
        }
      }
    }

    // <meta />
    const metas = metadata.meta
    for (const meta of metas) {
      if (meta.$ && meta.$.name) {
        const name = meta.$.name
        this.metadata[name] = meta.$.content
      }
      if (meta._ && meta._.property) {
        const property = meta._.property.split(':').pop()
        this.metadata[property] = meta._
      }
    }
  }

  private async parseManifest(manifest: Record<string, any>) {
    const items = manifest.item
    if (!items) {
      throw new Error('The manifest element must contain one or more item elements')
    }

    for (const item of items) {
      const element = item.$
      if (!element || !element.id || !element.href || !element['media-type']) {
        throw new Error('The item in manifest must have attributes id, href and mediaType.')
      }
      // save element if it is an image,
      // which was determined by whether media-type starts with 'image'
      if (element['media-type'].startsWith('image')) {
        const imageName: string = element.href.split('/').pop()
        const imagePath = resolve(this.imageSaveDir, imageName)
        if (!existsSync(imagePath)) {
          writeFileSync(
            imagePath,
            // cannot assign Buffer to ArrayBufferView, so convert it to Uint8Array,
            //  which is a subclass of ArrayBufferView
            new Uint8Array(this.zip.readImage(this.padWithContentDir(element.href))),
          )
        }
      }
      this.manifest[element.id] = element
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
