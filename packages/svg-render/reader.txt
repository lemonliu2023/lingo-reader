import fs from 'node:fs'
import path from 'node:path'
import { initEpubFile } from '@svg-ebook-reader/epub-parser'
import type { Page, SvgRenderOptions } from '@svg-ebook-reader/svg-render'
import { SvgRender } from '@svg-ebook-reader/svg-render'

export async function initAllPage(
  epubPath: string,
  svgRenderOptions: SvgRenderOptions = {},
) {
  const pages: Page[] = []
  const epub = await initEpubFile(epubPath, svgRenderOptions.imageRoot)
  const tableOfContents = epub.getToc()
  for (let i = 0; i < tableOfContents.length; i++) {
    const id = tableOfContents[i].id
    const chapter = await epub.getChapter(id)
    const renderer = new SvgRender(id, svgRenderOptions)
    await renderer.addContents(chapter.contents)
    const pageOfChapter = renderer.getPages()
    pages.push(...pageOfChapter)
  }

  // save svg result to disk if savePath.length > 0
  const savePath = svgRenderOptions.saveDir
  if (savePath && savePath.length > 0) {
    const fileName = epub.getFileName()
    pages.forEach((page) => {
      const dir = path.resolve(
        savePath,
        `${fileName}-${page.chapterId}-${page.pageIndex}-${page.lastContentIndexOfPage}.svg`,
      )
      fs.writeFileSync(dir, page.svg)
    })
  }

  return pages
}

// /**
//  * Combine epub-parser and svg-render to reader,
//  *  expose nextPage, prevPage and init methods to get page string
//  */
// export function Reader(
//   epubPath: string,
//   svgRenderOptions: SvgRenderOptions = {},
// ) {
//   // chapter > pages > page(string)
//   let epub: EpubFile
//   let tableOfContents: (TOCOutput | ManifestItem)[] = []
//   let pageIndex: number = 0
//   let chapterIndex: number = 0
//   let currChapterPages: string[] | undefined = []
//   let nextChapterPages: string[] | undefined
//   let prevChapterPages: string[] | undefined

//   const loadChapter = async (chapterIndex: number) => {
//     const id = tableOfContents[chapterIndex].id
//     const chapter = await epub.getChapter(id)
//     const renderer = new SvgRender(id, svgRenderOptions)
//     await renderer.addContents(chapter.contents)
//     return renderer.pages
//   }
//   return {
//     async init() {
//       epub = await initEpubFile(epubPath, svgRenderOptions.imageRoot)
//       tableOfContents = epub.getToc()
//       currChapterPages = await loadChapter(chapterIndex)

//       nextChapterPages = chapterIndex + 1 < tableOfContents.length
//         ? await loadChapter(chapterIndex + 1)
//         : undefined

//       prevChapterPages = chapterIndex - 1 >= 0
//         ? await loadChapter(chapterIndex - 1)
//         : undefined

//       // for (let i = 0; i < currChapterPages.length; i++) {
//       //   if (!fs.existsSync(`./example/${chapterIndex}-${i}.svg`)) {
//       // fs.writeFileSync(`./example/${chapterIndex}-${0}.svg`, currChapterPages[0])
//       // fs.writeFileSync(`./example/${chapterIndex}-${1}.svg`, currChapterPages[1])
//       // fs.writeFileSync(`./example/${chapterIndex}-${2}.svg`, currChapterPages[2])
//       //   }
//       // }
//       return currChapterPages[pageIndex]
//     },

//     async toNextPage() {
//       const nextPageIndex = pageIndex + 1
//       if (nextPageIndex < currChapterPages!.length) {
//         pageIndex = nextPageIndex
//         return currChapterPages![pageIndex]
//       }
//       else {
//         if (!nextChapterPages) {
//           return undefined
//         }
//         else {
//           pageIndex = 0
//           prevChapterPages = currChapterPages
//           currChapterPages = nextChapterPages
//           chapterIndex++
//           if (chapterIndex + 1 >= tableOfContents.length) {
//             nextChapterPages = undefined
//             return undefined
//           }
//           else {
//             nextChapterPages = undefined
//             nextChapterPages = await loadChapter(chapterIndex + 1)
//           }
//           return currChapterPages[pageIndex]
//         }
//       }
//     },

//     toPrevPage() {
//       const prevPageIndex = pageIndex - 1
//       if (prevPageIndex >= 0) {
//         pageIndex = prevPageIndex
//         return currChapterPages![pageIndex]
//       }
//       else {
//         if (!prevChapterPages) {
//           return undefined
//         }
//         else {
//           pageIndex = 0
//           nextChapterPages = currChapterPages
//           currChapterPages = prevChapterPages
//           chapterIndex--
//           if (chapterIndex - 1 < 0) {
//             prevChapterPages = undefined
//             return undefined
//           }
//           else {
//             prevChapterPages = undefined
//             loadChapter(chapterIndex - 1)
//               .then((pages) => {
//                 prevChapterPages = pages
//               })
//           }
//           return currChapterPages[pageIndex]
//         }
//       }
//     },

//     getPageIndex() {
//       return pageIndex
//     },

//     getChapterIndex() {
//       return chapterIndex
//     },

//     getCurrChapterPageCount() {
//       return currChapterPages!.length
//     },
//   }
// }
