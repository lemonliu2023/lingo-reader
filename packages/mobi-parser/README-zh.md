<div align="center">
  <a href="https://github.com/hhk-png/blingo-reader">Home Page</a>&nbsp;&nbsp;&nbsp;
</div>

mobi 和 kf8 文件的解析参考了 [https://github.com/johnfactotum/foliate-js/blob/main/mobi.js](https://github.com/johnfactotum/foliate-js/blob/main/mobi.js)

# 简介

mobi 文件格式基于 pdb 文件格式，kf8(kf8)文件格式基于 mobi。因此 mobi 和 kf8 的解析一起放在了 mobi-parser 中。

# MobiFile

## Usage in browser

```typescript
import { initMobiFile } from '@blingo-reader/mobi-parser'
import type { MobiSpine } from '@blingo-reader/mobi-parser'

function initMobi(file: File) {
  const mobi: Mobi = await initMobiFile(file)
  // spine
  const spine: MobiSpine = mobi.getSpine()
  // loadChapter
  const firstChapter = mobi.loadChapter(spine[0].id)
}

// see Mobi class
// .....
```

## Usage in node

```typescript
import { initMobiFile } from '@blingo-reader/mobi-parser'
import type { MobiSpine } from '@blingo-reader/mobi-parser'

const mobi: Mobi = await initMobiFile('./example/taoyong.mobi')
// spine
const spine: MobiSpine = mobi.getSpine()
// loadChapter
const firstChapter = mobi.loadChapter(spine[0].id)

// see Mobi class
// .....
```

## Mobi class

```typescript
class Mobi {
  getFileInfo(): MobiFileInfo
  getSpine(): MobiSpine
  loadChapter(id: string): MobiProcessedChapter | undefined
  getToc(): MobiToc
  getCoverImage(): string | undefined
  getMetadata(): MobiMetadata
  resolveHref(href: string): MobiResolvedHref | undefined
  destroy(): void
}
```

### getFileInfo(): MobiFileInfo

```typescript
interface MobiFileInfo {
  // mobi文件名，包括文件后缀
  fileName: string
}
```

获取一些文件信息，目前只有 `fileName` 字段。

### getSpine(): MobiSpine

```typescript
interface MobiChapter {
  // chapter id
  id: string
  // 未经过资源路径替换的原始html文本
  text: string
  // 该章节在文件中开始位置的字节
  start: number
  // 该章节在文件中结束位置的字节
  end: number
  // 该章节所占的字节大小
  size: number
}
type MobiSpine = MobiChapter[]
```

spine 中列出了所有需要按顺序显示的章节文件。

在原始的章节 html 文本中，图片的资源路径指向的是文件内部的地址。因此需要将该路径替换为 blob url，然后才能直接放在页面中展示。

### loadChapter(id: string): MobiProcessedChapter | undefined

```typescript
interface MobiCssPart {
  id: string
  href: string
}
interface MobiProcessedChapter {
  html: string
  css: MobiCssPart[]
}
```

`loadChapter` 的参数是章节的 id，返回值为处理后的章节对象。如果返回值为 `undefined`，说明没有该章节。

原始的 html 被分为了 css 和文本(`MobiProcessedChapter`)，其中 css 以 blob url 的形式给出，也就是 `MobiCssPart`，html 为替换资源后的 html 文本，主要是 `<body>` 标签中的内容。

### getToc(): MobiToc

```typescript
interface MobiTocItem {
  // toc item label
  label: string
  // mobi内部的href
  href: string
  // 子目录
  children?: MobiTocItem[]
}
type MobiToc = MobiTocItem[]
```

用于获取书籍的目录。

### getCoverImage(): string | undefined

获取书籍的封面图片，以 blob url 的形式给出。

### getMetadata(): MobiMetadata

```typescript
interface MobiMetadata {
  // 唯一标识
  identifier: string
  // 书名
  title: string
  // 作者
  author: string[]
  // 发布者
  publisher: string
  // 书的语言
  language: string
  // 发布日期
  published: string
  // 描述
  description: string
  // 分类
  subject: string[]
  // 版权信息
  rights: string
  // 贡献者
  contributor: string[]
}
```

获取元数据。

### resolveHref(href: string): MobiResolvedHref | undefined

```typescript
interface MobiResolvedHref {
  // 章节的id
  id: string
  // html中的选择器
  selector: string
}
```

用于解析指向其他章节的链接，被处理成上面的形式。

### destroy(): void

清除解析文件过程中所创建的 blob url 和保存的资源，防止内存泄漏。

# Kf8File

## Usage in browser

```typescript
import { initKf8File } from '@blingo-reader/mobi-parser'
import type { Kf8Spine } from '@blingo-reader/mobi-parser'

function initMobi(file: File) {
  const mobi: Kf8 = await initKf8File(file)
  // spine
  const spine: Kf8Spine = mobi.getSpine()
  // loadChapter
  const firstChapter: Kf8ProcessedChapter = mobi.loadChapter(spine[0].id)
}

// see Kf8 class
// .....
```

## Usage in node

```typescript
import { initKf8File } from '@blingo-reader/mobi-parser'
import type { Kf8Spine } from '@blingo-reader/mobi-parser'

const mobi: Kf8 = await initKf8File('./example/taoyong.azw3')
// spine
const spine: Kf8Spine = mobi.getSpine()
// loadChapter
const firstChapter: Kf8ProcessedChapter = mobi.loadChapter(spine[0].id)

// see Kf8 class
// .....
```

## Kf8 class

```typescript
class Kf8 {
  getFileInfo(): Kf8FileInfo
  getMetadata(): Kf8Metadata
  getCoverImage(): string | undefined
  getSpine(): Kf8Spine
  getToc(): Kf8Toc
  getGuide(): Kf8Guide | undefined
  loadChapter(id: string): Kf8ProcessedChapter | undefined
  resolveHref(href: string): Kf8ResolvedHref | undefined
  destroy(): void
}
```

### getFileInfo(): Kf8FileInfo

```typescript
type Kf8FileInfo = MobiFileInfo
```

与 MobiFileInfo 相同，[跳转](#getfileinfo-mobifileinfo)

### getMetadata(): Kf8Metadata

```typescript
type Kf8Metadata = MobiMetadata
```

与 MobiMetadata 相同，[跳转](#getmetadata-mobimetadata)

### getCoverImage(): string | undefined

用于获取书籍封面图片，以 blob url 的形式给出。

### getSpine(): Kf8Spine

```typescript
interface Kf8Chapter {
  id: string
  skel: SkelTableItem
  frags: FragTable
  fragEnd: number
  length: number
  totalLength: number
}
type Kf8Spine = Kf8Chapter[]
```

暂无解释。

### getToc(): Kf8Toc

```typescript
interface Kf8TocItem {
  label: string
  // 章节的资源路径
  href: string
  children?: Kf8TocItem[]
}
type Kf8Toc = Kf8TocItem[]
```

获取目录。

### getGuide(): Kf8Guide | undefined

```typescript
interface Kf8GuideItem {
  label: string
  type: string[]
  href: string
}
type Kf8Guide = Kf8GuideItem[]
```

获取书籍可供浏览的部分。

### loadChapter(id: string): Kf8ProcessedChapter | undefined

```typescript
interface Kf8CssPart {
  id: string
  href: string
}
interface Kf8ProcessedChapter {
  html: string
  css: Kf8CssPart[]
}
```

同 MobiProcessedChapter，[跳转](#loadchapterid-string-mobiprocessedchapter--undefined)

### resolveHref(href: string): Kf8ResolvedHref | undefined

```typescript
type Kf8ResolvedHref = MobiResolvedHref
```

用于解析指向其他章节的链接，同 MobiResolvedHref，[跳转](#resolvehrefhref-string-mobiresolvedhref--undefined)。

### destroy(): void

清除解析文件过程中所创建的 blob url 和保存的资源，防止内存泄漏。
