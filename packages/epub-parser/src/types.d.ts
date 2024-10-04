// xml:lang scheme

export interface Contributor {
  contributor: string
  fileAs?: string
  role?: string

  // append with in <meta>
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
  // TODO: <link>
}

/**
 * ManifestItem is parsed from the manifest tag in the opf file.
 *  content reference like:
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

// table of contents that is parsed from navMap in toc.ncx
//  which is equal to ManifestItem
export interface TOCOutput extends ManifestItem {
  level: number
  order: number
  title: string
}
