In `src/index.ts`, the `initEpubFile` method and some related types, as well as a prefix for internal links, are exposed.

Internal chapter navigation within an EPUB file is handled through `<a>` tags with `href` attributes. To distinguish internal links from external ones and to simplify the handling of internal navigation logic, internal links are prefixed with `epub:`. The processing of these links is done in the UI layer, while the `epub-parser` only provides the functionality to return the corresponding chapter’s HTML and selector. See `reader-html`。

# EpubFile

The parsing of EPUB files is based on the [EPUB 3.3](https://www.w3.org/TR/epub-33/#sec-pkg-metadata) and [Open Packaging Format (OPF) 2.0.1 v1.0](https://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#Section2.4.1) specifications. The methods exposed by the parsing object for this file are as follows:

```typescript
declare class EpubFile implements EBookParser {
  getFileInfo(): EpubFileInfo
  getMetadata(): EpubMetadata
  getManifest(): Record<string, ManifestItem>
  getSpine(): EpubSpine
  getGuide(): GuideReference[]
  getCollection(): CollectionItem[]
  getToc(): EpubToc
  getPageList(): PageList
  getNavList(): NavList
  loadChapter(id: string): Promise<EpubProcessedChapter>
  resolveHref(href: string): EpubResolvedHref | undefined
  destroy(): void
}
```

## getFileInfo(): EpubFileInfo

```typescript
interface EpubFileInfo {
  fileName: string
  mimetype: string
}
```

The returned object contains the `fileName` and a `mimetype` field. The `mimetype` is always set to the string `application/epub+zip`.

## getMetadata(): EpubMetadata;

```typescript
/**
 * id represents the unique identifier for the resource,
 * scheme specifies the system or authority that assigned the identifier.
 */
interface Identifier {
  id: string
  identifierType?: string
  scheme?: string
}

interface Contributor {
  contributor: string
  fileAs?: string
  role?: string

  // append in <meta>
  scheme?: string
  alternateScript?: string
}

interface Subject {
  subject: string
  authority?: string
  term?: string
}

interface Link {
  href: string
  hreflang?: string
  id?: string
  mediaType?: string
  properties?: string
  rel: string
}

interface EpubMetadata {
  // Book title
  title: string
  // Book language
  language: string
  // Book description
  description?: string
  // Publisher of the EPUB file
  publisher?: string
  // Generic book type, such as novel, biography, etc.
  type?: string
  // EPUB file mimetype
  format?: string
  // Original source of the book’s content
  source?: string
  // Associated external resources
  relation?: string
  // Coverage of the publication’s content
  coverage?: string
  // Copyright information
  rights?: string
  // Includes creation, publication, and update dates, refer to opf:event for specific fields
  date?: Record<string, string>
  identifier: Identifier
  packageIdentifier: Identifier
  creator?: Contributor[]
  contributor?: Contributor[]
  subject?: Subject[]

  metas?: Record<string, string>
  links?: Link[]
}
```

## getManifest(): Record<string, ManifestItem>;

```typescript
interface ManifestItem {
  // Unique resource identifier
  id: string
  // Path to the resource within the EPUB (ZIP) file
  href: string
  // Resource type, mimetype
  mediaType: string
  // Role of the resource, such as cover-image
  properties?: string
  // Media overlay for audio/video resources
  mediaOverlay?: string
  // List of fallback resource IDs; when the current resource cannot be loaded, the corresponding fallback resource can be used as a replacement.
  fallback?: string[]
}
```

This method retrieves all resources in the EPUB file, including chapter HTML files, images, audio/video files, etc.
