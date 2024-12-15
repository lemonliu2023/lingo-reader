import type { EpubFile, SpineItem } from '@blingo-reader/epub-parser'
import { initEpubFile } from '@blingo-reader/epub-parser'
import { defineStore } from 'pinia'
import { ref } from 'vue'

const useBookStore = defineStore('ebook', () => {
  let book: EpubFile | undefined
  let toc: SpineItem[] = []
  const chapterIndex = ref<number>(0)
  const chapterNums = ref<number>(0)

  const initBook = async (file: File) => {
    if (file.name.endsWith('epub')) {
      book = await initEpubFile(file)
      toc = book.getToc()
      chapterNums.value = toc.length
    }
  }

  // TODO: add cache
  const getChapterHTML = async () => {
    return await book!.getHTML(toc[chapterIndex.value].id)
  }

  const getNavMap = () => {
    return book!.getNavMap()
  }

  const getFileName = () => {
    return book!.getFileName()
  }

  const reset = () => {
    book!.revokeImageUrls()
    book = undefined
    toc = []
    chapterIndex.value = 0
    chapterNums.value = 0
  }

  const existBook = (): boolean => {
    return book !== undefined
  }

  return {
    chapterIndex,
    chapterNums,
    initBook,
    getChapterHTML,
    getNavMap,
    getFileName,
    reset,
    existBook,
  }
})

export default useBookStore
