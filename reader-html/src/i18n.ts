import { createI18n } from 'vue-i18n'
import enMessage from './locales/en.json'
import zhMessage from './locales/zh.json'

const i18 = createI18n({
  locale: 'en',
  messages: {
    en: enMessage,
    zh: zhMessage,
  },
})

export default i18
