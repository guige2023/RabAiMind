// User Experience Optimizer - 用户体验深度优化
import { ref, computed, watch, onMounted } from 'vue'

export type OptimizationArea = 'performance' | 'accessibility' | 'usability' | 'engagement' | 'retention'

export interface ExperienceMetric {
  area: OptimizationArea
  score: number
  weight: number
  recommendations: string[]
}

export interface UserJourney {
  step: string
  completed: boolean
  timeSpent: number
  dropOff?: boolean
}

export interface FunnelAnalysis {
  stage: string
  users: number
  conversionRate: number
}

export function useUserExperienceOptimizer() {
  // 体验指标
  const metrics = ref<ExperienceMetric[]>([
    { area: 'performance', score: 85, weight: 0.3, recommendations: [] },
    { area: 'accessibility', score: 78, weight: 0.2, recommendations: [] },
    { area: 'usability', score: 82, weight: 0.25, recommendations: [] },
    { area: 'engagement', score: 75, weight: 0.15, recommendations: [] },
    { area: 'retention', score: 70, weight: 0.1, recommendations: [] }
  ])

  // 用户旅程
  const userJourney = ref<UserJourney[]>([
    { step: 'landing', completed: true, timeSpent: 0 },
    { step: 'template_selection', completed: false, timeSpent: 0 },
    { step: 'content_input', completed: false, timeSpent: 0 },
    { step: 'generation', completed: false, timeSpent: 0 },
    { step: 'editing', completed: false, timeSpent: 0 },
    { step: 'export', completed: false, timeSpent: 0 }
  ])

  // 漏斗分析
  const funnelAnalysis = ref<FunnelAnalysis[]>([
    { stage: '访问', users: 1000, conversionRate: 100 },
    { stage: '模板选择', users: 650, conversionRate: 65 },
    { stage: '内容输入', users: 480, conversionRate: 73.8 },
    { stage: '生成完成', users: 420, conversionRate: 87.5 },
    { stage: '导出', users: 350, conversionRate: 83.3 }
  ])

  // 优化建议
  const recommendations = ref<string[]>([])

  // 性能优化
  const optimizePerformance = () => {
    const perfMetric = metrics.value.find(m => m.area === 'performance')
    if (!perfMetric) return

    const newRecommendations: string[] = []

    // 检测性能指标
    if ('performance' in window) {
      const timing = (window as any).performance.timing
      const loadTime = timing.loadEventEnd - timing.navigationStart

      if (loadTime > 3000) {
        newRecommendations.push('页面加载时间较长，建议优化资源')
      }
    }

    // 检查图片优化
    const images = document.querySelectorAll('img')
    let unoptimizedImages = 0
    images.forEach(img => {
      if (!img.loading && !img.src.includes('webp')) {
        unoptimizedImages++
      }
    })

    if (unoptimizedImages > 5) {
      newRecommendations.push(`检测到${unoptimizedImages}张未优化的图片，建议使用WebP格式`)
    }

    perfMetric.recommendations = newRecommendations
    perfMetric.score = Math.max(0, 100 - newRecommendations.length * 5)
  }

  // 无障碍优化
  const optimizeAccessibility = () => {
    const a11yMetric = metrics.value.find(m => m.area === 'accessibility')
    if (!a11yMetric) return

    const newRecommendations: string[] = []

    // 检查图片alt属性
    const images = document.querySelectorAll('img')
    let missingAlt = 0
    images.forEach(img => {
      if (!img.alt) missingAlt++
    })

    if (missingAlt > 0) {
      newRecommendations.push(`${missingAlt}张图片缺少alt属性，影响无障碍访问`)
    }

    // 检查表单标签
    const inputs = document.querySelectorAll('input')
    let unlabeledInputs = 0
    inputs.forEach(input => {
      if (!input.id || !document.querySelector(`label[for="${input.id}"]`)) {
        unlabeledInputs++
      }
    })

    if (unlabeledInputs > 0) {
      newRecommendations.push(`${unlabeledInputs}个输入框缺少标签`)
    }

    // 检查颜色对比度
    newRecommendations.push('建议检查文字与背景的颜色对比度是否足够')

    a11yMetric.recommendations = newRecommendations
    a11yMetric.score = Math.max(0, 100 - newRecommendations.length * 8)
  }

  // 可用性优化
  const optimizeUsability = () => {
    const usageMetric = metrics.value.find(m => m.area === 'usability')
    if (!usageMetric) return

    const newRecommendations: string[] = []

    // 检查按钮大小
    const buttons = document.querySelectorAll('button')
    let smallButtons = 0
    buttons.forEach(btn => {
      const rect = btn.getBoundingClientRect()
      if (rect.width < 44 || rect.height < 44) {
        smallButtons++
      }
    })

    if (smallButtons > 0) {
      newRecommendations.push(`${smallButtons}个按钮尺寸小于44px，建议增大触摸区域`)
    }

    // 检查输入框提示
    const inputs = document.querySelectorAll('input')
    let missingPlaceholders = 0
    inputs.forEach(input => {
      if (!input.placeholder && !input.getAttribute('aria-label')) {
        missingPlaceholders++
      }
    })

    if (missingPlaceholders > 0) {
      newRecommendations.push(`${missingPlaceholders}个输入框缺少提示文字`)
    }

    usageMetric.recommendations = newRecommendations
    usageMetric.score = Math.max(0, 100 - newRecommendations.length * 10)
  }

  // 参与度优化
  const optimizeEngagement = () => {
    const engageMetric = metrics.value.find(m => m.area === 'engagement')
    if (!engageMetric) return

    const newRecommendations: string[] = []

    // 基于漏斗分析
    const maxDropOff = Math.max(...funnelAnalysis.value.map(f =>
      f.conversionRate < 100 ? 100 - f.conversionRate : 0
    ))

    if (maxDropOff > 30) {
      newRecommendations.push('检测到较大用户流失，建议简化转化流程')
    }

    engageMetric.recommendations = newRecommendations
    engageMetric.score = Math.max(0, 100 - newRecommendations.length * 10)
  }

  // 留存优化
  const optimizeRetention = () => {
    const retentionMetric = metrics.value.find(m => m.area === 'retention')
    if (!retentionMetric) return

    const newRecommendations: string[] = []

    // 检查用户引导
    const onboardingSteps = userJourney.value.filter(j => !j.completed)
    if (onboardingSteps.length > 3) {
      newRecommendations.push('用户引导流程较长，建议精简步骤')
    }

    // 检查流失点
    const dropOffs = userJourney.value.filter(j => j.dropOff)
    if (dropOffs.length > 0) {
      newRecommendations.push(`检测到${dropOffs.length}个可能的流失点`)
    }

    retentionMetric.recommendations = newRecommendations
    retentionMetric.score = Math.max(0, 100 - newRecommendations.length * 10)
  }

  // 运行所有优化
  const runAllOptimizations = () => {
    optimizePerformance()
    optimizeAccessibility()
    optimizeUsability()
    optimizeEngagement()
    optimizeRetention()

    // 收集所有建议
    recommendations.value = metrics.value.flatMap(m => m.recommendations)
  }

  // 计算总体得分
  const overallScore = computed(() => {
    let total = 0
    let weightTotal = 0

    metrics.value.forEach(m => {
      total += m.score * m.weight
      weightTotal += m.weight
    })

    return Math.round(total / weightTotal)
  })

  // 获取需要改进的领域
  const areasNeedingImprovement = computed(() => {
    return metrics.value
      .filter(m => m.score < 80)
      .sort((a, b) => a.score - b.score)
      .map(m => m.area)
  })

  // 更新用户旅程
  const updateJourney = (step: string, completed: boolean) => {
    const journeyStep = userJourney.value.find(j => j.step === step)
    if (journeyStep) {
      journeyStep.completed = completed
      if (completed) {
        journeyStep.dropOff = false
      }
    }
  }

  // 记录停留时间
  const recordTimeSpent = (step: string, time: number) => {
    const journeyStep = userJourney.value.find(j => j.step === step)
    if (journeyStep) {
      journeyStep.timeSpent += time
    }
  }

  // 标记流失
  const markDropOff = (step: string) => {
    const journeyStep = userJourney.value.find(j => j.step === step)
    if (journeyStep) {
      journeyStep.dropOff = true
    }
  }

  // 获取旅程进度
  const journeyProgress = computed(() => {
    const completed = userJourney.value.filter(j => j.completed).length
    return Math.round((completed / userJourney.value.length) * 100)
  })

  // 统计
  const stats = computed(() => ({
    overallScore: overallScore.value,
    metrics: metrics.value.map(m => ({ area: m.area, score: m.score })),
    recommendations: recommendations.value.length,
    journeyProgress: journeyProgress.value,
    areasNeedingImprovement: areasNeedingImprovement.value
  }))

  // 定期运行优化
  onMounted(() => {
    runAllOptimizations()

    // 定期检查
    setInterval(runAllOptimizations, 60000)
  })

  return {
    metrics,
    userJourney,
    funnelAnalysis,
    recommendations,
    overallScore,
    areasNeedingImprovement,
    journeyProgress,
    stats,
    runAllOptimizations,
    optimizePerformance,
    optimizeAccessibility,
    optimizeUsability,
    optimizeEngagement,
    optimizeRetention,
    updateJourney,
    recordTimeSpent,
    markDropOff
  }
}

export default useUserExperienceOptimizer
