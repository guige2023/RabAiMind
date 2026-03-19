// useMemo.ts - 记忆化模块
import { ref, computed } from 'vue'

export function useMemo<T>(fn: () => T, deps: any[]) {
  const cached = ref<T | null>(null)
  const lastDeps = ref<string>('')

  return computed(() => {
    const depKey = JSON.stringify(deps)
    if (cached.value === null || lastDeps.value !== depKey) {
      cached.value = fn()
      lastDeps.value = depKey
    }
    return cached.value
  })
}

export default useMemo
