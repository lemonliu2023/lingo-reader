import fs from 'node:fs'
// import xml2js from 'xml2js'
import JSZip from 'jszip'
import { path } from '@svg-ebook-reader/shared'
// import type { ParserOptions } from 'xml2js'
import { readFileSync } from './fsImagePolyfill'

// export async function parsexml(str: string, optionsParserOptions: ParserOptions = {}) {
//   try {
//     const result = await xml2js.parseStringPromise(str, optionsParserOptions)
//     return result
//   }
//   catch (err) {
//     console.error(err)
//   }
// }

export async function createZipFile(filePath: string | File) {
  const zip = new ZipFile(filePath)
  await zip.loadZip()
  return zip
}

// wrap epub file into a class, epub file is a zip file
//  expose file operation(readFile, readImage..) to process the file in .zip
export class ZipFile {
  private jsZip!: JSZip
  private names!: Map<string, string>
  public getNames() {
    return [...this.names.values()]
  }

  constructor(private filePath: string | File) { }

  public async loadZip() {
    this.jsZip = await this.readZip(this.filePath)
    this.names = new Map(Object.keys(this.jsZip.files).map(
      (name) => {
        return [name.toLowerCase(), name]
      },
    ))
  }

  private async readZip(file: string | File): Promise<JSZip> {
    return new Promise((resolve, reject) => {
      if (__BROWSER__) {
        const reader = new FileReader()
        reader.onload = () => {
          new JSZip()
            .loadAsync(reader.result!)
            .then((zipFile) => {
              resolve(zipFile)
            })
        }
        reader.readAsArrayBuffer(file as File)
        reader.onerror = reject
      }
      else {
        new JSZip()
          .loadAsync(new Uint8Array(fs.readFileSync(<string>file)))
          .then((zipFile) => {
            resolve(zipFile)
          })
      }
    })
  }

  public async readFile(name: string): Promise<string> {
    if (!this.hasFile(name)) {
      throw new Error(`${name} file was not exit in ${this.filePath}`)
    }
    const fileName = this.getFileName(name)!
    const file = await this.jsZip.file(fileName)!.async('string')
    return file
  }

  public async readImage(name: string): Promise<Uint8Array> {
    if (!this.hasFile(name)) {
      throw new Error(`${name} file was not exit in ${this.filePath}`)
    }
    const fileName = this.getFileName(name)!
    const file = await this.jsZip.file(fileName)!.async('uint8array')
    return file
  }

  private hasFile(name: string): boolean {
    return this.names.has(name.toLowerCase())
  }

  private getFileName(name: string): string | undefined {
    return this.names.get(name.toLowerCase())
  }
}

export function camelCase(str: string): string {
  return str.replace(/-([a-z])/g, g => g[1].toUpperCase())
}

export const imageExtensionToMimeType: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  bmp: 'image/bmp',
  ico: 'image/x-icon',
  tiff: 'image/tiff',
  tif: 'image/tiff',
  heic: 'image/heic',
  avif: 'image/avif',
}

// TODO: provide an api for revoking blob url
export function transformImageSrc(src: string, imageSaveDir: string): string {
  const imageName = src.split('/').pop()!
  let imageSrc = path.resolve(imageSaveDir, imageName)
  if (__BROWSER__) {
    const ext = imageName.split('.').pop()!
    const blobType = imageExtensionToMimeType[ext]
    const image = new Uint8Array(readFileSync(imageSrc))
    const blob = new Blob([image], { type: blobType })
    imageSrc = URL.createObjectURL(blob)
  }
  return imageSrc
}
