import xml2js from 'xml2js'
import AdmZip from 'adm-zip'

// add options: const xmlOptions = {}
export async function parsexml(str: string) {
  try {
    const result = await xml2js.parseStringPromise(str)
    return result
  } catch (err) {
    throw err
  }
}

export class ZipFile {
  admZip: AdmZip
  names: Set<string>
  count: number
  constructor(filePath: string) {
    this.admZip = new AdmZip(filePath)
    this.names = new Set(this.admZip.getEntries().map(zipEntry => zipEntry.entryName))
    this.count = this.names.size
  }

  async readFile(name: string) {
    if (!this.names.has(name)) {
      throw new Error('File not found')
    }
    return this.admZip.readFile(this.admZip.getEntry(name)!)?.toString('utf8')
  }
}



