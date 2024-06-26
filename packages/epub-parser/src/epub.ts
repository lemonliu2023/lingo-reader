
import { parsexml, ZipFile } from './utils.ts'

export class EpubFile {
  zip: ZipFile
  mimeFile: string = 'mimetype'
  constructor(public epubFileName: string) {
    // TODO: image root and link root
    this.zip = new ZipFile(epubFileName)
    this.checkMimeType()
  }

  async checkMimeType() {
    const fileContent = await this.zip.readFile(this.mimeFile)
    
    if (fileContent.toLowerCase() !== 'application/epub+zip') {
      throw new Error('Unsupported mime type')
    }
  }
}

