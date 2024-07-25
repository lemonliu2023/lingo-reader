import { EpubFile, initEpubFile } from '@svg-ebook-reader/epub-parser'
import { SvgRender, SvgRenderOptions } from '@svg-ebook-reader/svg-render'
import type { TOCOutput, ManifestItem } from '@svg-ebook-reader/epub-parser'
// import fs from 'fs'

export function Reader(
  epubPath: string,
  svgRenderOptions: SvgRenderOptions = {}
) {
  // chapter > pages > page(string)
  let epub: EpubFile
  let tableOfContents: (TOCOutput | ManifestItem)[] = []
  let pageIndex: number = 0
  let chapterIndex: number = 0
  let currChapterPages: string[] | undefined = []
  let nextChapterPages: string[] | undefined = undefined
  let prevChapterPages: string[] | undefined = undefined

  const loadChapter = async (chapterIndex: number) => {
    const chapter = await epub.getChapter(tableOfContents[chapterIndex].id)
    const renderer = new SvgRender(svgRenderOptions)
    await renderer.addContents(chapter.contents)
    return renderer.pages
  }
  return {
    async init() {
      epub = await initEpubFile(epubPath, svgRenderOptions.imageRoot)
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
      // fs.writeFileSync(`./example/${chapterIndex}-${0}.svg`, currChapterPages[0])
      // fs.writeFileSync(`./example/${chapterIndex}-${1}.svg`, currChapterPages[1])
      // fs.writeFileSync(`./example/${chapterIndex}-${2}.svg`, currChapterPages[2])
      //   }
      // }
      return currChapterPages[pageIndex]
    },

    toNextPage() {
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
    },

    toPrevPage() {
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
    },

    getPageIndex() {
      return pageIndex
    },

    getChapterIndex() {
      return chapterIndex
    },
  }
}
