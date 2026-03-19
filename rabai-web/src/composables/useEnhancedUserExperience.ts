// Enhanced User Experience - 增强用户体验
import { ref, computed } from 'vue'

export type ExperienceLevel = 'new' | 'regular' | 'expert'

export interface UserProfile {
  id: string
  level: ExperienceLevel
  preferences: Record<string, any>
}

export function useEnhancedUserExperience() {
  // 用户档案
  const profile = ref<UserProfile>({
    id: '',
    level: 'regular',
    preferences: {}
  })

  // 使用统计
  const usage = ref({
    visits: 0,
    creations: 0,
    exports: 0,
    shares: 0,
    featuresUsed: [] as string[]
  })

  // 用户等级
  const level = computed<ExperienceLevel>(() => {
    const score = calculateLevelScore()
    if (score < 10) return 'new'
    if (score < 50) return 'regular'
    return 'expert'
  })

  // 计算等级分数
  const calculateLevelScore = () => {
    let score = 0
    score += usage.value.visits * 1
    score += usage.value.creations * 5
    score += usage.value.exports * 2
    score += usage.value.shares * 3
    score += usage.value.featuresUsed.length * 2
    return score
  }

  // 记录使用
  const recordUsage = (type: 'visit' | 'create' | 'export' | 'share' | 'feature', value?: string) => {
    switch (type) {
      case 'visit':
        usage.value.visits++
        break
      case 'create':
        usage.value.creations++
        break
      case 'export':
        usage.value.exports++
        break
      case 'share':
        usage.value.shares++
        break
      case 'feature':
        if (value && !usage.value.featuresUsed.includes(value)) {
          usage.value.featuresUsed.push(value)
        }
        break
    }

    // 更新等级
    profile.value.level = level.value
  }

  // 获取个性化建议
  const getSuggestions = computed(() => {
    const suggestions: string[] = []

    if (usage.value.creations < 3) {
      suggestions.push('创建您的第一个PPT开始体验')
    }

    if (usage.value.exports === 0) {
      suggestions.push('尝试导出您的作品')
    }

    if (!usage.value.featuresUsed.includes('ai')) {
      suggestions.push('尝试使用AI生成功能')
    }

    if (!usage.value.featuresUsed.includes('template')) {
      suggestions.push('浏览模板市场寻找灵感')
    }

    return suggestions
  })

  // 获取功能推荐
  const recommendedFeatures = computed(() => {
    const recommended: { id: string; name: string; reason: string }[] = []

    if (level.value === 'new') {
      recommended.push({ id: 'template', name: '模板市场', reason: '快速创建PPT' })
      recommended.push({ id: 'ai', name: 'AI生成', reason: 'AI辅助创建' })
    }

    if (level.value === 'regular') {
      recommended.push({ id: 'batch', name: '批量操作', reason: '提高效率' })
      recommended.push({ id: 'brand', name: '品牌模板', reason: '统一形象' })
    }

    if (level.value === 'expert') {
      recommended.push({ id: 'api', name: 'API接入', reason: '高级功能' })
      recommended.push({ id: 'team', name: '团队协作', reason: '多人编辑' })
    }

    return recommended
  })

  // 保存偏好
  const savePreference = (key: string, value: any) => {
    profile.value.preferences[key] = value
    localStorage.setItem('user_prefs', JSON.stringify(profile.value))
  }

  // 加载偏好
  const loadPreferences = () => {
    const stored = localStorage.getItem('user_prefs')
    if (stored) {
      try {
        profile.value = { ...profile.value, ...JSON.parse(stored) }
      } catch { /* ignore */ }
    }
  }

  // 重置数据
  const reset = () => {
    usage.value = { visits: 0, creations: 0, exports: 0, shares: 0, featuresUsed: [] }
    profile.value.level = 'new'
  }

  // 统计
  const stats = computed(() => ({
    level: level.value,
    score: calculateLevelScore(),
    totalActions: usage.value.visits + usage.value.creations + usage.value.exports + usage.value.shares,
    featuresUsed: usage.value.featuresUsed.length
  }))

  return {
    profile,
    usage,
    level,
    recordUsage,
    getSuggestions,
    recommendedFeatures,
    savePreference,
    loadPreferences,
    reset,
    stats
  }
}

export default useEnhancedUserExperience
