/**
 * useSmartLayout.ts - Smart Slide Layout Engine
 * R121: Smart Slide Layout Engine
 * - Auto-balance: redistribute elements evenly
 * - Smart grid: snap elements to intelligent grid
 * - Content reflow: reflow text when elements change size
 * - Layout presets: expanded common arrangements
 * - Responsive slides: adapt to different aspect ratios
 */
import { ref, computed } from 'vue'

// Slide element type
interface SlideElement {
  id: string
  type: 'text' | 'shape' | 'image' | 'video' | 'audio' | 'gif'
  x: number
  y: number
  width: number
  height: number
  content?: string
  color?: string
  fill?: string
  fontSize?: number
  fontWeight?: string
  fontFamily?: string
  fontStyle?: string
  textDecoration?: string
  textAlign?: string
  textBgColor?: string
  lineHeight?: string
  objectFit?: string
  align?: string
  src?: string
  zIndex?: number
  videoUrl?: string
  videoType?: 'youtube' | 'vimeo' | 'mp4'
  audioUrl?: string
  gifUrl?: string
  autoPlay?: boolean
  loop?: boolean
  muted?: boolean
}

interface Slide {
  background?: string
  elements: SlideElement[]
}

// Aspect ratio presets
export interface AspectRatio {
  id: string
  name: string
  width: number
  height: number
  icon: string
}

export const ASPECT_RATIOS: AspectRatio[] = [
  { id: '16:9', name: '16:9 宽屏', width: 960, height: 540, icon: '📺' },
  { id: '4:3', name: '4:3 标准', width: 800, height: 600, icon: '📋' },
  { id: '16:10', name: '16:10 办公', width: 960, height: 600, icon: '💻' },
  { id: '21:9', name: '21:9 超宽', width: 1050, height: 450, icon: '🎬' },
  { id: '1:1', name: '1:1 正方', width: 600, height: 600, icon: '◻️' },
  { id: '9:16', name: '9:16 竖屏', width: 540, height: 960, icon: '📱' },
]

// Smart grid presets
export interface GridPreset {
  id: string
  name: string
  size: number
  cols: number
  rows: number
  icon: string
}

export const GRID_PRESETS: GridPreset[] = [
  { id: 'fine', name: '精细 5px', size: 5, cols: 192, rows: 108, icon: '🔬' },
  { id: 'normal', name: '标准 10px', size: 10, cols: 96, rows: 54, icon: '📐' },
  { id: 'coarse', name: '粗略 20px', size: 20, cols: 48, rows: 27, icon: '🔳' },
  { id: 'smart', name: '智能网格', size: 0, cols: 12, rows: 8, icon: '🧠' },
]

// Expanded layout presets
export interface LayoutPreset {
  id: string
  name: string
  icon: string
  description: string
}

export const LAYOUT_PRESETS: LayoutPreset[] = [
  { id: 'default', name: '默认', icon: '📐', description: '保持当前布局' },
  { id: 'center', name: '居中', icon: '🎯', description: '所有元素居中' },
  { id: 'center-wide', name: '水平居中', icon: '➡️⬅️', description: '水平居中,垂直分布' },
  { id: 'left-heavy', name: '左重', icon: '◀️', description: '元素靠左对齐' },
  { id: 'right-heavy', name: '右重', icon: '▶️', description: '元素靠右对齐' },
  { id: 'top-heavy', name: '上重', icon: '🔼', description: '元素靠上对齐' },
  { id: 'bottom-heavy', name: '下重', icon: '🔽', description: '元素靠下对齐' },
  { id: 'grid-2x2', name: '2x2网格', icon: '🟧', description: '2列2行网格布局' },
  { id: 'grid-3x3', name: '3x3网格', icon: '🟦', description: '3列3行网格布局' },
  { id: 'sidebar-left', name: '左侧边栏', icon: '📑', description: '左侧固定边栏' },
  { id: 'sidebar-right', name: '右侧边栏', icon: '📄', description: '右侧固定边栏' },
  { id: 'diagonal', name: '对角分布', icon: '↘️', description: '沿对角线分布' },
  { id: 'scattered', name: '随机散落', icon: '✨', description: '均衡散落分布' },
  { id: 'golden-ratio', name: '黄金比例', icon: '🟡', description: '黄金分割布局' },
  { id: 'spiral', name: '螺旋布局', icon: '🌀', description: '顺时针螺旋分布' },
]

export function useSmartLayout() {
  const smartGridEnabled = ref(false)
  const smartGridSize = ref(10)
  const smartGridCols = ref(12)
  const smartGridRows = ref(8)
  const activeSmartLayout = ref('default')
  const activeAspectRatio = ref('16:9')

  // Get current canvas dimensions based on aspect ratio
  const getCanvasDimensions = (aspectId: string = activeAspectRatio.value) => {
    const preset = ASPECT_RATIOS.find(a => a.id === aspectId) || ASPECT_RATIOS[0]
    return { width: preset.width, height: preset.height }
  }

  // Snap a value to smart grid
  const snapToSmartGrid = (value: number, gridSize: number): number => {
    if (gridSize === 0) return value // Smart grid doesn't snap raw values
    return Math.round(value / gridSize) * gridSize
  }

  // Smart grid snapping for an element (intelligent - considers element relationships)
  const snapElementToSmartGrid = (el: SlideElement, allElements: SlideElement[], gridSize: number) => {
    if (gridSize === 0) {
      // Smart grid: snap to column/row intersections with tolerance
      const colWidth = 960 / smartGridCols.value
      const rowHeight = 540 / smartGridRows.value
      const tolerance = Math.min(colWidth, rowHeight) * 0.3

      // Snap x to nearest column
      el.x = snapToNearest(el.x, colWidth, tolerance)
      // Snap y to nearest row
      el.y = snapToNearest(el.y, rowHeight, tolerance)
    } else {
      el.x = snapToSmartGrid(el.x, gridSize)
      el.y = snapToSmartGrid(el.y, gridSize)
    }
  }

  // Helper: snap to nearest multiple with tolerance
  const snapToNearest = (value: number, unit: number, tolerance: number): number => {
    const nearest = Math.round(value / unit) * unit
    if (Math.abs(value - nearest) <= tolerance) {
      return nearest
    }
    return value
  }

  // Auto-balance: redistribute elements evenly across the canvas
  const autoBalanceElements = (elements: SlideElement[], canvasW?: number, canvasH?: number) => {
    if (!elements || elements.length === 0) return

    const { width: cw, height: ch } = getCanvasDimensions()
    const w = canvasW || cw
    const h = canvasH || ch

    const count = elements.length
    const padding = 40
    const availableW = w - padding * 2
    const availableH = h - padding * 2

    // Group elements by type for smart distribution
    const textEls = elements.filter(el => el.type === 'text')
    const imageEls = elements.filter(el => el.type === 'image')
    const shapeEls = elements.filter(el => el.type === 'shape' || el.type === 'video' || el.type === 'audio' || el.type === 'gif')
    const otherEls = elements.filter(el => !textEls.includes(el) && !imageEls.includes(el) && !shapeEls.includes(el))

    // Calculate bounding boxes for each group
    const totalArea = elements.reduce((sum, el) => sum + (el.width * el.height), 0)
    const aspectRatio = w / h

    // Determine optimal arrangement based on element count and types
    let cols = Math.ceil(Math.sqrt(count * aspectRatio))
    let rows = Math.ceil(count / cols)

    // Avoid single-column or single-row unless necessary
    if (cols > 1 && rows > 1) {
      // Make it more square-ish
      while (cols / rows > aspectRatio * 1.5 && rows < count) {
        rows++
        cols = Math.ceil(count / rows)
      }
    }

    const cellW = availableW / cols
    const cellH = availableH / rows
    const gapX = 20
    const gapY = 20

    // Sort elements by area (larger ones first for better placement)
    const sorted = [...elements].sort((a, b) => (b.width * b.height) - (a.width * a.height))

    sorted.forEach((el, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)

      // Calculate max size within cell
      const maxW = Math.min(el.width, cellW - gapX * 2)
      const maxH = Math.min(el.height, cellH - gapY * 2)

      // Center element within its cell
      el.x = Math.round(padding + col * cellW + (cellW - maxW) / 2)
      el.y = Math.round(padding + row * cellH + (cellH - maxH) / 2)

      // Scale down if needed
      if (el.width > maxW || el.height > maxH) {
        const scaleW = maxW / el.width
        const scaleH = maxH / el.height
        const scale = Math.min(scaleW, scaleH)
        el.width = Math.round(el.width * scale)
        el.height = Math.round(el.height * scale)
      }
    })

    // Z-index: larger elements in back
    elements.forEach((el, i) => {
      const sortedIdx = sorted.findIndex(s => s.id === el.id)
      el.zIndex = sorted.indexOf(el)
    })
  }

  // Content reflow: reflow text when elements change size
  const reflowTextContent = (elements: SlideElement[], changedEl: SlideElement, canvasW?: number, canvasH?: number) => {
    if (!elements || elements.length === 0) return

    const { width: cw, height: ch } = getCanvasDimensions()
    const w = canvasW || cw
    const h = canvasH || ch

    // Find all text elements and non-text elements
    const textEls = elements.filter(el => el.type === 'text')
    const otherEls = elements.filter(el => el.type !== 'text')

    if (otherEls.length === 0 || textEls.length === 0) return

    // Build occupancy grid from non-text elements
    const occupiedCells = new Set<string>()
    const gridResolution = 10 // 10px grid

    otherEls.forEach(el => {
      const minX = Math.floor(el.x / gridResolution)
      const maxX = Math.ceil((el.x + el.width) / gridResolution)
      const minY = Math.floor(el.y / gridResolution)
      const maxY = Math.ceil((el.y + el.height) / gridResolution)

      for (let gx = minX; gx <= maxX; gx++) {
        for (let gy = minY; gy <= maxY; gy++) {
          occupiedCells.add(`${gx},${gy}`)
        }
      }
    })

    // Reflow each text element to avoid occupied cells
    const margin = 30
    const minX = margin
    const maxX = Math.floor((w - margin) / gridResolution)
    const minY = margin
    const maxY = Math.floor((h - margin) / gridResolution)

    textEls.forEach(el => {
      // Simple reflow: if text overlaps with non-text, nudge it
      const elMinX = Math.floor(el.x / gridResolution)
      const elMaxX = Math.ceil((el.x + el.width) / gridResolution)
      const elMinY = Math.floor(el.y / gridResolution)
      const elMaxY = Math.ceil((el.y + el.height) / gridResolution)

      let overlapped = false
      for (let gx = elMinX; gx <= elMaxX; gx++) {
        for (let gy = elMinY; gy <= elMaxY; gy++) {
          if (occupiedCells.has(`${gx},${gy}`)) {
            overlapped = true
            break
          }
        }
        if (overlapped) break
      }

      if (overlapped) {
        // Try to move below the occupied area
        let newY = el.y
        const targetY = el.y + el.height + 20

        // Find first free row below current position
        for (let y = Math.floor(targetY / gridResolution); y <= maxY; y++) {
          let rowFree = true
          for (let gx = elMinX; gx <= elMaxX; gx++) {
            if (occupiedCells.has(`${gx},${y}`)) {
              rowFree = false
              break
            }
          }
          if (rowFree) {
            newY = y * gridResolution
            break
          }
        }

        if (newY + el.height <= h - margin) {
          el.y = newY
        } else {
          // Try moving right instead
          let newX = el.x
          for (let x = Math.floor((el.x + el.width + 20) / gridResolution); x <= maxX; x++) {
            let colFree = true
            for (let gy = elMinY; gy <= elMaxY; gy++) {
              if (occupiedCells.has(`${x},${gy}`)) {
                colFree = false
                break
              }
            }
            if (colFree) {
              newX = x * gridResolution
              break
            }
          }
          if (newX + el.width <= w - margin) {
            el.x = newX
          }
        }
      }
    })
  }

  // Apply layout preset to elements
  const applySmartLayoutPreset = (
    elements: SlideElement[],
    presetId: string,
    canvasW?: number,
    canvasH?: number
  ) => {
    if (!elements || elements.length === 0) return

    const { width: cw, height: ch } = getCanvasDimensions()
    const w = canvasW || cw
    const h = canvasH || ch

    const count = elements.length
    const padding = 40
    const availableW = w - padding * 2
    const availableH = h - padding * 2

    switch (presetId) {
      case 'center': {
        const totalH = elements.reduce((sum, el) => sum + el.height, 0) + (count - 1) * 20
        let currentY = (h - totalH) / 2
        elements.forEach(el => {
          el.x = Math.round((w - el.width) / 2)
          el.y = Math.round(currentY)
          currentY += el.height + 20
        })
        break
      }

      case 'center-wide': {
        const spacing = availableH / (count + 1)
        elements.forEach((el, i) => {
          el.x = Math.round((w - el.width) / 2)
          el.y = Math.round(padding + spacing * (i + 1) - el.height / 2)
        })
        break
      }

      case 'left-heavy': {
        elements.forEach((el, i) => {
          el.x = padding
          el.y = Math.round(padding + i * (availableH / count))
        })
        break
      }

      case 'right-heavy': {
        elements.forEach((el, i) => {
          el.x = Math.round(w - el.width - padding)
          el.y = Math.round(padding + i * (availableH / count))
        })
        break
      }

      case 'top-heavy': {
        elements.forEach((el, i) => {
          el.x = Math.round(padding + i * (availableW / count))
          el.y = padding
        })
        break
      }

      case 'bottom-heavy': {
        elements.forEach((el, i) => {
          el.x = Math.round(padding + i * (availableW / count))
          el.y = Math.round(h - el.height - padding)
        })
        break
      }

      case 'grid-2x2': {
        const cols = 2
        const rows = 2
        const cellW = availableW / cols
        const cellH = availableH / rows
        const gap = 15

        elements.slice(0, 4).forEach((el, i) => {
          const col = i % cols
          const row = Math.floor(i / cols)
          const scale = Math.min((cellW - gap * 2) / el.width, (cellH - gap * 2) / el.height)
          el.width = Math.round(el.width * Math.min(scale, 1))
          el.height = Math.round(el.height * Math.min(scale, 1))
          el.x = Math.round(padding + col * cellW + (cellW - el.width) / 2)
          el.y = Math.round(padding + row * cellH + (cellH - el.height) / 2)
        })
        break
      }

      case 'grid-3x3': {
        const cols = 3
        const rows = 3
        const cellW = availableW / cols
        const cellH = availableH / rows
        const gap = 10

        elements.slice(0, 9).forEach((el, i) => {
          const col = i % cols
          const row = Math.floor(i / cols)
          const scale = Math.min((cellW - gap * 2) / el.width, (cellH - gap * 2) / el.height)
          el.width = Math.round(el.width * Math.min(scale, 1))
          el.height = Math.round(el.height * Math.min(scale, 1))
          el.x = Math.round(padding + col * cellW + (cellW - el.width) / 2)
          el.y = Math.round(padding + row * cellH + (cellH - el.height) / 2)
        })
        break
      }

      case 'sidebar-left': {
        const sidebarW = Math.round(availableW * 0.3)
        const mainEls = elements.filter((_, i) => i > 0).slice(1)
        const sidebarEls = elements.filter((_, i) => i === 0).slice(0, 1)

        if (elements[0]) {
          elements[0].x = padding
          elements[0].y = padding
          elements[0].width = Math.min(elements[0].width, sidebarW - gap)
          elements[0].height = Math.min(elements[0].height, availableH)
        }

        mainEls.forEach((el, i) => {
          el.x = Math.round(padding + sidebarW + 20)
          el.y = Math.round(padding + i * (availableH / Math.max(mainEls.length, 1)))
          el.width = Math.min(el.width, availableW - sidebarW - 40)
        })
        break
      }

      case 'sidebar-right': {
        const sidebarW = Math.round(availableW * 0.3)
        const mainEls = elements.filter((_, i) => i > 0).slice(1)
        const sidebarEls = elements.filter((_, i) => i === 0).slice(0, 1)

        if (elements[0]) {
          elements[0].x = Math.round(w - sidebarW - padding)
          elements[0].y = padding
          elements[0].width = Math.min(elements[0].width, sidebarW - gap)
          elements[0].height = Math.min(elements[0].height, availableH)
        }

        mainEls.forEach((el, i) => {
          el.x = padding
          el.y = Math.round(padding + i * (availableH / Math.max(mainEls.length, 1)))
          el.width = Math.min(el.width, availableW - sidebarW - 40)
        })
        break
      }

      case 'diagonal': {
        elements.forEach((el, i) => {
          const t = count > 1 ? i / (count - 1) : 0
          el.x = Math.round(padding + t * (availableW - el.width))
          el.y = Math.round(padding + t * (availableH - el.height))
        })
        break
      }

      case 'scattered': {
        // Balanced distribution using spiral-like approach
        const centerX = w / 2
        const centerY = h / 2
        const maxRadius = Math.min(availableW, availableH) / 2 - 50

        elements.forEach((el, i) => {
          if (count === 1) {
            el.x = centerX - el.width / 2
            el.y = centerY - el.height / 2
          } else {
            const angle = (2 * Math.PI * i) / count - Math.PI / 2
            const radius = maxRadius * 0.6 + (maxRadius * 0.4 * i) / count
            el.x = Math.round(centerX + Math.cos(angle) * radius - el.width / 2)
            el.y = Math.round(centerY + Math.sin(angle) * radius - el.height / 2)
          }
        })
        break
      }

      case 'golden-ratio': {
        const phi = 1.618033988749895
        elements.forEach((el, i) => {
          const t = i / Math.max(count - 1, 1)
          const grX = availableW / phi
          const grY = availableH / phi
          el.x = Math.round(padding + t * (availableW - grX - el.width) + grX)
          el.y = Math.round(padding + t * (availableH - grY - el.height) + grY)
        })
        break
      }

      case 'spiral': {
        const centerX = w / 2
        const centerY = h / 2

        elements.forEach((el, i) => {
          const angle = i * 0.5 // Increasing angle
          const radius = 30 + i * 25 // Increasing radius
          el.x = Math.round(centerX + Math.cos(angle) * radius - el.width / 2)
          el.y = Math.round(centerY + Math.sin(angle) * radius - el.height / 2)

          // Keep within bounds
          el.x = Math.max(padding, Math.min(w - el.width - padding, el.x))
          el.y = Math.max(padding, Math.min(h - el.height - padding, el.y))
        })
        break
      }

      default:
        break
    }

    // Update z-index
    elements.forEach((el, i) => {
      el.zIndex = i
    })
  }

  // Adapt slide to new aspect ratio (responsive)
  const adaptToAspectRatio = (
    elements: SlideElement[],
    fromRatio: string,
    toRatio: string,
    _fromW?: number,
    _fromH?: number
  ) => {
    const from = ASPECT_RATIOS.find(a => a.id === fromRatio) || ASPECT_RATIOS[0]
    const to = ASPECT_RATIOS.find(a => a.id === toRatio) || ASPECT_RATIOS[0]

    const fromW = _fromW || from.width
    const fromH = _fromH || from.height
    const scaleX = to.width / fromW
    const scaleY = to.height / fromH

    elements.forEach(el => {
      // Scale position
      el.x = Math.round(el.x * scaleX)
      el.y = Math.round(el.y * scaleY)
      // Scale size
      el.width = Math.round(el.width * scaleX)
      el.height = Math.round(el.height * scaleY)
    })

    activeAspectRatio.value = toRatio
  }

  // Scale all elements by a factor
  const scaleElements = (elements: SlideElement[], scale: number, canvasW?: number, canvasH?: number) => {
    const { width: cw, height: ch } = getCanvasDimensions()
    const w = canvasW || cw
    const h = canvasH || ch
    const centerX = w / 2
    const centerY = h / 2

    elements.forEach(el => {
      // Move relative to center
      el.x = Math.round(centerX + (el.x - centerX) * scale)
      el.y = Math.round(centerY + (el.y - centerY) * scale)
      // Scale size
      el.width = Math.round(el.width * scale)
      el.height = Math.round(el.height * scale)
    })
  }

  return {
    // State
    smartGridEnabled,
    smartGridSize,
    smartGridCols,
    smartGridRows,
    activeSmartLayout,
    activeAspectRatio,

    // Constants
    ASPECT_RATIOS,
    GRID_PRESETS,
    LAYOUT_PRESETS,

    // Methods
    snapToSmartGrid,
    snapElementToSmartGrid,
    autoBalanceElements,
    reflowTextContent,
    applySmartLayoutPreset,
    adaptToAspectRatio,
    scaleElements,
    getCanvasDimensions,
  }
}
