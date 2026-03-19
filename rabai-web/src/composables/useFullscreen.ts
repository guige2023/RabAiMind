// useFullscreen.ts - 全屏模块
import { ref } from 'vue'

export function useFullscreen(elementRef?: any) {
  const isFullscreen = ref(false)

  const enter = async () => {
    const el = elementRef?.value || document.documentElement
    try {
      await el.requestFullscreen()
      isFullscreen.value = true
    } catch (e) {
      console.error('Fullscreen error:', e)
    }
  }

  const exit = async () => {
    try {
      await document.exitFullscreen()
      isFullscreen.value = false
    } catch (e) {
      console.error('Exit fullscreen error:', e)
    }
  }

  const toggle = () => {
    isFullscreen.value ? exit() : enter()
  }

  // 监听全屏变化
  document.addEventListener('fullscreenchange', () => {
    isFullscreen.value = !!document.fullscreenElement
  })

  return { isFullscreen, enter, exit, toggle }
}

export default useFullscreen
