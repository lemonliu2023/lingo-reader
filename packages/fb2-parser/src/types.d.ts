export interface Fb2Resource {
  id: string
  // mimetyoe
  contentType: string
  // base64
  base64Data: string
}

export type Fb2ResourceMap = Map<string, Fb2Resource>

export interface Author {
  name: string
  firstName: string
  middleName: string
  lastName: string
  nickname?: string
  homePage?: string
  email?: string
}

export interface Sequence {
  name: string
  number?: string
}

/**

<title-info>
  <genre>fantasy</genre>
  <author>
    <first-name>J.</first-name>
    <last-name>Tolkien</last-name>
  </author>
  <book-title>The Hobbit</book-title>
  <annotation>A fantasy novel...</annotation>
  <date value="1937">1937</date>
  <coverpage>
    <image l:href="#cover.jpg"/>
  </coverpage>
  <lang>en</lang>
  <sequence name="Middle-earth" number="1"/>
</title-info>

 */

// title-info
export interface TitleInfo {
  // alias of book-title
  title?: string
  // alias of genre
  type?: string
  author?: Author
  // alias of lang
  language?: string
  // alias of annotation
  description?: string
  keywords?: string
  // date that the book was written
  date?: string
  srcLang?: string
  translator?: string
  sequence?: Sequence[]
  coverImageId?: string
}

// document-info
export interface DocumentInfo {
  author?: Author
  // alias of id
  id?: string
  programUsed?: string
  srcUrl?: string
  srcOcr?: string
  version?: string
  // html, need to format node
  history?: string
  date?: string
}

// publish-info
export interface PublishInfo {
  bookName?: string
  publisher?: string
  city?: string
  year?: string
  isbn?: string
}

export type CustomInfo = Record<string, string>

export type Fb2Metadata = Omit<TitleInfo, 'coverImageId'> & DocumentInfo & PublishInfo & CustomInfo
