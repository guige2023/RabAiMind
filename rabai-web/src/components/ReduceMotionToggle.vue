<template>
  <button
    class="motion-toggle"
    @click="toggle"
    :aria-pressed="isReduceMotion"
    :aria-label="isReduceMotion ? t('a11y.reduceMotionOn') : t('a11y.reduceMotionOff')"
    :title="isReduceMotion ? t('a11y.reduceMotionOn') : t('a11y.reduceMotionOff')"
  >
    <span class="motion-icon" aria-hidden="true">
      {{ isReduceMotion ? '⏸' : '▶' }}
    </span>
  </button>
</template>

<script setup lang="ts">
import { useAccessibility } from '../composables/useAccessibility'
import { useI18n } from '../composables/useI18n'

const { isReduceMotion, toggleReduceMotion } = useAccessibility()
const { t } = useI18n()

const toggle = () => {
  toggleReduceMotion()
}
</script>

<style scoped>
.motion-toggle {
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

.motion-toggle:hover {
  background: rgba(255,255,255,0.2);
}

.motion-toggle:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.motion-icon {
  font-size: 16px;
}

:root.dark .motion-toggle {
  background: rgba(255,255,255,0.08);
}

:root.dark .motion-toggle:hover {
  background: rgba(255,255,255,0.15);
}
</style>
