/**
 * useAccessibility - Accessibility utilities
 * - Reduce motion preference
 * - Keyboard focus management
 * - ARIA helpers
 */
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Singleton state
const reduceMotion = ref(localStorage.getItem('reduceMotion') === 'true')
const focusedElement = ref<HTMLElement | null>(null)

// Internal apply function
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

/**
 * Apply reduce motion setting to document.
 * Call this early in main.ts BEFORE mounting the Vue app.
 */
export function applyReduceMotionEarly() {
  const prefersReduced = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false
  const stored = localStorage.getItem('reduceMotion')
  if (stored !== null) {
    reduceMotion.value = stored === 'true'
  } else if (prefersReduced) {
    reduceMotion.value = true
  }
  applyReduceMotion()
}

export function useAccessibility() {
  const isReduceMotion = computed(() => reduceMotion.value)

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
    // Small delay to ensure screen reader picks it up
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

  // Listen for system preference changes (only in browser)
  onMounted(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('reduceMotion') === null) {
        reduceMotion.value = e.matches
        applyReduceMotion()
      }
    }
    mediaQuery.addEventListener('change', handleChange)
    ;(window as any).__reduceMotionMediaQuery = mediaQuery
  })

  onUnmounted(() => {
    const mq = (window as any).__reduceMotionMediaQuery
    if (mq) mq.removeEventListener('change', handleChange)
  })

  return {
    isReduceMotion,
    toggleReduceMotion,
    setReduceMotion,
    applyReduceMotion,
    trapFocus,
    handleEscape,
    announce,
    saveFocus,
    restoreFocus
  }
}
