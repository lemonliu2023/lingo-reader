import xml2js from 'xml2js'
import AdmZip from 'adm-zip'
import type { ParserOptions } from 'xml2js'

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
  readFile(name: string): string {
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

  hasFile(name: string): boolean {
    return this.names.has(name.toLowerCase())
  }

  getFileName(name: string): string | undefined {
    return this.names.get(name.toLowerCase())
  }
}

export function camelCase(str: string): string {
  return str.replace(/-([a-z])/g, g => g[1].toUpperCase())
}
