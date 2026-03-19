// useSSR.ts - SSR检测模块
import { ref, onMounted } from 'vue'

export function useSSR() {
  const isServer = ref(typeof window === 'undefined')
  const isClient = ref(typeof window !== 'undefined')

  onMounted(() => {
    isServer.value = false
    isClient.value = true
  })

  return { isServer, isClient }
}

export default useSSR
