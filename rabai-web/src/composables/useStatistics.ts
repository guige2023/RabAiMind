import { ref, computed } from 'vue'

interface Statistics {
  totalGenerations: number
  totalSlides: number
  favoriteStyles: Record<string, number>
  lastGenerated: string | null
}

const STORAGE_KEY = 'ppt_statistics'

// Load statistics from localStorage
const loadStatistics = (): Statistics => {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    return JSON.parse(saved)
  }
  return {
    totalGenerations: 0,
    totalSlides: 0,
    favoriteStyles: {},
    lastGenerated: null
  }
}

// Save statistics to localStorage
const saveStatistics = (stats: Statistics) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stats))
}

const stats = ref<Statistics>(loadStatistics())

export function useStatistics() {
  // Record a new generation
  const recordGeneration = (slideCount: number, style: string) => {
    stats.value.totalGenerations++
    stats.value.totalSlides += slideCount
    stats.value.favoriteStyles[style] = (stats.value.favoriteStyles[style] || 0) + 1
    stats.value.lastGenerated = new Date().toISOString()
    saveStatistics(stats.value)
  }

  // Get statistics
  const statistics = computed(() => stats.value)

  // Get most used style
  const mostUsedStyle = computed(() => {
    const styles = stats.value.favoriteStyles
    if (Object.keys(styles).length === 0) return null

    return Object.entries(styles).sort((a, b) => b[1] - a[1])[0][0]
  })

  // Get average slides per presentation
  const averageSlides = computed(() => {
    if (stats.value.totalGenerations === 0) return 0
    return Math.round(stats.value.totalSlides / stats.value.totalGenerations)
  })

  // Reset statistics
  const resetStatistics = () => {
    stats.value = {
      totalGenerations: 0,
      totalSlides: 0,
      favoriteStyles: {},
      lastGenerated: null
    }
    saveStatistics(stats.value)
  }

  return {
    statistics,
    recordGeneration,
    mostUsedStyle,
    averageSlides,
    resetStatistics
  }
}
