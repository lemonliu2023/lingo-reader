import { readFileSync } from 'node:fs'
import { kf8Header, mobiHeader, mobiLang, palmdocHeader, pdbHeader } from './headers'
import type { Exth, GetStruct, Kf8Header, MobiHeader, MobiHeaderExtends, Offset, PalmdocHeader, PdbHeader } from './types'
import { getExth, getString, getStruct, getUint, toArrayBuffer } from './utils'

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

  constructor(private file: string | File) { }

  async load() {
    this.fileArrayBuffer = await toArrayBuffer(
      __BROWSER__
        ? this.file as File
        : readFileSync(this.file as string),
    )
  }

  parse() {
    this.parsePdbHeader()
    this.parseFirstRecord()
  }

  loadRecord(index: number): ArrayBuffer {
    const [start, end] = this.recordsOffset[index]
    return this.fileArrayBuffer.slice(start, end)
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
  private parseFirstRecord() {
    const firstRecord = this.loadRecord(0)
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

    // exth, 16 is the length of palmdocHeader
    this.exth = mobi.exthFlag & 0b100_0000
      ? getExth(firstRecord.slice(mobi.length + 16), mobi.encoding)
      : undefined
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
