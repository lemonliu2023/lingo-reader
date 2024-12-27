import { readFileSync } from 'node:fs'
import { kf8Header, mobiHeader, mobiLang, palmdocHeader, pdbHeader } from './headers'
import type {
  DecompressFunc,
  Exth,
  GetStruct,
  Kf8Header,
  MobiHeader,
  MobiHeaderExtends,
  Offset,
  PalmdocHeader,
  PdbHeader,
} from './types'
import {
  decompressPalmDOC,
  getDecoder,
  getExth,
  getFont,
  getNCX,
  getRemoveTrailingEntries,
  getString,
  getStruct,
  getUint,
  huffcdic,
  toArrayBuffer,
  unescapeHTML,
} from './utils'

export async function initMobiFile(file: string | File) {
  const mobi = new Mobi(file)
  await mobi.load()
  mobi.parse()

  return mobi
}

export class Mobi {
  private fileArrayBuffer!: ArrayBuffer
  // extract from pdb header
  private pdbHeader!: GetStruct<PdbHeader>
  private recordsOffset!: Offset
  private recordsMagic!: string[]

  // extract from first record
  private mobiHeader!: GetStruct<MobiHeader> & MobiHeaderExtends
  private palmdocHeader!: GetStruct<PalmdocHeader>
  private kf8Header?: GetStruct<Kf8Header>
  private exth?: Exth

  public isKf8: boolean = false
  private start: number = 0
  // resource start index in records
  private resourceStart!: number

  private decoder!: TextDecoder
  private encoder!: TextEncoder
  private removeTrailingEntries!: (array: Uint8Array) => Uint8Array
  private decompress!: DecompressFunc

  constructor(private file: string | File) { }

  async load() {
    this.fileArrayBuffer = await toArrayBuffer(
      __BROWSER__
        ? this.file as File
        : readFileSync(this.file as string),
    )
  }

  decode(arr: ArrayBuffer) {
    return this.decoder.decode(arr)
  }

  encode(str: string) {
    return this.encoder.encode(str)
  }

  loadRecord(index: number): ArrayBuffer {
    const [start, end] = this.recordsOffset[this.start + index]
    return this.fileArrayBuffer.slice(start, end)
  }

  loadMagic(index: number): string {
    return this.recordsMagic[this.start + index]
  }

  loadText(index: number) {
    return this.decoder.decode(
      this.decompress(
        this.removeTrailingEntries(
          new Uint8Array(
            this.loadRecord(index + 1),
          ),
        ),
      ),
    )
  }

  loadResource(index: number): Uint8Array {
    const buf = this.loadRecord(this.resourceStart + index)
    const magic = getString(buf.slice(0, 4))
    if (magic === 'FONT') {
      return getFont(buf)
    }
    if (magic === 'VIDE' || magic === 'AUDI') {
      return new Uint8Array(buf.slice(12))
    }
    return new Uint8Array(buf)
  }

  getNCX() {
    const index = this.mobiHeader.indx
    if (index < 0xFFFFFFFF) {
      return getNCX(index, this.loadRecord.bind(this))
    }
    return undefined
  }

  getMetadata() {
    // const { mobi, exth } = this.headers
    const mobi = this.mobiHeader
    const exth = this.exth
    return {
      identifier: this.mobiHeader.uid.toString(),
      title: exth?.title || mobi.title,
      author: (exth?.creator as string[])?.map(unescapeHTML),
      publisher: exth?.publisher,
      language: exth?.language ?? mobi.language,
      published: exth?.date ?? '',
      description: exth?.description ?? '',
      subject: (exth?.subject as string[])?.map(unescapeHTML),
      rights: exth?.rights ?? '',
      contributor: exth?.contributor,
    }
  }

  getCover() {
    const exth = this.exth
    const coverOffset = Number(exth?.coverOffset?.[0] ?? 0xFFFFFFFF)
    const thumbnailOffset = Number(exth?.thumbnailOffset?.[0] ?? 0xFFFFFFFF)
    const offset = coverOffset < 0xFFFFFFFF
      ? coverOffset
      : thumbnailOffset < 0xFFFFFFFF
        ? thumbnailOffset
        : undefined
    if (offset) {
      const buf = this.loadResource(offset)
      return new Blob([buf])
    }
    return undefined
  }

  parse() {
    this.parsePdbHeader()
    this.parseFirstRecord(this.loadRecord(0))
    // resource start index in records
    this.resourceStart = this.mobiHeader.resourceStart
    if (!this.isKf8) {
      const boundary = this.exth?.boundary?.[0] as number ?? 0xFFFFFFFF
      if (boundary < 0xFFFFFFFF) {
        try {
          // it's a "combo" MOBI/KF8 file; try to open the KF8 part
          this.parseFirstRecord(this.loadRecord(boundary))
          this.start = boundary
        }
        catch (e) {
          console.warn(e)
          console.warn('Failed to open KF8; falling back to MOBI')
        }
      }
    }
    this.setup()
  }

  private parsePdbHeader() {
    const pdb = getStruct(pdbHeader, this.fileArrayBuffer.slice(0, 78))
    pdb.name = pdb.name.replace(/\0.*$/, '')
    this.pdbHeader = pdb
    const recordsBuffer = this.fileArrayBuffer.slice(78, 78 + pdb.numRecords * 8)

    const recordsStart = Array.from(
      { length: pdb.numRecords },
      (_, i) => getUint(recordsBuffer.slice(i * 8, i * 8 + 4)),
    )
    this.recordsOffset = recordsStart.map(
      (start, i) => [start, recordsStart[i + 1]],
    )

    this.recordsMagic = recordsStart.map(
      val => getString(this.fileArrayBuffer.slice(val, val + 4)),
    )
  }

  // mobi file header, which is in the first record
  private parseFirstRecord(firstRecord: ArrayBuffer) {
    // const firstRecord = this.loadRecord(0)
    // palmdocHeader
    this.palmdocHeader = getStruct(palmdocHeader, firstRecord.slice(0, 16))

    // mobiHeader
    const mobi = getStruct(mobiHeader, firstRecord)
    if (mobi.magic !== 'MOBI') {
      throw new Error('Missing MOBI header')
    }
    const { titleOffset, titleLength, localeLanguage, localeRegion } = mobi
    // extend mobiHeader through mobi property, title and language
    const lang = mobiLang[localeLanguage.toString()]
    const mobiHeaderExtends: MobiHeaderExtends = {
      title: getString(firstRecord.slice(titleOffset, titleOffset + titleLength)),
      language: lang[localeRegion >> 2] ?? lang[0] ?? 'unknown',
    }
    this.mobiHeader = Object.assign(mobi, mobiHeaderExtends)

    // kf8(azw3) header, if mobi.version >= 8
    this.kf8Header = mobi.version >= 8
      ? getStruct(kf8Header, firstRecord)
      : undefined
    this.isKf8 = mobi.version >= 8

    // exth, 16 is the length of palmdocHeader
    this.exth = mobi.exthFlag & 0b100_0000
      ? getExth(firstRecord.slice(mobi.length + 16), mobi.encoding)
      : undefined
  }

  private setup() {
    this.decoder = getDecoder(this.mobiHeader.encoding.toString())
    this.encoder = new TextEncoder()

    // set up decompressor
    const compression = this.palmdocHeader.compression
    if (compression === 1) {
      this.decompress = f => f
    }
    else if (compression === 2) {
      this.decompress = decompressPalmDOC
    }
    else if (compression === 17480) {
      this.decompress = huffcdic(this.mobiHeader, this.loadRecord.bind(this))
    }
    else {
      throw new Error('Unsupported compression')
    }

    // set up function for removing trailing bytes
    const trailingFlags = this.mobiHeader.trailingFlags
    this.removeTrailingEntries = getRemoveTrailingEntries(trailingFlags)
  }

  // extract from pdb header
  public getRecordsMagic() {
    return this.recordsMagic
  }

  public getPdbHeader() {
    return this.pdbHeader
  }

  public getRecordOffset() {
    return this.recordsOffset
  }

  public getMobiHeader() {
    return this.mobiHeader
  }

  public getPalmdocHeader() {
    return this.palmdocHeader
  }

  public getKf8Header() {
    return this.kf8Header
  }

  public getExth() {
    return this.exth
  }
}
