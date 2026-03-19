// Transition Effects - 幻灯片切换效果
import { ref, computed } from 'vue'

export type TransitionType =
  | 'none' | 'fade' | 'slide' | 'push' | 'cover' | 'reveal'
  | 'zoom' | 'flip' | 'rotate' | 'scale' | 'blur' | 'glitch'
  | 'cube' | 'concave' | 'convex' | 'ripple' | 'fold' | 'unfold'

export interface Transition {
  id: string
  name: string
  nameEn: string
  type: TransitionType
  category: 'simple' | 'slide' | '3d' | 'special'
  duration: number
  easing: string
  description: string
}

export interface TransitionPreset {
  id: string
  name: string
  nameEn: string
  enter: TransitionType
  exit: TransitionType
  duration: number
}

export interface TransitionSettings {
  enter: TransitionType
  exit: TransitionType
  duration: number
  autoAdvance: boolean
  autoAdvanceDelay: number
  clickToAdvance: boolean
  keyboardNav: boolean
}

export function useTransitionEffects() {
  // 切换效果列表
  const transitions = ref<Transition[]>([
    // 简单效果
    { id: 'none', name: '无', nameEn: 'None', type: 'none', category: 'simple', duration: 0, easing: 'ease', description: '无切换效果' },
    { id: 'fade', name: '淡入淡出', nameEn: 'Fade', type: 'fade', category: 'simple', duration: 500, easing: 'ease-in-out', description: '平滑的淡入淡出效果' },
    { id: 'blur', name: '模糊切换', nameEn: 'Blur', type: 'blur', category: 'simple', duration: 600, easing: 'ease-out', description: '模糊过渡效果' },

    // 滑动效果
    { id: 'slide', name: '滑动', nameEn: 'Slide', type: 'slide', category: 'slide', duration: 400, easing: 'ease-out', description: '平滑滑动切换' },
    { id: 'push', name: '推入', nameEn: 'Push', type: 'push', category: 'slide', duration: 400, easing: 'ease-out', description: '推入式切换' },
    { id: 'cover', name: '覆盖', nameEn: 'Cover', type: 'cover', category: 'slide', duration: 400, easing: 'ease-out', description: '新幻灯片覆盖旧幻灯片' },
    { id: 'reveal', name: '揭示', nameEn: 'Reveal', type: 'reveal', category: 'slide', duration: 400, easing: 'ease-out', description: '旧幻灯片被新幻灯片揭示' },

    // 3D效果
    { id: 'zoom', name: '缩放', nameEn: 'Zoom', type: 'zoom', category: '3d', duration: 500, easing: 'ease-out', description: '缩放过渡效果' },
    { id: 'flip', name: '翻转', nameEn: 'Flip', type: 'flip', category: '3d', duration: 600, easing: 'ease-in-out', description: '3D水平翻转效果' },
    { id: 'rotate', name: '旋转', nameEn: 'Rotate', type: 'rotate', category: '3d', duration: 500, easing: 'ease-out', description: '旋转过渡效果' },
    { id: 'scale', name: '缩放进出', nameEn: 'Scale', type: 'scale', category: '3d', duration: 500, easing: 'ease-out', description: '缩小进、放大出' },
    { id: 'cube', name: '立方体', nameEn: 'Cube', type: 'cube', category: '3d', duration: 700, easing: 'ease-in-out', description: '3D立方体旋转效果' },
    { id: 'concave', name: '凹面', nameEn: 'Concave', type: 'concave', category: '3d', duration: 600, easing: 'ease-in-out', description: '3D凹面效果' },
    { id: 'convex', name: '凸面', nameEn: 'Convex', type: 'convex', category: '3d', duration: 600, easing: 'ease-in-out', description: '3D凸面效果' },

    // 特殊效果
    { id: 'glitch', name: '故障', nameEn: 'Glitch', type: 'glitch', category: 'special', duration: 500, easing: 'linear', description: '故障艺术效果' },
    { id: 'ripple', name: '波纹', nameEn: 'Ripple', type: 'ripple', category: 'special', duration: 600, easing: 'ease-out', description: '波纹扩散效果' },
    { id: 'fold', name: '折叠', nameEn: 'Fold', type: 'fold', category: 'special', duration: 500, easing: 'ease-out', description: '折叠效果' },
    { id: 'unfold', name: '展开', nameEn: 'Unfold', type: 'unfold', category: 'special', duration: 500, easing: 'ease-out', description: '展开效果' }
  ])

  // 切换预设
  const presets = ref<TransitionPreset[]>([
    { id: 'preset_simple', name: '简洁', nameEn: 'Simple', enter: 'fade', exit: 'fade', duration: 500 },
    { id: 'preset_professional', name: '专业', nameEn: 'Professional', enter: 'slide', exit: 'slide', duration: 400 },
    { id: 'preset_modern', name: '现代', nameEn: 'Modern', enter: 'zoom', exit: 'zoom', duration: 500 },
    { id: 'preset_dynamic', name: '动感', nameEn: 'Dynamic', enter: 'push', exit: 'cover', duration: 350 },
    { id: 'preset_creative', name: '创意', nameEn: 'Creative', enter: 'glitch', exit: 'glitch', duration: 500 },
    { id: 'preset_3d', name: '3D效果', nameEn: '3D Effect', enter: 'flip', exit: 'flip', duration: 600 }
  ])

  // 切换设置
  const settings = ref<TransitionSettings>({
    enter: 'fade',
    exit: 'fade',
    duration: 500,
    autoAdvance: false,
    autoAdvanceDelay: 5000,
    clickToAdvance: true,
    keyboardNav: true
  })

  // 当前过渡状态
  const isTransitioning = ref(false)
  const currentTransition = ref<Transition | null>(null)

  // 获取分类效果
  const getTransitionsByCategory = computed(() => {
    const categories: Record<string, Transition[]> = {}
    transitions.value.forEach(t => {
      if (!categories[t.category]) {
        categories[t.category] = []
      }
      categories[t.category].push(t)
    })
    return categories
  })

  // 设置入场效果
  const setEnterTransition = (type: TransitionType) => {
    settings.value.enter = type
  }

  // 设置退场效果
  const setExitTransition = (type: TransitionType) => {
    settings.value.exit = type
  }

  // 应用预设
  const applyPreset = (presetId: string) => {
    const preset = presets.value.find(p => p.id === presetId)
    if (preset) {
      settings.value.enter = preset.enter
      settings.value.exit = preset.exit
      settings.value.duration = preset.duration
    }
  }

  // 获取过渡效果CSS
  const getTransitionCSS = (type: TransitionType, direction: 'enter' | 'exit'): string => {
    const baseCSS: Record<string, string> = {
      none: 'none',
      fade: `opacity ${settings.value.duration}ms ease-in-out`,
      blur: `filter blur ${settings.value.duration}ms ease-out`,
      slide: `transform translateX(${direction === 'enter' ? '100%' : '-100%'}) ${settings.value.duration}ms ease-out`,
      push: `transform translateX(${direction === 'enter' ? '100%' : '-100%'}) ${settings.value.duration}ms ease-out`,
      cover: `transform scale(1.2) ${settings.value.duration}ms ease-out`,
      reveal: `transform translateX(${direction === 'enter' ? '-100%' : '100%'}) ${settings.value.duration}ms ease-out`,
      zoom: `transform scale(${direction === 'enter' ? '0.8' : '1.2'}) ${settings.value.duration}ms ease-out`,
      flip: `transform rotateY(${direction === 'enter' ? '90deg' : '-90deg'}) ${settings.value.duration}ms ease-in-out`,
      rotate: `transform rotate(${direction === 'enter' ? '180deg' : '-180deg'}) ${settings.value.duration}ms ease-out`,
      scale: `transform scale(${direction === 'enter' ? '0' : '1.5'}) ${settings.value.duration}ms ease-out`,
      cube: `transform rotateY(${direction === 'enter' ? '90deg' : '-90deg'}) perspective(1000px) ${settings.value.duration}ms ease-in-out`,
      glitch: `filter hue-rotate ${settings.value.duration}ms linear`,
      ripple: `transform scale(0) ${settings.value.duration}ms ease-out, opacity ${settings.value.duration}ms ease-out`,
      fold: `transform perspective(1000px) rotateX(${direction === 'enter' ? '90deg' : '-90deg'}) ${settings.value.duration}ms ease-out`,
      unfold: `transform perspective(1000px) rotateX(${direction === 'enter' ? '-90deg' : '90deg'}) ${settings.value.duration}ms ease-out`
    }
    return baseCSS[type] || baseCSS.fade
  }

  // 触发起过渡
  const triggerTransition = async (): Promise<void> => {
    if (isTransitioning.value) return

    isTransitioning.value = true

    const enterTransition = transitions.value.find(t => t.type === settings.value.enter)
    currentTransition.value = enterTransition || null

    await new Promise(resolve => setTimeout(resolve, settings.value.duration))

    isTransitioning.value = false
  }

  // 播放过渡动画
  const playTransition = async (container: HTMLElement, type: TransitionType, direction: 'enter' | 'exit'): Promise<void> => {
    const css = getTransitionCSS(type, direction)

    container.style.transition = css
    container.style.transform = type === 'fade' ? 'opacity 0' : css

    await new Promise(resolve => setTimeout(resolve, settings.value.duration))
  }

  // 更新设置
  const updateSettings = (newSettings: Partial<TransitionSettings>) => {
    Object.assign(settings.value, newSettings)
  }

  // 获取效果选项
  const getTransitionOptions = computed(() =>
    transitions.value.map(t => ({ value: t.type, label: t.name }))
  )

  // 统计
  const stats = computed(() => ({
    totalTransitions: transitions.value.length,
    enterTransition: settings.value.enter,
    exitTransition: settings.value.exit,
    duration: settings.value.duration,
    isTransitioning: isTransitioning.value,
    autoAdvance: settings.value.autoAdvance
  }))

  return {
    transitions,
    presets,
    settings,
    isTransitioning,
    currentTransition,
    getTransitionsByCategory,
    setEnterTransition,
    setExitTransition,
    applyPreset,
    getTransitionCSS,
    triggerTransition,
    playTransition,
    updateSettings,
    getTransitionOptions,
    stats
  }
}

export default useTransitionEffects
