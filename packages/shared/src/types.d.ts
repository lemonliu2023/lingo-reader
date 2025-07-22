export interface FileInfo {
  fileName: string
}

export interface SpineItem {
  id: string
}
export type Spine = SpineItem[]

export interface TocItem {
  label: string
  href: string
  id?: string
  children?: TocItem[]
}
export type Toc = TocItem[]

export interface CssPart {
  id: string
  href: string
}

export interface ProcessedChapter {
  css: CssPart[]
  html: string
}

export interface ResolvedHref {
  id: string
  selector: string
}

export type Metadata = Record<string, any>

export type InputFile = string | File | Uint8Array

export interface EBookParser {
  getSpine: () => Spine
  loadChapter: (id: string) => Promise<ProcessedChapter | undefined> | ProcessedChapter | undefined
  getToc: () => Toc
  getMetadata: () => Metadata
  getFileInfo: () => FileInfo
  getCoverImage?: () => string
  resolveHref: (href: string) => ResolvedHref | undefined
  destroy: () => void
}
