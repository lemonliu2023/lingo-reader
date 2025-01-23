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
  const chapterIndex = ref<number>(6)
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
