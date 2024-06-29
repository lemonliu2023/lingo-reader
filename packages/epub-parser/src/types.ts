/**
 * content reference like:
 *  <item href="pgepub.css" id="item29" media-type="text/css"/>
 */
export interface ManifestItem {
  id: string
  href: string
  mediaType: string
}

export interface GuideReference {
  title: string
  type: string
  href: string
}

export interface Spine {
  toc: ManifestItem
  contents: ManifestItem[]
}
