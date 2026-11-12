import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/bebas-neue/400.css'
import './assets/styles/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { pinia } from './stores'

createApp(App).use(pinia).use(router).mount('#app')
