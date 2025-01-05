type ValueType = 'string' | 'uint'
type HeaderValue<T extends ValueType> = [number, number, T]

export interface PdbHeader {
  name: HeaderValue<'string'>
  type: HeaderValue<'string'>
  creator: HeaderValue<'string'>
  numRecords: HeaderValue<'uint'>
}

export interface PalmdocHeader {
  compression: HeaderValue<'uint'>
  numTextRecords: HeaderValue<'uint'>
  recordSize: HeaderValue<'uint'>
  encryption: HeaderValue<'uint'>
}

export interface MobiHeader {
  magic: HeaderValue<'string'>
  length: HeaderValue<'uint'>
  type: HeaderValue<'uint'>
  encoding: HeaderValue<'uint'>
  uid: HeaderValue<'uint'>
  version: HeaderValue<'uint'>
  titleOffset: HeaderValue<'uint'>
  titleLength: HeaderValue<'uint'>
  localeRegion: HeaderValue<'uint'>
  localeLanguage: HeaderValue<'uint'>
  resourceStart: HeaderValue<'uint'>
  huffcdic: HeaderValue<'uint'>
  numHuffcdic: HeaderValue<'uint'>
  exthFlag: HeaderValue<'uint'>
  trailingFlags: HeaderValue<'uint'>
  indx: HeaderValue<'uint'>
}

export interface MobiHeaderExtends {
  title: string
  language: string
}

export interface Kf8Header {
  resourceStart: HeaderValue<'uint'>
  fdst: HeaderValue<'uint'>
  numFdst: HeaderValue<'uint'>
  frag: HeaderValue<'uint'>
  skel: HeaderValue<'uint'>
  guide: HeaderValue<'uint'>
}

export interface ExthHeader {
  magic: HeaderValue<'string'>
  length: HeaderValue<'uint'>
  count: HeaderValue<'uint'>
}

export interface IndxHeader {
  magic: HeaderValue<'string'>
  length: HeaderValue<'uint'>
  type: HeaderValue<'uint'>
  idxt: HeaderValue<'uint'>
  numRecords: HeaderValue<'uint'>
  encoding: HeaderValue<'uint'>
  language: HeaderValue<'uint'>
  total: HeaderValue<'uint'>
  ordt: HeaderValue<'uint'>
  ligt: HeaderValue<'uint'>
  numLigt: HeaderValue<'uint'>
  numCncx: HeaderValue<'uint'>
}

export interface TagxHeader {
  magic: HeaderValue<'string'>
  length: HeaderValue<'uint'>
  numControlBytes: HeaderValue<'uint'>
}

export interface HuffHeader {
  magic: HeaderValue<'string'>
  offset1: HeaderValue<'uint'>
  offset2: HeaderValue<'uint'>
}

export interface CdicHeader {
  magic: HeaderValue<'string'>
  length: HeaderValue<'uint'>
  numEntries: HeaderValue<'uint'>
  codeLength: HeaderValue<'uint'>
}

export interface FdstHeader {
  magic: HeaderValue<'string'>
  numEntries: HeaderValue<'uint'>
}

export interface FontHeader {
  flags: HeaderValue<'uint'>
  dataStart: HeaderValue<'uint'>
  keyLength: HeaderValue<'uint'>
  keyStart: HeaderValue<'uint'>
}

export type Header = PdbHeader | PalmdocHeader | MobiHeader
  | Kf8Header | ExthHeader | IndxHeader | TagxHeader | HuffHeader
  | CdicHeader | FdstHeader | FontHeader

export type GetStruct<T extends Header> = {
  [K in keyof T]: T[K] extends HeaderValue<ValueType>
    ? (T[K][2] extends 'string' ? string : number)
    : never
}

export type Offset = [number, number][]

export type Exth = Record<string, (string | number)[]>

export type DecompressFunc = (data: Uint8Array) => Uint8Array

export type LoadRecordFunc = (index: number) => ArrayBuffer

export interface Chapter {
  id: number
  text: string
  start: number
  end: number
  size: number
}

export interface TocItem {
  title: string
  id: number
  children?: TocItem[]
}

export interface IndexTableItem {
  name: string
  tagMap: Record<number, number[]>
}
export type IndexTable = IndexTableItem[]
export type Cncx = Record<string, string>
export interface IndexData { table: IndexTable, cncx: Cncx }

/**
 * azw3 types
 */
export interface SkelTableItem {
  index: number
  name: string
  numFrag: number
  offset: number
  length: number
}
export type SkelTable = SkelTableItem[]

export interface FragTableItem {
  insertOffset: number
  selector: string
  index: number
  offset: number
  length: number
}
export type FragTable = FragTableItem[]

export interface Azw3Chapter {
  id: number
  skel: SkelTableItem
  frags: FragTable
  fragEnd: number
  length: number
  totalLength: number
}

export interface NcxItem {
  index: number
  offset: number
  size: number
  label: string
  headingLevel: number
  pos: number[]
  parent: number
  firstChild: number
  lastChild: number
  children?: NcxItem[]
}
export type Ncx = NcxItem[]

export interface Azw3TocItem {
  label: string
  href: string
  subitems?: Azw3TocItem[]
}
export type Azw3Toc = Azw3TocItem[]

export interface Azw3GuideItem {
  label: string
  type: string[]
  href: string
}
export type Azw3Guide = Azw3GuideItem[]
