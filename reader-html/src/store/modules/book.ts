import type { EpubFile, EpubSpine } from '@blingo-reader/epub-parser'
import { initEpubFile } from '@blingo-reader/epub-parser'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import DOMPurify from 'dompurify'
import { initAzw3File, initMobiFile } from '@blingo-reader/mobi-parser'
import type { Azw3, Azw3Spine, Mobi, MobiSpine } from '@blingo-reader/mobi-parser'

const useBookStore = defineStore('ebook', () => {
  let book: EpubFile | Mobi | Azw3 | undefined
  let spine: EpubSpine | MobiSpine | Azw3Spine = []
  const chapterIndex = ref<number>(0)
  const chapterNums = ref<number>(0)
  let fileInfo: Record<string, any> = {
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
    else if (file.name.endsWith('mobi')) {
      book = await initMobiFile(file)
      spine = book.getSpine()
      chapterNums.value = spine.length
      fileInfo = book.getFileInfo()
    }
    else if (file.name.endsWith('azw3')) {
      book = await initAzw3File(file)
      spine = book.getSpine()
      chapterNums.value = spine.length
      fileInfo = book.getFileInfo()
    }
  }

  // TODO: add cache
  const getChapterHTML = async () => {
    const { html } = await book!.loadChapter(spine[chapterIndex.value].id)!
    // for security
    return DOMPurify.sanitize(html, {
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
