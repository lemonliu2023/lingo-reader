<div align="center">
  <a href="./README-zh.md">中文</a>
</div>

# Introduction

**blingo-reader** is a library for parsing eBook files. It currently supports the parsing of **.epub**, **.mobi**, and .**.azw3** (**.kf8**) files, and provides a unified API.

In addition, you can also visit [https://hhk-png.github.io/blingo-reader/](https://hhk-png.github.io/blingo-reader/) to directly read eBooks. This website is developed based on this parsing library.

# Usage in browser

```typescript
let book: EpubFile | Mobi | Kf8 | undefined
let spine: EpubSpine | MobiSpine | Kf8Spine = []
let fileInfo: FileInfo = {
  fileName: '',
}

async function initBook(file: File) {
  if (file.name.endsWith('epub')) {
    book = await initEpubFile(file)
    spine = book.getSpine()
    fileInfo = book.getFileInfo()
  }
  else if (file.name.endsWith('mobi')) {
    book = await initMobiFile(file)
    spine = book.getSpine()
    fileInfo = book.getFileInfo()
  }
  else if (file.name.endsWith('kf8')) {
    book = await initKf8File(file)
    spine = book.getSpine()
    fileInfo = book.getFileInfo()
  }
}
await initBook()
// toc
console.log(book.getToc())

for (let i = 0; i < spine.length; i++) {
  const id = spine[i].id
  // loadChapter
  const chapter = book!.loadChapter(id)
  console.log(chapter)
}

// destroy
book!.destroy()
```

# Unified API

For different eBook file formats, **blingo-reader** provides the following unified API:

```typescript
export interface EBookParser {
  getSpine: () => Spine
  loadChapter: (
    id: string
  ) => Promise<ProcessedChapter | undefined> | ProcessedChapter | undefined
  getToc: () => Toc
  getMetadata: () => Metadata
  getFileInfo: () => FileInfo
  getCover?: () => string
  resolveHref: (href: string) => ResolvedHref | undefined
  destroy: () => void
}
```

The usage is as follows, taking the `epub-parser` as an example:

```typescript
import type { EpubFile } from '@blingo-reader/epub-parser'
import { initEpubFile } from '@blingo-reader/epub-parser'

let book: EpubFile
async function initBook(file: File): EpubFile {
  if (file.name.endsWith('epub')) {
    book = await initEpubFile(file)
  }
  return book
}
```

**@blingo-reader/epub-parser** exposes the `initEpubFile` method and the types associated with it. The usage described above is for the browser environment, where you need to pass in a `File` object, which can be obtained via an input element with `type="file"`. **@blingo-reader/epub-parser** also supports running in Node.js environment, but in this case, you need to pass the file path instead.

The object returned by `initEpubFile` implements the `EBookParser` interface, and depending on the type of eBook file, it also provides additional specific APIs. You can refer to the relevant parser's documentation for more details：[epub-parser](./packages/epub-parser/README.md)，[mobi-parser]()，[kf8-parser]()。

## getSpine: () => Spine

```typescript
interface SpineItem {
  id: string
}
type Spine = SpineItem[]
```

A book consists of multiple chapters from beginning to the end, including the preface, copyright information, Chapter 1, Chapter 2, and so on. The purpose of `getSpine` is to retrieve an array of these chapter description objects, as shown in the code above. Each chapter object must include an `id` field, which is used for loading the chapter's text and CSS resources later.

## loadChapter: (id: string) => Promise<ProcessedChapter | undefined> | ProcessedChapter | undefined

The parameter of `loadChapter` is the chapter `id`, and the return value is the processed chapter object. Due to the differences in eBook file parsing methods, the returned chapter object may be a `Promise`, as shown in the `ProcessedChapter` interface below. If the return value is `undefined`, it means the chapter does not exist.

```typescript
interface CssPart {
  id: string
  href: string
}

interface ProcessedChapter {
  css: CssPart[]
  html: string
}
```

In an eBook file, a chapter is generally an HTML (or XHTML) file. Therefore, the processed chapter object consists of two parts: one is the HTML content string under the `<body>` tag, and the other is the CSS. The CSS is parsed from the `link` tag in the html file and provided as a blob URL, specifically in the `href` field of `CssPart`, along with an `id` corresponding to that URL. The blob URL of the CSS can be directly referenced by the `<link>` tag, or it can be fetched using the `Fetch` API to retrieve the CSS text for further processing, such as adding an ID of a DOM element before the CSS selector to implement scoped CSS.

## getToc: () => Toc

The `toc` refers to the `table of contents`.

```typescript
export interface TocItem {
  label: string
  href: string
  id?: string
  children?: TocItem[]
}
export type Toc = TocItem[]
```

The `getToc` method returns the table of contents as an array. In each item of the array, the `label` represents the name of the TOC item. The `href` is an internal link, and the `resolveHref` method is used to retrieve the corresponding chapter ID and the Dom selector, such as `[id="example"]`. After obtaining the chapter's HTML, you can use `querySelector` to find the target element to jump to.

The `id` represents the chapter's ID, which is an optional field that sames to the ID parsed by `resolveHref`. The `children` field represents sub-TOC items. In an EPUB file, the TOC is also the `navMap`.

## getMetadata: () => Metadata

The metadata of an eBook includes fields such as the title, language, description, author, date, etc. Since the values of these fields can vary in type—strings, objects, arrays, etc.—and differ across eBooks, the value type is set to `any`. For specific details, you can refer to the documentation of each eBook parser.

```typescript
type Metadata = Record<string, any>
```

## getFileInfo: () => FileInfo

```typescript
interface FileInfo {
  fileName: string
}
```

The `FileInfo` currently includes a common field, `fileName`. In the `epub-parser`, there is also a `mimetype` field, and further filed extensions may be added in the future.

## getCover?: () => string

This method is designed to retrieve the book's cover image. It returns a blob URL for the image, which can be directly referenced by an `<img src="">` tag. This is an optional method.

## resolveHref: (href: string) => ResolvedHref | undefined

In a book, there are internal links that jump to other chapters as well as external links pointing to websites. The `resolveHref` method resolves internal links to chapter `id` and `selector` in the book's HTML. If an external link or a non-existent internal link is passed, it will return `undefined`. External links are like `https://www.example.com`.

```typescript
export interface ResolvedHref {
  id: string
  selector: string
}
```

## destroy: () => void

This method is used to clear blob URLs and other resources created during the file parsing process to prevent memory leaks.

# Security

During file parsing, the HTML extracted from chapters is not security and could be vulnerable to XSS attacks. The parsing library does not handle this issue directly, but the vulnerability is mitigated in the upper-level `reader-html` application by using [DOMPurify](https://github.com/cure53/DOMPurify).

## TODO or Contribution：

1. the UI of the homepage is ugly and needs to be adjusted.
2. add a link to blingo-reader github on the homepage.
3. add a new way to open files. Enable users to open file via urls.
4. the `xml2js` and `jszip` are very large. Find a way to reduce their size.
5. picture preview
6. write documentation include epub-parser, mobi-parser, reader-html
7. write blog to explain how to parse epub, mobi or kf8 file
8. Now the file is loaded into memory all at once and then processed, this will be bad when ebook files are vary large. It could be better to convert the way to ondemand loading.
9. find test case
10. i18
