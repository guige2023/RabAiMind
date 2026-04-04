/**
 * useAccessibility - Accessibility utilities
 * - Reduce motion preference
 * - High contrast mode
 * - Font size control
 * - Keyboard focus management
 * - ARIA helpers
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Singleton state
const reduceMotion = ref(localStorage.getItem('reduceMotion') === 'true')
const highContrast = ref(localStorage.getItem('highContrast') === 'true')

type FontSize = 'small' | 'medium' | 'large'
const fontSize = ref<FontSize>((localStorage.getItem('fontSize') as FontSize) || 'medium')

const focusedElement = ref<HTMLElement | null>(null)

// Font size base multipliers
const FONT_SIZE_MAP: Record<FontSize, string> = {
  small: '13px',
  medium: '15px',
  large: '17px',
}

// Apply reduce motion setting to document
const applyReduceMotion = () => {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (reduceMotion.value) {
    root.classList.add('reduce-motion')
    root.style.setProperty('--animation-duration', '0.01ms')
    root.style.setProperty('--transition-duration', '0.01ms')
  } else {
    root.classList.remove('reduce-motion')
    root.style.removeProperty('--animation-duration')
    root.style.removeProperty('--transition-duration')
  }
}

// Apply high contrast mode to document
const applyHighContrast = () => {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (highContrast.value) {
    root.classList.add('high-contrast')
  } else {
    root.classList.remove('high-contrast')
  }
}

// Apply font size to document root
const applyFontSize = () => {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  root.style.setProperty('--base-font-size', FONT_SIZE_MAP[fontSize.value])
  root.style.fontSize = FONT_SIZE_MAP[fontSize.value]
}

/**
 * Apply all early accessibility settings to document.
 * Call this early in main.ts BEFORE mounting the Vue app.
 */
export function applyAccessibilityEarly() {
  if (typeof window === 'undefined') return

  // Reduce motion
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const storedMotion = localStorage.getItem('reduceMotion')
  if (storedMotion !== null) {
    reduceMotion.value = storedMotion === 'true'
  } else if (prefersReduced) {
    reduceMotion.value = true
  }
  applyReduceMotion()

  // High contrast
  const storedContrast = localStorage.getItem('highContrast')
  if (storedContrast !== null) {
    highContrast.value = storedContrast === 'true'
  }
  applyHighContrast()

  // Font size
  const storedFontSize = localStorage.getItem('fontSize') as FontSize
  if (storedFontSize && FONT_SIZE_MAP[storedFontSize]) {
    fontSize.value = storedFontSize
  }
  applyFontSize()
}

// Backward compatibility alias
export const applyReduceMotionEarly = applyAccessibilityEarly

export function useAccessibility() {
  const isReduceMotion = computed(() => reduceMotion.value)
  const isHighContrast = computed(() => highContrast.value)
  const currentFontSize = computed(() => fontSize.value)

  const toggleReduceMotion = () => {
    reduceMotion.value = !reduceMotion.value
    localStorage.setItem('reduceMotion', String(reduceMotion.value))
    applyReduceMotion()
  }

  const setReduceMotion = (value: boolean) => {
    reduceMotion.value = value
    localStorage.setItem('reduceMotion', String(value))
    applyReduceMotion()
  }

  const toggleHighContrast = () => {
    highContrast.value = !highContrast.value
    localStorage.setItem('highContrast', String(highContrast.value))
    applyHighContrast()
  }

  const setHighContrast = (value: boolean) => {
    highContrast.value = value
    localStorage.setItem('highContrast', String(value))
    applyHighContrast()
  }

  const setFontSize = (size: FontSize) => {
    fontSize.value = size
    localStorage.setItem('fontSize', size)
    applyFontSize()
  }

  // Trap focus within a container (modal/dialog)
  const trapFocus = (container: HTMLElement) => {
    const focusableSelectors = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ')

    const focusableElements = container.querySelectorAll<HTMLElement>(focusableSelectors)
    const first = focusableElements[0]
    const last = focusableElements[focusableElements.length - 1]

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }

    container.addEventListener('keydown', handleTab)
    first?.focus()

    return () => container.removeEventListener('keydown', handleTab)
  }

  // Handle Escape key on a container
  const handleEscape = (container: HTMLElement, onEscape: () => void) => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onEscape()
      }
    }
    container.addEventListener('keydown', handleEsc)
    return () => container.removeEventListener('keydown', handleEsc)
  }

  // Announce message to screen readers
  const announce = (message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    const el = document.createElement('div')
    el.setAttribute('aria-live', politeness)
    el.setAttribute('aria-atomic', 'true')
    el.setAttribute('role', 'status')
    el.className = 'sr-only'
    el.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);'
    document.body.appendChild(el)
    setTimeout(() => {
      el.textContent = message
      setTimeout(() => document.body.removeChild(el), 1000)
    }, 50)
  }

  // Save/restore focus for modal-like UI
  const saveFocus = () => {
    focusedElement.value = document.activeElement as HTMLElement
  }

  const restoreFocus = () => {
    if (focusedElement.value && typeof focusedElement.value.focus === 'function') {
      focusedElement.value.focus()
    }
  }

  // Listen for system preference changes
  const motionQuery = typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)') : null
  const handleMotionChange = (e: MediaQueryListEvent) => {
    if (localStorage.getItem('reduceMotion') === null) {
      reduceMotion.value = e.matches
      applyReduceMotion()
    }
  }

  onMounted(() => {
    if (motionQuery) {
      motionQuery.addEventListener('change', handleMotionChange)
      ;(window as any).__reduceMotionMediaQuery = motionQuery
    }
  })

  onUnmounted(() => {
    const mq = (window as any).__reduceMotionMediaQuery
    if (mq) mq.removeEventListener('change', handleMotionChange)
  })

  return {
    isReduceMotion,
    isHighContrast,
    currentFontSize,
    toggleReduceMotion,
    setReduceMotion,
    toggleHighContrast,
    setHighContrast,
    setFontSize,
    applyHighContrast,
    applyReduceMotion,
    trapFocus,
    handleEscape,
    announce,
    saveFocus,
    restoreFocus
  }
}
