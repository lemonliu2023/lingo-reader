<h2 align="center">
  <a target="_blank" href="https://github.com/hhk-png/lingo-reader">Home Page</a>&nbsp;&nbsp;&nbsp;
</h2>

epub 文件格式用于存储电子书的内容，在其内部存储有书籍的各章节内容，与规定如何按顺序读取这些章节内容的相关文件。

epub 实际上是一个 zip 文件，电子书内容的构建基于 html 和 css，理论上也可以包括 js。将 epub 文件的后缀改变为 zip 之后解压缩，点击章节对应的 html/xhtml 文件，就可以直接查阅对应的章节内容。只是此时各章节之间的排序为乱序，并且如果某些章节或者资源进行了加密，通过前面说的转换为 zip 文件打开的方式就会失败。

在进行 epub 文件的解析时，

**(1).** 一部分是解析文件中的 `container.xml`、`.opf`、`.ncx` 文件，这些文件中包括书籍的元信息（书名、作者、发布日期等）、资源信息（图片等在 epub 文件中的路径）、按顺序显示的章节文件信息（Spine）等。

**(2).** 另一部分是处理章节中的资源路径，章节文件中对资源的引用路径只能用于文件内部，因此需要将其处理成在展示的环境下可以使用的路径，浏览器环境下会处理成 bloburl，node 环境下会处理成文件系统中的绝对路径。

**(3).** epub 文件的加密信息存放在 `META-INF/encryption.xml` 文件中，`0.3.x` 版本可以支持加密的 epub 文件的解析，但需要遵循特定的加密策略和传入用于解密的私钥，支持的加密策略在 `initEpubFile` 部分有介绍。

**(4).** 除此之外，还需要处理 epub 文件的签名、权限等内容，分别对应 `signatures.xml`、`rights.xml` 文件，这些文件与 `container.xml` 文件一样，统一存放在 `/META-INF/` 文件夹下，且文件名固定。`@lingo-reader/epub-parser` 会在未来的更新中支持这些部分。

epub 文件的解析参考了 [EPUB 3.3](https://www.w3.org/TR/epub-33/#sec-pkg-metadata) 和 [Open Packaging Format (OPF) 2.0.1 v1.0](https://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#Section2.4.1) 两个规范。提供的 API 尽可能地将文件提供的信息暴漏出来。

## Install

```shell
pnpm install @lingo-reader/epub-parser
```

## Usage in node

```typescript
import { initEpubFile } from '@lingo-reader/epub-parser'

const epub = await initEpubFile('./example/alice.epub')

const spine = epub.getSpine()
const fileInfo = epub.getFileInfo()

// 加载第一章，html为处理后的html章节字符串，
// css为章节的css文件，在node中以绝对路径给出，
// 可以直接读取
const { html, css } = epub.loadChapter(spine[0].id)

// ...
// ...
```

## Usage in browser

```ts
import { initEpubFile } from '@lingo-reader/epub-parser'

async function initEpub(file: File) {
  const epub = await initEpubFile(file)

  const spine = epub.getSpine()
  const fileInfo = epub.getFileInfo()

  // 加载第一章，html为处理后的html章节字符串，
  // css为章节的css文件，在浏览器环境下以blob url给出，
  // 可以通过fetch获取
  const { html, css } = epub.loadChapter(spine[0].id)
}

// ...
// ...
```

## initEpubFile

```typescript
import { initEpubFile } from '@lingo-reader/epub-parser'
import type { EpubFile } from '@lingo-reader/epub-parser'
/*
  interface EpubFileOptions {
    rsaPrivateKey?: string | Uint8Array
    aesSymmetricKey?: string | Uint8Array
  }

  type initEpubFile = (epubPath: string | File, resourceSaveDir: string = './images', options: EpubFileOptions = {}): => Promise<EpubFile>
*/

const epub: EpubFile = await initEpubFile(
  file,
  './images', // 默认为'./images'，如果不想更改，可以传入undefined
  {
    // pkcs8格式的密钥，以base64或者Uint8Array形式表示
    rsaPrivateKey: 'MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQ......',
    aesSymmetricKey: 'D2wVcst49HU6KqC......',
  }
)
```

`@lingo-reader/epub-parser` 主要向外暴漏了一个 `initEpubFile` API。将文件路径、文件的 File 对象或者 Uint8Array 输入其中后，就可以得到一个已经初始化的 EpubFile 对象，包括读取元信息、Spine 的各种信息的 API。

**参数：**

- `epubPath: string | File | Uint8Array`：文件路径或者文件的 File 对象，`Uint8Array`。
- `resourceSaveDir?: string`：可选参数，主要应用在 node 环境下，为图片等资源的保存路径。默认为 `./images`
- `options?: EpubFileOptions`：可选参数，用于传入密钥信息。

```typescript
interface EpubFileOptions {
  // pkcs8格式的密钥，以base64或者Uint8Array形式传递
  rsaPrivateKey?: string | Uint8Array
  aesSymmetricKey?: string | Uint8Array
}
```

**返回值：**

- `Promise<EpubFile>`：初始化后的 EpubFile 对象，为一个 Promise。

**Note:** 对于 `epubPath` 参数，浏览器端其类型应为 `File | Uint8Array`，不能传入`string` 类型。nodejs端其类型应该为 `string | Uint8Array`，不能传入 `File` 类型。否则会报错。

`0.3.x` 版本的 `epub-parser` 支持解密两种加密方式。第一种是使用非对称加密算法 RSA 加密对称加密算法 AES 的对称密钥，使用 AES 算法加密文件内容，解密时首先通过 RSA 的私钥获取到 AES 的对称密钥，然后解密由 AES 加密的文件内容。这时需要在 EpubFileOptions 中传入 pkcs8 格式的 `rsaPrivateKey` 私钥，此种方式支持在`encryption.xml` 中存入多个对称密钥信息。第二种是仅使用 AES 直接加密文件内容，不使用 RSA 加密密钥信息，因此需要传入 `aesSymmetricKey` 参数。具体的解密策略可以查看 `epub-parser/src/parseFiles.ts` 中的`parseEncryption` 方法。

解密流程没有依赖额外的第三方库，而是基于浏览器的 web crypto api 与 node crypto 实现，可以同时支持在浏览器端与 node 端运行。浏览器支持的加解密算法少于 node crypto，而浏览器支持的算法在 node 中都有支持，因此所支持的算法与浏览器相同，是 node crypto 的子集。

支持的非对称加密算法有 `rsa-oaep`，`rsa-oaep-mgf1p`。

支持的对称加密算法有 `aes-256-cbc`，`aes-256-ctr`，`aes-256-gcm`，`aes-128-cbc`，`aes-128-ctr`，`aes-128-gcm`。192 位的 Aes 算法在浏览器中不支持，解析该算法加密的文件时会报错，但是在 node 中可以正常解析。加密所使用的IV应该放在加密后文件的头部。

256 位、192 位、128 位加密算法的密钥长度分别为 32B、24B、16B。

## EpubFile

EpubFile 暴露出来的方法如下：

```typescript
import { EpubFile } from '@lingo-reader/epub-parser'
import { EBookParser } from '@lingo-reader/shared'

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

### getManifest(): Record<string, ManifestItem>

描述书籍内资源，html 文件、图片等。

```typescript
import { getManifest } from '@lingo-reader/epub-parser'
import type { ManifestItem } from '@lingo-reader/epub-parser'
/*
  type getMetadata = () => Record<string, ManifestItem>
*/

// 键为 id
const manifest: Record<string, ManifestItem> = epub.getManifest()
```

**参数：**

- none

**返回值：**

- `Record<string, ManifestItem>`：

```typescript
interface ManifestItem {
  // 资源的唯一标识，也作为
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

### getSpine(): EpubSpine

spine 中列出了所有需要按顺序显示的章节文件。

`SpineItem` 中 `linear` 代表是否是电子书中的一个线性部分，值可以为 `yes` 或者 `no`。

```typescript
import { getSpine } from '@lingo-reader/epub-parser'
import type { EpubSpine } from '@lingo-reader/epub-parser'
/*
  type getSpine = () => EpubSpine
*/

const spine: EpubSpine = epub.getSpine()
```

**参数：**

- none

**返回值：**

- `EpubSpine`：

```typescript
type SpineItem = ManifestItem & { linear?: string }
type EpubSpine = SpineItem[]
```

### loadChapter(id: string): Promise\<EpubProcessedChapter>

`loadChapter` 的参数是章节的 id，返回值为处理后的章节对象。如果返回值为 `undefined`，说明没有该章节。

```typescript
const spine = epub.getSpine()
const fileInfo = epub.getFileInfo()

// 加载第一章，html为处理后的html章节字符串，
// css为章节的css文件，在node中以绝对路径给出，
// 可以直接读取
const { html, css, mediaOverlays } = epub.loadChapter(spine[0].id)
```

**参数：**

- `id: string`：章节的 id。

**返回值：**

- `Promise<EpubProcessedChapter>`：处理后的章节对象

```typescript
// css
interface EpubCssPart {
  id: string
  href: string
}

// media-overlay
interface Par {
  // element id
  textDOMId: string
  // unit: s
  clipBegin: number
  clipEnd: number
}
interface SmilAudio {
  audioSrc: string
  pars: Par[]
}
type SmilAudios = SmilAudio[]

// chapter
interface EpubProcessedChapter {
  css: EpubCssPart[]
  html: string
  mediaOverlays?: SmilAudios
}
```

在 epub 电子书文件中，一般一个章节是一个 xhtml(or html)文件。因此处理后的章节对象包括两部分，一部分是 body 标签下的 html 正文字符串。另一部分是 css，该 css 从章节文件的 link 标签中解析出来，在此以 blob url 的形式给出（node 环境下是文件系统的绝对路径），即 `EpubCssPart` 中的 `href` 字段，并附带一个该 url 对应的 `id`。css 的 blob url 可以供 link 标签直接引用，也可以通过 fetch api （node 环境下使用绝对路径）来获取 css 文本，然后做进一步的处理。

epub中也可以通过smil文件支持语音朗读功能。在smil文件内部，将语音的时间段与文档元素的id进行绑定，这样在语音播放时就可以监听当前的播放时间，从而寻找到对应文本元素的id，通过dom操作进行高亮。smil文件被处理成了EpubProcessedChapter中的mediaOverlays，其是一个数组，数组项中的audioSrc元素为音频的文件路径，pars为`时间段-文本元素id` 对，textDOMId为元素id，clipBegin和clipEnd分别为起止时间，单位为秒(s)。

epub 内部章节的跳转通过 a 标签的 href，为了将内部跳转链接与外部链接相区分，并方便处理内部跳转逻辑，内部跳转链接在前面会添加一个 `epub:` 前缀。使用下面的 resolveHref 可以解析。对该类链接的处理放在 ui 层，`epub-parser` 只提供返回对应章节的 html 和选择器的功能。

### resolveHref(href: string): EpubResolvedHref | undefined

用于处理书籍中转到其他章节的内部链接。`resolveHref` 将内部链接解析成内部章节的 id 和书籍 html 中的选择器。如果传入的是外部链接或者是一个不存在的内部链接，会返回 undefined，外部链接比如https://www.example.com。

```typescript
const toc: EpubToc = epub.getToc()
// id 为章节的id，selector为dom选择器，比如 `[id="ididid"]`
const { id, selector } = epub.resolveHref(toc[0].href)
```

**参数：**

- `href: string`：内部资源路径。

**返回值：**

- `EpubResolvedHref | undefined`：处理后的内部链接，为 undefined 表示该资源路径不合法。

```typescript
interface EpubResolvedHref {
  id: string
  selector: string
}
```

### getToc(): EpubToc

此处的 toc 为 `.ncx` 文件中的 `navMap` 下的内容。

```typescript
import { getToc } from '@lingo-reader/epub-parser'
import type { EpubToc } from '@lingo-reader/epub-parser'
/*
  type getToc = () => EpubToc
*/

const toc: EpubToc = epub.getToc()
```

**参数：**

- none

**返回值：**

- `EpubToc`：

```typescript
interface NavPoint {
  // 目录项名称
  label: string
  // 资源在epub文件中的路径，已经被处理成了特定的形式，可以使用resolveHref来解析
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

### getCoverImage(): string

> 从 **v0.4.1** 开始支持。

返回封面图片的路径

**参数：**

- none

**返回值:**

- `string`：封面图片的路径

### destroy(): void

用于清除在文件解析过程中创建的 blob url 等，防止内存泄漏。node 环境下会删除对应的文件。

### getFileInfo(): EpubFileInfo

```typescript
import type { EpubFileInfo } from '@lingo-reader/epub-parser'
/*
  type getFileInfo = () => EpubFileInfo
*/

const fileInfo: EpubFileInfo = epub.getFileInfo()
```

EpubFileInfo 目前包括两个属性，`fileName` 为文件名，`mimetype` 为 epub 文件的文件类型，从 `/mimetype` 文件中读取，但固定为 `application/epub+zip`。

**参数：**

- none

**返回值：**

- `EpubFileInfo`：

```typescript
interface EpubFileInfo {
  fileName: string
  mimetype: string
}
```

### getMetadata(): EpubMetadata

书籍中记录的元信息。

```typescript
import type { EpubMetadata } from '@lingo-reader/epub-parser'
/*
  type getMetadata = () => EpubFileInfo
*/

const metadata: EpubMetadata = epub.getMetadata()
```

**参数：**

- none

**返回值：**

- `EpubMetadata`：

```typescript
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
  // 包括书籍的创建时间，发布时间，更新时间等，
  // 具体的字段需要查看其opf:event,比如 modification、
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

#### identifier: Identifier

id 表示资源的唯一标识符，scheme 为用来指定生成或分配该标识符的系统或权威机构，比如 ISBN、DOI。identifierType 说明 `id` 所使用的标识符类型，类似 scheme。

```typescript
interface Identifier {
  id: string
  scheme?: string
  identifierType?: string
}
```

#### packageIdentifier: Identifier

实际上也是一个 Identifier。通常在 package 标签中，通过 unique-identifier 引用，unique-identifier 的值为对应元素的 id。

```xml
<package unique-identifier="id">

<dc:identifier id="id" opf:scheme="URI">uuid:19c0c5cb-002b-476f-baa7-fcf510414f95</dc:identifier>

</package>
```

#### creator?: Contributor[]

描述各个贡献者。

```typescript
interface Contributor {
  // 贡献者名字
  contributor: string
  // 名字的排序格式
  fileAs?: string
  // 贡献者所担任的角色
  role?: string

  // role或者alternateScript所使用的编码方案，
  // 也可以是语言，比如英语、中文
  scheme?: string
  // 贡献者名字的其他书写方式
  alternateScript?: string
}
```

#### subject?: Subject[]

书籍所属的主题。

```typescript
interface Subject {
  // 主题，比如小说、散文等。
  subject: string
  // 代码或标识符的来源机构
  authority?: string
  // 关联主题代码
  term?: string
}
```

#### links?: Link[]

提供额外的关联资源或外部链接

```typescript
interface Link {
  // 指向资源的 URL 或路径
  href: string
  // 资源的语言
  hreflang?: string
  // id
  id?: string
  // 资源的 MIME 类型（如 image/jpeg、application/xml）
  mediaType?: string
  // 附加属性
  properties?: string
  // 该链接的用途或功能。
  rel: string
}
```

### getGuide(): EpubGuide

书籍的预览章节，也可以取 spine 中的前几个章节来替代。

```typescript
import { getGuide } from '@lingo-reader/epub-parser'
import type { EpubGuide } from '@lingo-reader/epub-parser'
/*
  type getGuide = () => EpubGuide
*/

const guide: EpubGuide = epub.getGuide()
```

**参数：**

- none

**返回值：**

- `EpubGuide`：

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

### getCollection(): EpubCollection

`.opf` 文件中 \<collection\>标签下的内容，用来指定一个 EPUB 文件是否属于某个特定的集合，例如一个系列、类别或特定的出版物组。

```typescript
import { getCollection } from '@lingo-reader/epub-parser'
import type { EpubCollection } from '@lingo-reader/epub-parser'
/*
  type getCollection = () => EpubCollection
*/

const collection: EpubCollection = epub.getCollection()
```

**参数：**

- none

**返回值：**

- `EpubCollection`：

```typescript
interface CollectionItem {
  // 在集合中充当的作用
  role: string
  // 相关的资源链接
  links: string[]
}
type EpubCollection = CollectionItem[]
```

### getPageList(): PageList

查看 [https://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#Section2.4.1.2](https://idpf.org/epub/20/spec/OPF_2.0.1_draft.htm#Section2.4.1.2)，其中的 `correspondId` 为资源的 id，其他都和规范中相对应。

```typescript
import { getPageList } from '@lingo-reader/epub-parser'
import type { PageList } from '@lingo-reader/epub-parser'
/*
  type getPageList = () => PageList
*/

const getPageList: PageList = epub.getPageList()
```

**参数：**

- none

**返回值：**

- `PageList`:

```typescript
interface PageTarget {
  label: string
  // 页码
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

### getNavList(): NavList

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
