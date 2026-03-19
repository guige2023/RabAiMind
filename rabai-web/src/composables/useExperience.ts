// useExperience.ts - 体验统一模块
// 合并所有体验相关功能
import { ref, computed } from 'vue'

export interface ExperienceConfig {
  animations: boolean
  transitions: boolean
  feedback: boolean
  gestures: boolean
}

export interface InteractionMetrics {
  clicks: number
  hovers: number
  inputs: number
  navigations: number
}

export function useExperience() {
  // 配置
  const config = ref<ExperienceConfig>({
    animations: true,
    transitions: true,
    feedback: true,
    gestures: true
  })

  // 指标
  const metrics = ref<InteractionMetrics>({
    clicks: 0,
    hovers: 0,
    inputs: 0,
    navigations: 0
  })

  // 记录点击
  const trackClick = () => {
    metrics.value.clicks++
  }

  // 记录悬停
  const trackHover = () => {
    metrics.value.hovers++
  }

  // 记录输入
  const trackInput = () => {
    metrics.value.inputs++
  }

  // 记录导航
  const trackNavigation = () => {
    metrics.value.navigations++
  }

  // 更新配置
  const updateConfig = (updates: Partial<ExperienceConfig>) => {
    Object.assign(config.value, updates)
  }

  // 总交互数
  const totalInteractions = computed(() => {
    return metrics.value.clicks + metrics.value.hovers + metrics.value.inputs + metrics.value.navigations
  })

  return {
    config,
    metrics,
    trackClick,
    trackHover,
    trackInput,
    trackNavigation,
    updateConfig,
    totalInteractions
  }
}

export default useExperience
