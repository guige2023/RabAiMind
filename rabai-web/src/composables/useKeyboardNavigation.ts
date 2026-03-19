// Keyboard navigation utility for Vue

import { onMounted, onUnmounted } from 'vue'

interface KeyboardNavigationOptions {
  selector: string
  orientation?: 'vertical' | 'horizontal' | 'grid'
  loop?: boolean
  onActivate?: (element: HTMLElement) => void
}

export function useKeyboardNavigation(options: KeyboardNavigationOptions) {
  const { selector, orientation = 'vertical', loop = true, onActivate } = options

  const getFocusableElements = (): HTMLElement[] => {
    return Array.from(document.querySelectorAll(selector))
      .filter((el): el is HTMLElement => el instanceof HTMLElement && el.offsetParent !== null)
  }

  const getCurrentIndex = (): number => {
    const elements = getFocusableElements()
    const active = document.activeElement as HTMLElement
    return elements.indexOf(active)
  }

  const focusNext = () => {
    const elements = getFocusableElements()
    if (elements.length === 0) return

    const currentIndex = getCurrentIndex()
    let nextIndex: number

    if (currentIndex === -1) {
      nextIndex = 0
    } else if (orientation === 'vertical') {
      nextIndex = currentIndex < elements.length - 1 ? currentIndex + 1 : (loop ? 0 : currentIndex)
    } else if (orientation === 'horizontal') {
      nextIndex = currentIndex < elements.length - 1 ? currentIndex + 1 : (loop ? 0 : currentIndex)
    } else {
      // Grid - move to next row
      const columns = Math.ceil(Math.sqrt(elements.length))
      nextIndex = currentIndex + columns
      if (nextIndex >= elements.length) {
        nextIndex = loop ? nextIndex % elements.length : elements.length - 1
      }
    }

    elements[nextIndex]?.focus()
  }

  const focusPrev = () => {
    const elements = getFocusableElements()
    if (elements.length === 0) return

    const currentIndex = getCurrentIndex()
    let prevIndex: number

    if (currentIndex === -1 || currentIndex === 0) {
      prevIndex = loop ? elements.length - 1 : 0
    } else if (orientation === 'vertical' || orientation === 'horizontal') {
      prevIndex = currentIndex - 1
    } else {
      // Grid
      const columns = Math.ceil(Math.sqrt(elements.length))
      prevIndex = currentIndex - columns
      if (prevIndex < 0) {
        prevIndex = loop ? elements.length + prevIndex : 0
      }
    }

    elements[prevIndex]?.focus()
  }

  const handleKeydown = (event: KeyboardEvent) => {
    switch (event.key) {
      case 'ArrowDown':
      case 'j':
        if (orientation === 'vertical' || orientation === 'grid') {
          event.preventDefault()
          focusNext()
        }
        break

      case 'ArrowUp':
      case 'k':
        if (orientation === 'vertical' || orientation === 'grid') {
          event.preventDefault()
          focusPrev()
        }
        break

      case 'ArrowRight':
      case 'l':
        if (orientation === 'horizontal' || orientation === 'grid') {
          event.preventDefault()
          focusNext()
        }
        break

      case 'ArrowLeft':
      case 'h':
        if (orientation === 'horizontal' || orientation === 'grid') {
          event.preventDefault()
          focusPrev()
        }
        break

      case 'Enter':
      case ' ':
        const active = document.activeElement as HTMLElement
        if (active && onActivate) {
          event.preventDefault()
          onActivate(active)
        }
        break

      case 'Home':
        event.preventDefault()
        getFocusableElements()[0]?.focus()
        break

      case 'End':
        event.preventDefault()
        const elements = getFocusableElements()
        elements[elements.length - 1]?.focus()
        break
    }
  }

  onMounted(() => {
    document.addEventListener('keydown', handleKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeydown)
  })

  return {
    focusNext,
    focusPrev,
    getFocusableElements
  }
}

// Focus visible styles
export const focusVisibleStyles = `
  :focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }

  :focus:not(:focus-visible) {
    outline: none;
  }
`
