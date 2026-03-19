// useDrag.ts - 拖拽模块
import { ref, onMounted, onUnmounted } from 'vue'

export interface DragOptions {
  onDragStart?: () => void
  onDrag?: (x: number, y: number) => void
  onDragEnd?: () => void
}

export function useDrag(options: DragOptions = {}) {
  const isDragging = ref(false)
  const position = ref({ x: 0, y: 0 })
  const startPosition = ref({ x: 0, y: 0 })

  const handleMouseDown = (e: MouseEvent) => {
    isDragging.value = true
    startPosition.value = { x: e.clientX, y: e.clientY }
    options.onDragStart?.()
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.value) return
    const dx = e.clientX - startPosition.value.x
    const dy = e.clientY - startPosition.value.y
    position.value = { x: dx, y: dy }
    options.onDrag?.(dx, dy)
  }

  const handleMouseUp = () => {
    isDragging.value = false
    options.onDragEnd?.()
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
  }

  const reset = () => {
    position.value = { x: 0, y: 0 }
  }

  return { isDragging, position, startPosition, handleMouseDown, reset }
}

export default useDrag
