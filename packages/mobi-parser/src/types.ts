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
export interface Azw3InitOptions {
  // cssMountedId?: string
  imageSaveDir?: string
}

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

export interface CssPart {
  id: number
  href: string
}
export interface ProcessedChapter {
  html: string
  css: CssPart[]
}
