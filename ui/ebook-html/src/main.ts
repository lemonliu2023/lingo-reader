import { createApp } from 'vue'
import './assets/normalize.css'
// for xml2js
// import 'events'
import router from './router'
import pinia from './store'
import App from './App.vue'

const app = createApp(App)

app.use(router)
app.use(pinia)

app.mount('#app')
