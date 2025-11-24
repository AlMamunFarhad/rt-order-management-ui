import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { useAuthStore } from '@/stores/auth'
import { Toaster } from "vue-sonner";
import "vue-sonner/style.css";

import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap/dist/js/bootstrap.bundle.min'
import "@fortawesome/fontawesome-free/css/all.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import './assets/styles.css'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)
app.component("Toaster", Toaster)

const auth = useAuthStore()
if (localStorage.getItem('token')) {
  auth.init()
}

app.mount('#app')
