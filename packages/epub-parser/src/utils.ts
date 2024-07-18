import xml2js from 'xml2js'
import AdmZip from 'adm-zip'
import type { ParserOptions } from 'xml2js'

export async function parsexml(str: string, optionsParserOptions: ParserOptions = {}) {
  try {
    const result = await xml2js.parseStringPromise(str, optionsParserOptions)
    return result
  } catch (err) {
    console.error(err)
  }
}

export class ZipFile {
  admZip: AdmZip
  names: Map<string, string>
  count: number
  constructor(public filePath: string) {
    this.admZip = new AdmZip(filePath)
    this.names = new Map(this.admZip.getEntries().map(
      (zipEntry) => {
        return [zipEntry.entryName.toLowerCase(), zipEntry.entryName]
      })
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
    let content = this.admZip.readAsText(this.admZip.getEntry(fileName)!)
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

export const camelCase = (str: string) => {
  return str.replace(/-([a-z])/g, (g) => g[1].toUpperCase())
}

