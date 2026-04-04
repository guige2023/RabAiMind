<template>
  <div class="theme-switch-wrapper" ref="containerRef">
    <button
      class="theme-switch"
      @click="cycleTheme"
      :aria-label="t('a11y.theme') + ': ' + currentLabel"
      :aria-expanded="showMenu"
      aria-haspopup="true"
      aria-controls="theme-menu"
    >
      <span class="theme-icon" aria-hidden="true">{{ currentIcon }}</span>
    </button>
    <Transition name="theme-dropdown">
      <div
        v-if="showMenu"
        id="theme-menu"
        class="theme-menu"
        role="menu"
        ref="menuRef"
        aria-label="theme-menu"
      >
        <button
          v-for="(opt, idx) in options"
          :key="opt.value"
          class="theme-menu-item"
          :class="{ active: themeMode === opt.value }"
          role="menuitem"
          :aria-checked="themeMode === opt.value"
          :tabindex="0"
          @click.stop="setTheme(opt.value)"
          @keydown.enter.stop="setTheme(opt.value)"
          @keydown.space.stop.prevent="setTheme(opt.value)"
          @keydown.escape.stop="closeMenu"
          @keydown.tab.stop="closeMenu"
          @keydown.down.prevent="moveFocus(1, idx)"
          @keydown.up.prevent="moveFocus(-1, idx)"
        >
          <span class="item-icon" aria-hidden="true">{{ opt.icon }}</span>
          <span class="item-label">{{ opt.label }}</span>
          <span v-if="themeMode === opt.value" class="item-check" aria-hidden="true">✓</span>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from '../composables/useI18n'

type ThemeMode = 'light' | 'dark' | 'auto'

const { t } = useI18n()
const themeMode = ref<ThemeMode>('auto')
const showMenu = ref(false)
const containerRef = ref<HTMLElement | null>(null)
const menuRef = ref<HTMLElement | null>(null)

const options = computed(() => [
  { value: 'light' as ThemeMode, label: t('theme.light'), icon: '☀️' },
  { value: 'dark' as ThemeMode, label: t('theme.dark'), icon: '🌙' },
  { value: 'auto' as ThemeMode, label: t('theme.auto'), icon: '⚙️' }
])

const currentIcon = computed(() => {
  if (themeMode.value === 'dark') return '🌙'
  if (themeMode.value === 'light') return '☀️'
  return '💻'
})

const currentLabel = computed(() => {
  return options.value.find(o => o.value === themeMode.value)?.label || ''
})

const setTheme = (mode: ThemeMode) => {
  themeMode.value = mode
  applyTheme(mode)
  localStorage.setItem('themeMode', mode)
  closeMenu()
}

const cycleTheme = () => {
  showMenu.value = !showMenu.value
}

const closeMenu = () => {
  showMenu.value = false
}

const moveFocus = (direction: 1 | -1, currentIdx: number) => {
  const items = menuRef.value?.querySelectorAll<HTMLElement>('[role="menuitem"]')
  if (!items) return
  const nextIdx = (currentIdx + direction + items.length) % items.length
  items[nextIdx]?.focus()
}

const applyTheme = (mode: ThemeMode) => {
  const root = document.documentElement
  if (mode === 'dark') {
    root.classList.add('dark')
    root.classList.remove('theme-auto')
  } else if (mode === 'light') {
    root.classList.remove('dark', 'theme-auto')
  } else {
    root.classList.remove('dark')
    root.classList.add('theme-auto')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (prefersDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }
}

const handleMediaChange = (e: MediaQueryListEvent) => {
  if (themeMode.value === 'auto') {
    if (e.matches) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }
}

const handleClickOutside = (e: MouseEvent) => {
  const target = e.target as Element
  if (!target.closest('.theme-switch-wrapper')) {
    showMenu.value = false
  }
}

onMounted(() => {
  const saved = localStorage.getItem('themeMode') as ThemeMode | null
  if (saved && options.value.some(o => o.value === saved)) {
    themeMode.value = saved
  }
  applyTheme(themeMode.value)

  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
  mediaQuery.addEventListener('change', handleMediaChange)
  document.addEventListener('click', handleClickOutside)

  ;(window as any).__themeMediaQuery = mediaQuery
})

onBeforeUnmount(() => {
  const mq = (window as any).__themeMediaQuery
  if (mq) mq.removeEventListener('change', handleMediaChange)
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.theme-switch-wrapper {
  position: relative;
}

.theme-switch {
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  transition: background 0.3s;
  border: none;
}

.theme-switch:hover {
  background: rgba(255,255,255,0.2);
}

.theme-switch:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.theme-icon {
  font-size: 18px;
}

.theme-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: var(--white);
  border: 1px solid var(--gray-200);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  min-width: 160px;
  z-index: 100;
  overflow: hidden;
  padding: 6px 0;
}

.theme-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  cursor: pointer;
  font-size: 14px;
  color: var(--gray-700);
  transition: background 0.15s;
}

.theme-menu-item:focus-visible {
  outline: none;
  background: var(--gray-100);
}

.theme-menu-item:hover {
  background: var(--gray-100);
}

.theme-menu-item.active {
  color: var(--primary);
  font-weight: 600;
}

.item-icon {
  font-size: 16px;
  width: 24px;
  text-align: center;
}

.item-label {
  flex: 1;
  text-align: left;
}

.item-check {
  color: var(--primary);
  font-size: 14px;
}

/* Dark mode overrides for menu */
:root.dark .theme-menu {
  background: var(--gray-900);
  border-color: var(--gray-200);
}

:root.dark .theme-menu-item {
  color: var(--gray-100);
}

:root.dark .theme-menu-item:hover,
:root.dark .theme-menu-item:focus-visible {
  background: var(--gray-800);
}

/* Dropdown transition */
.theme-dropdown-enter-active,
.theme-dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.theme-dropdown-enter-from,
.theme-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Reduce motion */
.reduce-motion .theme-dropdown-enter-active,
.reduce-motion .theme-dropdown-leave-active {
  transition: none;
}
</style>
