// Page Layout Pro - 页面布局深度优化
import { ref, computed, onMounted, onUnmounted } from 'vue'

export type LayoutType = 'grid' | 'list' | 'masonry' | 'carousel' | 'split' | 'stacked'
export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

export interface LayoutConfig {
  type: LayoutType
  columns: Record<Breakpoint, number>
  gap: number
  responsive: boolean
  fluid: boolean
  alignment: 'start' | 'center' | 'end' | 'stretch'
}

export interface ResponsiveBreakpoint {
  breakpoint: Breakpoint
  width: number
  columns: number
}

export function usePageLayoutPro() {
  // 配置
  const config = ref<LayoutConfig>({
    type: 'grid',
    columns: { xs: 1, sm: 2, md: 3, lg: 4, xl: 5, xxl: 6 },
    gap: 16,
    responsive: true,
    fluid: true,
    alignment: 'start'
  })

  // 当前响应式状态
  const current = ref<ResponsiveBreakpoint>({
    breakpoint: 'md',
    width: 1024,
    columns: 3
  })

  // 布局状态
  const state = ref({
    sidebarOpen: true,
    sidebarWidth: 280,
    headerHeight: 64,
    footerHeight: 60,
    contentMaxWidth: 1200
  })

  // 断点配置
  const breakpoints: Record<Breakpoint, number> = {
    xs: 0, sm: 480, md: 768, lg: 1024, xl: 1280, xxl: 1536
  }

  // 检测断点
  const detectBreakpoint = (): Breakpoint => {
    const width = window.innerWidth
    if (width >= breakpoints.xxl) return 'xxl'
    if (width >= breakpoints.xl) return 'xl'
    if (width >= breakpoints.lg) return 'lg'
    if (width >= breakpoints.md) return 'md'
    if (width >= breakpoints.sm) return 'sm'
    return 'xs'
  }

  // 更新响应式
  const updateResponsive = () => {
    const width = window.innerWidth
    const breakpoint = detectBreakpoint()

    current.value = {
      breakpoint,
      width,
      columns: config.value.columns[breakpoint]
    }
  }

  // 布局类型切换
  const setLayoutType = (type: LayoutType) => {
    config.value.type = type
  }

  // 设置列数
  const setColumns = (columns: Partial<Record<Breakpoint, number>>) => {
    config.value.columns = { ...config.value.columns, ...columns }
  }

  // 切换侧边栏
  const toggleSidebar = () => {
    state.value.sidebarOpen = !state.value.sidebarOpen
  }

  // 网格样式
  const gridStyle = computed(() => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${current.value.columns}, 1fr)`,
    gap: `${config.value.gap}px`
  }))

  // 流式布局
  const fluidStyle = computed(() => ({
    width: config.value.fluid ? '100%' : 'auto',
    maxWidth: config.value.fluid ? 'none' : `${state.value.contentMaxWidth}px`,
    margin: config.value.fluid ? '0 auto' : '0'
  }))

  // 监听
  let resizeObserver: ResizeObserver | null = null

  onMounted(() => {
    updateResponsive()
    window.addEventListener('resize', updateResponsive)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', updateResponsive)
    resizeObserver?.disconnect()
  })

  return {
    config,
    current,
    state,
    breakpoints,
    detectBreakpoint,
    updateResponsive,
    setLayoutType,
    setColumns,
    toggleSidebar,
    gridStyle,
    fluidStyle
  }
}

export default usePageLayoutPro
