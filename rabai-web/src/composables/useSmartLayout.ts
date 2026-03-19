// Smart Layout - 智能布局系统
import { ref, computed } from 'vue'

export interface LayoutElement {
  id: string
  type: 'text' | 'image' | 'shape' | 'chart' | 'table' | 'icon'
  x: number
  y: number
  width: number
  height: number
  content: any
  style: Record<string, any>
}

export interface LayoutGrid {
  cols: number
  rows: number
  gap: number
  margin: { top: number; right: number; bottom: number; left: number }
}

export interface LayoutPreset {
  id: string
  name: string
  nameEn: string
  category: string
  thumbnail: string
  grid: LayoutGrid
  elements: Array<{
    area: string
    type: LayoutElement['type']
    defaultStyle?: Record<string, any>
  }>
}

export interface SmartLayoutOptions {
  autoAlign: boolean
  autoSpacing: boolean
  autoResize: boolean
  snapToGrid: boolean
  gridSize: number
  preserveAspectRatio: boolean
}

export type LayoutCategory = 'title' | 'content' | 'comparison' | 'gallery' | 'list' | 'timeline' | 'process' | 'custom'

export function useSmartLayout() {
  // 当前布局
  const currentLayout = ref<LayoutPreset | null>(null)

  // 布局预设列表
  const presets = ref<LayoutPreset[]>([
    {
      id: 'layout_title',
      name: '标题页',
      nameEn: 'Title Slide',
      category: 'title',
      thumbnail: '/layouts/title.png',
      grid: { cols: 1, rows: 1, gap: 0, margin: { top: 100, right: 100, bottom: 100, left: 100 } },
      elements: [{ area: 'full', type: 'text', defaultStyle: { fontSize: 72, align: 'center' } }]
    },
    {
      id: 'layout_title_sub',
      name: '标题+副标题',
      nameEn: 'Title with Subtitle',
      category: 'title',
      thumbnail: '/layouts/title_sub.png',
      grid: { cols: 1, rows: 2, gap: 30, margin: { top: 80, right: 80, bottom: 80, left: 80 } },
      elements: [
        { area: 'row1', type: 'text', defaultStyle: { fontSize: 56, align: 'center' } },
        { area: 'row2', type: 'text', defaultStyle: { fontSize: 32, align: 'center', color: '#666' } }
      ]
    },
    {
      id: 'layout_content_left',
      name: '左侧标题+右侧内容',
      nameEn: 'Title Left Content Right',
      category: 'content',
      thumbnail: '/layouts/content_left.png',
      grid: { cols: 2, rows: 1, gap: 40, margin: { top: 60, right: 60, bottom: 60, left: 60 } },
      elements: [
        { area: 'col1', type: 'text', defaultStyle: { fontSize: 44, align: 'left' } },
        { area: 'col2', type: 'text', defaultStyle: { fontSize: 24, align: 'left' } }
      ]
    },
    {
      id: 'layout_content_top',
      name: '上方标题+下方内容',
      nameEn: 'Title Top Content Bottom',
      category: 'content',
      thumbnail: '/layouts/content_top.png',
      grid: { cols: 1, rows: 2, gap: 30, margin: { top: 60, right: 60, bottom: 60, left: 60 } },
      elements: [
        { area: 'row1', type: 'text', defaultStyle: { fontSize: 44, align: 'center' } },
        { area: 'row2', type: 'text', defaultStyle: { fontSize: 20, align: 'left' } }
      ]
    },
    {
      id: 'layout_two_column',
      name: '双栏内容',
      nameEn: 'Two Column Content',
      category: 'content',
      thumbnail: '/layouts/two_column.png',
      grid: { cols: 2, rows: 1, gap: 30, margin: { top: 60, right: 60, bottom: 60, left: 60 } },
      elements: [
        { area: 'col1', type: 'text', defaultStyle: { fontSize: 20 } },
        { area: 'col2', type: 'text', defaultStyle: { fontSize: 20 } }
      ]
    },
    {
      id: 'layout_comparison',
      name: '对比布局',
      nameEn: 'Comparison',
      category: 'comparison',
      thumbnail: '/layouts/comparison.png',
      grid: { cols: 2, rows: 2, gap: 20, margin: { top: 50, right: 50, bottom: 50, left: 50 } },
      elements: [
        { area: 'row1:col1', type: 'text', defaultStyle: { fontSize: 32, align: 'center', fontWeight: 'bold' } },
        { area: 'row1:col2', type: 'text', defaultStyle: { fontSize: 32, align: 'center', fontWeight: 'bold' } },
        { area: 'row2:col1', type: 'text', defaultStyle: { fontSize: 18 } },
        { area: 'row2:col2', type: 'text', defaultStyle: { fontSize: 18 } }
      ]
    },
    {
      id: 'layout_gallery',
      name: '图片画廊',
      nameEn: 'Image Gallery',
      category: 'gallery',
      thumbnail: '/layouts/gallery.png',
      grid: { cols: 3, rows: 2, gap: 15, margin: { top: 40, right: 40, bottom: 40, left: 40 } },
      elements: [
        { area: 'col1:row1', type: 'image', defaultStyle: { objectFit: 'cover' } },
        { area: 'col2:row1', type: 'image', defaultStyle: { objectFit: 'cover' } },
        { area: 'col3:row1', type: 'image', defaultStyle: { objectFit: 'cover' } },
        { area: 'col1:row2', type: 'image', defaultStyle: { objectFit: 'cover' } },
        { area: 'col2:row2', type: 'image', defaultStyle: { objectFit: 'cover' } },
        { area: 'col3:row2', type: 'image', defaultStyle: { objectFit: 'cover' } }
      ]
    },
    {
      id: 'layout_list',
      name: '列表布局',
      nameEn: 'List Layout',
      category: 'list',
      thumbnail: '/layouts/list.png',
      grid: { cols: 1, rows: 4, gap: 20, margin: { top: 60, right: 100, bottom: 60, left: 100 } },
      elements: [
        { area: 'row1', type: 'shape', defaultStyle: { type: 'circle' } },
        { area: 'row2', type: 'shape', defaultStyle: { type: 'circle' } },
        { area: 'row3', type: 'shape', defaultStyle: { type: 'circle' } },
        { area: 'row4', type: 'shape', defaultStyle: { type: 'circle' } }
      ]
    },
    {
      id: 'layout_timeline',
      name: '时间线',
      nameEn: 'Timeline',
      category: 'timeline',
      thumbnail: '/layouts/timeline.png',
      grid: { cols: 4, rows: 1, gap: 30, margin: { top: 80, right: 60, bottom: 80, left: 60 } },
      elements: [
        { area: 'col1', type: 'shape', defaultStyle: { type: 'line' } },
        { area: 'col2', type: 'shape', defaultStyle: { type: 'line' } },
        { area: 'col3', type: 'shape', defaultStyle: { type: 'line' } },
        { area: 'col4', type: 'shape', defaultStyle: { type: 'line' } }
      ]
    },
    {
      id: 'layout_process',
      name: '流程图',
      nameEn: 'Process Flow',
      category: 'process',
      thumbnail: '/layouts/process.png',
      grid: { cols: 4, rows: 1, gap: 20, margin: { top: 100, right: 40, bottom: 100, left: 40 } },
      elements: [
        { area: 'col1', type: 'shape', defaultStyle: { type: 'rect' } },
        { area: 'col2', type: 'shape', defaultStyle: { type: 'arrow' } },
        { area: 'col3', type: 'shape', defaultStyle: { type: 'rect' } },
        { area: 'col4', type: 'shape', defaultStyle: { type: 'arrow' } }
      ]
    }
  ])

  // 当前幻灯片元素
  const elements = ref<LayoutElement[]>([])

  // 布局选项
  const options = ref<SmartLayoutOptions>({
    autoAlign: true,
    autoSpacing: true,
    autoResize: true,
    snapToGrid: true,
    gridSize: 20,
    preserveAspectRatio: true
  })

  // 幻灯片尺寸
  const slideSize = ref({ width: 960, height: 540 })

  // 应用布局预设
  const applyPreset = (presetId: string): boolean => {
    const preset = presets.value.find(p => p.id === presetId)
    if (!preset) return false

    currentLayout.value = preset
    generateElements(preset)
    return true
  }

  // 根据预设生成元素
  const generateElements = (preset: LayoutPreset) => {
    elements.value = []

    const { grid, margin } = preset.grid
    const contentWidth = slideSize.value.width - margin.left - margin.right
    const contentHeight = slideSize.value.height - margin.top - margin.bottom
    const cellWidth = (contentWidth - (grid.cols - 1) * grid.gap) / grid.cols
    const cellHeight = (contentHeight - (grid.rows - 1) * grid.gap) / grid.rows

    preset.elements.forEach((el, index) => {
      let x = margin.left
      let y = margin.top
      let width = cellWidth
      let height = cellHeight

      // 解析区域
      if (el.area.includes(':')) {
        const [rowPart, colPart] = el.area.split(':')
        const row = parseInt(rowPart.replace('row', '')) - 1
        const col = parseInt(colPart.replace('col', '')) - 1
        x = margin.left + col * (cellWidth + grid.gap)
        y = margin.top + row * (cellHeight + grid.gap)
      } else if (el.area === 'full') {
        width = contentWidth
        height = contentHeight
      } else if (el.area.startsWith('row')) {
        const row = parseInt(el.area.replace('row', '')) - 1
        y = margin.top + row * (cellHeight + grid.gap)
        width = contentWidth
      } else if (el.area.startsWith('col')) {
        const col = parseInt(el.area.replace('col', '')) - 1
        x = margin.left + col * (cellWidth + grid.gap)
        height = contentHeight
      }

      elements.value.push({
        id: `el_${index}`,
        type: el.type,
        x,
        y,
        width,
        height,
        content: '',
        style: el.defaultStyle || {}
      })
    })
  }

  // 自动对齐元素
  const autoAlign = () => {
    if (!currentLayout.value) return

    const { grid } = currentLayout.value
    const { margin } = grid

    elements.value.forEach((el, index) => {
      if (options.value.snapToGrid) {
        el.x = Math.round(el.x / options.value.gridSize) * options.value.gridSize
        el.y = Math.round(el.y / options.value.gridSize) * options.value.gridSize
      }
    })
  }

  // 自动调整元素大小
  const autoResize = () => {
    if (!currentLayout.value) return

    const preset = currentLayout.value
    const { grid } = preset.grid
    const { margin } = grid
    const contentWidth = slideSize.value.width - margin.left - margin.right
    const contentHeight = slideSize.value.height - margin.top - margin.bottom

    const cellWidth = (contentWidth - (grid.cols - 1) * grid.gap) / grid.cols
    const cellHeight = (contentHeight - (grid.rows - 1) * grid.gap) / grid.rows

    elements.value.forEach((el, index) => {
      const area = preset.elements[index]?.area || 'full'

      if (area.includes(':')) {
        const [rowPart, colPart] = area.split(':')
        const col = parseInt(colPart.replace('col', '')) - 1

        if (options.value.preserveAspectRatio) {
          const aspectRatio = el.width / el.height
          if (aspectRatio > cellWidth / cellHeight) {
            el.width = cellWidth
            el.height = cellWidth / aspectRatio
          } else {
            el.height = cellHeight
            el.width = cellHeight * aspectRatio
          }
        } else {
          el.width = cellWidth
          el.height = cellHeight
        }
      }
    })
  }

  // 更新元素
  const updateElement = (id: string, updates: Partial<LayoutElement>) => {
    const el = elements.value.find(e => e.id === id)
    if (el) {
      Object.assign(el, updates)

      if (options.value.autoAlign) {
        autoAlign()
      }
    }
  }

  // 添加元素
  const addElement = (element: Omit<LayoutElement, 'id'>) => {
    const newElement: LayoutElement = {
      ...element,
      id: `el_${Date.now()}`
    }
    elements.value.push(newElement)
    return newElement
  }

  // 删除元素
  const removeElement = (id: string) => {
    const index = elements.value.findIndex(e => e.id === id)
    if (index > -1) {
      elements.value.splice(index, 1)
    }
  }

  // 按分类获取预设
  const getPresetsByCategory = computed(() => {
    const categories: Record<string, LayoutPreset[]> = {}
    presets.value.forEach(preset => {
      if (!categories[preset.category]) {
        categories[preset.category] = []
      }
      categories[preset.category].push(preset)
    })
    return categories
  })

  // 导出布局为JSON
  const exportLayout = () => {
    return JSON.stringify({
      preset: currentLayout.value,
      elements: elements.value,
      slideSize: slideSize.value,
      options: options.value
    }, null, 2)
  }

  // 更新选项
  const updateOptions = (newOptions: Partial<SmartLayoutOptions>) => {
    Object.assign(options.value, newOptions)
  }

  // 统计
  const stats = computed(() => ({
    totalPresets: presets.value.length,
    currentElements: elements.value.length,
    categories: Object.keys(getPresetsByCategory.value).length,
    slideWidth: slideSize.value.width,
    slideHeight: slideSize.value.height
  }))

  return {
    // 数据
    presets,
    currentLayout,
    elements,
    options,
    slideSize,

    // 方法
    applyPreset,
    generateElements,
    autoAlign,
    autoResize,
    updateElement,
    addElement,
    removeElement,
    updateOptions,
    exportLayout,

    // 计算属性
    getPresetsByCategory,
    stats
  }
}

export default useSmartLayout
