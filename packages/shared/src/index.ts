export enum ContentType {
  HEADING1 = 'heading1',
  HEADING2 = 'heading2',
  HEADING3 = 'heading3',
  HEADING4 = 'heading4',
  HEADING5 = 'heading5',
  HEADING6 = 'heading6',
  PARAGRAPH = 'paragraph',
  CENTERPARAGRAPH = 'centerparagraph',
  IMAGE = 'image',
  CODEBLOCK = 'codeblock',
  TABLE = 'table',
  UL = 'ul',
  OL = 'ol',
}

export interface ChapterParagraph {
  type: ContentType.PARAGRAPH
  text: string
}

export type HEADING = ContentType.HEADING1 | ContentType.HEADING2 |
  ContentType.HEADING3 | ContentType.HEADING4 |
  ContentType.HEADING5 | ContentType.HEADING6

interface ChapterHeading {
  type: HEADING
  heading: string
}

export interface ChapterImage {
  type: ContentType.IMAGE
  src: string
  // imageName: string
  alt: string
  width?: number
  height?: number
  caption?: string
}

export interface ChapterCenterParagraph {
  type: ContentType.CENTERPARAGRAPH
  text: string
}

export interface ChapterCodeBlock {
  type: ContentType.CODEBLOCK
  text: string
}

export interface ChapterTable {
  type: ContentType.TABLE
  table: string[][]
}

export type UlOrOlList = (ChapterImage | ChapterParagraph | ChapterOL | ChapterUL)[]

export interface ChapterOL {
  type: ContentType.OL
  list: UlOrOlList
}

export interface ChapterUL {
  type: ContentType.UL
  list: UlOrOlList
}

export type Content = ChapterParagraph |
  ChapterCenterParagraph |
  ChapterImage |
  ChapterHeading |
  ChapterCodeBlock |
  ChapterTable |
  ChapterOL |
  ChapterUL

export interface ChapterOutput {
  title: string
  contents: Content[]
}
