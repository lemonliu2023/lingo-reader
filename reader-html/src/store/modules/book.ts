import type { EpubFile, EpubSpine } from '@lingo-reader/epub-parser'
import { initEpubFile } from '@lingo-reader/epub-parser'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import DOMPurify from 'dompurify'
import { initKf8File, initMobiFile } from '@lingo-reader/mobi-parser'
import type { Kf8, Kf8Spine, Mobi, MobiSpine } from '@lingo-reader/mobi-parser'
import type { FileInfo } from '@lingo-reader/shared'

const useBookStore = defineStore('ebook', () => {
  let book: EpubFile | Mobi | Kf8 | undefined
  let spine: EpubSpine | MobiSpine | Kf8Spine = []
  const chapterIndex = ref<number>(0)
  const chapterNums = ref<number>(0)
  let fileInfo: FileInfo = {
    fileName: '',
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
    else if (file.name.endsWith('kf8')) {
      book = await initKf8File(file)
      spine = book.getSpine()
      chapterNums.value = spine.length
      fileInfo = book.getFileInfo()
    }
  }

  const chapterCache = new Map<string, string>()
  const getChapterHTMLFromId = async (id: string): Promise<string> => {
    if (chapterCache.has(id)) {
      return chapterCache.get(id)!
    }

    const { html } = await book!.loadChapter(id)!
    // for security
    const purifiedDom = DOMPurify.sanitize(html, {
      ALLOWED_URI_REGEXP: /^(blob|https|Epub|filepos|kindle)/gi,
    })
    chapterCache.set(id, purifiedDom)
    return purifiedDom
  }

  const getChapterHTML = async () => {
    const id = spine[chapterIndex.value].id
    return await getChapterHTMLFromId(id)
  }

  const getChapterThroughId = async (id: string) => {
    chapterIndex.value = spine.findIndex(item => item.id === id)
    return await getChapterHTMLFromId(id)
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
    // clear chapter cache to avoid image conflict in different books
    chapterCache.clear()
  }

  const existBook = (): boolean => {
    return book !== undefined
  }

  const resolveHref = (href: string) => {
    return book!.resolveHref(href)
  }

  return {
    chapterIndex,
    chapterNums,
    initBook,
    getChapterHTML,
    getChapterThroughId,
    getToc,
    getFileName,
    reset,
    existBook,
    resolveHref,
  }
})

export default useBookStore
