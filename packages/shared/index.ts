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

interface ChapterHeading {
  type: HEADING
  heading: string
}

export interface ChapterImage {
  type: ContentType.IMAGE,
  src: string
  alt?: string
  width?: number
  height?: number
}

export type Content = ChapterParagraph | ChapterImage | ChapterHeading
