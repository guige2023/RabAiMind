// Service Worker Manager - PWA服务管理
import { ref, computed, onMounted } from 'vue'

export interface SWState {
  registered: boolean
  updating: boolean
  version: string
  status: 'idle' | 'installing' | 'installed' | 'activating' | 'activated' | 'redundant'
}

export interface SWConfig {
  enableOffline: boolean
  enableNotifications: boolean
  enableBackgroundSync: boolean
  updateOnClose: boolean
}

export function useServiceWorkerManager() {
  const state = ref<SWState>({
    registered: false,
    updating: false,
    version: '',
    status: 'idle'
  })
  const config = ref<SWConfig>({
    enableOffline: true,
    enableNotifications: true,
    enableBackgroundSync: true,
    updateOnClose: true
  })
  const registration = ref<ServiceWorkerRegistration | null>(null)

  const register = async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator)) {
      console.warn('Service Worker not supported')
      return false
    }
    try {
      registration.value = await navigator.serviceWorker.register('/sw.js')
      state.value.registered = true
      state.value.version = registration.value.active?.scriptURL || ''
      return true
    } catch (error) {
      console.error('SW registration failed:', error)
      return false
    }
  }

  const update = async (): Promise<boolean> => {
    if (!registration.value) return false
    state.value.updating = true
    try {
      await registration.value.update()
      return true
    } catch {
      return false
    } finally {
      state.value.updating = false
    }
  }

  const unregister = async (): Promise<boolean> => {
    if (!registration.value) return false
    try {
      await registration.value.unregister()
      state.value.registered = false
      return true
    } catch {
      return false
    }
  }

  const stats = computed(() => ({
    registered: state.value.registered,
    updating: state.value.updating,
    version: state.value.version,
    status: state.value.status
  }))

  onMounted(() => { register() })

  return { state, config, registration, register, update, unregister, stats }
}

export default useServiceWorkerManager
