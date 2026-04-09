<template>
  <div class="brand-card" @click="$emit('click')">
    <div class="brand-card-header">
      <div class="brand-logo" v-if="brand.logo_url">
        <img :src="brand.logo_url" :alt="brand.name" />
      </div>
      <div class="brand-logo-placeholder" v-else>
        <span class="logo-icon">🛡️</span>
      </div>
      <div class="brand-info">
        <h4 class="brand-name">{{ brand.name }}</h4>
        <span class="brand-id">{{ brand.brand_id }}</span>
      </div>
    </div>

    <div class="brand-card-colors">
      <div class="color-preview">
        <span
          class="color-dot primary"
          :style="{ background: brand.primary_color }"
          :title="brand.primary_color"
        ></span>
        <span class="color-label">主色</span>
      </div>
      <div class="color-preview">
        <span
          class="color-dot secondary"
          :style="{ background: brand.secondary_color }"
          :title="brand.secondary_color"
        ></span>
        <span class="color-label">辅色</span>
      </div>
    </div>

    <div class="brand-card-footer">
      <span class="font-preview" :style="{ fontFamily: brand.font_family }">
        {{ brand.font_family }}
      </span>
      <div class="brand-actions">
        <button class="action-btn edit" @click.stop="$emit('edit', brand)" title="编辑">
          ✏️
        </button>
        <button class="action-btn delete" @click.stop="$emit('delete', brand)" title="删除">
          🗑️
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Brand } from '../utils/types'

defineProps<{
  brand: Brand
}>()

defineEmits<{
  click: []
  edit: [brand: Brand]
  delete: [brand: Brand]
}>()
</script>

<style scoped>
.brand-card {
  background: var(--surface-color, #fff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.brand-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.brand-card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.brand-logo {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--bg-color, #f9fafb);
  display: flex;
  align-items: center;
  justify-content: center;
}

.brand-logo img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.brand-logo-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: linear-gradient(135deg, var(--brand-primary, #165DFF) 0%, var(--brand-secondary, #0E42D2) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-icon {
  font-size: 24px;
}

.brand-info {
  flex: 1;
  min-width: 0;
}

.brand-name {
  font-size: 16px;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary, #111827);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.brand-id {
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
}

.brand-card-colors {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.color-preview {
  display: flex;
  align-items: center;
  gap: 6px;
}

.color-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.color-label {
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
}

.brand-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 12px;
  border-top: 1px solid var(--border-color, #e5e7eb);
}

.font-preview {
  font-size: 13px;
  color: var(--text-secondary, #6b7280);
  max-width: 120px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.brand-actions {
  display: flex;
  gap: 8px;
}

.action-btn {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 6px;
  background: var(--bg-color, #f9fafb);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--border-color, #e5e7eb);
}

.action-btn.delete:hover {
  background: #fee2e2;
}
</style>
