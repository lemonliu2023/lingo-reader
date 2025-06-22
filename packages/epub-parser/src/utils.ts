import fs from 'node:fs'
import JSZip from 'jszip'
import type { EncryptionKeys, EpubFileOptions, PathToProcessors } from './types'

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

  private pathToProcessors: PathToProcessors = {}
  public useDeprocessors(processors: PathToProcessors) {
    this.pathToProcessors = {
      ...this.pathToProcessors,
      ...processors,
    }
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
    const file = await this.readResource(name)
    return new TextDecoder().decode(file)
  }

  public async readResource(name: string): Promise<Uint8Array> {
    if (!this.hasFile(name)) {
      console.warn(`${name} file was not exit in ${this.filePath}, return an empty uint8 array`)
      return new Uint8Array()
    }
    const fileName = this.getFileName(name)!
    let file = await this.jsZip.file(fileName)!.async('uint8array')
    if (this.pathToProcessors[fileName]) {
      for (const processor of this.pathToProcessors[fileName]) {
        file = await processor(file)
      }
    }
    return file
  }

  public hasFile(name: string): boolean {
    return this.names.has(name.toLowerCase())
  }

  private getFileName(name: string): string | undefined {
    return this.names.get(name.toLowerCase())
  }
}

export function camelCase(str: string): string {
  return str.replace(/-([a-z])/g, g => g[1].toUpperCase())
}

export const resourceExtensionToMimeType: Record<string, string> = {
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
  css: 'text/css',

  // video
  mp4: 'video/mp4',
  mkv: 'video/mkv',
  webm: 'video/webm',

  // audio
  mp3: 'audio/mp3',
  wav: 'audio/wav',
  ogg: 'audio/ogg',

  // font
  ttf: 'font/ttf',
  otf: 'font/otf',
  woff: 'font/woff',
  woff2: 'font/woff2',
  eot: 'font/eot',
}

export const savedResourceMediaTypePrefixes = new Set(Object.values(resourceExtensionToMimeType))

export const prefixMatch = /(?!xmlns)^.*:/

export function extractEncryptionKeys(options: EpubFileOptions): EncryptionKeys {
  const encryptionKeys: EncryptionKeys = {}
  // options
  if (options.rsaPrivateKey) {
    encryptionKeys.rsaPrivateKey = typeof options.rsaPrivateKey === 'string'
      ? Uint8Array.from(atob(options.rsaPrivateKey), c => c.charCodeAt(0))
      : options.rsaPrivateKey
  }
  if (options.aesSymmetricKey) {
    encryptionKeys.aesSymmetricKey = typeof options.aesSymmetricKey === 'string'
      ? Uint8Array.from(atob(options.aesSymmetricKey), c => c.charCodeAt(0))
      : options.aesSymmetricKey
  }
  return encryptionKeys
}
