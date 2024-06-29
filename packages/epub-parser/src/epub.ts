
import { camelCase, parsexml, ZipFile } from './utils.ts'

export class EpubFile {
  zip: ZipFile
  mimeFile: string = 'mimetype'
  mimeType: string = ''
  rootFile: string = ''
  metadata: Record<string, any> = {}
  constructor(public epubFileName: string) {
    // TODO: image root and link root
    this.zip = new ZipFile(epubFileName)
    this.parse()
  }

  async parse() {
    await this.checkMimeType()
    await this.parseContainer()
    await this.parseRootFile()
  }

  // parse mimetype
  async checkMimeType() {
    const fileContent = await this.zip.readFile(this.mimeFile)
    if (fileContent.toLowerCase() !== 'application/epub+zip') {
      throw new Error('Unsupported mime type')
    }

    this.mimeType = fileContent.toLowerCase()
  }

  // parse meta-inf/container.xml
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

  // opf file package
  async parseRootFile() {
    const rootFileOPF = await this.zip.readFile(this.rootFile)
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
          this.parseManifest(rootFile[key][0])
          break
        case 'spine':
          this.parseSpine(rootFile[key][0])
          break
        case 'guide':
          this.parseGuide(rootFile[key][0])
          break
      }
    }

    // TODO: parse TOC
  }

  parseMetadata(metadata: Record<string, any>) {
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
          this.metadata[keyName] = {[keyName]: metadata[key][0]['_'] || ''}
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
          console.log(metadata[key])
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
    console.log(this.metadata)
  }

  parseManifest(manifest: Object) {
    // console.log(manifest)
  }

  parseSpine(spine: Object) {
    // console.log(spine)
  }

  parseGuide(guide: Object) {
    // console.log(guide)
  }
}

