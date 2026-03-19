// Page Transition Manager - 页面切换与过渡管理
import { ref, computed } from 'vue'

export interface TransitionConfig {
  enter: string
  exit: string
  duration: number
  easing: string
  delay: number
}

export interface PageTransition {
  fromPageId: string
  toPageId: string
  config: TransitionConfig
  status: 'idle' | 'transitioning' | 'complete'
}

export function usePageTransition() {
  // 全局过渡配置
  const globalConfig = ref<TransitionConfig>({
    enter: 'fade',
    exit: 'fade',
    duration: 300,
    easing: 'ease-in-out',
    delay: 0
  })

  // 页面特定配置
  const pageConfigs = ref<Map<string, TransitionConfig>>(new Map())

  // 当前过渡状态
  const currentTransition = ref<PageTransition | null>(null)

  // 过渡历史
  const transitionHistory = ref<PageTransition[]>([])

  // 可用过渡效果
  const availableTransitions = [
    { id: 'fade', name: '淡入淡出', nameEn: 'Fade' },
    { id: 'slide', name: '滑动', nameEn: 'Slide' },
    { id: 'zoom', name: '缩放', nameEn: 'Zoom' },
    { id: 'flip', name: '翻转', nameEn: 'Flip' },
    { id: 'none', name: '无', nameEn: 'None' }
  ]

  // 设置全局配置
  const setGlobalConfig = (config: Partial<TransitionConfig>) => {
    Object.assign(globalConfig.value, config)
  }

  // 设置页面特定配置
  const setPageConfig = (pageId: string, config: Partial<TransitionConfig>) => {
    const existing = pageConfigs.value.get(pageId)
    if (existing) {
      Object.assign(existing, config)
    } else {
      pageConfigs.value.set(pageId, { ...globalConfig.value, ...config })
    }
  }

  // 获取页面配置
  const getPageConfig = (pageId: string): TransitionConfig => {
    return pageConfigs.value.get(pageId) || { ...globalConfig.value }
  }

  // 执行过渡
  const executeTransition = async (fromPageId: string, toPageId: string): Promise<void> => {
    const config = getPageConfig(toPageId)

    currentTransition.value = {
      fromPageId,
      toPageId,
      config,
      status: 'transitioning'
    }

    // 模拟过渡动画
    await new Promise(resolve => setTimeout(resolve, config.duration))

    currentTransition.value.status = 'complete'

    // 记录历史
    transitionHistory.value.push({ ...currentTransition.value })

    // 限制历史数量
    if (transitionHistory.value.length > 50) {
      transitionHistory.value.shift()
    }

    // 重置状态
    setTimeout(() => {
      currentTransition.value = null
    }, 100)
  }

  // 生成CSS
  const generateTransitionCSS = (config: TransitionConfig): string => {
    return `
.${config.enter}-enter {
  animation: ${config.enter}In ${config.duration}ms ${config.easing};
}
.${config.exit}-exit {
  animation: ${config.exit}Out ${config.duration}ms ${config.easing};
}
`.trim()
  }

  // 统计
  const stats = computed(() => ({
    globalEnter: globalConfig.value.enter,
    globalExit: globalConfig.value.exit,
    duration: globalConfig.value.duration,
    pageConfigs: pageConfigs.value.size,
    historyCount: transitionHistory.value.length,
    isTransitioning: currentTransition.value?.status === 'transitioning'
  }))

  return {
    globalConfig,
    pageConfigs,
    currentTransition,
    transitionHistory,
    availableTransitions,
    setGlobalConfig,
    setPageConfig,
    getPageConfig,
    executeTransition,
    generateTransitionCSS,
    stats
  }
}

export default usePageTransition
