// xml:lang scheme

export interface Contributor {
  contributor: string
  fileAs?: string
  role?: string

  // append in <meta>
  scheme?: string
  alternateScript?: string
}

export interface Subject {
  subject: string
  authority?: string
  term?: string
}

export interface Identifier {
  id: string
  identifierType?: string
  scheme?: string
}

export interface Link {
  href: string
  hreflang?: string
  id?: string
  mediaType?: string
  properties?: string
  rel: string
}

export interface Metadata {
  title: string
  language: string
  description?: string
  publisher?: string
  type?: string
  format?: string
  source?: string
  relation?: string
  coverage?: string
  rights?: string

  date?: Record<string, string>
  identifier: Identifier
  packageIdentifier: Identifier
  creator?: Contributor[]
  contributor?: Contributor[]
  subject?: Subject[]

  metas?: Record<string, string>
  links?: Link[]
}

/**
 * ManifestItem is parsed from the manifest tag in the opf file.
 *  content reference like:
 *  <item href="pgepub.css" id="item29" media-type="text/css"/>
 */
export interface ManifestItem {
  id: string
  href: string
  mediaType: string
  properties?: string
  mediaOverlay?: string
  fallback?: string[]
}

// idref, linear, id, properties attributes when parsing spine>itemref
type SpineItem = ManifestItem & { linear?: string }

export interface GuideReference {
  title: string
  type: string
  href: string
}

export interface CollectionItem {
  role: string
  links: string[]
}
// for .ncx file
export interface NavPoint {
  depth: number
  label: string
  src: string
  correspondId: string | undefined
  playOrder: string
}

// export type NavMap = NavPoint[]

export interface PageTarget {
  label: string
  value: string
  src: string
  playOrder: string
  type: string
  correspondId: string
}

export interface PageList {
  label: string
  pageTargets: PageTarget[]
}

export interface NavTarget {
  label: string
  src: string
  correspondId: string
}

export interface NavList {
  label: string
  navTargets: NavTarget[]
}

// // navPoint in toc.ncx
// export interface NavPoint {
//   $: { id: string, playOrder: string }
//   navLabel: any
//   content: any
//   navPoint: NavPoint[]
// }
// export type NavPoints = NavPoint[]
