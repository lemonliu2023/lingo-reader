import { createPinia } from 'pinia'
import useBookStore from './modules/book'
import useLocaleStore from './modules/locale'

const pinia = createPinia()

export { useBookStore, useLocaleStore }
export default pinia
