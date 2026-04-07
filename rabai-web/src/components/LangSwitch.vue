<template>
  <div
    class="lang-switch"
    ref="containerRef"
    role="combobox"
    aria-haspopup="listbox"
    :aria-expanded="showDropdown"
    :aria-label="t('a11y.language')"
  >
    <button
      class="lang-trigger"
      @click="toggleDropdown"
      @keydown.down.prevent="openAndFocusFirst"
      @keydown.up.prevent="openAndFocusLast"
      @keydown.escape="closeDropdown"
      :aria-expanded="showDropdown"
      :aria-haspopup="true"
    >
      <span class="lang-icon" aria-hidden="true">🌐</span>
      <span class="lang-current">{{ currentLocaleOption.nativeName }}</span>
      <span class="lang-arrow" aria-hidden="true">{{ showDropdown ? '▲' : '▼' }}</span>
    </button>

    <Transition name="dropdown">
      <ul
        v-if="showDropdown"
        class="lang-dropdown"
        role="listbox"
        :aria-label="t('a11y.language')"
        ref="listRef"
      >
        <li
          v-for="locale in LOCALES"
          :key="locale.code"
          class="lang-option"
          :class="{ active: currentLocale === locale.code }"
          role="option"
          :aria-selected="currentLocale === locale.code"
          :tabindex="0"
          @click="setLang(locale.code)"
          @keydown.enter.prevent="setLang(locale.code)"
          @keydown.space.prevent="setLang(locale.code)"
          @keydown.escape="closeDropdown"
          @keydown.down.prevent="moveFocus(1)"
          @keydown.up.prevent="moveFocus(-1)"
        >
          <span class="lang-option-native">{{ locale.nativeName }}</span>
          <span class="lang-option-name">{{ locale.name }}</span>
          <span v-if="currentLocale === locale.code" class="lang-option-check" aria-hidden="true">✓</span>
        </li>
      </ul>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n, LOCALES, type LocaleOption } from '../composables/useI18n'

const { currentLocale, currentLocaleOption, setLocale, t, localeName } = useI18n()
const showDropdown = ref(false)
const listRef = ref<HTMLElement | null>(null)
const containerRef = ref<HTMLElement | null>(null)

const toggleDropdown = () => {
  showDropdown.value = !showDropdown.value
}

const openAndFocusFirst = () => {
  showDropdown.value = true
  nextTick(() => {
    const first = listRef.value?.querySelector<HTMLElement>('[role="option"]')
    first?.focus()
  })
}

const openAndFocusLast = () => {
  showDropdown.value = true
  nextTick(() => {
    const options = listRef.value?.querySelectorAll<HTMLElement>('[role="option"]')
    options?.[options.length - 1]?.focus()
  })
}

const closeDropdown = () => {
  showDropdown.value = false
}

const setLang = (code: Locale) => {
  setLocale(code)
  showDropdown.value = false
}

const moveFocus = (direction: 1 | -1) => {
  const options = listRef.value?.querySelectorAll<HTMLElement>('[role="option"]')
  if (!options) return
  const current = document.activeElement as HTMLElement
  const idx = Array.from(options).indexOf(current)
  const next = idx + direction
  if (next >= 0 && next < options.length) {
    options[next].focus()
  } else if (next < 0) {
    options[options.length - 1].focus()
  } else {
    options[0].focus()
  }
}

const handleClickOutside = (e: MouseEvent) => {
  if (!containerRef.value?.contains(e.target as Node)) {
    showDropdown.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.lang-switch {
  position: relative;
}

.lang-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 6px;
  background: rgba(255,255,255,0.1);
  color: #fff;
  font-size: 14px;
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}

.lang-trigger:hover {
  background: rgba(255,255,255,0.2);
}

.lang-trigger:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.lang-icon {
  font-size: 16px;
}

.lang-arrow {
  font-size: 10px;
  opacity: 0.7;
}

.lang-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: var(--white);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  overflow: hidden;
  z-index: 1000;
  list-style: none;
  padding: 6px 0;
  min-width: 160px;
}

.lang-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 0.15s;
}

.lang-option:focus-visible {
  outline: none;
  background: var(--gray-100);
}

.lang-option:hover {
  background: var(--gray-100);
}

.lang-option.active {
  background: #e6f0ff;
}

.lang-option-native {
  font-size: 15px;
  color: var(--gray-700);
  font-weight: 500;
}

.lang-option-name {
  font-size: 12px;
  color: var(--gray-300);
  margin-left: auto;
}

.lang-option-check {
  color: var(--primary);
  font-size: 14px;
  margin-left: 4px;
}

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* Dark mode */
:root.dark .lang-trigger {
  background: rgba(255,255,255,0.08);
}

:root.dark .lang-dropdown {
  background: var(--gray-900);
  border: 1px solid var(--gray-200);
}

:root.dark .lang-option-native {
  color: var(--gray-100);
}

:root.dark .lang-option.active {
  background: rgba(22, 93, 255, 0.15);
}

/* Reduce motion */
.reduce-motion .dropdown-enter-active,
.reduce-motion .dropdown-leave-active {
  transition: none;
}
</style>
