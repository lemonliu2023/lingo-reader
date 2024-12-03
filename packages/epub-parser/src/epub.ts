import process from 'node:process'
import { parsexml, path } from '@svg-ebook-reader/shared'
import { existsSync, mkdirSync, writeFileSync } from './fsImagePolyfill'
import { type ZipFile, createZipFile } from './utils'
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
import { transformHTML } from './transformHTML'
/*
  TODO: parse links in meta-inf/container.xml
*/

// wrapper for async constructor, because EpubFile class has async code
export async function initEpubFile(epubPath: string | File, imageRoot?: string): Promise<EpubFile> {
  const epub = new EpubFile(epubPath, imageRoot)
  await epub.loadEpub()
  await epub.parse()
  return epub
}

/**
 * The class EpubFile is an epub file parse manager.
 * It has a ZipFile instance used to read files in epub file. Its function
 *  is to read and parse(xml) the content of epub file and then hand it
 *  over to other functions for processing. Finally, the infomation extracted
 *  from epub file is stored in the form of EpubFile class attributes.
 */
export class EpubFile {
  /**
   * epub file name without extension
   */
  private fileNameWithoutExt: string = ''
  public getFileName(): string {
    return this.fileNameWithoutExt
  }

  /**
   * imageSaveDir is an absolute path in Node env, because it was obtained by path.resolve
   *  and it is used to save images in epub file. In browser env, the __dirname is '/' and
   *  the read/write of image file occurs in memory, so the imageSaveDir is not used. It also
   *  an absolute path.
   */
  private imageSaveDir: string
  getImageSaveDir(): string {
    return this.imageSaveDir
  }

  /**
   * mimetype through reading the file 'mimetype'
   */
  private mimeType: string = ''
  public getMimeType(): string {
    return this.mimeType
  }

  /**
   * zip processing class
   */
  private zip!: ZipFile

  /**
   * meta-inf/container.xml full-path and .opf file path when reading zip
   */
  private rootFilePath: string = ''
  public getRootFilePath(): string {
    return this.rootFilePath
  }

  /**
   * content base dir when reading files using ZipFile attribute,
   */
  private contentBaseDir: string = ''
  public getContentBaseDir(): string {
    return this.contentBaseDir
  }

  /**
   * <metadata> in .opf file
   */
  private metadata?: Metadata
  public getMetadata(): Metadata {
    return this.metadata!
  }

  /**
   * <manifest> in .opf file
   */
  private manifest: Record<string, ManifestItem> = {}
  public getManifest(): Record<string, ManifestItem> {
    return this.manifest
  }

  /**
   * <spine> in .opf file
   */
  private spine: SpineItem[] = []
  public getSpine(): SpineItem[] {
    return this.spine
  }

  /**
   * <guide> in .opf file
   */
  private guide: GuideReference[] = []
  public getGuide(): GuideReference[] {
    return this.guide
  }

  /**
   * <collection> in .opf file
   */
  private collections: CollectionItem[] = []
  public getCollection(): CollectionItem[] {
    return this.collections
  }

  /**
   * <navMap> in .ncx file
   *  which is default value if there is no <navMap> in epub file
   */
  private navMap: NavPoint[] = []
  public getNavMap(): NavPoint[] {
    return this.navMap
  }

  /**
   * <pageList> in .ncx file
   *  which is default value if there is no <pageList> in epub file
   */
  private pageList: PageList = {
    label: '',
    pageTargets: [],
  }

  public getPageList(): PageList {
    return this.pageList
  }

  /**
   * <navList> in .ncx file,
   *  which is default value if there is no <navList> in epub file
   */
  private navList: NavList = {
    label: '',
    navTargets: [],
  }

  public getNavList(): NavList {
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

  async loadEpub(): Promise<void> {
    this.zip = await createZipFile(this.epubPath)
  }

  public async parse(): Promise<void> {
    // mimetype
    const mimetype = await this.zip.readFile('mimetype')
    this.mimeType = parseMimeType(mimetype)

    // meta-inf/container.xml
    const containerXml = await this.zip.readFile('meta-inf/container.xml')
    const containerAST = await parsexml(containerXml)
    // full-path
    this.rootFilePath = parseContainer(containerAST)
    this.contentBaseDir = this.rootFilePath.split('/').slice(0, -1).join('/')

    // .opf file
    await this.parseRootFile()
  }

  /**
   * parse .opf file
   */
  private async parseRootFile(): Promise<void> {
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
          // .ncx file path
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

    // .ncx file
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

  /**
   *
   * @returns { SpineItem[] } the table of contents of the epub file
   */
  public getToc(): SpineItem[] {
    // the priority is spine > manifest
    return this.spine.length > 0 ? this.spine : Object.values(this.manifest)
  }

  /**
   * replace <img> src absolute path or blob url
   * @param id the manifest item id of the chapter
   * @returns replaced html string
   */
  public async getHTML(id: string): Promise<string> {
    const xmlHref = this.manifest[id].href
    return transformHTML(await this.zip.readFile(xmlHref), this.imageSaveDir)
  }
}
