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

export interface EBookParser {
  getFileInfo: () => FileInfo
  getSpine: () => Spine | undefined
  getToc: () => Toc | undefined
  loadChapter: (id: string) => Promise<ProcessedChapter | undefined> | ProcessedChapter | undefined
  resolveHref: (href: string) => ResolvedHref | undefined
  getMetadata: () => Metadata
  getCover?: () => string
  destroy: () => void
}
