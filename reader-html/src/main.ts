import { createApp } from 'vue'
import './assets/global.css'
import './assets/normalize.css'
import router from './router'
import pinia from './store'
import App from './App.vue'

window.process = window.process || {}
window.process.cwd = () => '/'

const app = createApp(App)

app.use(router)
app.use(pinia)

app.mount('#app')
