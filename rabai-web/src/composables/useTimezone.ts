// useTimezone.ts - 时区模块
import { ref, onMounted } from 'vue'

export function useTimezone() {
  const timezone = ref('')
  const offset = ref(0)

  onMounted(() => {
    timezone.value = Intl.DateTimeFormat().resolvedOptions().timeZone
    offset.value = new Date().getTimezoneOffset()
  })

  const toLocal = (date: Date) => new Date(date.toLocaleString())
  const toUTC = (date: Date) => new Date(date.getTime() + offset.value * 60000)

  return { timezone, offset, toLocal, toUTC }
}

export default useTimezone
