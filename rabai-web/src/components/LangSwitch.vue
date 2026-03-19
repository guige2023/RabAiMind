<template>
  <div class="lang-switch" @click="toggleLang" @keydown.escape="showDropdown = false" role="combobox" aria-haspopup="listbox" :aria-expanded="showDropdown" aria-label="选择语言">
    <span class="current-lang">{{ currentLangText }}</span>
    <div class="lang-dropdown" v-if="showDropdown" role="listbox">
      <div
        v-for="lang in languages"
        :key="lang.code"
        class="lang-option"
        :class="{ active: currentLang === lang.code }"
        @click.stop="setLang(lang.code)"
        role="option"
        :aria-selected="currentLang === lang.code"
      >
        {{ lang.name }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const currentLang = ref(localStorage.getItem('lang') || 'zh')
const showDropdown = ref(false)

const languages = [
  { code: 'zh', name: '中文' },
  { code: 'en', name: 'English' }
]

const currentLangText = computed(() => {
  return languages.find(l => l.code === currentLang.value)?.name || '中文'
})

const toggleLang = () => {
  showDropdown.value = !showDropdown.value
}

const setLang = (code: string) => {
  currentLang.value = code
  localStorage.setItem('lang', code)
  showDropdown.value = false
  // 刷新页面以应用语言
  window.location.reload()
}
</script>

<style scoped>
.lang-switch {
  position: relative;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  background: rgba(255,255,255,0.1);
  color: #fff;
  font-size: 14px;
}

.lang-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 8px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  overflow: hidden;
  z-index: 100;
}

.lang-option {
  padding: 10px 20px;
  color: #333;
  font-size: 14px;
  white-space: nowrap;
}

.lang-option:hover {
  background: #f5f5f5;
}

.lang-option.active {
  background: #e6f0ff;
  color: #165DFF;
}
</style>
