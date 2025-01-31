<div align="center">
  <a href="https://github.com/hhk-png/blingo-reader">Home Page</a>&nbsp;&nbsp;&nbsp;
  <a href="./README-zh.md">中文</a>
</div>

# Usage in node

```typescript
const epub = await initEpubFile('./example/alice.epub')
// fileInfo
epub.getFileInfo()

// metadata
epub.getMetadata()!

// ...
// ...
```

# Usage in browser

```ts
function initEpub(file: File) {
  const epub = await initEpubFile(file)
  // fileInfo
  epub.getFileInfo()

  // metadata
  epub.getMetadata()!
}

// ...
// ...
```

In the `src/index.ts` file, the `initEpubFile` method, along with some related types, is exposed, as well as an internal link prefix.

To handle internal chapter navigation within the EPUB, EPUB uses `<a>` tags with href. To distinguish internal links from external ones and simplify internal link handling, internal links are prefixed with epub:. The processing of such links is handled in the UI layer, while epub-parser only provides the functionality to return the corresponding chapter's HTML and selectors.

# EpubFile

The parsing of the EPUB file is based on the specifications of [EPUB 3.3](https://www.w3.org/TR/epub-33/#sec-pkg-metadata) and [Open Packaging Format (OPF) 2.0.1 v1.0](https://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#Section2.4.1). The exposed methods of the parsed EPUB file object are as follows:

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

The returned object contains the `fileName` and `mimetype`, where the `mimetype` is always set to the string `application/epub+zip`.

## getMetadata(): EpubMetadata;

```typescript
// 'id' represents the unique identifier of the resource, 'scheme' specifies the system or authority used to generate or assign that identifier.
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
  // Title of the book
  title: string
  // Language of the book
  language: string
  // Description of the book
  description?: string
  // Publisher of the EPUB file
  publisher?: string
  // General book genre (e.g., novel, biography)
  type?: string
  // Mimetype of the EPUB file
  format?: string
  // Original source of the book's content
  source?: string
  // Associated external resources
  relation?: string
  // Scope of the publication
  coverage?: string
  // Copyright statement
  rights?: string
  // Includes book creation time, publication time, update time, etc.
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
  // Unique identifier for the resource
  id: string
  // Path of the resource within the EPUB (ZIP) file
  href: string
  // Resource type (mimetype)
  mediaType: string
  // Role of the resource, e.g., "cover-image"
  properties?: string
  // Media overlay for audio/video resources
  mediaOverlay?: string
  // List of fallback resource IDs (in case the current resource fails to load)
  fallback?: string[]
}
```

This method returns all the resources in the EPUB file, including HTML chapter files, images, audio, video, etc.

## getSpine(): EpubSpine

```typescript
type SpineItem = ManifestItem & { linear?: string }
type EpubSpine = SpineItem[]
```

The spine lists all the chapter files that need to be displayed in order. The `linear` property in `SpineItem` indicates whether the chapter is part of the main linear sequence, with values of either `yes` or `no`.

## getGuide(): GuideReference[]

```typescript
interface GuideReference {
  title: string
  // Role of the resource, e.g., toc, loi, cover-image, etc.
  type: string
  // Path within the EPUB file
  href: string
}
type EpubGuide = GuideReference[]
```

This contains preview chapters of the book, or it can use the first few chapters from the spine as a substitute.

## getCollection(): EpubCollection

```typescript
interface CollectionItem {
  // Role of the resource in the collection
  role: string
  // Related resource links
  links: string[]
}
type EpubCollection = CollectionItem[]
```

The `<collection>` tag in the `.opf` file is used to specify whether an EPUB file belongs to a specific collection, such as a series, category, or particular group of publications.

## getToc(): EpubToc

```typescript
interface NavPoint {
  // Label of the table of contents entry
  label: string
  // Path to the resource in the EPUB file
  href: string
  // Chapter ID
  id: string
  // Order of the resource
  playOrder: string
  // Subdirectory for nested TOC entries
  children?: NavPoint[]
}
type EpubToc = NavPoint[]
```

This toc corresponds to the `navMap` in the `.ncx` file.

## getPageList(): PageList

```typescript
interface PageTarget {
  label: string
  value: string
  href: string
  playOrder: string
  type: string
  correspondId: string
}
interface PageList {
  label: string
  pageTargets: PageTarget[]
}
```

For more details, refer to [this specification](https://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#Section2.4.1.2). The `correspondId` represents the resource's ID, while other fields correspond to the specification.

## getNavList(): NavList

```typescript
interface NavTarget {
  label: string
  href: string
  correspondId: string
}
interface NavList {
  label: string
  navTargets: NavTarget[]
}
```

For details, check [this specification](https://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#Section2.4.1.2). Here, `correspondId` is the resource's ID, `label` corresponds to `navLabel.text`, and `href` is the path to the resource in the EPUB file.

## loadChapter(id: string): Promise<EpubProcessedChapter>

The parameter for `loadChapter` is the chapter ID. It returns the processed chapter object. If the chapter is not found, it returns `undefined`.

```typescript
interface EpubCssPart {
  id: string
  href: string
}
interface EpubProcessedChapter {
  css: EpubCssPart[]
  html: string
}
```

In an EPUB file, a chapter is typically an XHTML (or HTML) file. The processed chapter object includes two parts: the HTML body string under the `<body>` tag, and the CSS, which is extracted from the `<link>` tags in the chapter file. The CSS is returned as a Blob URL in the `href` field of the EpubCssPart and can be used directly in a `<link>` tag or fetched via the Fetch API for further processing.

## resolveHref(href: string): EpubResolvedHref | undefined

```typescript
interface EpubResolvedHref {
  id: string
  selector: string
}
```

This method resolves internal links within the book to the chapter ID and CSS selector for that chapter. If the link is external or does not exist, it returns `undefined`. External links, such as `https://www.example.com`, are handled as regular URLs.

## destroy(): void

This method is used to clean up resources created during the file parsing process, such as Blob URLs, to prevent memory leaks.
