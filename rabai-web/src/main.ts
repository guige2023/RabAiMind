import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './styles/main.css'
import './styles/mobile.css'

const routes = [
  { path: '/', name: 'home', component: () => import('./views/HomeView.vue') },
  { path: '/create', name: 'create', component: () => import('./views/CreateView.vue') },
  { path: '/outline', name: 'outline', component: () => import('./views/OutlineEditView.vue') },
  { path: '/generating', name: 'generating', component: () => import('./views/GeneratingView.vue') },
  { path: '/result', name: 'result', component: () => import('./views/ResultView.vue') },
  { path: '/media', name: 'media', component: () => import('./views/MediaLibraryView.vue') },
  { path: '/history', name: 'history', component: () => import('./views/HistoryView.vue') },
  { path: '/favorites', name: 'favorites', component: () => import('./views/FavoritesView.vue') },
  { path: '/templates', name: 'templates', component: () => import('./views/TemplateMarketView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const app = createApp(App)
app.use(router)
app.mount('#app')

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      console.log('SW registered:', registration.scope)
    }).catch((error) => {
      console.log('SW registration failed:', error)
    })
  })
}
