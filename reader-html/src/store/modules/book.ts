import type { EpubFile, SpineItem } from '@blingo-reader/epub-parser'
import { initEpubFile } from '@blingo-reader/epub-parser'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import DOMPurify from 'dompurify'

const useBookStore = defineStore('ebook', () => {
  let book: EpubFile | undefined
  let toc: SpineItem[] = []
  const chapterIndex = ref<number>(0)
  const chapterNums = ref<number>(0)
  let fileInfo = {
    fileName: '',
    mimetype: '',
  }

  const initBook = async (file: File) => {
    if (file.name.endsWith('epub')) {
      book = await initEpubFile(file)
      toc = book.getToc()
      chapterNums.value = toc.length
      fileInfo = book.getFileInfo()
    }
  }

  // TODO: add cache
  const getChapterHTML = async () => {
    // for security
    return DOMPurify.sanitize((await book!.loadChapter(toc[chapterIndex.value].id)).html, {
      ALLOWED_URI_REGEXP: /^(blob|https)/gi,
    })
  }

  const getNavMap = () => {
    return book!.getNavMap()
  }

  const getFileName = () => {
    return fileInfo.fileName
  }

  const reset = () => {
    book!.destroy()
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
