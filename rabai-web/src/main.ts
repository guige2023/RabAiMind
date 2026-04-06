import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import './styles/main.css'
import './styles/mobile.css'
import { initDeviceMode } from './composables/useDeviceMode'
import { applyAccessibilityEarly } from './composables/useAccessibility'

const routes = [
  { path: '/', name: 'home', component: () => import('./views/HomeView.vue') },
  { path: '/create', name: 'create', component: () => import('./views/CreateView.vue') },
  { path: '/outline', name: 'outline', component: () => import('./views/OutlineEditView.vue') },
  { path: '/generating', name: 'generating', component: () => import('./views/GeneratingView.vue') },
  { path: '/result/:taskId', name: 'result', component: () => import('./views/ResultView.vue') },
  { path: '/media', name: 'media', component: () => import('./views/MediaLibraryView.vue') },
  { path: '/history', name: 'history', component: () => import('./views/HistoryView.vue') },
  { path: '/favorites', name: 'favorites', component: () => import('./views/FavoritesView.vue') },
  { path: '/templates', name: 'templates', component: () => import('./views/TemplateMarketView.vue') },
  { path: '/analytics', name: 'analytics', component: () => import('./views/AnalyticsView.vue') },
  { path: '/brand', name: 'brand', component: () => import('./views/BrandCenterView.vue') },
  { path: '/settings', name: 'settings', component: () => import('./views/SettingsView.vue') },
  { path: '/template-editor', name: 'template-editor', component: () => import('./views/TemplateEditorView.vue') },
  { path: '/presenter', name: 'presenter', component: () => import('./views/PresenterView.vue') },
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Initialize accessibility early (before app mounts)
applyAccessibilityEarly()

const app = createApp(App)
app.use(router)
app.mount('#app')

// Initialize device mode detection early
initDeviceMode()

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      // SW registered
    }).catch((error) => {
      // SW registration failed
    })
  })

  // Watch for back-online to trigger sync
  window.addEventListener('online', () => {
    console.log('[App] Back online, triggering offline sync...')
    navigator.serviceWorker.ready.then((registration) => {
      if ('sync' in registration) {
        (registration as any).sync.register('process-offline-queue').catch(() => {
          registration.active?.postMessage({ type: 'TRIGGER_SYNC' })
        })
      } else {
        registration.active?.postMessage({ type: 'TRIGGER_SYNC' })
      }
    })
  })
}
