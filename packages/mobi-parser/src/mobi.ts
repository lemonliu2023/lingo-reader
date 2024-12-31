import { readFileSync } from 'node:fs'
import { parsexml } from '@blingo-reader/shared'
import { mobiHeader, mobiLang, palmdocHeader, pdbHeader } from './headers'
import type {
  Chapter,
  DecompressFunc,
  Exth,
  GetStruct,
  Kf8Header,
  MobiHeader,
  MobiHeaderExtends,
  Offset,
  PalmdocHeader,
  PdbHeader,
  TocItem,
} from './types'
import {
  concatTypedArrays,
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
  mbpPagebreakRegex,
  toArrayBuffer,
  unescapeHTML,
} from './utils'

export async function initMobiFile(file: string | File) {
  const mobi = new Mobi(file)
  await mobi.load()
  await mobi.parse()

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
  // resource start index in records
  private resourceStart!: number

  private decoder!: TextDecoder
  private encoder!: TextEncoder
  private removeTrailingEntries!: (array: Uint8Array) => Uint8Array
  private decompress!: DecompressFunc

  // chapter
  private chapters: Chapter[] = []
  private idToChapter = new Map<number, Chapter>()
  private toc: TocItem[] = []

  public getSpine() {
    return this.chapters
  }

  public getChapterById(id: number) {
    return this.idToChapter.get(id)?.text
  }

  public getNavMap() {
    return this.toc
  }

  constructor(private file: string | File) { }

  async load() {
    this.fileArrayBuffer = await toArrayBuffer(
      __BROWSER__
        ? this.file as File
        : readFileSync(this.file as string),
    )
  }

  decode(arr: ArrayBuffer): string {
    return this.decoder.decode(arr)
  }

  encode(str: string): Uint8Array {
    return this.encoder.encode(str)
  }

  loadRecord(index: number): ArrayBuffer {
    const [start, end] = this.recordsOffset[index]
    return this.fileArrayBuffer.slice(start, end)
  }

  loadMagic(index: number): string {
    return this.recordsMagic[index]
  }

  private loadTextBuffer(index: number) {
    return this.decompress(
      this.removeTrailingEntries(
        new Uint8Array(
          this.loadRecord(index + 1),
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

  getCoverImage() {
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

  async parse() {
    // pdbHeader, recordsOffset, recordsMagic
    this.parsePdbHeader()
    // palmdocHeader, mobiHeader, isKf8, exth
    this.parseFirstRecord(this.loadRecord(0))
    // resource start index in records
    this.resourceStart = this.mobiHeader.resourceStart
    if (!this.isKf8) {
      const boundary = this.exth?.boundary?.[0] as number ?? 0xFFFFFFFF
      if (boundary < 0xFFFFFFFF) {
        console.warn('This seems to be a compatible file, which includes .azw3 and .mobi. '
        + 'We will parse it as a mobi file.',
        )
      }
    }

    // setup decoder, encoder, decompress, removeTrailingEntries
    this.setup()
    await this.init()
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

  // palmdocHeader, mobiHeader, isKf8, exth
  private parseFirstRecord(firstRecord: ArrayBuffer) {
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

    // isKf8
    this.isKf8 = mobi.version >= 8

    // exth, 16 is the length of palmdocHeader
    this.exth = mobi.exthFlag & 0b100_0000
      ? getExth(firstRecord.slice(mobi.length + 16), mobi.encoding)
      : undefined
  }

  // setup decoder, encoder, decompress, removeTrailingEntries
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

  async init() {
    // get all chapter buffers
    const buffers: Uint8Array[] = []
    for (let i = 0; i < this.palmdocHeader.numTextRecords; i++) {
      buffers.push(this.loadTextBuffer(i))
    }
    const array = concatTypedArrays(buffers)
    const str = Array.from(
      array,
      val => String.fromCharCode(val),
    ).join('')

    // split chapters
    const chapters: Chapter[] = []
    const idToChapter = new Map<number, Chapter>()
    let id = 0
    const matches = Array.from(str.matchAll(mbpPagebreakRegex))
    matches.unshift({ index: 0, input: '', groups: undefined, 0: '' } as RegExpExecArray)

    for (let i = 0; i < matches.length; i++) {
      const match = matches[i]
      const start = match.index
      const matched = match[0]
      const end = matches[i + 1]?.index
      const section = str.slice(start + matched.length, end)
      const buffer = Uint8Array.from(section, c => c.charCodeAt(0))
      const text = this.decode(buffer.buffer)
      const chapter: Chapter = {
        id,
        text,
        start,
        end,
        size: buffer.length,
      }
      chapters.push(chapter)
      idToChapter.set(id, chapter)
      id++
    }
    // process last chapter. remove trailing </body></html>
    const lastChapterText = chapters[chapters.length - 1].text
    chapters[chapters.length - 1].text = lastChapterText.slice(0, lastChapterText.indexOf('</body>'))

    // process first chapter, remove beginning ...<body>
    const firstChapterText = chapters[0].text
    const bodyOpenTagIndex = firstChapterText.indexOf('<body>')
    chapters[0].text = firstChapterText.slice(bodyOpenTagIndex + '<body>'.length)

    this.chapters = chapters
    this.idToChapter = idToChapter

    // used for parsing toc
    const referenceStr = firstChapterText.slice(0, bodyOpenTagIndex)
    const tocChapterStr = this.findTocChapter(referenceStr)
    if (tocChapterStr) {
      const wrappedChapterStr = `<wrapper>${
         tocChapterStr.text.replace(/filepos=(\d+)/gi, 'filepos="$1"')
         }</wrapper>`

      const tocAst = await parsexml(wrappedChapterStr, {
        preserveChildrenOrder: true,
        explicitChildren: true,
        childkey: 'children',
      })
      const toc: TocItem[] = []
      this.parseNavMap(tocAst.wrapper.children, toc)
      this.toc = toc
    }
  }

  private findTocChapter(referenceStr: string): Chapter | undefined {
    const tocPosReg = /<reference.*\/>/g
    const refs = referenceStr.match(tocPosReg)
    const typeReg = /type="(.+?)"/
    const fileposReg = /filepos=(.*)/
    if (refs) {
      for (const ref of refs) {
        const type = ref.match(typeReg)?.[1].trim()
        const filepos = ref.match(fileposReg)?.[1].trim()
        if (type === 'toc' && filepos) {
          const tocPos = Number.parseInt(filepos, 10)
          const chapter = this.chapters.find(ch => ch.end > tocPos)
          return chapter
        }
      }
    }
    return undefined
  }

  private parseNavMap(children: any, toc: TocItem[]) {
    for (const child of children) {
      const childName = child['#name']
      if (childName === 'p' || childName === 'blockquote') {
        let subItem: TocItem = {
          title: '',
          id: -1,
        }
        if (child.a) {
          const a = child.a[0]
          const title = a._
          const filepos = Number(a.$.filepos)
          const chapter = this.chapters.find(ch => ch.end > filepos)
          subItem = {
            title,
            id: chapter?.id ?? -1,
          }
        }
        toc.push(subItem)
        if (child.p || child.blockquote) {
          subItem.children = []
          this.parseNavMap(child.children, subItem.children)
        }
      }
    }
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
