import { camelCase, parsexml, ZipFile } from './utils'
import type { ManifestItem, GuideReference, Spine, NavPoints, TOCOutput } from './types'
import { Chapter } from './chapter'
import { resolve, join } from 'node:path'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'

export class EpubFile {
  private zip: ZipFile
  private mimeFile: string = 'mimetype'
  public mimeType: string = ''
  public rootFile: string = ''
  public contentDir: string = ''
  public metadata: Record<string, any> = {}
  public manifest: Record<string, ManifestItem> = {}
  public spine: Spine = {
    // table of contents
    tocPath: '',
    contents: []
  }
  public guide: GuideReference[] = []
  // reference to the spine.contents
  public flow: ManifestItem[] = []
  // table of contents
  public toc: TOCOutput[] = []
  // remove duplicate href item in TOCOutput
  private hrefSet: Set<string> = new Set()

  imageSaveDir: string
  constructor(public epubPath: string, imageRoot: string = './images') {
    this.imageSaveDir = resolve(process.cwd(), imageRoot)
    if (!existsSync(this.imageSaveDir)) {
      mkdirSync(this.imageSaveDir, { recursive: true })
    }
    // TODO: link root
    this.zip = new ZipFile(this.epubPath)
    this.parse()
  }

  async parse() {
    this.checkMimeType()
    await this.parseContainer()
    await this.parseRootFile()
  }

  // parse mimetype
  private checkMimeType() {
    const fileContent = this.zip.readFile(this.mimeFile)
    if (fileContent.toLowerCase() !== 'application/epub+zip') {
      throw new Error('Unsupported mime type')
    }

    this.mimeType = fileContent.toLowerCase()
  }

  // parse meta-inf/container.xml
  private async parseContainer() {
    const containerFile = this.zip.getFileName('meta-inf/container.xml')
    if (!containerFile) {
      throw new Error('No container.xml in epub file')
    }

    const containerXml = this.zip.readFile(containerFile)
    const xmlContainer = (await parsexml(containerXml)).container
    if (!xmlContainer ||
      !xmlContainer.rootfiles ||
      !xmlContainer.rootfiles.length) {
      throw new Error('No rootfiles found')
    }

    const len = xmlContainer.rootfiles.length
    const rootFile = xmlContainer.rootfiles[len - 1].rootfile[0]
    const mediaType = rootFile['$']['media-type']
    const fullPath = rootFile['$']['full-path']
    if (mediaType !== 'application/oebps-package+xml' ||
      fullPath.length === 0) {
      throw new Error('Rootfile in unknow format')
    }
    this.rootFile = fullPath
    this.contentDir = fullPath.split('/').slice(0, -1).join('/')
  }

  // opf file package
  private async parseRootFile() {
    const rootFileOPF = this.zip.readFile(this.rootFile)
    const xml = await parsexml(rootFileOPF)
    const rootKeys = Object.keys(xml)
    let rootFile;
    if (rootKeys.length === 1) {
      rootFile = xml[rootKeys[0]]
    } else {
      rootFile = xml[rootKeys.length - 1]
    }
    for (const key in rootFile) {
      switch (key) {
        case 'metadata':
          this.parseMetadata(rootFile[key][0])
          break
        case 'manifest':
          await this.parseManifest(rootFile[key][0])
          break
        case 'spine':
          this.parseSpine(rootFile[key][0])
          break
        case 'guide':
          this.parseGuide(rootFile[key][0])
          break
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
        case 'coverage':
          this.metadata[keyName] = metadata[key][0]['_'] || metadata[key][0] || ''
          break

        case 'creator':
        case 'contributor':
          this.metadata[keyName] = { [keyName]: metadata[key][0]['_'] || '' }
          const $: Record<string, string> = metadata[key][0]['$']
          for (const attr in $) {
            const attrName = camelCase(attr.split(':').pop()!)
            this.metadata[keyName][attrName] = $[attr]
          }
          break

        case 'date':
          if (!metadata[key][0]['$']) {
            this.metadata[keyName] = metadata[key][0] || ''
          } else {
            this.metadata[keyName] = {}
            for (const event of metadata[key]) {
              const key = event['$']['opf:event']
              const value = event['_']
              this.metadata[keyName][key] = value
            }
          }
          break

        case 'identifier':
          const $OfIdentifier = metadata[key][0]['$']
          const content = metadata[key][0]['_']
          if ($OfIdentifier['opf:scheme']) {
            this.metadata[$OfIdentifier['opf:scheme'].toUpperCase()] = content
          } else {
            const contentSplit = content.split(':')
            if (content.startsWith('urn') && contentSplit.length > 1) {
              this.metadata[contentSplit[1].toUpperCase()] = contentSplit[2]
            } else {
              this.metadata['identifier'] = content
            }
          }
          break
      }
    }

    // <meta />
    const metas = metadata['meta']
    for (const meta of metas) {
      if (meta['$'] && meta['$'].name) {
        const name = meta['$'].name
        this.metadata[name] = meta['$'].content
      }
      if (meta['_'] && meta['_'].property) {
        const property = meta['_'].property.split(':').pop()
        this.metadata[property] = meta['_']
      }
    }
  }

  private async parseManifest(manifest: Record<string, any>) {
    const items = manifest.item
    if (!items) {
      throw new Error('The manifest element must contain one or more item elements')
    }

    for (const item of items) {
      const element = item['$']
      if (!element || !element.id || !element.href || !element['media-type']) {
        throw new Error('The item in manifest must have attributes id, href and mediaType.')
      }
      // save element if it is an image, 
      // which was determined by whether media-type starts with 'image'
      if (element['media-type'].startsWith('image')) {
        const imagePath = join(this.imageSaveDir, element.href)
        if (!existsSync(imagePath)) {
          writeFileSync(
            imagePath,
            this.zip.readImage(this.padWithContentDir(element.href))
          )
        }
      }
      this.manifest[element.id] = element
    }
  }

  private parseSpine(spine: Record<string, any>) {
    if (spine['$']?.toc) {
      this.spine.tocPath = this.manifest[spine['$'].toc].href || ""
    }

    const itemrefs = spine.itemref
    if (!itemrefs) {
      throw new Error('The spine element must contain one or more itemref elements')
    }
    for (const itemref of itemrefs) {
      const $ = itemref['$']
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
      const element = reference['$']
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
        const order = parseInt(navPoint['$']?.playOrder)
        const href = navPoint.content[0]['$']?.src.split('#')[0]

        if (!this.hrefSet.has(href)) {
          const element: TOCOutput = {
            href,
            order,
            title,
            level,
            id: ''
          }
          if (idList[href]) {
            Object.assign(element, this.manifest[idList[href]])
          } else {
            element.id = navPoint['$']?.id || ""
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

  async getChapter(id: string) {
    const xmlHref = this.manifest[id].href
    let xmlContent = this.zip.readFile(this.padWithContentDir(xmlHref))

    // remove <span> b strong i em u s small mark
    xmlContent = xmlContent.replace(/<\/?(span|b[^o]|strong|i[^m]|em^[b]|u[^l]|s|small|mark|header|footer|section)[^>]*>/ig, '')
    // remove a and <a/>
    xmlContent = xmlContent.replace(/<a[^>]*?>(.*?)<\/a[^>]*?>/ig, '$1')
    xmlContent = xmlContent.replace(/<a[^>]*?>/ig, '')
    // remove <tag></tag> with no content
    xmlContent = xmlContent.replace(/<(\w+)[^>]*?><\/\1[^>]*?>/ig, '')
    // remove <hr /> <br />
    xmlContent = xmlContent.replace(/<(hr|br)[^>]*?>/ig, '')
    // remove id and class
    xmlContent = xmlContent.replace(/\s*(class|id)=["'][^"']*["']/g, '')
    // mutiple (\n| ) to one (\n| )
    xmlContent = xmlContent.replace(/(^|[^\n])\n(?!\n)/g, '$1 ')
    xmlContent = xmlContent.replace(/[ \f\t\v]+/g, ' ')

    const xmlTree = await parsexml(xmlContent, {
      preserveChildrenOrder: true,
      explicitChildren: true,
      childkey: 'children'
    })
    const chapterContent = new Chapter(xmlTree)
    return chapterContent.getContents()
  }

  private padWithContentDir(href: string) {
    return join(this.contentDir, href).replace(/\\/g, '/')
  }

  public getToc() {
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

