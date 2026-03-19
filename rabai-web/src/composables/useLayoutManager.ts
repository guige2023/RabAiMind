// Layout Manager - 布局管理器
import { ref, computed, watch } from 'vue'

export type LayoutType = 'grid' | 'list' | 'masonry' | 'carousel' | 'kanban' | 'timeline' | 'gallery'
export type GridSize = 'small' | 'medium' | 'large' | 'xlarge'
export type ResponsiveBreakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl'

export interface LayoutConfig {
  type: LayoutType
  gridSize: GridSize
  gap: number
  columns: number
  rows?: number
  autoFill: boolean
  responsive: boolean
}

export interface LayoutBreakpoint {
  breakpoint: ResponsiveBreakpoint
  minWidth: number
  columns: number
  gridSize: GridSize
}

export interface LayoutItem {
  id: string
  x?: number
  y?: number
  w?: number
  h?: number
  minW?: number
  minH?: number
  maxW?: number
  maxH?: number
  fixed?: boolean
}

export const defaultLayoutConfig: LayoutConfig = {
  type: 'grid',
  gridSize: 'medium',
  gap: 16,
  columns: 4,
  rows: 0,
  autoFill: true,
  responsive: true
}

export const breakpoints: LayoutBreakpoint[] = [
  { breakpoint: 'xs', minWidth: 0, columns: 1, gridSize: 'small' },
  { breakpoint: 'sm', minWidth: 480, columns: 2, gridSize: 'small' },
  { breakpoint: 'md', minWidth: 768, columns: 3, gridSize: 'medium' },
  { breakpoint: 'lg', minWidth: 1024, columns: 4, gridSize: 'medium' },
  { breakpoint: 'xl', minWidth: 1280, columns: 5, gridSize: 'large' },
  { breakpoint: 'xxl', minWidth: 1536, columns: 6, gridSize: 'xlarge' }
]

export const gridSizeMap: Record<GridSize, string> = {
  small: '200px',
  medium: '280px',
  large: '360px',
  xlarge: '450px'
}

export function useLayoutManager() {
  const config = ref<LayoutConfig>({ ...defaultLayoutConfig })
  const items = ref<LayoutItem[]>([])
  const currentBreakpoint = ref<ResponsiveBreakpoint>('md')
  const isDragging = ref(false)
  const draggedItem = ref<string | null>(null)

  // 计算网格列数
  const columns = computed(() => {
    if (!config.value.responsive) {
      return config.value.columns
    }

    const bp = breakpoints.find(b => currentBreakpoint.value === b.breakpoint)
    return bp?.columns || config.value.columns
  })

  // 计算网格尺寸
  const gridSize = computed(() => {
    if (!config.value.responsive) {
      return gridSizeMap[config.value.gridSize]
    }

    const bp = breakpoints.find(b => currentBreakpoint.value === b.breakpoint)
    return gridSizeMap[bp?.gridSize || config.value.gridSize]
  })

  // 切换布局类型
  const setLayoutType = (type: LayoutType) => {
    config.value.type = type
  }

  // 切换网格大小
  const setGridSize = (size: GridSize) => {
    config.value.gridSize = size
  }

  // 设置列数
  const setColumns = (cols: number) => {
    config.value.columns = Math.max(1, Math.min(12, cols))
  }

  // 设置间距
  const setGap = (gap: number) => {
    config.value.gap = Math.max(0, Math.min(48, gap))
  }

  // 检测当前断点
  const detectBreakpoint = () => {
    const width = window.innerWidth

    for (let i = breakpoints.length - 1; i >= 0; i--) {
      if (width >= breakpoints[i].minWidth) {
        currentBreakpoint.value = breakpoints[i].breakpoint
        break
      }
    }
  }

  // 初始化断点监听
  const initBreakpointListener = () => {
    detectBreakpoint()
    window.addEventListener('resize', detectBreakpoint)
  }

  // 移除断点监听
  const removeBreakpointListener = () => {
    window.removeEventListener('resize', detectBreakpoint)
  }

  // 添加布局项
  const addItem = (item: LayoutItem) => {
    items.value.push(item)
  }

  // 移除布局项
  const removeItem = (id: string) => {
    items.value = items.value.filter(item => item.id !== id)
  }

  // 更新布局项
  const updateItem = (id: string, updates: Partial<LayoutItem>) => {
    const index = items.value.findIndex(item => item.id === id)
    if (index !== -1) {
      items.value[index] = { ...items.value[index], ...updates }
    }
  }

  // 拖拽开始
  const startDrag = (id: string) => {
    isDragging.value = true
    draggedItem.value = id
  }

  // 拖拽中
  const onDrag = (id: string, x: number, y: number) => {
    if (!isDragging.value || draggedItem.value !== id) return

    const item = items.value.find(i => i.id === id)
    if (item && !item.fixed) {
      item.x = x
      item.y = y
    }
  }

  // 拖拽结束
  const endDrag = () => {
    isDragging.value = false
    draggedItem.value = null
  }

  // 重置布局
  const resetLayout = () => {
    items.value = []
    config.value = { ...defaultLayoutConfig }
  }

  // 网格布局样式
  const gridStyle = computed(() => ({
    display: 'grid',
    gridTemplateColumns: `repeat(${columns.value}, 1fr)`,
    gap: `${config.value.gap}px`,
    gridAutoRows: config.value.type === 'masonry' ? 'auto' : gridSize.value
  }))

  // 列表布局样式
  const listStyle = computed(() => ({
    display: 'flex',
    flexDirection: 'column',
    gap: `${config.value.gap}px`
  }))

  // 瀑布流布局样式
  const masonryStyle = computed(() => ({
    columnCount: columns.value,
    columnGap: `${config.value.gap}px`
  }))

  // 获取当前布局样式
  const currentStyle = computed(() => {
    switch (config.value.type) {
      case 'grid':
        return gridStyle.value
      case 'list':
        return listStyle.value
      case 'masonry':
        return masonryStyle.value
      default:
        return gridStyle.value
    }
  })

  // 布局统计
  const stats = computed(() => ({
    type: config.value.type,
    columns: columns.value,
    gridSize: gridSize.value,
    itemCount: items.value.length,
    breakpoint: currentBreakpoint.value,
    isDragging: isDragging.value
  }))

  return {
    config,
    items,
    currentBreakpoint,
    isDragging,
    draggedItem,
    columns,
    gridSize,
    currentStyle,
    stats,
    setLayoutType,
    setGridSize,
    setColumns,
    setGap,
    detectBreakpoint,
    initBreakpointListener,
    removeBreakpointListener,
    addItem,
    removeItem,
    updateItem,
    startDrag,
    onDrag,
    endDrag,
    resetLayout
  }
}

export default useLayoutManager
