<template>
  <div class="font-selector">
    <label class="font-label">{{ label }}</label>
    <div class="font-grid">
      <button
        v-for="font in fonts"
        :key="font.value"
        :class="['font-option', { active: modelValue === font.value }]"
        :style="{ fontFamily: font.value }"
        @click="$emit('update:modelValue', font.value)"
      >
        <span class="font-name">{{ font.label }}</span>
        <span class="font-preview">ABC123</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
  label?: string
}>()

defineEmits<{
  'update:modelValue': [value: string]
}>()

const fonts = [
  { value: '思源黑体', label: '思源黑体' },
  { value: '思源宋体', label: '思源宋体' },
  { value: '微软雅黑', label: '微软雅黑' },
  { value: 'Arial', label: 'Arial' },
  { value: 'Helvetica', label: 'Helvetica' },
  { value: 'Times New Roman', label: 'Times New Roman' },
  { value: 'Georgia', label: 'Georgia' },
  { value: 'Verdana', label: 'Verdana' }
]
</script>

<style scoped>
.font-selector {
  width: 100%;
}

.font-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 12px;
  color: var(--text-secondary, #374151);
}

.font-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.font-option {
  padding: 12px;
  border: 2px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  background: var(--surface-color, #fff);
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}

.font-option:hover {
  border-color: var(--brand-primary, #165DFF);
  background: rgba(22, 93, 255, 0.02);
}

.font-option.active {
  border-color: var(--brand-primary, #165DFF);
  background: rgba(22, 93, 255, 0.05);
}

.font-name {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary, #111827);
  margin-bottom: 4px;
}

.font-preview {
  display: block;
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
}
</style>
