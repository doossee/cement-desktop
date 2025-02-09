import './assets/main.css'
import App from "./App.vue"
import Mask from 'vue-the-mask'
import { createApp } from "vue"
import { router } from '@/router'
import { createPinia } from 'pinia'

createApp(App)
    .use(createPinia())
    .use(router)
    .use(Mask as any)
    .mount("#app");
