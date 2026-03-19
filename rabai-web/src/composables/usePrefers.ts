// usePrefers.ts - 用户偏好模块
import { ref, onMounted } from 'vue'

export function usePrefers() {
  const prefersReducedMotion = ref(false)
  const prefersDark = ref(false)
  const prefersLight = ref(false)

  onMounted(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.value = mq.matches
    mq.addEventListener('change', e => prefersReducedMotion.value = e.matches)

    const darkMq = window.matchMedia('(prefers-color-scheme: dark)')
    prefersDark.value = darkMq.matches
    darkMq.addEventListener('change', e => prefersDark.value = e.matches)

    prefersLight.value = !prefersDark.value
  })

  return { prefersReducedMotion, prefersDark, prefersLight }
}

export default usePrefers
