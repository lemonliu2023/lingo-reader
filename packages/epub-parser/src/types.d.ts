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

export interface EpubFileInfo {
  fileName: string
  mimetype: string
}

export interface EpubMetadata {
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
export type SpineItem = ManifestItem & { linear?: string }
export type EpubSpine = SpineItem[]

export interface GuideReference {
  title: string
  type: string
  href: string
}
export type EpubGuide = GuideReference[]

export interface CollectionItem {
  role: string
  links: string[]
}
export type EpubCollection = CollectionItem[]

// for .ncx file
export interface NavPoint {
  label: string
  href: string
  id: string
  playOrder: string
  children?: NavPoint[]
}
export type EpubToc = NavPoint[]

export interface PageTarget {
  label: string
  value: string
  href: string
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
  href: string
  correspondId: string
}

export interface NavList {
  label: string
  navTargets: NavTarget[]
}

export interface EpubCssPart {
  id: string
  href: string
}

export interface EpubProcessedChapter {
  css: EpubCssPart[]
  html: string
  mediaOverlays?: SmilAudios
}

export interface EpubResolvedHref {
  id: string
  selector: string
}

/**
 * decryption
 */
export type RsaHash = 'sha1' | 'sha256' | 'sha384' | 'sha512'

export type AesName = 'aes-256-cbc' | 'aes-256-ctr' | 'aes-256-gcm'
  | 'aes-192-cbc' | 'aes-192-ctr' | 'aes-192-gcm'
  | 'aes-128-cbc' | 'aes-128-ctr' | 'aes-128-gcm'

export type IdToKey = Record<string, Uint8Array>

export type FileProcessor = (file: Uint8Array) => Promise<Uint8Array> | Uint8Array
export type PathToProcessors = Record<string, FileProcessor[]>

export interface EpubFileOptions {
  rsaPrivateKey?: string | Uint8Array
  aesSymmetricKey?: string | Uint8Array
}

export interface EncryptionKeys {
  rsaPrivateKey?: Uint8Array
  aesSymmetricKey?: Uint8Array
}

/**
 * .smil file
 */
export interface Par {
  // element id
  textDOMId: string
  // unit: s
  clipBegin: number
  clipEnd: number
}

export interface SmilAudio {
  audioSrc: string
  pars: Par[]
}

export type SmilAudios = SmilAudio[]
