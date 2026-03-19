// Page Layout Optimizer - 页面布局优化
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'

export type LayoutType = 'grid' | 'list' | 'masonry' | 'carousel' | 'split'
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

export interface LayoutConfig {
  type: LayoutType
  columns: Record<Breakpoint, number>
  gap: number
  responsive: boolean
  fluid: boolean
}

export interface ResponsiveConfig {
  breakpoint: Breakpoint
  width: number
}

export const defaultLayoutConfig: LayoutConfig = {
  type: 'grid',
  columns: { xs: 1, sm: 2, md: 3, lg: 4, xl: 5, xxl: 6 },
  gap: 16,
  responsive: true,
  fluid: true
}

export const breakpoints: Record<Breakpoint, number> = {
  xs: 0,
  sm: 480,
  md: 768,
  lg: 1024,
  xl: 1280,
  xxl: 1536
}

export function usePageLayoutOptimizer() {
  // 配置
  const config = ref<LayoutConfig>({ ...defaultLayoutConfig })

  // 当前响应式状态
  const responsive = ref<ResponsiveConfig>({
    breakpoint: 'md',
    width: window.innerWidth
  })

  // 布局状态
  const state = ref({
    isSidebarOpen: true,
    sidebarWidth: 280,
    headerHeight: 64,
    footerHeight: 60
  })

  // 检测当前断点
  const detectBreakpoint = (): Breakpoint => {
    const width = window.innerWidth
    if (width >= breakpoints.xxl) return 'xxl'
    if (width >= breakpoints.xl) return 'xl'
    if (width >= breakpoints.lg) return 'lg'
    if (width >= breakpoints.md) return 'md'
    if (width >= breakpoints.sm) return 'sm'
    return 'xs'
  }

  // 获取当前列数
  const currentColumns = computed(() => {
    return config.value.columns[responsive.value.breakpoint]
  })

  // 更新响应式状态
  const updateResponsive = () => {
    responsive.value.width = window.innerWidth
    responsive.value.breakpoint = detectBreakpoint()
  }

  // 监听窗口大小变化
  let resizeObserver: ResizeObserver | null = null

  const initResponsive = () => {
    updateResponsive()
    window.addEventListener('resize', updateResponsive)

    // 使用 ResizeObserver 监听特定元素
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateResponsive()
      })
    }
  }

  const cleanupResponsive = () => {
    window.removeEventListener('resize', updateResponsive)
    if (resizeObserver) {
      resizeObserver.disconnect()
    }
  }

  // 设置布局类型
  const setLayoutType = (type: LayoutType) => {
    config.value.type = type
  }

  // 设置列数
  const setColumns = (columns: Partial<Record<Breakpoint, number>>) => {
    config.value.columns = { ...config.value.columns, ...columns }
  }

  // 设置间距
  const setGap = (gap: number) => {
    config.value.gap = gap
  }

  // 切换侧边栏
  const toggleSidebar = () => {
    state.value.isSidebarOpen = !state.value.isSidebarOpen
  }

  // 设置侧边栏宽度
  const setSidebarWidth = (width: number) => {
    state.value.sidebarWidth = Math.max(200, Math.min(400, width))
  }

  // 生成网格样式
  const gridStyle = computed(() => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${currentColumns.value}, 1fr)`,
    gap: `${config.value.gap}px`
  }))

  // 生成流式布局样式
  const fluidStyle = computed(() => ({
    width: config.value.fluid ? '100%' : 'auto',
    maxWidth: config.value.fluid ? 'none' : `${responsive.value.width}px`,
    margin: config.value.fluid ? '0 auto' : '0'
  }))

  // 切换响应式
  const toggleResponsive = () => {
    config.value.responsive = !config.value.responsive
  }

  // 切换流式布局
  const toggleFluid = () => {
    config.value.fluid = !config.value.fluid
  }

  // 保存配置
  const saveConfig = () => {
    localStorage.setItem('layout_config', JSON.stringify(config.value))
  }

  // 加载配置
  const loadConfig = () => {
    try {
      const stored = localStorage.getItem('layout_config')
      if (stored) {
        config.value = { ...config.value, ...JSON.parse(stored) }
      }
    } catch { /* ignore */ }
  }

  onMounted(() => {
    loadConfig()
    initResponsive()
  })

  onUnmounted(() => {
    cleanupResponsive()
  })

  return {
    config,
    responsive,
    state,
    currentColumns,
    gridStyle,
    fluidStyle,
    setLayoutType,
    setColumns,
    setGap,
    toggleSidebar,
    setSidebarWidth,
    toggleResponsive,
    toggleFluid,
    saveConfig,
    loadConfig,
    detectBreakpoint
  }
}

export default usePageLayoutOptimizer
