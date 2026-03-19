// useIsUpdating.ts - 更新状态模块
import { ref, onUpdated, onMounted } from 'vue'

export function useIsUpdating() {
  const updating = ref(false)
  onMounted(() => { updating.value = false })
  onUpdated(() => { updating.value = true })
  return { updating }
}

export default useIsUpdating
