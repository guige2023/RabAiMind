import { ref } from 'vue'

const notificationPermission = ref<NotificationPermission>(
  typeof Notification !== 'undefined' ? Notification.permission : 'denied'
)
const swRegistration = ref<ServiceWorkerRegistration | null>(null)

export function usePushNotification() {
  // Register service worker message handler on the client side
  const initNotifications = () => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.ready.then((registration) => {
      swRegistration.value = registration

      // Listen for messages from service worker
      registration.addEventListener('message', (event) => {
        const { type, data } = event.data || {}
        if (type === 'SYNC_SUCCESS') {
          console.log('[PushNotification] Sync success for:', data?.url)
        }
      })
    })
  }

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('[PushNotification] Notifications not supported')
      return false
    }

    if (Notification.permission === 'granted') {
      notificationPermission.value = 'granted'
      return true
    }

    if (Notification.permission === 'denied') {
      notificationPermission.value = 'denied'
      return false
    }

    try {
      const permission = await Notification.requestPermission()
      notificationPermission.value = permission
      return permission === 'granted'
    } catch (err) {
      console.error('[PushNotification] Permission request failed:', err)
      return false
    }
  }

  // Request permission early when PPT generation starts
  const prepareForGeneration = async () => {
    if (notificationPermission.value !== 'granted') {
      await requestPermission()
    }
  }

  // Notify service worker to show notification (used when PPT generation completes)
  const notifyGenerationComplete = async (taskId: string, title?: string) => {
    if (notificationPermission.value !== 'granted') {
      console.log('[PushNotification] Permission not granted, skipping notification')
      return
    }

    try {
      const registration = swRegistration.value || await navigator.serviceWorker.ready
      const taskTitle = title || 'PPT 生成完成'

      // Send message to service worker to show notification
      registration.active?.postMessage({
        type: 'SHOW_NOTIFICATION',
        payload: {
          title: taskTitle,
          body: '点击查看您的演示文稿 👇',
          tag: `ppt-complete-${taskId}`,
          icon: '/icon-192.svg',
          data: { taskId, type: 'ppt_complete' }
        }
      })
    } catch (err) {
      console.error('[PushNotification] Failed to show notification:', err)
    }
  }

  const notifyGenerationFailed = async (taskId?: string, error?: string) => {
    if (notificationPermission.value !== 'granted') return

    try {
      const registration = swRegistration.value || await navigator.serviceWorker.ready
      registration.active?.postMessage({
        type: 'SHOW_NOTIFICATION',
        payload: {
          title: 'PPT 生成失败',
          body: error || '请稍后重试',
          tag: `ppt-failed-${taskId || Date.now()}`,
          icon: '/icon-192.svg',
          data: { taskId, type: 'ppt_failed' }
        }
      })
    } catch (err) {
      console.error('[PushNotification] Failed to show error notification:', err)
    }
  }

  // Trigger sync of queued offline requests
  const triggerOfflineSync = () => {
    if (!('serviceWorker' in navigator)) return

    navigator.serviceWorker.ready.then((registration) => {
      // Try Background Sync API
      if ('sync' in registration) {
        (registration as any).sync.register('process-offline-queue').catch(() => {
          // Fallback: manual trigger
          registration.active?.postMessage({ type: 'TRIGGER_SYNC' })
        })
      } else {
        // Fallback: manual trigger
        registration.active?.postMessage({ type: 'TRIGGER_SYNC' })
      }
    })
  }

  // Check if browser is online
  const isOnline = () => navigator.onLine

  // Listen for online/offline events to trigger sync
  const watchNetworkStatus = (onOnline: () => void) => {
    window.addEventListener('online', () => {
      console.log('[Network] Back online, triggering sync...')
      triggerOfflineSync()
      onOnline()
    })

    window.addEventListener('offline', () => {
      console.log('[Network] Gone offline')
    })
  }

  return {
    notificationPermission,
    initNotifications,
    requestPermission,
    prepareForGeneration,
    notifyGenerationComplete,
    notifyGenerationFailed,
    triggerOfflineSync,
    isOnline,
    watchNetworkStatus
  }
}
