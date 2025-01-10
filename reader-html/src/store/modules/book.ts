import type { EpubFile, SpineItem } from '@blingo-reader/epub-parser'
import { initEpubFile } from '@blingo-reader/epub-parser'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import DOMPurify from 'dompurify'

const useBookStore = defineStore('ebook', () => {
  let book: EpubFile | undefined
  let spine: SpineItem[] = []
  const chapterIndex = ref<number>(0)
  const chapterNums = ref<number>(0)
  let fileInfo = {
    fileName: '',
    mimetype: '',
  }

  const initBook = async (file: File) => {
    if (file.name.endsWith('epub')) {
      book = await initEpubFile(file)
      spine = book.getSpine()
      chapterNums.value = spine.length
      fileInfo = book.getFileInfo()
    }
  }

  // TODO: add cache
  const getChapterHTML = async () => {
    // for security
    return DOMPurify.sanitize((await book!.loadChapter(spine[chapterIndex.value].id)).html, {
      ALLOWED_URI_REGEXP: /^(blob|https)/gi,
    })
  }

  const getToc = () => {
    return book!.getToc()
  }

  const getFileName = () => {
    return fileInfo.fileName
  }

  const reset = () => {
    book!.destroy()
    book = undefined
    spine = []
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
    getToc,
    getFileName,
    reset,
    existBook,
  }
})

export default useBookStore
