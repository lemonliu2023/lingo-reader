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
  $: { id: string, playOrder: string },
  navLabel: any,
  content: any,
  navPoint: NavPoint[]
}
export type NavPoints = NavPoint[]

export interface TOCOutput extends ManifestItem {
  level: number,
  order: number,
  title: string
}
