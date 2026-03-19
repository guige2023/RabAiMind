import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './styles/main.css'
import { trackPageLoad, reportWebVitals } from './utils/performance'

// 路由配置
const routes = [
  { path: '/', name: 'home', component: () => import('./views/HomeView.vue') },
  { path: '/create', name: 'create', component: () => import('./views/CreateView.vue') },
  { path: '/outline', name: 'outline', component: () => import('./views/OutlineEditView.vue') },
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

// Track performance
trackPageLoad()
reportWebVitals((metric) => {
  console.log('Web Vitals:', metric)
})

// Register service worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('SW registered:', registration.scope)
    }).catch((error) => {
      console.log('SW registration failed:', error)
    })
  })
}
