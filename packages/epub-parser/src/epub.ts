import process from 'node:process'
import path from '@svg-ebook-reader/shared/path'
import type { ChapterOutput } from '@svg-ebook-reader/shared'
import { existsSync, mkdirSync, writeFileSync } from './fsImagePolyfill'
import { type ZipFile, createZipFile, parsexml } from './utils'
import type {
  CollectionItem,
  GuideReference,
  ManifestItem,
  Metadata,
  NavList,
  NavPoint,
  PageList,
  SpineItem,
} from './types'
import {
  parseCollection,
  parseContainer,
  parseGuide,
  parseManifest,
  parseMetadata,
  parseMimeType,
  parseNavList,
  parseNavMap,
  parsePageList,
  parseSpine,
} from './parseFiles'
import { parseChapter } from './parseChapter'
/*
  TODO: parse links in meta-inf/container.xml
*/

// wrapper for async constructor, because EpubFile constructor has async code
export async function initEpubFile(epubPath: string | File, imageRoot?: string): Promise<EpubFile> {
  const epub = new EpubFile(epubPath, imageRoot)
  await epub.loadEpub()
  await epub.parse()
  return epub
}

/**
 * The class EpubFile is an epub file parse manager,
 */
export class EpubFile {
  private fileNameWithoutExt: string = ''
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

  private zip!: ZipFile

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

  private spine: SpineItem[] = []
  public getSpine() {
    return this.spine
  }

  private guide: GuideReference[] = []
  public getGuide() {
    return this.guide
  }

  private collections: CollectionItem[] = []
  public getCollection() {
    return this.collections
  }

  private navMap: NavPoint[] = []
  public getNavMap() {
    return this.navMap
  }

  private pageList: PageList = {
    label: '',
    pageTargets: [],
  }

  public getPageList() {
    return this.pageList
  }

  private navList: NavList = {
    label: '',
    navTargets: [],
  }

  public getNavList() {
    return this.navList
  }

  constructor(private epubPath: string | File, imageRoot: string = './images') {
    if (typeof epubPath === 'string') {
      this.fileNameWithoutExt = path.basename(epubPath, path.extname(epubPath))
    }
    // imageSaveDir must be an absolute path
    this.imageSaveDir = path.resolve(process.cwd(), imageRoot)
    if (!existsSync(this.imageSaveDir)) {
      mkdirSync(this.imageSaveDir, { recursive: true })
    }
  }

  async loadEpub() {
    this.zip = await createZipFile(this.epubPath)
  }

  public async parse() {
    // mimetype
    const mimetype = await this.zip.readFile('mimetype')
    this.mimeType = parseMimeType(mimetype)

    // meta-inf/container.xml
    const containerXml = await this.zip.readFile('meta-inf/container.xml')
    const containerAST = await parsexml(containerXml)
    this.rootFilePath = parseContainer(containerAST)
    this.contentBaseDir = this.rootFilePath.split('/').slice(0, -1).join('/')

    // .opf file
    await this.parseRootFile()
  }

  private async parseRootFile() {
    const rootFileOPF = await this.zip.readFile(this.rootFilePath)
    const xml = await parsexml(rootFileOPF)
    const rootFile = xml.package

    let tocPath = ''
    for (const key in rootFile) {
      switch (key) {
        case 'metadata': {
          this.metadata = parseMetadata(rootFile[key][0])
          break
        }
        case 'manifest': {
          this.manifest = parseManifest(rootFile[key][0], this.contentBaseDir)
          // save element if it is an image,
          // which was determined by whether media-type starts with 'image'
          for (const key in this.manifest) {
            const manifestItem = this.manifest[key]

            if (manifestItem.mediaType.startsWith('image')) {
              const imageName: string = manifestItem.href.split('/').pop()!
              const imagePath = path.resolve(this.imageSaveDir, imageName)
              if (!existsSync(imagePath)) {
                writeFileSync(
                  imagePath,
                  await this.zip.readImage(manifestItem.href),
                )
              }
            }
          }
          break
        }
        case 'spine': {
          const res = parseSpine(rootFile[key][0], this.manifest)
          tocPath = res.tocPath
          this.spine = res.spine
          break
        }
        case 'guide': {
          this.guide = parseGuide(rootFile[key][0], this.contentBaseDir)
          break
        }
        case 'collection': {
          this.collections = parseCollection(rootFile[key], this.contentBaseDir)
          break
        }
      }
    }

    if (tocPath.length > 0) {
      const tocDirPath = path.dirname(tocPath)
      // href to id
      const hrefToIdMap: Record<string, string> = {}
      for (const item of this.spine) {
        hrefToIdMap[item.href] = item.id
      }
      const tocNcxFile = await this.zip.readFile(tocPath)
      const ncx = (await parsexml(tocNcxFile)).ncx
      // navMap
      if (ncx.navMap)
        this.navMap = parseNavMap(ncx.navMap[0], hrefToIdMap, tocDirPath)

      // pageList
      if (ncx.pageList)
        this.pageList = parsePageList(ncx.pageList[0], hrefToIdMap, tocDirPath)

      // navList
      if (ncx.navList)
        this.navList = parseNavList(ncx.navList[0], hrefToIdMap, tocDirPath)
    }
  }

  async getChapter(id: string): Promise<ChapterOutput> {
    const xmlHref = this.manifest[id].href
    return parseChapter(await this.zip.readFile(xmlHref), this.imageSaveDir)
  }

  public getToc(): SpineItem[] {
    return this.spine.length > 0 ? this.spine : Object.values(this.manifest)
  }
}
