import { createPinia } from 'pinia'
import useBookStore from './modules/book'

const pinia = createPinia()

export { useBookStore }
export default pinia
