// Layout Advanced - 高级布局系统
import { ref, computed } from 'vue'

export type AdvancedLayoutType =
  | 'grid' | 'masonry' | 'mosaic' | 'packery'
  | 'carousel' | 'slider' | 'coverflow'
  | 'timeline' | 'kanban' | 'swimlane'
  | 'radial' | 'polar' | 'sunburst'
  | 'force' | 'sankey' | 'treemap'

export interface LayoutItem {
  id: string
  x?: number
  y?: number
  width?: number
  height?: number
  row?: number
  column?: number
  order?: number
  data?: any
}

export interface LayoutConfig {
  type: AdvancedLayoutType
  columns: number
  gap: number
  rowHeight: number
  autoFill: boolean
  responsive: boolean
  animation: boolean
}

export interface LayoutPreset {
  id: string
  name: string
  description: string
  config: LayoutConfig
}

export const layoutPresets: LayoutPreset[] = [
  { id: 'grid', name: '网格布局', description: '整齐的网格排列', config: { type: 'grid', columns: 4, gap: 16, rowHeight: 200, autoFill: true, responsive: true, animation: true }},
  { id: 'masonry', name: '瀑布流', description: '像瀑布一样流动的布局', config: { type: 'masonry', columns: 3, gap: 12, rowHeight: 0, autoFill: true, responsive: true, animation: true }},
  { id: 'mosaic', name: '马赛克', description: '不规则块状拼接', config: { type: 'mosaic', columns: 4, gap: 4, rowHeight: 150, autoFill: true, responsive: true, animation: true }},
  { id: 'packery', name: '紧凑拼图', description: '紧凑的无缝拼接', config: { type: 'packery', columns: 5, gap: 8, rowHeight: 180, autoFill: true, responsive: true, animation: true }},
  { id: 'carousel', name: '轮播', description: '水平滚动的卡片', config: { type: 'carousel', columns: 1, gap: 24, rowHeight: 400, autoFill: false, responsive: true, animation: true }},
  { id: 'slider', name: '滑块', description: '带控制器的滑动', config: { type: 'slider', columns: 1, gap: 0, rowHeight: 500, autoFill: false, responsive: true, animation: true }},
  { id: 'coverflow', name: '封面流', description: '3D翻转效果', config: { type: 'coverflow', columns: 3, gap: 20, rowHeight: 300, autoFill: false, responsive: true, animation: true }},
  { id: 'timeline', name: '时间线', description: '垂直时间顺序', config: { type: 'timeline', columns: 1, gap: 32, rowHeight: 120, autoFill: false, responsive: true, animation: true }},
  { id: 'kanban', name: '看板', description: '列式任务看板', config: { type: 'kanban', columns: 4, gap: 12, rowHeight: 100, autoFill: true, responsive: true, animation: true }},
  { id: 'swimlane', name: '泳道', description: '水平分区看板', config: { type: 'swimlane', columns: 1, gap: 16, rowHeight: 200, autoFill: true, responsive: true, animation: true }},
  { id: 'radial', name: '放射状', description: '从中心向外扩散', config: { type: 'radial', columns: 1, gap: 0, rowHeight: 0, autoFill: true, responsive: false, animation: true }},
  { id: 'treemap', name: '树图', description: '矩形嵌套层次', config: { type: 'treemap', columns: 1, gap: 2, rowHeight: 0, autoFill: true, responsive: false, animation: true }}
]

export function useLayoutAdvanced() {
  // 配置
  const config = ref<LayoutConfig>({
    type: 'grid',
    columns: 4,
    gap: 16,
    rowHeight: 200,
    autoFill: true,
    responsive: true,
    animation: true
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

  // 预设
  const presets = ref(layoutPresets)

  // 切换布局类型
  const setType = (type: AdvancedLayoutType) => {
    config.value.type = type
  }

  // 应用预设
  const applyPreset = (presetId: string) => {
    const preset = presets.value.find(p => p.id === presetId)
    if (preset) {
      config.value = { ...preset.config }
    }
  }

  // 添加项
  const addItem = (item: Omit<LayoutItem, 'id'>) => {
    const newItem: LayoutItem = {
      ...item,
      id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
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

  // 拖拽开始
  const startDrag = (id: string) => {
    dragState.value.isDragging = true
    dragState.value.draggedId = id
  }

  // 拖拽中
  const onDrag = (id: string, x: number, y: number) => {
    if (!dragState.value.isDragging) return
    updateItem(id, { x, y })
  }

  // 放置
  const drop = (targetId: string) => {
    if (!dragState.value.draggedId) return

    const draggedItem = items.value.find(i => i.id === dragState.value.draggedId)
    const targetItem = items.value.find(i => i.id === targetId)

    if (draggedItem && targetItem) {
      // 交换位置
      const draggedOrder = draggedItem.order
      const targetOrder = targetItem.order
      draggedItem.order = targetOrder
      targetItem.order = draggedOrder
    }

    endDrag()
  }

  // 结束拖拽
  const endDrag = () => {
    dragState.value.isDragging = false
    dragState.value.draggedId = null
    dragState.value.dropTargetId = null
    dragState.value.placeholder = null
  }

  // 排序
  const sortItems = (compareFn: (a: LayoutItem, b: LayoutItem) => number) => {
    items.value.sort(compareFn)
  }

  // 过滤
  const filterItems = (predicate: (item: LayoutItem) => boolean) => {
    return items.value.filter(predicate)
  }

  // 生成CSS样式
  const getLayoutStyles = computed(() => {
    const { type, columns, gap, rowHeight, animation } = config.value

    const baseStyles: Record<string, any> = {
      display: 'flex',
      flexWrap: 'wrap',
      gap: `${gap}px`
    }

    switch (type) {
      case 'grid':
        return {
          ...baseStyles,
          display: 'grid',
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
          gridAutoRows: rowHeight > 0 ? `${rowHeight}px` : 'auto'
        }

      case 'masonry':
        return {
          ...baseStyles,
          columnCount: columns,
          columnGap: `${gap}px`
        }

      case 'carousel':
      case 'slider':
        return {
          display: 'flex',
          overflowX: 'auto',
          gap: `${gap}px`,
          scrollSnapType: 'x mandatory'
        }

      case 'timeline':
        return {
          display: 'flex',
          flexDirection: 'column',
          gap: `${gap}px`,
          position: 'relative',
          paddingLeft: '60px'
        }

      case 'kanban':
      case 'swimlane':
        return {
          display: 'flex',
          flexDirection: 'column',
          gap: `${gap}px`
        }

      default:
        return baseStyles
    }
  })

  // 统计
  const stats = computed(() => ({
    type: config.value.type,
    items: items.value.length,
    columns: config.value.columns,
    gap: config.value.gap,
    isDragging: dragState.value.isDragging,
    presets: presets.value.length
  }))

  return {
    config,
    items,
    dragState,
    presets,
    stats,
    setType,
    applyPreset,
    addItem,
    removeItem,
    updateItem,
    startDrag,
    onDrag,
    drop,
    endDrag,
    sortItems,
    filterItems,
    getLayoutStyles
  }
}

export default useLayoutAdvanced
