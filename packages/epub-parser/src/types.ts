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
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video'
}

export interface ChapterText {
  type: ContentType.TEXT,
  text: string
}

export interface ChapterImage {
  type: ContentType.IMAGE,
  src: string
}

export type Content = ChapterText | ChapterImage
