import { EpubFile } from '@svg-ebook-reader/epub-parser'
import { SvgRender, SvgRenderOptions } from '@svg-ebook-reader/svg-render'
import type { TOCOutput, ManifestItem } from '@svg-ebook-reader/epub-parser'
import fs from 'fs'

function initEpubFile(): Promise<EpubFile> {
  return new Promise((resolve) => {
    const epub = new EpubFile('./example/alice.epub')
    setTimeout(() => {
      resolve(epub)
    }, 0)
  })
}

let epub: EpubFile;
let tableOfContents: (TOCOutput | ManifestItem)[] = []
let pageIndex: number = 0
let chapterIndex: number = 0
let currChapterPages: string[] | undefined = []
let nextChapterPages: string[] | undefined = undefined
let prevChapterPages: string[] | undefined = undefined

export function __test__pageIndex() {
  return pageIndex
}

export function __test__chapterIndex() {
  return chapterIndex
}

export async function init() {
  epub = await initEpubFile()
  tableOfContents = epub.getToc()
  currChapterPages = await loadChapter(chapterIndex)

  nextChapterPages = chapterIndex + 1 < tableOfContents.length
    ? await loadChapter(chapterIndex + 1)
    : undefined
  
  prevChapterPages = chapterIndex - 1 >= 0
    ? await loadChapter(chapterIndex - 1)
    : undefined

  // for (let i = 0; i < currChapterPages.length; i++) {
  //   if (!fs.existsSync(`./example/${chapterIndex}-${i}.svg`)) {
      fs.writeFileSync(`./example/${chapterIndex}-${2}.svg`, currChapterPages[2])
  //   }
  // }
  return currChapterPages[pageIndex]
}

async function loadChapter(chapterIndex: number) {
  const chapter = await epub.getChapter(tableOfContents[chapterIndex].id)
  const renderer = new SvgRender({
    padding: '40',
    width: 1474,
    height: 743,
    imageRoot: './example/alice'
  })
  await renderer.addContents(chapter.contents)
  return renderer.pages
}

export async function toNextPage() {
  const nextPageIndex = pageIndex + 1
  if (nextPageIndex < currChapterPages!.length) {
    pageIndex = nextPageIndex
    return currChapterPages![pageIndex]
  } else {
    if (!nextChapterPages) {
      return undefined
    } else {
      pageIndex = 0
      prevChapterPages = currChapterPages
      currChapterPages = nextChapterPages
      chapterIndex++
      if (chapterIndex + 1 >= tableOfContents.length) {
        nextChapterPages = undefined
        return undefined
      } else {
        loadChapter(chapterIndex + 1)
          .then(pages => {
            nextChapterPages = pages
          })
      }
      return currChapterPages[pageIndex]
    }
  }
}

export async function toPrevPage() {
  const prevPageIndex = pageIndex - 1
  if (prevPageIndex >= 0) {
    pageIndex = prevPageIndex
    return currChapterPages![pageIndex]
  } else {
    if (!prevChapterPages) {
      return undefined
    } else {
      pageIndex = 0
      nextChapterPages = currChapterPages
      currChapterPages = prevChapterPages
      chapterIndex--
      if (chapterIndex - 1 < 0) {
        prevChapterPages = undefined
        return undefined
      } else {
        loadChapter(chapterIndex - 1)
          .then(pages => {
            prevChapterPages = pages
          })
      }
      return currChapterPages[pageIndex]
    }
  }
}

// chapter > pages > page(string)


