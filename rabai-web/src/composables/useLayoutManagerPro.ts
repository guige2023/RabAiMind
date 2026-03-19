// Layout Manager Pro - 布局管理器深度增强
import { ref, computed } from 'vue'

export type AdvancedLayoutType = 'grid' | 'list' | 'masonry' | 'carousel' | 'kanban' | 'timeline' | 'spiral' | 'zigzag' | 'mosaic' | 'scattered'

export interface AdvancedLayoutConfig {
  type: AdvancedLayoutType
  columns: number
  gap: number
  alignment: 'start' | 'center' | 'end' | 'stretch'
  justify: 'start' | 'center' | 'end' | 'space-between' | 'space-around'
  direction: 'row' | 'column'
  reverse: boolean
  wrap: boolean
}

export interface LayoutAnimation {
  enabled: boolean
  duration: number
  stagger: number
  easing: string
}

export interface ResponsiveLayout {
  xs?: Partial<AdvancedLayoutConfig>
  sm?: Partial<AdvancedLayoutConfig>
  md?: Partial<AdvancedLayoutConfig>
  lg?: Partial<AdvancedLayoutConfig>
  xl?: Partial<AdvancedLayoutConfig>
}

export interface LayoutPreset {
  id: string
  name: string
  icon: string
  config: AdvancedLayoutConfig
}

export const layoutPresets: LayoutPreset[] = [
  {
    id: 'grid-default',
    name: '网格',
    icon: '⊞',
    config: { type: 'grid', columns: 4, gap: 16, alignment: 'start', justify: 'start', direction: 'row', reverse: false, wrap: true }
  },
  {
    id: 'grid-dense',
    name: '紧凑网格',
    icon: '▦',
    config: { type: 'grid', columns: 6, gap: 8, alignment: 'start', justify: 'start', direction: 'row', reverse: false, wrap: true }
  },
  {
    id: 'masonry',
    name: '瀑布流',
    icon: '♢',
    config: { type: 'masonry', columns: 3, gap: 16, alignment: 'start', justify: 'start', direction: 'row', reverse: false, wrap: true }
  },
  {
    id: 'carousel',
    name: '轮播',
    icon: '◐',
    config: { type: 'carousel', columns: 1, gap: 24, alignment: 'center', justify: 'center', direction: 'row', reverse: false, wrap: false }
  },
  {
    id: 'kanban',
    name: '看板',
    icon: '▤',
    config: { type: 'kanban', columns: 3, gap: 12, alignment: 'stretch', justify: 'start', direction: 'row', reverse: false, wrap: false }
  },
  {
    id: 'timeline',
    name: '时间线',
    icon: '⊚',
    config: { type: 'timeline', columns: 1, gap: 24, alignment: 'center', justify: 'start', direction: 'column', reverse: false, wrap: false }
  },
  {
    id: 'zigzag',
    name: '之字形',
    icon: '⚡',
    config: { type: 'zigzag', columns: 2, gap: 20, alignment: 'center', justify: 'center', direction: 'row', reverse: false, wrap: true }
  },
  {
    id: 'mosaic',
    name: '马赛克',
    icon: '▩',
    config: { type: 'mosaic', columns: 3, gap: 4, alignment: 'stretch', justify: 'start', direction: 'row', reverse: false, wrap: true }
  }
]

export function useLayoutManagerPro() {
  // 配置
  const config = ref<AdvancedLayoutConfig>({
    type: 'grid',
    columns: 4,
    gap: 16,
    alignment: 'start',
    justify: 'start',
    direction: 'row',
    reverse: false,
    wrap: true
  })

  // 动画设置
  const animation = ref<LayoutAnimation>({
    enabled: true,
    duration: 300,
    stagger: 50,
    easing: 'ease-out'
  })

  // 响应式配置
  const responsive = ref<ResponsiveLayout>({
    xs: { columns: 1 },
    sm: { columns: 2 },
    md: { columns: 3 },
    lg: { columns: 4 },
    xl: { columns: 5 }
  })

  // 当前断点
  const currentBreakpoint = ref<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md')

  // 检测断点
  const detectBreakpoint = () => {
    const width = window.innerWidth
    if (width < 480) currentBreakpoint.value = 'xs'
    else if (width < 768) currentBreakpoint.value = 'sm'
    else if (width < 1024) currentBreakpoint.value = 'md'
    else if (width < 1280) currentBreakpoint.value = 'lg'
    else currentBreakpoint.value = 'xl'
  }

  // 获取当前配置
  const currentConfig = computed(() => {
    const bp = currentBreakpoint.value
    const bpConfig = responsive.value[bp] || {}

    return {
      ...config.value,
      ...bpConfig
    }
  })

  // 切换布局类型
  const setType = (type: AdvancedLayoutType) => {
    config.value.type = type
  }

  // 设置列数
  const setColumns = (cols: number) => {
    config.value.columns = Math.max(1, Math.min(12, cols))
  }

  // 设置间距
  const setGap = (gap: number) => {
    config.value.gap = Math.max(0, Math.min(48, gap))
  }

  // 设置对齐
  const setAlignment = (alignment: AdvancedLayoutConfig['alignment']) => {
    config.value.alignment = alignment
  }

  // 设置排列
  const setJustify = (justify: AdvancedLayoutConfig['justify']) => {
    config.value.justify = justify
  }

  // 应用预设
  const applyPreset = (presetId: string) => {
    const preset = layoutPresets.find(p => p.id === presetId)
    if (preset) {
      config.value = { ...preset.config }
    }
  }

  // 切换方向
  const toggleDirection = () => {
    config.value.direction = config.value.direction === 'row' ? 'column' : 'row'
  }

  // 切换反转
  const toggleReverse = () => {
    config.value.reverse = !config.value.reverse
  }

  // 生成CSS样式
  const layoutStyles = computed(() => {
    const cfg = currentConfig.value

    const baseStyles: Record<string, any> = {
      display: 'flex',
      flexDirection: cfg.reverse ? (cfg.direction === 'row' ? 'row-reverse' : 'column-reverse') : cfg.direction,
      gap: `${cfg.gap}px`,
      alignItems: cfg.alignment === 'stretch' ? 'stretch' : cfg.alignment,
      justifyContent: cfg.justify,
      flexWrap: cfg.wrap ? 'wrap' : 'nowrap'
    }

    switch (cfg.type) {
      case 'grid':
        return {
          ...baseStyles,
          display: 'grid',
          gridTemplateColumns: `repeat(${cfg.columns}, 1fr)`
        }

      case 'masonry':
        return {
          ...baseStyles,
          display: 'block',
          columnCount: cfg.columns,
          columnGap: `${cfg.gap}px`
        }

      case 'carousel':
        return {
          ...baseStyles,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory'
        }

      case 'kanban':
        return {
          ...baseStyles,
          display: 'flex',
          height: '100%'
        }

      case 'timeline':
        return {
          ...baseStyles,
          position: 'relative',
          paddingLeft: '40px'
        }

      case 'zigzag':
        return {
          ...baseStyles,
          display: 'grid',
          gridTemplateColumns: `repeat(${cfg.columns}, 1fr)`
        }

      case 'mosaic':
        return {
          ...baseStyles,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gridAutoRows: '100px'
        }

      default:
        return baseStyles
    }
  })

  // 动画样式
  const animationStyles = computed(() => {
    if (!animation.value.enabled) return {}

    return {
      transition: `all ${animation.value.duration}ms ${animation.value.easing}`
    }
  })

  // 交错动画延迟
  const getStaggerDelay = (index: number) => {
    return animation.value.enabled ? index * animation.value.stagger : 0
  }

  // 统计
  const stats = computed(() => ({
    type: config.value.type,
    columns: currentConfig.value.columns,
    gap: config.value.gap,
    breakpoint: currentBreakpoint.value,
    presets: layoutPresets.length,
    animation: animation.value.enabled
  }))

  // 初始化
  detectBreakpoint()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', detectBreakpoint)
  }

  return {
    config,
    animation,
    responsive,
    currentBreakpoint,
    currentConfig,
    layoutStyles,
    animationStyles,
    layoutPresets,
    stats,
    setType,
    setColumns,
    setGap,
    setAlignment,
    setJustify,
    applyPreset,
    toggleDirection,
    toggleReverse,
    getStaggerDelay,
    detectBreakpoint
  }
}

export default useLayoutManagerPro
