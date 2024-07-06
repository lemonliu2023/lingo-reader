/**
 * content reference like:
 *  <item href="pgepub.css" id="item29" media-type="text/css"/>
 */
export interface ManifestItem {
  id: string
  href: string
  mediaType?: string
}

export interface GuideReference {
  title: string
  type: string
  href: string
}

export interface Spine {
  tocPath: string
  contents: ManifestItem[]
}

// navPoint in toc.ncx
export interface NavPoint {
  $: { id: string, playOrder: string }
  navLabel: any
  content: any
  navPoint: NavPoint[]
}
export type NavPoints = NavPoint[]

export interface TOCOutput extends ManifestItem {
  level: number
  order: number
  title: string
}

// Chapter content
export enum ContentType {
  HEADING1 = 'heading1',
  HEADING2 = 'heading2',
  HEADING3 = 'heading3',
  HEADING4 = 'heading4',
  HEADING5 = 'heading5',
  HEADING6 = 'heading6',
  PARAGRAPH = 'paragraph',
  IMAGE = 'image',
}

interface ChapterParagraph {
  type: ContentType.PARAGRAPH,
  text: string
}

export type HEADING = ContentType.HEADING1 | ContentType.HEADING2 | 
  ContentType.HEADING3 | ContentType.HEADING4 | 
  ContentType.HEADING5 | ContentType.HEADING6

type ChapterHeading = {
  type: HEADING,
  text: string
}

interface ChapterImage {
  type: ContentType.IMAGE,
  src: string
  alt: string
}

export type Content = ChapterParagraph | ChapterImage | ChapterHeading
