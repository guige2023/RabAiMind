import { watch, onMounted, onUnmounted, Ref } from 'vue'

interface AutoSaveOptions {
  key: string
  data: Ref<any>
  debounceMs?: number
  excludeKeys?: string[]
}

export function useAutoSave({ key, data, debounceMs = 1000, excludeKeys = [] }: AutoSaveOptions) {
  const STORAGE_KEY = `ppt_draft_${key}`

  // Save to localStorage
  const saveDraft = () => {
    try {
      const dataToSave = { ...data.value }
      // Exclude specified keys
      excludeKeys.forEach(k => delete dataToSave[k])
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        data: dataToSave,
        savedAt: Date.now()
      }))
    } catch (e) {
      console.warn('Failed to save draft:', e)
    }
  }

  // Load from localStorage
  const loadDraft = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const { data: savedData, savedAt } = JSON.parse(saved)
        // Check if draft is less than 24 hours old
        if (savedAt && Date.now() - savedAt < 24 * 60 * 60 * 1000) {
          return savedData
        }
      }
    } catch (e) {
      console.warn('Failed to load draft:', e)
    }
    return null
  }

  // Clear draft
  const clearDraft = () => {
    localStorage.removeItem(STORAGE_KEY)
  }

  // Check if draft exists
  const hasDraft = () => {
    return localStorage.getItem(STORAGE_KEY) !== null
  }

  // Watch for changes and auto-save with debounce
  let debounceTimer: number | null = null

  const setupAutoSave = () => {
    watch(data, () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      debounceTimer = window.setTimeout(() => {
        saveDraft()
      }, debounceMs)
    }, { deep: true })
  }

  const cleanup = () => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }
  }

  return {
    saveDraft,
    loadDraft,
    clearDraft,
    hasDraft,
    setupAutoSave,
    cleanup
  }
}
