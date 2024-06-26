
import { parsexml, ZipFile } from './utils.ts'

export class EpubFile {
  zip: ZipFile
  mimeFile: string = 'mimetype'
  mimeType: string = ''
  rootFile: string = ''
  constructor(public epubFileName: string) {
    // TODO: image root and link root
    this.zip = new ZipFile(epubFileName)
    this.checkMimeType()
    this.parseContainer()
  }

  async checkMimeType() {
    const fileContent = await this.zip.readFile(this.mimeFile)
    if (fileContent.toLowerCase() !== 'application/epub+zip') {
      throw new Error('Unsupported mime type')
    }

    this.mimeType = fileContent.toLowerCase()
  }

  async parseContainer() {
    const containerFile = this.zip.getFileName('meta-inf/container.xml')
    if (!containerFile) {
      throw new Error('No container.xml in epub file')
    }

    const containerXml = await this.zip.readFile(containerFile)
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
  }
}

