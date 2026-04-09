<template>
  <div class="brand-form">
    <div class="form-section">
      <h3>基本信息</h3>
      <div class="form-item">
        <label>品牌名称 *</label>
        <input
          v-model="formData.name"
          type="text"
          placeholder="例如：我的公司"
          required
        />
      </div>
    </div>

    <div class="form-section">
      <h3>LOGO 设置</h3>
      <div
        class="logo-upload-area"
        @click="triggerLogoUpload"
        @dragover.prevent
        @drop.prevent="handleLogoDrop"
      >
        <input ref="logoInput" type="file" accept="image/*" style="display:none" @change="handleLogoFile" />
        <div v-if="formData.logo_url" class="logo-preview-wrap">
          <img :src="formData.logo_url" class="logo-preview-img" alt="LOGO" />
          <button class="logo-remove-btn" @click.stop="removeLogo">✕</button>
        </div>
        <div v-else class="logo-placeholder">
          <span class="logo-icon">🖼️</span>
          <p>点击上传 / 拖拽 LOGO</p>
          <p class="hint">PNG、JPG、SVG，≤2MB</p>
        </div>
      </div>
    </div>

    <div class="form-section">
      <h3>品牌配色</h3>
      <div class="color-row">
        <div class="color-item">
          <label>主色</label>
          <div class="color-input-wrap">
            <input type="color" v-model="formData.primary_color" />
            <span class="color-hex">{{ formData.primary_color }}</span>
          </div>
        </div>
        <div class="color-item">
          <label>辅色</label>
          <div class="color-input-wrap">
            <input type="color" v-model="formData.secondary_color" />
            <span class="color-hex">{{ formData.secondary_color }}</span>
          </div>
        </div>
      </div>

      <div class="color-presets">
        <span class="preset-label">预设:</span>
        <button
          v-for="preset in colorPresets"
          :key="preset.name"
          class="preset-btn"
          :style="{ background: `linear-gradient(135deg, ${preset.primary} 0%, ${preset.secondary} 100%)` }"
          :title="preset.name"
          @click="applyPreset(preset)"
        >
          {{ preset.name }}
        </button>
      </div>
    </div>

    <div class="form-section">
      <h3>字体设置</h3>
      <div class="form-item">
        <label>品牌字体</label>
        <select v-model="formData.font_family">
          <option value="思源黑体">思源黑体</option>
          <option value="思源宋体">思源宋体</option>
          <option value="微软雅黑">微软雅黑</option>
          <option value="Arial">Arial</option>
          <option value="Helvetica">Helvetica</option>
          <option value="Times New Roman">Times New Roman</option>
        </select>
      </div>
    </div>

    <div class="form-actions">
      <button type="button" class="btn-cancel" @click="$emit('cancel')">取消</button>
      <button type="submit" class="btn-submit" @click.prevent="handleSubmit" :disabled="!isValid">
        {{ isEdit ? '保存修改' : '创建品牌' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { apiClient } from '../api/client'
import type { Brand } from '../utils/types'

const props = defineProps<{
  brand?: Brand | null
  userId?: string
}>()

const emit = defineEmits<{
  submit: [brand: Partial<Brand>]
  cancel: []
}>()

const logoInput = ref<HTMLInputElement | null>(null)

const formData = ref({
  name: '',
  logo_url: '' as string | null,
  primary_color: '#165DFF',
  secondary_color: '#0E42D2',
  font_family: '思源黑体'
})

const isEdit = computed(() => !!props.brand?.brand_id)

const isValid = computed(() => formData.value.name.trim().length > 0)

const colorPresets = [
  { name: '科技蓝', primary: '#165DFF', secondary: '#0E42D2' },
  { name: '商务绿', primary: '#00A76A', secondary: '#007F5F' },
  { name: '热情红', primary: '#FF4D4F', secondary: '#CC0000' },
  { name: '活力橙', primary: '#FF9500', secondary: '#CC7700' },
  { name: '优雅紫', primary: '#722ED1', secondary: '#5319B5' }
]

watch(() => props.brand, (newBrand) => {
  if (newBrand) {
    formData.value = {
      name: newBrand.name || '',
      logo_url: newBrand.logo_url || null,
      primary_color: newBrand.primary_color || '#165DFF',
      secondary_color: newBrand.secondary_color || '#0E42D2',
      font_family: newBrand.font_family || '思源黑体'
    }
  } else {
    resetForm()
  }
}, { immediate: true })

function resetForm() {
  formData.value = {
    name: '',
    logo_url: null,
    primary_color: '#165DFF',
    secondary_color: '#0E42D2',
    font_family: '思源黑体'
  }
}

function applyPreset(preset: { primary: string; secondary: string }) {
  formData.value.primary_color = preset.primary
  formData.value.secondary_color = preset.secondary
}

function triggerLogoUpload() {
  logoInput.value?.click()
}

async function handleLogoFile(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    await uploadLogo(file)
  }
}

async function handleLogoDrop(event: DragEvent) {
  const file = event.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) {
    await uploadLogo(file)
  }
}

async function uploadLogo(file: File) {
  if (file.size > 2 * 1024 * 1024) {
    alert('图片大小不能超过 2MB')
    return
  }

  try {
    const formData = new FormData()
    formData.append('file', file)

    // 如果是编辑模式，先上传到已有品牌
    const brandId = props.brand?.brand_id
    if (brandId) {
      const response = await apiClient.post(`/brand/${brandId}/logo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      if (response.data.success) {
        formData.value.logo_url = response.data.logo_url
      }
    } else {
      // 创建模式：使用临时 base64 预览
      const reader = new FileReader()
      reader.onload = (e) => {
        formData.value.logo_url = e.target?.result as string
      }
      reader.readAsDataURL(file)
    }
  } catch (error) {
    console.error('Logo upload failed:', error)
    alert('Logo 上传失败')
  }
}

function removeLogo() {
  formData.value.logo_url = null
}

async function handleSubmit() {
  if (!isValid.value) return

  try {
    if (isEdit.value && props.brand?.brand_id) {
      // 更新品牌
      const response = await apiClient.put(`/brand/${props.brand.brand_id}`, {
        name: formData.value.name,
        primary_color: formData.value.primary_color,
        secondary_color: formData.value.secondary_color,
        font_family: formData.value.font_family,
        logo_url: formData.value.logo_url
      })
      if (response.data.success) {
        emit('submit', response.data.brand)
      }
    } else {
      // 创建品牌
      const response = await apiClient.post('/brand', {
        user_id: props.userId || 'default',
        name: formData.value.name,
        primary_color: formData.value.primary_color,
        secondary_color: formData.value.secondary_color,
        font_family: formData.value.font_family,
        logo_url: formData.value.logo_url
      })
      if (response.data.success) {
        // 如果有 Logo，上传到新品牌
        if (formData.value.logo_url && response.data.brand?.brand_id) {
          const logoFormData = new FormData()
          const blob = await fetch(formData.value.logo_url).then(r => r.blob())
          logoFormData.append('file', blob, 'logo.png')
          await apiClient.post(`/brand/${response.data.brand.brand_id}/logo`, logoFormData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
        }
        emit('submit', response.data.brand)
      }
    }
  } catch (error) {
    console.error('Brand save failed:', error)
    alert('保存失败')
  }
}
</script>

<style scoped>
.brand-form {
  max-width: 600px;
}

.form-section {
  margin-bottom: 24px;
}

.form-section h3 {
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: var(--text-primary, #111827);
}

.form-item {
  margin-bottom: 16px;
}

.form-item label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 6px;
  color: var(--text-secondary, #374151);
}

.form-item input[type="text"],
.form-item select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  font-size: 14px;
  background: var(--surface-color, #fff);
  color: var(--text-primary, #111827);
}

.form-item input:focus,
.form-item select:focus {
  outline: none;
  border-color: var(--brand-primary, #165DFF);
  box-shadow: 0 0 0 3px rgba(22, 93, 255, 0.1);
}

.logo-upload-area {
  border: 2px dashed var(--border-color, #e5e7eb);
  border-radius: 12px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background: var(--bg-color, #f9fafb);
}

.logo-upload-area:hover {
  border-color: var(--brand-primary, #165DFF);
  background: rgba(22, 93, 255, 0.02);
}

.logo-preview-wrap {
  position: relative;
  display: inline-block;
}

.logo-preview-img {
  max-width: 200px;
  max-height: 100px;
  border-radius: 8px;
}

.logo-remove-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 24px;
  height: 24px;
  border: none;
  border-radius: 50%;
  background: #ef4444;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.logo-placeholder {
  color: var(--text-secondary, #6b7280);
}

.logo-icon {
  font-size: 48px;
  display: block;
  margin-bottom: 8px;
}

.hint {
  font-size: 12px;
  margin: 4px 0 0 0;
}

.color-row {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}

.color-item {
  flex: 1;
}

.color-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  background: var(--surface-color, #fff);
}

.color-input-wrap input[type="color"] {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  padding: 0;
}

.color-hex {
  font-family: monospace;
  font-size: 14px;
  color: var(--text-primary, #111827);
}

.color-presets {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.preset-label {
  font-size: 13px;
  color: var(--text-secondary, #6b7280);
}

.preset-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 16px;
  color: white;
  font-size: 12px;
  cursor: pointer;
  transition: transform 0.2s;
}

.preset-btn:hover {
  transform: scale(1.05);
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 16px;
  border-top: 1px solid var(--border-color, #e5e7eb);
}

.btn-cancel,
.btn-submit {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: var(--bg-color, #f3f4f6);
  border: 1px solid var(--border-color, #e5e7eb);
  color: var(--text-primary, #374151);
}

.btn-cancel:hover {
  background: var(--border-color, #e5e7eb);
}

.btn-submit {
  background: var(--brand-primary, #165DFF);
  border: none;
  color: white;
}

.btn-submit:hover:not(:disabled) {
  background: var(--brand-secondary, #0E42D2);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
