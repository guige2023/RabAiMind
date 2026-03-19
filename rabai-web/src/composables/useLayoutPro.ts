// Layout Pro - 布局专业版
import { ref, computed } from 'vue'

export type AdvancedLayoutType =
  | 'grid' | 'masonry' | 'mosaic' | 'packery' | 'tiled'
  | 'carousel' | 'slider' | 'coverflow' | 'gallery'
  | 'timeline' | 'kanban' | 'swimlane' | 'spreadsheet'
  | 'radial' | 'polar' | 'sunburst' | 'network'
  | 'split' | 'sidebar' | 'magazine' | 'hero'
  | 'parallax' | 'cascade' | 'scattered'

export interface LayoutItem {
  id: string
  x?: number
  y?: number
  width?: number
  height?: number
  row?: number
  column?: number
  order?: number
  span?: number
  data?: any
}

export interface LayoutPreset {
  id: string
  name: string
  nameEn: string
  icon: string
  description: string
  type: AdvancedLayoutType
  config: LayoutConfig
}

export interface LayoutConfig {
  columns: number
  gap: number
  rowHeight: number
  autoFill: boolean
  responsive: boolean
  animation: boolean
  alignment?: 'start' | 'center' | 'end' | 'stretch'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
}

export interface BreakpointConfig {
  name: string
  breakpoint: number
  columns: number
  gap: number
}

export function useLayoutPro() {
  // 预设集合
  const presets = ref<LayoutPreset[]>([
    // Grid 网格
    { id: 'grid-classic', name: '经典网格', nameEn: 'Classic Grid', icon: '⊞', description: '整齐的网格排列', type: 'grid', config: { columns: 4, gap: 16, rowHeight: 200, autoFill: true, responsive: true, animation: true } },
    { id: 'grid-masonry', name: '瀑布流', nameEn: 'Masonry', icon: '⊟', description: '像瀑布一样流动', type: 'masonry', config: { columns: 3, gap: 12, rowHeight: 0, autoFill: true, responsive: true, animation: true } },
    { id: 'grid-mosaic', name: '马赛克', nameEn: 'Mosaic', icon: '▦', description: '不规则块状拼接', type: 'mosaic', config: { columns: 4, gap: 4, rowHeight: 150, autoFill: true, responsive: true, animation: true } },
    { id: 'grid-packery', name: '紧凑拼图', nameEn: 'Packery', icon: '⊟', description: '紧凑的无缝拼接', type: 'packery', config: { columns: 5, gap: 8, rowHeight: 180, autoFill: true, responsive: true, animation: true } },
    { id: 'grid-tiled', name: '瓷砖', nameEn: 'Tiled', icon: '▩', description: '规则瓷砖排列', type: 'tiled', config: { columns: 3, gap: 8, rowHeight: 160, autoFill: true, responsive: true, animation: true } },

    // Carousel 轮播
    { id: 'carousel-basic', name: '基础轮播', nameEn: 'Carousel', icon: '⟲', description: '水平滚动的卡片', type: 'carousel', config: { columns: 1, gap: 24, rowHeight: 400, autoFill: false, responsive: true, animation: true } },
    { id: 'slider-full', name: '全屏滑块', nameEn: 'Full Slider', icon: '⬌', description: '全屏滑动展示', type: 'slider', config: { columns: 1, gap: 0, rowHeight: 500, autoFill: false, responsive: true, animation: true } },
    { id: 'coverflow-3d', name: '3D封面流', nameEn: 'Coverflow', icon: '⟳', description: '3D翻转效果', type: 'coverflow', config: { columns: 3, gap: 20, rowHeight: 300, autoFill: false, responsive: true, animation: true } },
    { id: 'gallery-grid', name: '图片画廊', nameEn: 'Gallery', icon: '🖼', description: '图片展示画廊', type: 'gallery', config: { columns: 4, gap: 8, rowHeight: 200, autoFill: true, responsive: true, animation: true } },

    // Kanban 看板
    { id: 'kanban-vertical', name: '竖向看板', nameEn: 'Vertical Kanban', icon: '⬜', description: '列式任务看板', type: 'kanban', config: { columns: 4, gap: 12, rowHeight: 100, autoFill: true, responsive: true, animation: true } },
    { id: 'swimlane-horiz', name: '泳道', nameEn: 'Swimlane', icon: '═', description: '水平分区看板', type: 'swimlane', config: { columns: 1, gap: 16, rowHeight: 200, autoFill: true, responsive: true, animation: true } },
    { id: 'spreadsheet-table', name: '表格', nameEn: 'Spreadsheet', icon: '▦', description: '电子表格布局', type: 'spreadsheet', config: { columns: 6, gap: 2, rowHeight: 40, autoFill: true, responsive: false, animation: false } },

    // Timeline 时间线
    { id: 'timeline-vert', name: '垂直时间线', nameEn: 'Vertical Timeline', icon: '↕', description: '垂直时间顺序', type: 'timeline', config: { columns: 1, gap: 32, rowHeight: 120, autoFill: false, responsive: true, animation: true } },
    { id: 'timeline-horiz', name: '水平时间线', nameEn: 'Horizontal Timeline', icon: '↔', description: '水平时间顺序', type: 'timeline', config: { columns: 1, gap: 48, rowHeight: 100, autoFill: false, responsive: true, animation: true } },

    // Radial 放射状
    { id: 'radial-center', name: '放射状', nameEn: 'Radial', icon: '⊙', description: '从中心向外扩散', type: 'radial', config: { columns: 1, gap: 0, rowHeight: 0, autoFill: true, responsive: false, animation: true } },
    { id: 'polar-chart', name: '极坐标', nameEn: 'Polar', icon: '◉', description: '极坐标排列', type: 'polar', config: { columns: 1, gap: 0, rowHeight: 0, autoFill: true, responsive: false, animation: true } },
    { id: 'sunburst', name: '太阳爆发', nameEn: 'Sunburst', icon: '☀', description: '层次放射状', type: 'sunburst', config: { columns: 1, gap: 0, rowHeight: 0, autoFill: true, responsive: false, animation: true } },
    { id: 'network', name: '网络图', nameEn: 'Network', icon: '⊛', description: '节点网络连接', type: 'network', config: { columns: 1, gap: 0, rowHeight: 0, autoFill: true, responsive: false, animation: true } },

    // Split 分割
    { id: 'split-vert', name: '左右分栏', nameEn: 'Vertical Split', icon: '▐', description: '左右两边分割', type: 'split', config: { columns: 2, gap: 16, rowHeight: 400, autoFill: false, responsive: true, animation: true } },
    { id: 'split-horiz', name: '上下分栏', nameEn: 'Horizontal Split', icon: '▄', description: '上下两边分割', type: 'split', config: { columns: 1, gap: 16, rowHeight: 250, autoFill: false, responsive: true, animation: true } },
    { id: 'sidebar-left', name: '左侧边栏', nameEn: 'Left Sidebar', icon: '◀', description: '主内容+侧边栏', type: 'sidebar', config: { columns: 2, gap: 0, rowHeight: 0, autoFill: false, responsive: true, animation: true, alignment: 'start' } },
    { id: 'sidebar-right', name: '右侧边栏', nameEn: 'Right Sidebar', icon: '▶', description: '侧边栏+主内容', type: 'sidebar', config: { columns: 2, gap: 0, rowHeight: 0, autoFill: false, responsive: true, animation: true, alignment: 'end' } },

    // Magazine 杂志
    { id: 'magazine', name: '杂志风', nameEn: 'Magazine', icon: '▤', description: '杂志排版风格', type: 'magazine', config: { columns: 3, gap: 12, rowHeight: 200, autoFill: true, responsive: true, animation: true } },
    { id: 'hero-main', name: '主英雄', nameEn: 'Hero', icon: '▣', description: '大图主视觉', type: 'hero', config: { columns: 2, gap: 16, rowHeight: 400, autoFill: false, responsive: true, animation: true } },

    // Creative 创意
    { id: 'parallax', name: '视差', nameEn: 'Parallax', icon: '⬇', description: '视差滚动效果', type: 'parallax', config: { columns: 1, gap: 0, rowHeight: 600, autoFill: false, responsive: true, animation: true } },
    { id: 'cascade', name: '层叠', nameEn: 'Cascade', icon: '⬚', description: '瀑布层叠效果', type: 'cascade', config: { columns: 3, gap: -50, rowHeight: 300, autoFill: false, responsive: true, animation: true } },
    { id: 'scattered', name: '散落', nameEn: 'Scattered', icon: '✱', description: '随机散落布局', type: 'scattered', config: { columns: 1, gap: 0, rowHeight: 0, autoFill: true, responsive: false, animation: true } }
  ])

  // 布局配置
  const config = ref<LayoutConfig>({
    columns: 4,
    gap: 16,
    rowHeight: 200,
    autoFill: true,
    responsive: true,
    animation: true,
    alignment: 'start',
    justify: 'start'
  })

  // 布局项
  const items = ref<LayoutItem[]>([])

  // 拖拽状态
  const dragState = ref({
    isDragging: false,
    draggedId: null as string | null,
    dropTargetId: null as string | null,
    placeholder: null as LayoutItem | null
  })

  // 断点配置
  const breakpoints = ref<BreakpointConfig[]>([
    { name: 'xs', breakpoint: 480, columns: 1, gap: 8 },
    { name: 'sm', breakpoint: 768, columns: 2, gap: 12 },
    { name: 'md', breakpoint: 1024, columns: 3, gap: 16 },
    { name: 'lg', breakpoint: 1280, columns: 4, gap: 16 },
    { name: 'xl', breakpoint: 1536, columns: 5, gap: 20 }
  ])

  // 当前断点
  const currentBreakpoint = ref('lg')

  // 应用预设
  const applyPreset = (presetId: string) => {
    const preset = presets.value.find(p => p.id === presetId)
    if (preset) {
      config.value = { ...config.value, ...preset.config }
    }
  }

  // 设置布局类型
  const setType = (type: AdvancedLayoutType) => {
    const preset = presets.value.find(p => p.type === type)
    if (preset) {
      applyPreset(preset.id)
    }
  }

  // 添加项
  const addItem = (item: Omit<LayoutItem, 'id'>) => {
    const newItem: LayoutItem = {
      ...item,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      order: items.value.length
    }
    items.value.push(newItem)
    return newItem
  }

  // 移除项
  const removeItem = (id: string) => {
    items.value = items.value.filter(i => i.id !== id)
  }

  // 更新项
  const updateItem = (id: string, updates: Partial<LayoutItem>) => {
    const item = items.value.find(i => i.id === id)
    if (item) {
      Object.assign(item, updates)
    }
  }

  // 拖拽操作
  const startDrag = (id: string) => {
    dragState.value.isDragging = true
    dragState.value.draggedId = id
  }

  const onDrag = (id: string, x: number, y: number) => {
    if (!dragState.value.isDragging) return
    updateItem(id, { x, y })
  }

  const drop = (targetId: string) => {
    if (!dragState.value.draggedId) return

    const draggedItem = items.value.find(i => i.id === dragState.value.draggedId)
    const targetItem = items.value.find(i => i.id === targetId)

    if (draggedItem && targetItem) {
      const draggedOrder = draggedItem.order
      const targetOrder = targetItem.order
      draggedItem.order = targetOrder
      targetItem.order = draggedOrder
    }

    endDrag()
  }

  const endDrag = () => {
    dragState.value.isDragging = false
    dragState.value.draggedId = null
    dragState.value.dropTargetId = null
  }

  // 排序
  const sortItems = (compareFn: (a: LayoutItem, b: LayoutItem) => number) => {
    items.value.sort(compareFn)
  }

  // 过滤
  const filterItems = (predicate: (item: LayoutItem) => boolean) => {
    return items.value.filter(predicate)
  }

  // 检测断点
  const detectBreakpoint = (width: number) => {
    for (let i = breakpoints.value.length - 1; i >= 0; i--) {
      if (width >= breakpoints.value[i].breakpoint) {
        currentBreakpoint.value = breakpoints.value[i].name
        return breakpoints.value[i]
      }
    }
    return breakpoints.value[0]
  }

  // 生成CSS样式
  const getLayoutStyles = computed(() => {
    const { columns, gap, rowHeight, animation, alignment, justify } = config.value

    const baseStyles = {
      display: 'flex',
      flexWrap: 'wrap',
      gap: `${gap}px`,
      justifyContent: justify === 'between' ? 'space-between' : justify === 'around' ? 'space-around' : justify,
      alignItems: alignment === 'stretch' ? 'stretch' : alignment
    }

    switch (config.value.columns > 1 ? 'grid' : 'flex') {
      case 'grid':
        return {
          ...baseStyles,
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gridAutoRows: rowHeight > 0 ? `${rowHeight}px` : 'auto'
        }

      default:
        return baseStyles
    }
  })

  // 获取项位置
  const getItemPosition = (index: number) => {
    const { columns, gap, rowHeight } = config.value
    const row = Math.floor(index / columns)
    const col = index % columns
    const x = col * (100 / columns)
    const y = row * (rowHeight + gap)

    return { x, y, row, col }
  }

  // 统计
  const stats = computed(() => ({
    presets: presets.value.length,
    items: items.value.length,
    columns: config.value.columns,
    gap: config.value.gap,
    isDragging: dragState.value.isDragging,
    currentBreakpoint: currentBreakpoint.value,
    types: [...new Set(presets.value.map(p => p.type))].length
  }))

  return {
    // 预设
    presets,
    applyPreset,
    setType,
    // 配置
    config,
    breakpoints,
    currentBreakpoint,
    detectBreakpoint,
    // 项目
    items,
    addItem,
    removeItem,
    updateItem,
    // 拖拽
    dragState,
    startDrag,
    onDrag,
    drop,
    endDrag,
    // 操作
    sortItems,
    filterItems,
    getItemPosition,
    // 样式
    getLayoutStyles,
    // 统计
    stats
  }
}

export default useLayoutPro
