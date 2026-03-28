import { watch, ref, Ref } from 'vue'

interface AutoSaveOptions {
  key: string
  data: Ref<any>
  debounceMs?: number
  excludeKeys?: string[]
  maxAge?: number // 草稿有效期（毫秒），默认24小时
}

interface DraftInfo {
  data: any
  savedAt: number
  expiresAt: number
}

export function useAutoSave({ key, data, debounceMs = 2000, excludeKeys = [], maxAge = 24 * 60 * 60 * 1000 }: AutoSaveOptions) {
  const STORAGE_KEY = `ppt_draft_${key}`
  const lastSavedTime = ref<number | null>(null)
  const isSaving = ref(false)

  // Save to localStorage
  const saveDraft = () => {
    isSaving.value = true
    try {
      const dataToSave = { ...data.value }
      // Exclude specified keys
      excludeKeys.forEach(k => delete dataToSave[k])

      const draftInfo: DraftInfo = {
        data: dataToSave,
        savedAt: Date.now(),
        expiresAt: Date.now() + maxAge
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(draftInfo))
      lastSavedTime.value = draftInfo.savedAt
    } catch (e) {
      console.warn('Failed to save draft:', e)
    } finally {
      isSaving.value = false
    }
  }

  // Load from localStorage
  const loadDraft = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const draftInfo: DraftInfo = JSON.parse(saved)
        // Check if draft is not expired
        if (draftInfo.expiresAt && Date.now() < draftInfo.expiresAt) {
          lastSavedTime.value = draftInfo.savedAt
          return draftInfo.data
        } else {
          // Draft expired, clear it
          clearDraft()
        }
      }
    } catch (e) {
      console.warn('Failed to load draft:', e)
    }
    return null
  }

  // Get draft info
  const getDraftInfo = (): { savedAt: number; expiresAt: number; timeAgo: string } | null => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const draftInfo: DraftInfo = JSON.parse(saved)
        const timeAgo = getTimeAgo(draftInfo.savedAt)
        return {
          savedAt: draftInfo.savedAt,
          expiresAt: draftInfo.expiresAt,
          timeAgo
        }
      }
    } catch (e) {
      console.warn('Failed to get draft info:', e)
    }
    return null
  }

  // Format time ago
  const getTimeAgo = (timestamp: number): string => {
    const diff = Date.now() - timestamp
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (days > 0) return `${days}天前`
    if (hours > 0) return `${hours}小时前`
    if (minutes > 0) return `${minutes}分钟前`
    return '刚刚'
  }

  // Clear draft
  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY)
    lastSavedTime.value = null
  }

  // Check if draft exists
  const hasDraft = () => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return false

    try {
      const draftInfo: DraftInfo = JSON.parse(saved)
      return Date.now() < draftInfo.expiresAt
    } catch {
      return false
    }
  }

  // Get remaining time
  const getRemainingTime = (): string => {
    const info = getDraftInfo()
    if (!info) return ''

    const remaining = info.expiresAt - Date.now()
    if (remaining <= 0) return '已过期'

    const hours = Math.floor(remaining / (1000 * 60 * 60))
    const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))

    if (hours > 0) return `${hours}小时${minutes}分钟`
    return `${minutes}分钟`
  }

  // Watch for changes and auto-save with debounce
  let debounceTimer: number | null = null
  let beforeUnloadHandler: ((e: BeforeUnloadEvent) => void) | null = null
  let stopWatch: (() => void) | null = null

  // Watch must be called synchronously during setup, not inside onMounted
  stopWatch = watch(data, () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    debounceTimer = window.setTimeout(() => {
      saveDraft()
    }, debounceMs)
  }, { deep: true })

  const setupAutoSave = () => {
    // Save on page leave
    beforeUnloadHandler = (e: BeforeUnloadEvent) => {
      // Save immediately before leaving
      saveDraft()
      // Show warning if there's unsaved data
      const hasData = Object.keys(data.value).some(k => {
        const val = data.value[k]
        return val !== '' && val !== null && val !== false
      })
      if (hasData) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', beforeUnloadHandler)
  }

  const cleanup = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
    if (beforeUnloadHandler) {
      window.removeEventListener('beforeunload', beforeUnloadHandler)
    }
    if (stopWatch) {
      stopWatch()
    }
  }

  // Auto cleanup on import
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      cleanup()
    })
  }

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    hasDraft,
    getDraftInfo,
    getRemainingTime,
    setupAutoSave,
    cleanup,
    lastSavedTime,
    isSaving
  }
}
