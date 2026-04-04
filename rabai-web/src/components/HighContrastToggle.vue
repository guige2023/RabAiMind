<template>
  <button
    class="contrast-toggle"
    @click="toggle"
    :aria-pressed="isHighContrast"
    :aria-label="isHighContrast ? t('a11y.highContrastOn') : t('a11y.highContrastOff')"
    :title="isHighContrast ? t('a11y.highContrastOn') : t('a11y.highContrastOff')"
  >
    <span class="contrast-icon" aria-hidden="true">
      {{ isHighContrast ? '◐' : '◑' }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { useAccessibility } from '../composables/useAccessibility'
import { useI18n } from '../composables/useI18n'

const { isHighContrast, toggleHighContrast } = useAccessibility()
const { t } = useI18n()

const toggle = () => {
  toggleHighContrast()
}
</script>

<style scoped>
.contrast-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: rgba(255,255,255,0.1);
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}

.contrast-toggle:hover {
  background: rgba(255,255,255,0.2);
}

.contrast-toggle:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.contrast-icon {
  font-size: 18px;
  line-height: 1;
}

:root.dark .contrast-toggle {
  background: rgba(255,255,255,0.08);
}

:root.dark .contrast-toggle:hover {
  background: rgba(255,255,255,0.15);
}

/* High contrast mode styles */
:global(.high-contrast) .contrast-toggle {
  background: rgba(255,255,255,0.2);
  border: 2px solid currentColor;
}
</style>
