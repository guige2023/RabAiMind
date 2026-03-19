// Accessibility utilities - 无障碍访问支持
import { ref, onMounted, onUnmounted } from 'vue'

// Focus trap for modals
export const useFocusTrap = (containerRef: { value: HTMLElement | null }) => {
  const focusableElements = ref<HTMLElement[]>([])
  const firstFocusable = ref<HTMLElement | null>(null)
  const lastFocusable = ref<HTMLElement | null>(null)

  const updateFocusableElements = () => {
    if (!containerRef.value) return

    const focusableSelectors = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])'
    ].join(', ')

    focusableElements.value = Array.from(
      containerRef.value.querySelectorAll(focusableSelectors)
    ) as HTMLElement[]

    firstFocusable.value = focusableElements.value[0] || null
    lastFocusable.value = focusableElements.value[focusableElements.value.length - 1] || null
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return

    if (e.shiftKey) {
      if (document.activeElement === firstFocusable.value) {
        e.preventDefault()
        lastFocusable.value?.focus()
      }
    } else {
      if (document.activeElement === lastFocusable.value) {
        e.preventDefault()
        firstFocusable.value?.focus()
      }
    }
  }

  onMounted(() => {
    updateFocusableElements()
    firstFocusable.value?.focus()
    document.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyDown)
  })

  return {
    updateFocusableElements
  }
}

// Announce to screen readers
export const useLiveRegion = () => {
  const announcement = ref('')
  const region = ref<HTMLElement | null>(null)

  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
    if (!region.value) {
      // Create region if not exists
      const el = document.createElement('div')
      el.setAttribute('role', 'status')
      el.setAttribute('aria-live', priority)
      el.setAttribute('aria-atomic', 'true')
      el.className = 'sr-only'
      el.style.cssText = `
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      `
      document.body.appendChild(el)
      region.value = el
    }

    // Clear and set new message
    region.value.textContent = ''
    setTimeout(() => {
      if (region.value) {
        region.value.textContent = message
      }
    }, 100)
  }

  return {
    announcement,
    announce
  }
}

// Skip link handler
export const useSkipLink = () => {
  const mainContentId = 'main-content'

  const setupSkipLink = () => {
    // Find or create skip link
    let skipLink = document.getElementById('skip-link')

    if (!skipLink) {
      skipLink = document.createElement('a')
      skipLink.id = 'skip-link'
      skipLink.href = `#${mainContentId}`
      skipLink.textContent = '跳到主要内容'
      skipLink.style.cssText = `
        position: absolute;
        top: -40px;
        left: 0;
        background: #165DFF;
        color: white;
        padding: 8px 16px;
        z-index: 100;
        transition: top 0.2s;
      `
      document.body.insertBefore(skipLink, document.body.firstChild)
    }

    // Handle skip link click
    skipLink.addEventListener('click', (e) => {
      e.preventDefault()
      const target = document.getElementById(mainContentId)
      if (target) {
        target.focus()
        skipLink?.remove()
      }
    })

    return mainContentId
  }

  return {
    mainContentId,
    setupSkipLink
  }
}

// Reduced motion preference
export const usePrefersReducedMotion = () => {
  const prefersReducedMotion = ref(false)

  onMounted(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    prefersReducedMotion.value = mediaQuery.matches

    const handler = (e: MediaQueryListEvent) => {
      prefersReducedMotion.value = e.matches
    }

    mediaQuery.addEventListener('change', handler)

    onUnmounted(() => {
      mediaQuery.removeEventListener('change', handler)
    })
  })

  return prefersReducedMotion
}

// High contrast mode detection
export const useHighContrastMode = () => {
  const isHighContrast = ref(false)

  onMounted(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: more)')
    isHighContrast.value = mediaQuery.matches

    const handler = (e: MediaQueryListEvent) => {
      isHighContrast.value = e.matches
    }

    mediaQuery.addEventListener('change', handler)

    onUnmounted(() => {
      mediaQuery.removeEventListener('change', handler)
    })
  })

  return isHighContrast
}

// ARIA attributes helper
export const ariaAttributes = {
  // Button
  button: {
    role: 'button',
    tabindex: '0'
  },

  // Dialog
  dialog: {
    role: 'dialog',
    'aria-modal': 'true',
    'aria-labelledby': '',
    'aria-describedby': ''
  },

  // Navigation
  navigation: {
    role: 'navigation',
    'aria-label': ''
  },

  // Live region
  liveRegion: {
    role: 'status',
    'aria-live': 'polite',
    'aria-atomic': 'true'
  },

  // Form field
  formField: {
    role: 'group',
    'aria-labelledby': ''
  },

  // Listbox
  listbox: {
    role: 'listbox',
    'aria-orientation': 'vertical'
  },

  // Option
  option: {
    role: 'option',
    tabindex: '-1'
  }
}

// Generate unique IDs for ARIA
let idCounter = 0
export const generateId = (prefix = 'id'): string => {
  return `${prefix}-${++idCounter}`
}

export default {
  useFocusTrap,
  useLiveRegion,
  useSkipLink,
  usePrefersReducedMotion,
  useHighContrastMode,
  ariaAttributes,
  generateId
}
