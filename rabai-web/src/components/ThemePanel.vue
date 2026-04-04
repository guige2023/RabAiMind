<template>
  <div class="theme-panel">
    <!-- 暗色模式切换 -->
    <div class="dark-mode-toggle">
      <label class="form-label">外观模式</label>
      <div class="dark-mode-options">
        <button
          v-for="opt in darkModeOptions"
          :key="opt.value"
          class="dark-mode-btn"
          :class="{ active: darkMode === opt.value }"
          @click="setDarkMode(opt.value)"
        >
          <span class="dm-icon">{{ opt.icon }}</span>
          <span class="dm-label">{{ opt.label }}</span>
        </button>
      </div>
    </div>

    <!-- 主题预设 -->
    <div class="preset-section">
      <label class="form-label">主题预设</label>
      <div class="preset-grid">
        <div
          v-for="preset in themePresets"
          :key="preset.id"
          class="preset-card"
          :class="{ active: activePreset?.id === preset.id }"
          @click="applyPreset(preset)"
        >
          <div class="preset-colors">
            <div class="color-swatch" :style="{ background: preset.primary }"></div>
            <div class="color-swatch" :style="{ background: preset.secondary }"></div>
            <div class="color-swatch" :style="{ background: preset.accent }"></div>
          </div>
          <div class="preset-info">
            <span class="preset-name">{{ preset.name }}</span>
            <span class="preset-desc">{{ preset.desc }}</span>
          </div>
          <div v-if="activePreset?.id === preset.id" class="preset-check">✓</div>
        </div>
      </div>
    </div>

    <!-- AI 图片提取主题色 -->
    <div class="extract-section">
      <label class="form-label">AI 提取主题色</label>
      <p class="extract-hint">上传任意图片，AI 自动分析并提取配色方案</p>

      <div class="extract-upload" @click="triggerFileInput" @dragover.prevent="dragOver = true" @dragleave="dragOver = false" @drop.prevent="handleDrop" :class="{ 'drag-over': dragOver }">
        <input ref="fileInputRef" type="file" accept="image/*" @change="handleFileChange" style="display:none" />
        <div v-if="!extractedImagePreview" class="extract-placeholder">
          <span class="extract-icon">🖼️</span>
          <span class="extract-text">点击或拖拽图片到这里</span>
          <span class="extract-subtext">支持 JPG/PNG/SVG，最大 5MB</span>
        </div>
        <div v-else class="extract-preview">
          <img :src="extractedImagePreview" alt="提取预览" class="extract-preview-img" />
          <button class="extract-clear-btn" @click.stop="clearExtractedImage">✕</button>
        </div>
      </div>

      <!-- 提取状态 -->
      <div v-if="extracting" class="extract-loading">
        <div class="extract-spinner"></div>
        <span>AI 正在分析图片...</span>
      </div>

      <!-- 提取结果 -->
      <div v-if="extractedColors.length > 0 && !extracting" class="extract-result">
        <div class="extract-result-header">
          <span class="extract-result-title">提取到 {{ extractedColors.length }} 种颜色</span>
          <span v-if="themeDescription" class="extract-result-desc">{{ themeDescription }}</span>
        </div>
        <div class="extract-colors">
          <div
            v-for="(color, idx) in extractedColors"
            :key="idx"
            class="extract-color-item"
          >
            <div class="extract-color-swatch" :style="{ background: color }"></div>
            <div class="extract-color-info">
              <span class="extract-color-hex">{{ color }}</span>
              <span v-if="colorNames[idx]" class="extract-color-name">{{ colorNames[idx] }}</span>
            </div>
            <button
              class="extract-apply-btn"
              :style="{ borderColor: color, color: color }"
              @click="applyExtractedColor(color, idx)"
            >
              {{ idx === 0 ? '主色' : idx === 1 ? '辅色' : '强调' }}
            </button>
          </div>
        </div>
        <button class="btn-apply-extract" @click="applyExtracted">应用全部</button>
      </div>

      <!-- 提取错误 -->
      <div v-if="extractError" class="extract-error">
        <span>{{ extractError }}</span>
      </div>
    </div>

    <!-- 自定义主题 -->
    <div class="custom-section">
      <label class="form-label">
        自定义主题
        <button class="btn-reset" @click="resetCustom">重置</button>
      </label>

      <div class="custom-colors">
        <div class="color-picker-item">
          <label>主色 Primary</label>
          <div class="color-input-group">
            <input type="color" v-model="customPrimary" @change="emitCustomTheme" />
            <input type="text" v-model="customPrimary" @change="emitCustomTheme" class="hex-input" maxlength="7" />
            <button class="eyedropper-btn" @click="startEyedropper('primary')" title="屏幕取色器" :class="{ active: eyedropperActive === 'primary' }">💉</button>
          </div>
        </div>
        <div class="color-picker-item">
          <label>辅色 Secondary</label>
          <div class="color-input-group">
            <input type="color" v-model="customSecondary" @change="emitCustomTheme" />
            <input type="text" v-model="customSecondary" @change="emitCustomTheme" class="hex-input" maxlength="7" />
            <button class="eyedropper-btn" @click="startEyedropper('secondary')" title="屏幕取色器" :class="{ active: eyedropperActive === 'secondary' }">💉</button>
          </div>
        </div>
        <div class="color-picker-item">
          <label>强调色 Accent</label>
          <div class="color-input-group">
            <input type="color" v-model="customAccent" @change="emitCustomTheme" />
            <input type="text" v-model="customAccent" @change="emitCustomTheme" class="hex-input" maxlength="7" />
            <button class="eyedropper-btn" @click="startEyedropper('accent')" title="屏幕取色器" :class="{ active: eyedropperActive === 'accent' }">💉</button>
          </div>
        </div>
      </div>

      <!-- 自定义主题预览 -->
      <div class="custom-preview" :style="customPreviewStyle">
        <div class="preview-header">演示文稿预览</div>
        <div class="preview-title" :style="{ color: customPrimary }">标题示例</div>
        <div class="preview-subtitle" :style="{ color: customSecondary }">副标题示例文本</div>
        <div class="preview-accent" :style="{ background: customAccent }">强调内容</div>
      </div>

      <button class="btn-apply-custom" @click="applyCustom">应用自定义主题</button>
    </div>

    <!-- 字体搭配 -->
    <div class="font-pairing-section">
      <label class="form-label">字体搭配建议</label>
      <div class="font-pairings">
        <div
          v-for="pair in fontPairings"
          :key="pair.id"
          class="font-pair-card"
          :class="{ active: activePairing?.id === pair.id }"
          @click="applyPairing(pair)"
        >
          <div class="pair-header" :style="{ fontFamily: pair.header }">
            {{ pair.headerName }}
          </div>
          <div class="pair-body" :style="{ fontFamily: pair.body }">
            正文内容示例
          </div>
          <div class="pair-footer">
            <span class="pair-header-font">{{ pair.headerName }}</span>
            <span class="pair-sep">+</span>
            <span class="pair-body-font">{{ pair.bodyName }}</span>
          </div>
          <div v-if="activePairing?.id === pair.id" class="pair-check">✓</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { api } from '../api/client'

const emit = defineEmits(['theme-change', 'dark-mode-change', 'font-change'])

// ===== R64: AI Extract from Image =====
const fileInputRef = ref<HTMLInputElement | null>(null)
const extractedImagePreview = ref<string | null>(null)
const extractedColors = ref<string[]>([])
const colorNames = ref<string[]>([])
const themeDescription = ref<string>('')
const extracting = ref(false)
const extractError = ref<string | null>(null)
const dragOver = ref(false)

const triggerFileInput = () => {
  fileInputRef.value?.click()
}

const handleFileChange = async (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) await processImageFile(file)
}

const handleDrop = async (e: DragEvent) => {
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file && file.type.startsWith('image/')) {
    await processImageFile(file)
  }
}

const processImageFile = async (file: File) => {
  if (file.size > 5 * 1024 * 1024) {
    extractError.value = '图片大小不能超过 5MB'
    return
  }
  if (!file.type.startsWith('image/')) {
    extractError.value = '请上传图片文件（PNG/JPG/SVG）'
    return
  }

  extractError.value = null
  extracting.value = true
  extractedColors.value = []
  colorNames.value = []
  themeDescription.value = ''

  // Show preview
  const reader = new FileReader()
  reader.onload = (e) => {
    extractedImagePreview.value = e.target?.result as string
  }
  reader.readAsDataURL(file)

  try {
    const resp = await api.brand.aiExtractColors(file)
    if (resp.data.success) {
      extractedColors.value = resp.data.colors || []
      colorNames.value = resp.data.color_names || []
      themeDescription.value = resp.data.theme_description || ''
    } else {
      extractError.value = resp.data.message || '提取失败，请重试'
    }
  } catch (err: any) {
    extractError.value = err?.message || '网络错误，请重试'
  } finally {
    extracting.value = false
  }
}

const clearExtractedImage = () => {
  extractedImagePreview.value = null
  extractedColors.value = []
  colorNames.value = []
  themeDescription.value = ''
  extractError.value = null
  if (fileInputRef.value) fileInputRef.value.value = ''
}

const applyExtractedColor = (color: string, idx: number) => {
  if (idx === 0) customPrimary.value = color
  else if (idx === 1) customSecondary.value = color
  else customAccent.value = color
  emitCustomTheme()
}

const applyExtracted = () => {
  if (extractedColors.value.length > 0) {
    customPrimary.value = extractedColors.value[0]
    customSecondary.value = extractedColors.value[1] || extractedColors.value[0]
    customAccent.value = extractedColors.value[2] || extractedColors.value[0]
    activePreset.value = null
    emitCustomTheme()
  }
}

// ===== Dark Mode =====
type DarkModeValue = 'light' | 'dark' | 'auto'
const darkMode = ref<DarkModeValue>('auto')

const darkModeOptions = [
  { value: 'light' as DarkModeValue, label: '亮色', icon: '☀️' },
  { value: 'dark' as DarkModeValue, label: '暗色', icon: '🌙' },
  { value: 'auto' as DarkModeValue, label: '跟随系统', icon: '⚙️' }
]

const setDarkMode = (mode: DarkModeValue) => {
  darkMode.value = mode
  // Apply to DOM
  if (mode === 'dark') {
    document.documentElement.classList.add('dark')
    document.documentElement.classList.remove('auto')
  } else if (mode === 'light') {
    document.documentElement.classList.remove('dark', 'auto')
  } else {
    // auto
    document.documentElement.classList.remove('dark')
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    if (prefersDark) {
      document.documentElement.classList.add('dark')
    }
  }
  localStorage.setItem('darkMode', mode)
  emit('dark-mode-change', mode)
}

// Load saved dark mode preference
const loadDarkMode = () => {
  const saved = localStorage.getItem('darkMode') as DarkModeValue | null
  if (saved) {
    darkMode.value = saved
    setDarkMode(saved)
  } else {
    // Initialize auto based on system preference
    setDarkMode('auto')
  }
}

// ===== Theme Presets (12 professional themes) =====
interface ThemePreset {
  id: string
  name: string
  desc: string
  primary: string
  secondary: string
  accent: string
}

const themePresets: ThemePreset[] = [
  { id: 'biz-blue', name: '商务蓝', desc: '专业稳重', primary: '#165DFF', secondary: '#0E42D2', accent: '#64D2FF' },
  { id: 'elegant-gold', name: '高端金', desc: '奢华大气', primary: '#D4AF37', secondary: '#1a1a2e', accent: '#FFD700' },
  { id: 'fresh-green', name: '清新绿', desc: '自然环保', primary: '#34C759', secondary: '#248A3D', accent: '#30D158' },
  { id: 'warm-orange', name: '活力橙', desc: '热情洋溢', primary: '#FF9500', secondary: '#CC7A00', accent: '#FFB340' },
  { id: 'romantic-pink', name: '浪漫粉', desc: '温馨甜美', primary: '#FF2D55', secondary: '#C41E3A', accent: '#FF6B8A' },
  { id: 'tech-purple', name: '科技紫', desc: '神秘未来', primary: '#5856D6', secondary: '#3634A3', accent: '#8B89FF' },
  { id: 'nature-teal', name: '自然青', desc: '清新宁静', primary: '#00B96B', secondary: '#00875A', accent: '#5DD879' },
  { id: 'ocean-blue', name: '海洋蓝', desc: '深邃宽广', primary: '#007AFF', secondary: '#0055CC', accent: '#5AC8FA' },
  { id: 'sunset-gold', name: '落日金', desc: '温暖柔和', primary: '#FF9500', secondary: '#8B5A00', accent: '#FFD60A' },
  { id: 'minimal-gray', name: '极简灰', desc: '简洁纯粹', primary: '#1A1A1A', secondary: '#48484A', accent: '#98989D' },
  { id: 'creative-coral', name: '创意珊瑚', desc: '活力创意', primary: '#FF6B6B', secondary: '#EE5A24', accent: '#FF9F7F' },
  { id: 'night-indigo', name: '午夜靛', desc: '深沉专业', primary: '#5856D6', secondary: '#1C1C1E', accent: '#BF5AF2' }
]

const activePreset = ref<ThemePreset | null>(null)

const applyPreset = (preset: ThemePreset) => {
  activePreset.value = preset
  customPrimary.value = preset.primary
  customSecondary.value = preset.secondary
  customAccent.value = preset.accent
  emitCustomTheme()
}

// ===== Custom Theme Creator =====
const customPrimary = ref('#165DFF')
const customSecondary = ref('#0E42D2')
const customAccent = ref('#64D2FF')

const customPreviewStyle = computed(() => ({
  background: `linear-gradient(135deg, ${customPrimary.value}22, ${customSecondary.value}22)`,
  borderColor: customPrimary.value
}))

const emitCustomTheme = () => {
  emit('theme-change', {
    primary: customPrimary.value,
    secondary: customSecondary.value,
    accent: customAccent.value
  })
}

const applyCustom = () => {
  activePreset.value = null
  emitCustomTheme()
}

const resetCustom = () => {
  customPrimary.value = '#165DFF'
  customSecondary.value = '#0E42D2'
  customAccent.value = '#64D2FF'
  activePreset.value = null
  emitCustomTheme()
}

// ===== Font Pairings =====
interface FontPairing {
  id: string
  header: string
  body: string
  headerName: string
  bodyName: string
}

const fontPairings: FontPairing[] = [
  { id: 'source-hansans', header: 'Source Han Sans CN', body: 'Source Han Serif CN', headerName: '思源黑体', bodyName: '思源宋体' },
  { id: 'noto-sans', header: 'Noto Sans SC', body: 'Noto Serif SC', headerName: 'Noto Sans', bodyName: 'Noto Serif' },
  { id: 'alibaba', header: 'Alibaba PuHuiTi', body: 'Alibaba PuHuiTi', headerName: '阿里巴巴普惠体', bodyName: '阿里巴巴普惠体' },
  { id: 'inter-georgia', header: 'Inter', body: 'Georgia', headerName: 'Inter', bodyName: 'Georgia' },
  { id: 'playfair', header: 'Playfair Display', body: 'Source Serif Pro', headerName: 'Playfair', bodyName: 'Source Serif' },
  { id: 'poppins', header: 'Poppins', body: 'Inter', headerName: 'Poppins', bodyName: 'Inter' },
  { id: 'space-grotesk', header: 'Space Grotesk', body: 'IBM Plex Sans', headerName: 'Space Grotesk', bodyName: 'IBM Plex' },
  { id: 'cormorant', header: 'Cormorant Garamond', body: 'Lato', headerName: 'Cormorant', bodyName: 'Lato' }
]

const activePairing = ref<FontPairing | null>(null)

const applyPairing = (pair: FontPairing) => {
  activePairing.value = pair
  emit('font-change', { header: pair.header, body: pair.body })
}

// ===== Eyedropper Tool (ThemePanel) =====
const eyedropperActive = ref<string | null>(null)
let eyedropperClickHandler: (() => void) | null = null
let eyedropperEscHandler: ((e: KeyboardEvent) => void) | null = null

const startEyedropper = async (slot: string) => {
  if (eyedropperActive.value === slot) {
    stopEyedropper()
    return
  }
  eyedropperActive.value = slot

  eyedropperClickHandler = async () => {
    await new Promise(resolve => setTimeout(resolve, 150))

    // Use macOS AppleScript `choose color` which provides native eyedropper
    const appleScript = `choose color`

    try {
      const execBridge = (window as any).__execBridge
      if (execBridge) {
        const result = await execBridge(`osascript -e '${appleScript}' 2>/dev/null`)
        if (result) {
          const rgbMatch = result.match(/\{(\d+),\s*(\d+),\s*(\d+)\}/)
          if (rgbMatch) {
            const r = Math.round((parseInt(rgbMatch[1]) / 65535) * 255)
            const g = Math.round((parseInt(rgbMatch[2]) / 65535) * 255)
            const b = Math.round((parseInt(rgbMatch[3]) / 65535) * 255)
            const hex = `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`.toUpperCase()
            applyEyedropperColor(hex, slot)
          }
        }
        stopEyedropper()
        return
      }

      // Manual fallback
      const manualColor = prompt(
        '💉 屏幕取色器 - 在终端运行:\npython3 /tmp/eyedropper.py\n或直接输入颜色值:',
        slot === 'primary' ? customPrimary.value : slot === 'secondary' ? customSecondary.value : customAccent.value
      )
      if (manualColor) {
        applyEyedropperColor(manualColor.trim(), slot)
      }
    } catch (err) {
      console.warn('[Eyedropper] Error:', err)
    }
    stopEyedropper()
  }

  eyedropperEscHandler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') stopEyedropper()
  }

  document.addEventListener('click', eyedropperClickHandler, { once: true })
  document.addEventListener('keydown', eyedropperEscHandler)
}

const applyEyedropperColor = (hex: string, slot: string) => {
  const clean = (hex || '').trim()
  if (clean.match(/^#[0-9A-Fa-f]{6}$/)) {
    if (slot === 'primary') {
      customPrimary.value = clean
    } else if (slot === 'secondary') {
      customSecondary.value = clean
    } else {
      customAccent.value = clean
    }
    emitCustomTheme()
  }
}

const stopEyedropper = () => {
  if (eyedropperClickHandler) {
    document.removeEventListener('click', eyedropperClickHandler)
    eyedropperClickHandler = null
  }
  if (eyedropperEscHandler) {
    document.removeEventListener('keydown', eyedropperEscHandler)
    eyedropperEscHandler = null
  }
  eyedropperActive.value = null
}

// Load saved settings
const loadSettings = () => {
  loadDarkMode()
  const saved = localStorage.getItem('customTheme')
  if (saved) {
    try {
      const t = JSON.parse(saved)
      customPrimary.value = t.primary || '#165DFF'
      customSecondary.value = t.secondary || '#0E42D2'
      customAccent.value = t.accent || '#64D2FF'
    } catch {}
  }
  const savedPair = localStorage.getItem('activePairing')
  if (savedPair) {
    try {
      activePairing.value = JSON.parse(savedPair)
    } catch {}
  }
}

loadSettings()
</script>

<style scoped>
.theme-panel {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* R64: Extract from image */
.extract-section {
  border-bottom: 1px solid var(--gray-200);
  padding-bottom: 20px;
}

.extract-hint {
  font-size: 12px;
  color: var(--gray-500);
  margin: 6px 0 12px;
}

.extract-upload {
  border: 2px dashed var(--gray-300);
  border-radius: var(--radius-lg);
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.extract-upload:hover,
.extract-upload.drag-over {
  border-color: var(--primary);
  background: rgba(22, 93, 255, 0.05);
}

.extract-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.extract-icon {
  font-size: 28px;
}

.extract-text {
  font-size: 14px;
  font-weight: 500;
  color: var(--gray-700);
}

.extract-subtext {
  font-size: 11px;
  color: var(--gray-500);
}

.extract-preview {
  position: relative;
  display: inline-block;
}

.extract-preview-img {
  max-width: 120px;
  max-height: 80px;
  border-radius: var(--radius-md);
  object-fit: cover;
}

.extract-clear-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  background: var(--error);
  color: white;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.extract-loading {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  font-size: 13px;
  color: var(--gray-500);
}

.extract-spinner {
  width: 18px;
  height: 18px;
  border: 2px solid var(--gray-200);
  border-top-color: var(--primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.extract-result {
  margin-top: 12px;
}

.extract-result-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.extract-result-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--gray-700);
}

.extract-result-desc {
  font-size: 11px;
  color: var(--primary);
  background: rgba(22, 93, 255, 0.08);
  padding: 2px 8px;
  border-radius: var(--radius-full);
}

.extract-colors {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 10px;
}

.extract-color-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px;
  background: var(--gray-100);
  border-radius: var(--radius-md);
}

.extract-color-swatch {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(0,0,0,0.1);
  flex-shrink: 0;
}

.extract-color-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.extract-color-hex {
  font-size: 12px;
  font-family: monospace;
  font-weight: 600;
  color: var(--gray-900);
}

.extract-color-name {
  font-size: 11px;
  color: var(--gray-500);
}

.extract-apply-btn {
  padding: 4px 10px;
  border: 1.5px solid;
  border-radius: var(--radius-full);
  background: transparent;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.extract-apply-btn:hover {
  background: var(--primary);
  color: white !important;
  border-color: var(--primary) !important;
}

.btn-apply-extract {
  width: 100%;
  padding: 10px;
  background: linear-gradient(135deg, var(--primary), var(--primary-light));
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-apply-extract:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.3);
}

.extract-error {
  margin-top: 10px;
  padding: 10px;
  background: rgba(255, 59, 48, 0.08);
  border-radius: var(--radius-md);
  color: var(--error);
  font-size: 12px;
}

/* Dark Mode Toggle */
.dark-mode-toggle {
  border-bottom: 1px solid var(--gray-200);
  padding-bottom: 20px;
}

.dark-mode-options {
  display: flex;
  gap: 8px;
  margin-top: 10px;
}

.dark-mode-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  background: var(--gray-100);
  border: 2px solid transparent;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
}

.dark-mode-btn:hover {
  border-color: var(--gray-300);
}

.dark-mode-btn.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.dm-icon {
  font-size: 20px;
}

.dm-label {
  font-weight: 500;
}

/* Preset Section */
.preset-section label,
.custom-section label,
.font-pairing-section label {
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 10px;
}

.preset-card {
  padding: 10px;
  background: var(--gray-100);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.preset-card:hover {
  border-color: var(--gray-300);
  transform: translateY(-2px);
}

.preset-card.active {
  border-color: var(--primary);
  background: var(--white);
  box-shadow: 0 2px 8px rgba(22, 93, 255, 0.15);
}

.preset-colors {
  display: flex;
  gap: 4px;
  margin-bottom: 8px;
}

.color-swatch {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 1px solid rgba(0,0,0,0.1);
}

.preset-info {
  display: flex;
  flex-direction: column;
}

.preset-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--gray-700);
}

.preset-desc {
  font-size: 10px;
  color: var(--gray-500);
}

.preset-check {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 18px;
  height: 18px;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Custom Theme */
.btn-reset {
  font-size: 12px;
  color: var(--primary);
  background: none;
  border: none;
  cursor: pointer;
  font-weight: 500;
}

.custom-colors {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 10px;
}

.color-picker-item label {
  display: block;
  font-size: 12px;
  color: var(--gray-500);
  margin-bottom: 6px;
  font-weight: 500;
}

.color-input-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-input-group input[type="color"] {
  width: 44px;
  height: 36px;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  padding: 2px;
}

.hex-input {
  flex: 1;
  padding: 8px 10px;
  border: 2px solid var(--gray-200);
  border-radius: var(--radius-md);
  font-family: monospace;
  font-size: 13px;
}

.custom-preview {
  margin-top: 12px;
  padding: 16px;
  border-radius: var(--radius-lg);
  border: 2px solid;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-header {
  font-size: 11px;
  color: rgba(0,0,0,0.4);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.preview-title {
  font-size: 20px;
  font-weight: 700;
}

.preview-subtitle {
  font-size: 14px;
}

.preview-accent {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  color: white;
  width: fit-content;
}

.btn-apply-custom {
  margin-top: 10px;
  padding: 10px;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  width: 100%;
  transition: all 0.2s;
}

.btn-apply-custom:hover {
  background: var(--primary-dark);
}

/* Font Pairings */
.font-pairings {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 10px;
}

.font-pair-card {
  padding: 12px;
  background: var(--gray-100);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.font-pair-card:hover {
  border-color: var(--gray-300);
}

.font-pair-card.active {
  border-color: var(--primary);
  background: var(--white);
  box-shadow: 0 2px 8px rgba(22, 93, 255, 0.15);
}

.pair-header {
  font-size: 16px;
  font-weight: 700;
  color: var(--gray-900);
  margin-bottom: 4px;
}

.pair-body {
  font-size: 13px;
  color: var(--gray-500);
  margin-bottom: 8px;
}

.pair-footer {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: var(--gray-500);
}

.pair-header-font,
.pair-body-font {
  font-weight: 500;
}

.pair-sep {
  color: var(--primary);
}

.pair-check {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 18px;
  height: 18px;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  font-size: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
