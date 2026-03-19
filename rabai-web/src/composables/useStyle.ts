// useStyle.ts - 动态样式加载模块
import { ref } from 'vue'

export function useStyle() {
  const isLoading = ref(false)
  const isLoaded = ref(false)
  const loadedStyles = new Set<string>()

  const loadStyle = (href: string, id?: string): Promise<HTMLLinkElement> => {
    if (loadedStyles.has(href)) {
      isLoaded.value = true
      return Promise.resolve(document.querySelector(`link[href="${href}"]`) as HTMLLinkElement)
    }

    isLoading.value = true

    return new Promise((resolve, reject) => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      if (id) link.id = id

      link.onload = () => {
        isLoading.value = false
        isLoaded.value = true
        loadedStyles.add(href)
        resolve(link)
      }

      link.onerror = () => {
        isLoading.value = false
        reject(new Error(`Failed to load style: ${href}`))
      }

      document.head.appendChild(link)
    })
  }

  const removeStyle = (href: string): boolean => {
    const link = document.querySelector(`link[href="${href}"]`)
    if (link) {
      link.remove()
      loadedStyles.delete(href)
      return true
    }
    return false
  }

  const injectCSS = (css: string, id?: string): HTMLStyleElement => {
    const style = document.createElement('style')
    style.textContent = css
    if (id) style.id = id
    document.head.appendChild(style)
    return style
  }

  return { isLoading, isLoaded, loadStyle, removeStyle, injectCSS }
}

export default useStyle
