import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './styles/main.css'

// 路由配置
const routes = [
  { path: '/', name: 'home', component: () => import('./views/HomeView.vue') },
  { path: '/create', name: 'create', component: () => import('./views/CreateView.vue') },
  { path: '/generating', name: 'generating', component: () => import('./views/GeneratingView.vue') },
  { path: '/result', name: 'result', component: () => import('./views/ResultView.vue') },
  { path: '/media', name: 'media', component: () => import('./views/MediaLibraryView.vue') },
  { path: '/history', name: 'history', component: () => import('./views/HistoryView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)
app.use(router)
app.mount('#app')
