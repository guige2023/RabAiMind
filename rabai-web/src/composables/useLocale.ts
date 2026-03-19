// useLocale.ts - 语言模块
import { ref, onMounted } from 'vue'

export function useLocale() {
  const locale = ref('zh-CN')
  const locales = ref<string[]>([])
  const messages = ref<Record<string, Record<string, string>>>({})

  onMounted(() => {
    locale.value = navigator.language || 'zh-CN'
  })

  const setLocale = (loc: string) => { locale.value = loc }
  const t = (key: string): string => messages.value[locale.value]?.[key] || key

  return { locale, locales, messages, setLocale, t }
}

export default useLocale
