import { createApp } from 'vue'
import './assets/global.css'
import './assets/normalize.css'
import i18 from './i18n'
import router from './router'
import pinia from './store'
import App from './App.vue'

window.process = window.process || {}
window.process.cwd = () => '/'

const app = createApp(App)

app.use(i18)
app.use(router)
app.use(pinia)

app.mount('#app')
