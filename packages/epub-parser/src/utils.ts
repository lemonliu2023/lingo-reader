import xml2js from 'xml2js'
import AdmZip from 'adm-zip'
import type { ParserOptions } from 'xml2js'

export function pureXmlContent(xmlContent: string) {
  // remove <span> b strong i em u s small mark
  // /<\/?b[^o][^>]*>/gi will remove <b> and its content, keep body, and <i>, <u> is
  xmlContent = xmlContent
    .replace(/<\/?(span|strong|s|sup|small|mark|header|footer|section|figure|aside|code|blockquote|tbody|thead)[^>]*>/gi, '')
  xmlContent = xmlContent.replace(/<\/?(([biua]|em)|([biua]|em)\s[^>]*)>/g, '')

  // remove <tag></tag> with no content
  xmlContent = xmlContent.replace(/<([a-z][a-z0-9]*)\b[^>]*>\s*<\/\1>/gi, '')
  // remove <hr /> <br /> <a />
  xmlContent = xmlContent.replace(/<(hr|br|a)[^>]*>/gi, '')
  // remove useless attrs, class, id, style, epub:type
  xmlContent = xmlContent.replace(/\s*(class|id|style|epub:type)=["'][^"']*["']/g, '')

  // mutiple (\n| ) to one (\n| )
  // xmlContent = xmlContent.replace(/(^|[^\n])\n(?!\n)/g, '$1 ')
  xmlContent = xmlContent.replace(/(\r\n|\n|\r){2,}/g, '\n')
  // xmlContent = xmlContent.replace(/[ \f\t\v]+/g, ' ')

  return xmlContent
}

export async function parsexml(str: string, optionsParserOptions: ParserOptions = {}) {
  try {
    const result = await xml2js.parseStringPromise(str, optionsParserOptions)
    return result
  }
  catch (err) {
    console.error(err)
  }
}

// wrap epub file into a class, epub file is a zip file
//  expose file operation(readFile, readImage..) to process the file in .zip
export class ZipFile {
  admZip: AdmZip
  names: Map<string, string>
  count: number
  constructor(public filePath: string) {
    this.admZip = new AdmZip(filePath)
    this.names = new Map(this.admZip.getEntries().map(
      (zipEntry) => {
        return [zipEntry.entryName.toLowerCase(), zipEntry.entryName]
      },
    ),
    )
    this.count = this.names.size
    if (this.count === 0) {
      throw new Error('No file in zip')
    }
  }

  // read inner file in .epub file
  readFile(name: string) {
    if (!this.hasFile(name)) {
      throw new Error(`${name} file was not exit in ${this.filePath}`)
    }
    const fileName = this.getFileName(name)!
    const content = this.admZip.readAsText(this.admZip.getEntry(fileName)!)
    const txt = content.trim()
    if (txt.length === 0) {
      throw new Error(`${name} file is empty`)
    }
    return txt
  }

  readImage(name: string) {
    if (!this.hasFile(name)) {
      throw new Error(`${name} file was not exit in ${this.filePath}`)
    }
    const fileName = this.getFileName(name)!
    const content = this.admZip.readFile(this.admZip.getEntry(fileName)!)!
    return content
  }

  hasFile(name: string) {
    return this.names.has(name.toLowerCase())
  }

  getFileName(name: string) {
    return this.names.get(name.toLowerCase())
  }
}

export function camelCase(str: string) {
  return str.replace(/-([a-z])/g, g => g[1].toUpperCase())
}
