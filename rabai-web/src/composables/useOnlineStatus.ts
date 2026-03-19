// useOnlineStatus.ts - 网络状态模块
import { ref, onMounted, onUnmounted } from 'vue'
import { useEventListener } from './useEventListener'

export function useOnlineStatus() {
  const isOnline = ref(true)
  const isOffline = ref(false)

  const updateStatus = () => {
    isOnline.value = navigator.onLine
    isOffline.value = !navigator.onLine
  }

  onMounted(() => {
    updateStatus()
  })

  useEventListener(window, 'online', updateStatus)
  useEventListener(window, 'offline', updateStatus)

  return { isOnline, isOffline }
}

export default useOnlineStatus
