<template>
  <Teleport to="body">
    <Transition name="tips-slide">
      <div v-if="isOpen" class="tips-panel">
        <!-- Header -->
        <div class="tips-header">
          <div class="tips-title">
            <span class="tips-icon">⌨️</span>
            <span>快捷键</span>
          </div>
          <button class="tips-close" @click="close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Category Tabs -->
        <div class="tips-tabs">
          <button
            v-for="cat in categories"
            :key="cat.id"
            class="tips-tab"
            :class="{ active: activeCategory === cat.id }"
            @click="activeCategory = cat.id"
          >
            {{ cat.icon }} {{ cat.name }}
          </button>
        </div>

        <!-- Shortcut List -->
        <div class="tips-content">
          <div class="shortcut-group">
            <div
              v-for="action in filteredActions"
              :key="action.id"
              class="shortcut-row"
            >
              <span class="shortcut-desc">{{ action.name }}</span>
              <kbd>{{ action.shortcut }}</kbd>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="tips-footer">
          <span>按 <kbd>?</kbd> 或 <kbd>Ctrl+/</kbd> 快速打开</span>
        </div>
      </div>
    </Transition>

    <!-- Floating Trigger Button -->
    <Transition name="fab-fade">
      <button
        v-if="!isOpen"
        class="tips-fab"
        @click="open"
        title="快捷键提示"
      >
        <span>⌨️</span>
      </button>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { defaultEditActions, type EditAction } from '../composables/useEditingExperienceOptimizer'

const isOpen = ref(false)
const activeCategory = ref('all')

const categories = [
  { id: 'all', name: '全部', icon: '📋' },
  { id: 'edit', name: '编辑', icon: '✏️' },
  { id: 'format', name: '格式', icon: '🎨' },
  { id: 'view', name: '视图', icon: '👁️' },
  { id: 'slide', name: '幻灯片', icon: '📑' }
]

const filteredActions = computed(() => {
  if (activeCategory.value === 'all') {
    return defaultEditActions
  }
  return defaultEditActions.filter(a => a.category === activeCategory.value)
})

const open = () => { isOpen.value = true }
const close = () => { isOpen.value = false }
const toggle = () => { isOpen.value = !isOpen.value }

defineExpose({ open, close, toggle })
</script>

<style scoped>
.tips-panel {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 320px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  z-index: 9998;
  overflow: hidden;
  border: 1px solid rgba(22, 93, 255, 0.1);
}

:global(.dark) .tips-panel {
  background: #1a1a1a;
  border-color: rgba(255, 255, 255, 0.1);
}

/* Header */
.tips-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

:global(.dark) .tips-header {
  border-color: rgba(255, 255, 255, 0.08);
}

.tips-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

:global(.dark) .tips-title {
  color: #fff;
}

.tips-icon {
  font-size: 18px;
}

.tips-close {
  width: 28px;
  height: 28px;
  border: none;
  background: #f0f0f0;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.tips-close:hover {
  background: #e0e0e0;
}

:global(.dark) .tips-close {
  background: #2a2a2a;
}

:global(.dark) .tips-close:hover {
  background: #333;
}

.tips-close svg {
  width: 14px;
  height: 14px;
  color: #666;
}

/* Tabs */
.tips-tabs {
  display: flex;
  gap: 4px;
  padding: 8px 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  overflow-x: auto;
}

:global(.dark) .tips-tabs {
  border-color: rgba(255, 255, 255, 0.08);
}

.tips-tab {
  padding: 6px 12px;
  border: none;
  background: transparent;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  color: #666;
  transition: all 0.2s;
}

:global(.dark) .tips-tab {
  color: #aaa;
}

.tips-tab:hover {
  background: #f0f0f0;
}

:global(.dark) .tips-tab:hover {
  background: #2a2a2a;
}

.tips-tab.active {
  background: #165DFF;
  color: white;
}

/* Content */
.tips-content {
  max-height: 320px;
  overflow-y: auto;
  padding: 8px 12px;
}

.shortcut-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.shortcut-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 8px;
  transition: background 0.15s;
}

.shortcut-row:hover {
  background: #f5f5f5;
}

:global(.dark) .shortcut-row:hover {
  background: #2a2a2a;
}

.shortcut-desc {
  font-size: 13px;
  color: #333;
}

:global(.dark) .shortcut-desc {
  color: #ddd;
}

kbd {
  padding: 3px 8px;
  background: #e8e8e8;
  border-radius: 4px;
  font-size: 11px;
  font-family: monospace;
  color: #555;
  border: 1px solid #d0d0d0;
}

:global(.dark) kbd {
  background: #2a2a2a;
  border-color: #444;
  color: #ccc;
}

/* Footer */
.tips-footer {
  padding: 10px 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  text-align: center;
  font-size: 11px;
  color: #999;
}

:global(.dark) .tips-footer {
  border-color: rgba(255, 255, 255, 0.08);
  color: #666;
}

.tips-footer kbd {
  padding: 2px 5px;
  font-size: 10px;
}

/* FAB */
.tips-fab {
  position: fixed;
  bottom: 24px;
  right: 24px;
  width: 48px;
  height: 48px;
  background: #165DFF;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(22, 93, 255, 0.3);
  transition: all 0.2s;
  z-index: 9997;
}

.tips-fab:hover {
  transform: scale(1.1);
  box-shadow: 0 6px 20px rgba(22, 93, 255, 0.4);
}

.tips-fab span {
  font-size: 22px;
}

/* Transitions */
.tips-slide-enter-active,
.tips-slide-leave-active {
  transition: all 0.3s ease;
}

.tips-slide-enter-from,
.tips-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

.fab-fade-enter-active,
.fab-fade-leave-active {
  transition: opacity 0.2s;
}

.fab-fade-enter-from,
.fab-fade-leave-to {
  opacity: 0;
}
</style>
