<template>
  <button
    class="theme-switch"
    @click="toggleTheme"
    :aria-label="isDark ? '切换到亮色模式' : '切换到暗色模式'"
    :aria-pressed="isDark"
  >
    <span class="theme-icon" aria-hidden="true">{{ isDark ? '🌙' : '☀️' }}</span>
  </button>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isDark = ref(false)

const toggleTheme = () => {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

onMounted(() => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    isDark.value = true
    document.documentElement.classList.add('dark')
  }
})
</script>

<style scoped>
.theme-switch {
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  transition: all 0.3s;
}

.theme-switch:hover {
  background: rgba(255,255,255,0.2);
}

.theme-icon {
  font-size: 18px;
}
</style>
