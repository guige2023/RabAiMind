// useScript.ts - 动态脚本加载模块
import { ref } from 'vue'

export interface ScriptOptions {
  src: string
  async?: boolean
  defer?: boolean
  id?: string
}

export function useScript() {
  const isLoading = ref(false)
  const isLoaded = ref(false)
  const error = ref<Error | null>(null)
  const loadedScripts = new Set<string>()

  const loadScript = (options: ScriptOptions): Promise<HTMLScriptElement> => {
    const { src, async = true, defer = true, id } = options

    // 已加载则直接返回
    if (loadedScripts.has(src)) {
      isLoaded.value = true
      return Promise.resolve(document.querySelector(`script[src="${src}"]`) as HTMLScriptElement)
    }

    isLoading.value = true
    error.value = null

    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = src
      script.async = async
      script.defer = defer
      if (id) script.id = id

      script.onload = () => {
        isLoading.value = false
        isLoaded.value = true
        loadedScripts.add(src)
        resolve(script)
      }

      script.onerror = () => {
        isLoading.value = false
        error.value = new Error(`Failed to load script: ${src}`)
        reject(error.value)
      }

      document.head.appendChild(script)
    })
  }

  const removeScript = (src: string): boolean => {
    const script = document.querySelector(`script[src="${src}"]`)
    if (script) {
      script.remove()
      loadedScripts.delete(src)
      return true
    }
    return false
  }

  const isLoadedCheck = (src: string): boolean => loadedScripts.has(src)

  return { isLoading, isLoaded, error, loadScript, removeScript, isLoaded: isLoadedCheck }
}

export default useScript
