// Enhanced Smart Recommendation - 增强智能推荐系统
import { ref, computed } from 'vue'

export type RecommendationType = 'template' | 'content' | 'style' | 'audience' | 'keyword'
export type RecommendationSource = 'history' | 'popular' | 'similar' | 'trending' | 'personalized' | 'ai'

export interface RecommendationItem {
  id: string
  type: RecommendationType
  title: string
  description: string
  score: number
  source: RecommendationSource
  tags: string[]
  thumbnail?: string
  reason?: string
  metadata?: Record<string, any>
}

export interface UserBehavior {
  viewedTemplates: string[]
  usedTemplates: string[]
  searchedKeywords: string[]
  createdTopics: string[]
  exportedFormats: string[]
  preferences: Record<string, number>
  sessionCount: number
  totalCreations: number
}

export interface RecommendationConfig {
  maxItems: number
  minScore: number
  enablePersonalization: boolean
  enableTrending: boolean
  enableSimilar: boolean
  enableAI: boolean
}

const defaultConfig: RecommendationConfig = {
  maxItems: 10,
  minScore: 0.3,
  enablePersonalization: true,
  enableTrending: true,
  enableSimilar: true,
  enableAI: true
}

export function useEnhancedRecommendation() {
  const config = ref<RecommendationConfig>({ ...defaultConfig })

  const userBehavior = ref<UserBehavior>({
    viewedTemplates: [],
    usedTemplates: [],
    searchedKeywords: [],
    createdTopics: [],
    exportedFormats: [],
    preferences: {},
    sessionCount: 0,
    totalCreations: 0
  })

  const recommendations = ref<RecommendationItem[]>([])
  const recentRecommendations = ref<RecommendationItem[]>([])

  // 追踪用户行为
  const trackView = (templateId: string) => {
    if (!userBehavior.value.viewedTemplates.includes(templateId)) {
      userBehavior.value.viewedTemplates.push(templateId)
    }
  }

  const trackUse = (templateId: string) => {
    if (!userBehavior.value.usedTemplates.includes(templateId)) {
      userBehavior.value.usedTemplates.push(templateId)
    }
    userBehavior.value.preferences[templateId] = (userBehavior.value.preferences[templateId] || 0) + 5
    userBehavior.value.totalCreations++
  }

  const trackSearch = (keyword: string) => {
    if (!userBehavior.value.searchedKeywords.includes(keyword)) {
      userBehavior.value.searchedKeywords.push(keyword)
    }
  }

  const trackTopic = (topic: string) => {
    if (!userBehavior.value.createdTopics.includes(topic)) {
      userBehavior.value.createdTopics.push(topic)
    }
  }

  const trackExport = (format: string) => {
    if (!userBehavior.value.exportedFormats.includes(format)) {
      userBehavior.value.exportedFormats.push(format)
    }
  }

  // 标签相似度计算
  const calculateSimilarity = (tags1: string[], tags2: string[]): number => {
    if (!tags1.length || !tags2.length) return 0
    const set1 = new Set(tags1)
    const set2 = new Set(tags2)
    const intersection = [...set1].filter(x => set2.has(x)).length
    return intersection / Math.max(set1.size, set2.size)
  }

  // 基于历史的推荐
  const getHistoryBased = (items: RecommendationItem[]): RecommendationItem[] => {
    if (!config.value.enablePersonalization) return []

    return items
      .filter(item => !userBehavior.value.usedTemplates.includes(item.id))
      .map(item => {
        let score = 0
        const lowerTags = item.tags.map(t => t.toLowerCase())

        userBehavior.value.searchedKeywords.forEach(kw => {
          if (item.title.toLowerCase().includes(kw.toLowerCase())) score += 3
          lowerTags.forEach(tag => { if (tag.includes(kw.toLowerCase())) score += 2 })
        })

        userBehavior.value.createdTopics.forEach(topic => {
          if (item.title.toLowerCase().includes(topic.toLowerCase())) score += 4
        })

        return score > 0 ? { ...item, score: Math.min(score / 10, 1), source: 'history' as RecommendationSource, reason: '基于您的搜索历史' } : null
      })
      .filter(Boolean) as RecommendationItem[]
      .sort((a, b) => b.score - a.score)
  }

  // 热门推荐
  const getPopular = (items: RecommendationItem[]): RecommendationItem[] => {
    if (!config.value.enableTrending) return []

    return items
      .map(item => ({ ...item, score: Math.random() * 0.4 + 0.6, source: 'popular' as RecommendationSource, reason: '热门推荐' }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
  }

  // 相似推荐
  const getSimilar = (items: RecommendationItem[], current: RecommendationItem): RecommendationItem[] => {
    if (!config.value.enableSimilar) return []

    return items
      .filter(item => item.id !== current.id)
      .map(item => ({
        ...item,
        score: calculateSimilarity(current.tags, item.tags),
        source: 'similar' as RecommendationSource,
        reason: '与当前内容相似'
      }))
      .filter(item => item.score > 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
  }

  // 个性化推荐
  const getPersonalized = (items: RecommendationItem[]): RecommendationItem[] => {
    if (!config.value.enablePersonalization) return []

    return items
      .map(item => {
        let score = 0

        const prefScore = userBehavior.value.preferences[item.id] || 0
        score += prefScore * 0.3

        const usageCount = userBehavior.value.usedTemplates.filter(id => id === item.id).length
        score += Math.min(usageCount * 0.2, 1)

        item.tags.forEach(tag => {
          if (userBehavior.value.searchedKeywords.includes(tag)) score += 0.3
        })

        return score > config.value.minScore ? { ...item, score, source: 'personalized' as RecommendationSource, reason: '根据您的使用习惯' } : null
      })
      .filter(Boolean) as RecommendationItem[]
      .sort((a, b) => b.score - a.score)
      .slice(0, config.value.maxItems)
  }

  // AI智能推荐
  const getAIRecommendations = (items: RecommendationItem[], context?: string): RecommendationItem[] => {
    if (!config.value.enableAI) return []

    // 基于上下文和用户偏好生成推荐
    const userPrefs = userBehavior.value.preferences
    const topPref = Object.entries(userPrefs).sort((a, b) => b[1] - a[1])[0]

    return items
      .map(item => {
        let score = 0.3 // 基础分数

        // 匹配用户偏好
        if (topPref && item.tags.includes(topPref[0])) {
          score += 0.4
        }

        // 匹配搜索关键词
        userBehavior.value.searchedKeywords.slice(-3).forEach(kw => {
          if (item.title.toLowerCase().includes(kw.toLowerCase())) score += 0.2
        })

        // 匹配最近创建的主题
        userBehavior.value.createdTopics.slice(-2).forEach(topic => {
          if (item.title.toLowerCase().includes(topic.toLowerCase())) score += 0.3
        })

        return { ...item, score, source: 'ai' as RecommendationSource, reason: 'AI智能推荐' }
      })
      .filter(item => item.score > 0.4)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
  }

  // 生成综合推荐
  const generateRecommendations = (items: RecommendationItem[], context?: string): RecommendationItem[] => {
    const results: RecommendationItem[] = []

    results.push(...getHistoryBased(items))
    results.push(...getPopular(items))
    results.push(...getPersonalized(items))

    if (context) {
      results.push(...getAIRecommendations(items, context))
    }

    // 去重合并
    const seen = new Set()
    const merged = results.filter(item => {
      if (seen.has(item.id)) return false
      seen.add(item.id)
      return true
    })

    recommendations.value = merged
      .sort((a, b) => b.score - a.score)
      .slice(0, config.value.maxItems)

    recentRecommendations.value = [...recommendations.value]
    return recommendations.value
  }

  // 相似推荐
  const recommendSimilar = (items: RecommendationItem[], current: RecommendationItem): RecommendationItem[] => {
    return getSimilar(items, current)
  }

  // 关键词推荐
  const recommendByKeyword = (items: RecommendationItem[], keyword: string): RecommendationItem[] => {
    const lower = keyword.toLowerCase()
    return items
      .filter(item =>
        item.title.toLowerCase().includes(lower) ||
        item.tags.some(t => t.toLowerCase().includes(lower))
      )
      .map(item => ({ ...item, score: 1, source: 'trending' as RecommendationSource, reason: `匹配"${keyword}"` }))
      .slice(0, config.value.maxItems)
  }

  // 保存/加载
  const saveBehavior = () => {
    try { localStorage.setItem('user_behavior', JSON.stringify(userBehavior.value)) } catch {}
  }

  const loadBehavior = () => {
    try {
      const stored = localStorage.getItem('user_behavior')
      if (stored) userBehavior.value = JSON.parse(stored)
    } catch {}
  }

  const clearBehavior = () => {
    userBehavior.value = { viewedTemplates: [], usedTemplates: [], searchedKeywords: [], createdTopics: [], exportedFormats: [], preferences: {}, sessionCount: 0, totalCreations: 0 }
    saveBehavior()
  }

  const stats = computed(() => ({
    views: userBehavior.value.viewedTemplates.length,
    uses: userBehavior.value.usedTemplates.length,
    searches: userBehavior.value.searchedKeywords.length,
    creations: userBehavior.value.totalCreations,
    recsCount: recommendations.value.length
  }))

  return {
    config, userBehavior, recommendations, recentRecommendations,
    trackView, trackUse, trackSearch, trackTopic, trackExport,
    generateRecommendations, recommendSimilar, recommendByKeyword,
    calculateSimilarity, clearBehavior, loadBehavior, saveBehavior, stats
  }
}

export default useEnhancedRecommendation
