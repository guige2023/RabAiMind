// useWindow.ts - 窗口模块
import { ref, onMounted, onUnmounted } from 'vue'

export function useWindow() {
  const width = ref(typeof window !== 'undefined' ? window.innerWidth : 0)
  const height = ref(typeof window !== 'undefined' ? window.innerHeight : 0)

  const handleResize = () => {
    width.value = window.innerWidth
    height.value = window.innerHeight
  }

  onMounted(() => window.addEventListener('resize', handleResize))
  onUnmounted(() => window.removeEventListener('resize', handleResize))

  const isMobile = () => width.value < 768
  const isTablet = () => width.value >= 768 && width.value < 1024
  const isDesktop = () => width.value >= 1024

  return { width, height, isMobile, isTablet, isDesktop }
}

export default useWindow
