<div align="center">
  <a href="https://github.com/hhk-png/blingo-reader">Home Page</a>&nbsp;&nbsp;&nbsp;
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

在 `src/index.ts` 中，向外暴漏出了 `initEpubFile` 方法和一些相关的类型，还有一个内部链接的前缀。

epub 内部章节的跳转通过 a 标签的 href，为了将内部跳转链接与外部链接相区分，并方便处理内部跳转逻辑，内部跳转链接在前面会添加一个 `epub:` 前缀。对该类链接的处理放在 ui 层，`epub-parser` 只提供返回对应章节的 html 和选择器的功能。

# EpubFile

epub 文件的解析参考了 [EPUB 3.3](https://www.w3.org/TR/epub-33/#sec-pkg-metadata) 和 [Open Packaging Format (OPF) 2.0.1 v1.0](https://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#Section2.4.1) 两个规范。该文件的解析对象暴露出来的方法如下：

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

返回的对象中除了 `fileName` 文件名以外，还有一个 mimetype，mimetype 固定为 `application/epub+zip` 字符串。

## getMetadata(): EpubMetadata;

```typescript
// id表示资源的唯一标识符，scheme为用来指定生成或分配该标识符的系统或权威机构
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
  // 书名
  title: string
  // 书的语言
  language: string
  // 书的描述
  description?: string
  // epub文件的发布者
  publisher?: string
  // 通用的书籍类型名称，比如小说、传记等
  type?: string
  // epub文件的mimetype
  format?: string
  // 书籍原始内容来源
  source?: string
  // 关联的外部资源
  relation?: string
  // 出版物内容的范围
  coverage?: string
  // 版权声明
  rights?: string
  // 包括书籍的创建时间，发布时间，更新时间等，具体的字段需要查看其opf:event
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
  // 资源的唯一标识
  id: string
  // 资源在 epub(zip) 文件中的路径
  href: string
  // 资源类型，mimetype
  mediaType: string
  // 资源所起的作用，值可以为cover-image
  properties?: string
  // 音视频资源的封面
  mediaOverlay?: string
  // 用于回滚的资源id列表，当前资源无法加载时，可以使用fallback中相应的资源来替代。
  fallback?: string[]
}
```

获取 epub 文件中的所有的资源，包括章节的 html 文件、图像、音视频等。

## getSpine(): EpubSpine

```typescript
type SpineItem = ManifestItem & { linear?: string }
type EpubSpine = SpineItem[]
```

spine 中列出了所有需要按顺序显示的章节文件。`SpineItem` 中 `linear` 代表是否是电子书中的一个线性部分，值可以为 `yes` 或者 `no`。

## getGuide(): GuideReference[]

```typescript
interface GuideReference {
  title: string
  // 资源所起的作用，比如 toc、loi、cover-image等
  type: string
  // 在epub文件中的路径
  href: string
}
type EpubGuide = GuideReference[]
```

书籍的预览章节，也可以取 spine 中的前几个章节来替代。

## getCollection(): EpubCollection

```typescript
interface CollectionItem {
  // 在集合中充当的作用
  role: string
  // 相关的资源链接
  links: string[]
}
type EpubCollection = CollectionItem[]
```

`.opf` 文件中 <collection>标签下的内容，用来指定一个 EPUB 文件是否属于某个特定的集合，例如一个系列、类别或特定的出版物组。

## getToc(): EpubToc

```typescript
interface NavPoint {
  // 目录项名称
  label: string
  // 资源在epub文件中的路径
  href: string
  // 章节的id
  id: string
  // 资源的顺序
  playOrder: string
  // 子目录
  children?: NavPoint[]
}
type EpubToc = NavPoint[]
```

此处的 toc 为 `.ncx` 文件中的 `navMap` 下的内容。

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

查看 [https://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#Section2.4.1.2](https://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#Section2.4.1.2)，其中的 `correspondId` 为资源的 id，其他都和规范中相对应。

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

查看 [https://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#Section2.4.1.2](https://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#Section2.4.1.2)，其中的 `correspondId` 为资源的 id，`label` 为 `navLabel.text` 中的内容，`href` 为资源在 epub 文件中的路径。

## loadChapter(id: string): Promise<EpubProcessedChapter>

`loadChapter` 的参数是章节的 id，返回值为处理后的章节对象。如果返回值为 `undefined`，说明没有该章节。

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

在 epub 电子书文件中，一般一个章节是一个 xhtml(or html)文件。因此处理后的章节对象包括两部分，一部分是 body 标签下的 html 正文字符串。另一部分是 css，该 css 从章节文件的 link 标签中解析出来，在此以 blob url 的形式给出，即 `EpubCssPart` 中的 `href` 字段，并附带一个该 url 对应的 `id`。css 的 blob url 可以供 link 标签直接引用，也可以通过 fetch api 来获取 css 文本，然后做进一步的处理。

## resolveHref(href: string): EpubResolvedHref | undefined

```typescript
interface EpubResolvedHref {
  id: string
  selector: string
}
```

用于处理书籍中转到其他章节的内部链接。`resolveHref` 将内部链接解析成内部章节的 id 和书籍 html 中的选择器。如果传入的是外部链接或者是一个不存在的内部链接，会返回 undefined，外部链接比如https://www.example.com。

## destroy(): void

用于清除在文件解析过程中创建的 blob url 等，防止内存泄漏。
