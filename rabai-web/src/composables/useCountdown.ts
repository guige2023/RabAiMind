// useCountdown.ts - 倒计时模块
import { ref, computed, onUnmounted } from 'vue'

export interface CountdownOptions {
  seconds: number
  onComplete?: () => void
  autoStart?: boolean
}

export function useCountdown(options: CountdownOptions) {
  const { seconds, onComplete, autoStart = false } = options

  const total = ref(seconds)
  const remaining = ref(seconds)
  const isRunning = ref(false)
  const isCompleted = computed(() => remaining.value <= 0)

  let timer: ReturnType<typeof setInterval> | null = null

  const start = () => {
    if (isRunning.value || isCompleted.value) return
    isRunning.value = true
    timer = setInterval(() => {
      remaining.value--
      if (remaining.value <= 0) {
        stop()
        onComplete?.()
      }
    }, 1000)
  }

  const stop = () => {
    if (timer) {
      clearInterval(timer)
      timer = null
    }
    isRunning.value = false
  }

  const reset = () => {
    stop()
    remaining.value = total.value
  }

  const format = computed(() => {
    const m = Math.floor(remaining.value / 60)
    const s = remaining.value % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  })

  if (autoStart) start()

  onUnmounted(stop)

  return { total, remaining, isRunning, isCompleted, format, start, stop, reset }
}

export default useCountdown
