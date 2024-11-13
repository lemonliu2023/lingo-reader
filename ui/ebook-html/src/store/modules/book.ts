import { defineStore } from 'pinia'
import { ref } from 'vue'

const useBookStore = defineStore('ebook', () => {
  const book = ref<File | undefined>(undefined)

  const setBook = (file: File): void => {
    book.value = file
  }

  const reset = (): void => {
    book.value = undefined
  }

  const existBook = (): boolean => {
    return book.value !== undefined
  }

  return {
    book,
    setBook,
    reset,
    existBook,
  }
})

export default useBookStore
