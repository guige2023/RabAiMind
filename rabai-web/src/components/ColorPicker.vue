<template>
  <div class="color-picker">
    <div class="color-preview" :style="{ background: modelValue }"></div>
    <input
      type="color"
      :value="modelValue"
      @input="onInput"
      class="color-input"
    />
    <span class="color-hex">{{ modelValue }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const onInput = (e: Event) => {
  const target = e.target as HTMLInputElement
  emit('update:modelValue', target.value)
}
</script>

<style scoped>
.color-picker {
  display: flex;
  align-items: center;
  gap: 8px;
}
.color-preview {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid #ddd;
}
.color-input {
  width: 40px;
  height: 24px;
  padding: 0;
  border: none;
  cursor: pointer;
}
.color-hex {
  font-family: monospace;
  font-size: 12px;
  color: #666;
}
</style>
