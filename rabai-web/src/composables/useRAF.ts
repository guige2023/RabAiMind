// useRAF.ts - 动画帧模块
import { ref, onUnmounted } from 'vue'

export function useRAF() {
  const active = ref(false)
  let id: number | null = null

  const start = (fn: () => void) => {
    active.value = true
    const loop = () => {
      if (!active.value) return
      fn()
      id = requestAnimationFrame(loop)
    }
    id = requestAnimationFrame(loop)
  }

  const stop = () => {
    active.value = false
    if (id) cancelAnimationFrame(id)
  }

  onUnmounted(stop)

  return { active, start, stop }
}

export default useRAF
