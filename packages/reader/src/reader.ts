import { EpubFile } from '@svg-ebook-reader/epub-parser'
import { SvgRender } from '@svg-ebook-reader/svg-render'
import type { TOCOutput, ManifestItem } from '@svg-ebook-reader/epub-parser'
import { ContentType } from '@svg-ebook-reader/shared'
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
const tocLen = tableOfContents.length
let pageIndex: number = 0
// pageCount = currChapter.length
let chapterIndex: number = 0
let currChapterPages: string[] | undefined = []
let nextChapterPages: string[] | undefined = undefined
let prevChapterPages: string[] | undefined = undefined

export async function init() {
  epub = await initEpubFile()
  tableOfContents = epub.getToc()
  const chapter = await epub.getChapter(tableOfContents[0].id)
  const renderer = new SvgRender({
    padding: '40',
    width: 1000,
    height: 700,
  })
  renderer.addContents(chapter.contents)
  currChapterPages = renderer.pages
  if (chapterIndex + 1 < tocLen) {
    const nextChapter = await epub.getChapter(tableOfContents[chapterIndex + 1].id)
    const nextRenderer = new SvgRender({
      padding: '40',
      width: 1000,
      height: 700,
    })
    nextRenderer.addContents(nextChapter.contents)
    nextChapterPages = nextRenderer.pages
  }
  if (chapterIndex - 1 >= 0) {
    const prevChapter = await epub.getChapter(tableOfContents[chapterIndex - 1].id)
    const prevRenderer = new SvgRender({
      padding: '40',
      width: 1000,
      height: 700,
    })
    prevRenderer.addContents(prevChapter.contents)
    prevChapterPages = prevRenderer.pages
  }

  return currChapterPages[pageIndex]
}

async function loadChapter(chapterIndex: number) {
  const chapter = await epub.getChapter(tableOfContents[chapterIndex].id)
  const renderer = new SvgRender({
    padding: '40',
    width: 1000,
    height: 700,
  })
  renderer.addContents(chapter.contents)
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
      if (chapterIndex + 1 >= tocLen) {
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


