import { defineStore } from 'pinia'
import { ref } from 'vue'

const localeStore = defineStore('locale', () => {
  const currLanguage = ref<string>('')

  return {
    currLanguage,
  }
})

export default localeStore
