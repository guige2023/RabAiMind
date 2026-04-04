<template>
  <div class="template-editor">
    <div class="editor-container">
      <!-- 顶部导航 -->
      <header class="editor-header">
        <div class="header-left">
          <button class="back-btn" @click="goBack">
            <span>←</span> 返回
          </button>
          <div class="header-title">
            <h1>{{ isEditing ? '编辑模板' : '模板创建工作室' }}</h1>
            <span class="editor-badge">Studio</span>
          </div>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline" @click="previewTemplate">
            👁️ 预览
          </button>
          <button class="btn btn-primary" @click="saveTemplate">
            💾 保存模板
          </button>
        </div>
      </header>

      <div class="editor-body">
        <!-- 左侧面板：模板配置 -->
        <aside class="editor-sidebar">
          <!-- 基础信息 -->
          <section class="config-section">
            <h3 class="section-title">📝 基础信息</h3>
            <div class="form-item">
              <label>模板名称</label>
              <input v-model="templateData.name" class="form-input" placeholder="例如：商务蓝经典版" />
            </div>
            <div class="form-item">
              <label>模板描述</label>
              <textarea v-model="templateData.description" class="form-textarea" placeholder="描述模板的特点和适用场景..." rows="3" />
            </div>
            <div class="form-row">
              <div class="form-item">
                <label>适用场景</label>
                <select v-model="templateData.scene" class="form-select">
                  <option value="business">💼 商务</option>
                  <option value="education">📚 教育</option>
                  <option value="marketing">📢 营销</option>
                  <option value="creative">🎨 创意</option>
                  <option value="data">📊 数据</option>
                  <option value="social">🤝 社交</option>
                </select>
              </div>
              <div class="form-item">
                <label>风格</label>
                <select v-model="templateData.style" class="form-select">
                  <option value="professional">专业</option>
                  <option value="creative">创意</option>
                  <option value="minimalist">极简</option>
                  <option value="classic">经典</option>
                  <option value="modern">现代</option>
                </select>
              </div>
            </div>
          </section>

          <!-- 主题色配置 -->
          <section class="config-section">
            <h3 class="section-title">🎨 主题色</h3>
            <div class="color-pickers">
              <div class="color-field">
                <label>主色 Primary</label>
                <div class="color-input-row">
                  <div class="color-swatch-wrapper">
                    <input
                      type="color"
                      v-model="templateData.colors.primary"
                      @change="onColorChange"
                      class="color-input-native"
                    />
                    <div
                      class="color-swatch"
                      :style="{ background: templateData.colors.primary }"
                      @click="openColorPicker('primary')"
                    ></div>
                    <!-- 吸管工具按钮 -->
                    <button
                      class="eyedropper-btn"
                      @click.stop="startEyedropper('primary')"
                      title="屏幕取色器"
                      :class="{ active: eyedropperActive === 'primary' }"
                    >
                      💉
                    </button>
                  </div>
                  <input
                    type="text"
                    v-model="templateData.colors.primary"
                    @change="onColorChange"
                    class="hex-input"
                    maxlength="7"
                    placeholder="#165DFF"
                  />
                </div>
              </div>

              <div class="color-field">
                <label>辅色 Secondary</label>
                <div class="color-input-row">
                  <div class="color-swatch-wrapper">
                    <input
                      type="color"
                      v-model="templateData.colors.secondary"
                      @change="onColorChange"
                      class="color-input-native"
                    />
                    <div
                      class="color-swatch"
                      :style="{ background: templateData.colors.secondary }"
                      @click="openColorPicker('secondary')"
                    ></div>
                    <button
                      class="eyedropper-btn"
                      @click.stop="startEyedropper('secondary')"
                      title="屏幕取色器"
                      :class="{ active: eyedropperActive === 'secondary' }"
                    >
                      💉
                    </button>
                  </div>
                  <input
                    type="text"
                    v-model="templateData.colors.secondary"
                    @change="onColorChange"
                    class="hex-input"
                    maxlength="7"
                    placeholder="#0E42D2"
                  />
                </div>
              </div>

              <div class="color-field">
                <label>强调色 Accent</label>
                <div class="color-input-row">
                  <div class="color-swatch-wrapper">
                    <input
                      type="color"
                      v-model="templateData.colors.accent"
                      @change="onColorChange"
                      class="color-input-native"
                    />
                    <div
                      class="color-swatch"
                      :style="{ background: templateData.colors.accent }"
                      @click="openColorPicker('accent')"
                    ></div>
                    <button
                      class="eyedropper-btn"
                      @click.stop="startEyedropper('accent')"
                      title="屏幕取色器"
                      :class="{ active: eyedropperActive === 'accent' }"
                    >
                      💉
                    </button>
                  </div>
                  <input
                    type="text"
                    v-model="templateData.colors.accent"
                    @change="onColorChange"
                    class="hex-input"
                    maxlength="7"
                    placeholder="#64D2FF"
                  />
                </div>
              </div>
            </div>

            <!-- 预设主题 -->
            <div class="preset-section">
              <label class="preset-label">快速预设</label>
              <div class="preset-grid">
                <button
                  v-for="preset in colorPresets"
                  :key="preset.id"
                  class="preset-btn"
                  @click="applyPreset(preset)"
                >
                  <div class="preset-colors">
                    <span class="preset-dot" :style="{ background: preset.primary }"></span>
                    <span class="preset-dot" :style="{ background: preset.secondary }"></span>
                    <span class="preset-dot" :style="{ background: preset.accent }"></span>
                  </div>
                  <span class="preset-name">{{ preset.name }}</span>
                </button>
              </div>
            </div>
          </section>

          <!-- 字体搭配 -->
          <section class="config-section">
            <h3 class="section-title">🔤 字体搭配</h3>
            <div class="font-pairings">
              <div
                v-for="pair in fontPairings"
                :key="pair.id"
                class="font-pair-card"
                :class="{ active: activePairing?.id === pair.id }"
                @click="selectPairing(pair)"
              >
                <!-- 实时预览 -->
                <div class="pair-preview" :style="{ background: previewGradient }">
                  <div class="preview-sample">
                    <div class="sample-header" :style="{ fontFamily: pair.header }">
                      {{ pair.headerName }}
                    </div>
                    <div class="sample-title" :style="{ fontFamily: pair.header }">
                      演示文稿标题
                    </div>
                    <div class="sample-body" :style="{ fontFamily: pair.body }">
                      正文内容示例，描述演示文稿的主要内容
                    </div>
                    <div class="sample-accent" :style="{ fontFamily: pair.header }">
                      强调文本
                    </div>
                  </div>
                </div>
                <div class="pair-info">
                  <span class="pair-header-font">{{ pair.headerName }}</span>
                  <span class="pair-sep">+</span>
                  <span class="pair-body-font">{{ pair.bodyName }}</span>
                </div>
                <div v-if="activePairing?.id === pair.id" class="pair-check">✓</div>
              </div>
            </div>
          </section>

          <!-- 布局网格 -->
          <section class="config-section">
            <h3 class="section-title">📐 布局网格</h3>
            <div class="layout-grid-config">
              <div class="grid-preview-container">
                <div
                  class="grid-preview"
                  :style="{
                    gridTemplateColumns: `repeat(${layoutGrid.cols}, 1fr)`,
                    gridTemplateRows: `repeat(${layoutGrid.rows}, 1fr)`,
                    gap: layoutGrid.gap + 'px',
                    padding: layoutGrid.padding + 'px',
                  }"
                >
                  <div
                    v-for="i in layoutGrid.cols * layoutGrid.rows"
                    :key="i"
                    class="grid-cell"
                    :style="{
                      background: `linear-gradient(135deg, ${templateData.colors.primary}33, ${templateData.colors.secondary}22)`
                    }"
                  >
                    <span class="cell-num">{{ i }}</span>
                  </div>
                </div>
              </div>

              <div class="grid-controls">
                <div class="grid-control-item">
                  <label>列数 Columns</label>
                  <div class="slider-row">
                    <input type="range" v-model.number="layoutGrid.cols" min="1" max="6" step="1" class="slider" />
                    <span class="slider-value">{{ layoutGrid.cols }}</span>
                  </div>
                </div>
                <div class="grid-control-item">
                  <label>行数 Rows</label>
                  <div class="slider-row">
                    <input type="range" v-model.number="layoutGrid.rows" min="1" max="6" step="1" class="slider" />
                    <span class="slider-value">{{ layoutGrid.rows }}</span>
                  </div>
                </div>
                <div class="grid-control-item">
                  <label>间距 Gap</label>
                  <div class="slider-row">
                    <input type="range" v-model.number="layoutGrid.gap" min="0" max="40" step="2" class="slider" />
                    <span class="slider-value">{{ layoutGrid.gap }}px</span>
                  </div>
                </div>
                <div class="grid-control-item">
                  <label>边距 Padding</label>
                  <div class="slider-row">
                    <input type="range" v-model.number="layoutGrid.padding" min="0" max="60" step="4" class="slider" />
                    <span class="slider-value">{{ layoutGrid.padding }}px</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- 保存选项 -->
          <section class="config-section">
            <h3 class="section-title">💾 保存选项</h3>
            <div class="form-item">
              <label>可见性</label>
              <div class="radio-group">
                <label class="radio-item" :class="{ active: templateData.visibility === 'private' }">
                  <input type="radio" v-model="templateData.visibility" value="private" />
                  <span>🔒 私人（仅自己可见）</span>
                </label>
                <label class="radio-item" :class="{ active: templateData.visibility === 'public' }">
                  <input type="radio" v-model="templateData.visibility" value="public" />
                  <span>🌍 公开（其他用户可用）</span>
                </label>
              </div>
            </div>
          </section>
        </aside>

        <!-- 右侧：实时预览 -->
        <main class="editor-preview">
          <div class="preview-header">
            <span class="preview-label">实时预览</span>
            <div class="preview-scale-controls">
              <button class="scale-btn" @click="previewScale = 0.5">50%</button>
              <button class="scale-btn active" @click="previewScale = 0.75">75%</button>
              <button class="scale-btn" @click="previewScale = 1">100%</button>
            </div>
          </div>
          <div class="preview-wrapper">
            <div
              class="slide-preview-frame"
              :style="{
                transform: `scale(${previewScale})`,
                width: '960px',
                height: '540px',
                background: previewGradient,
              }"
            >
              <!-- 模拟幻灯片内容 -->
              <div class="preview-slide-content">
                <!-- 顶部导航条 -->
                <div class="slide-top-bar" :style="{ background: templateData.colors.primary }">
                  <div class="bar-left">
                    <div class="logo-placeholder" :style="{ background: templateData.colors.accent }"></div>
                    <span class="bar-text" :style="{ color: '#fff' }">LOGO</span>
                  </div>
                  <div class="bar-right">
                    <div class="nav-dot" :style="{ background: '#fff' }"></div>
                    <div class="nav-dot" :style="{ background: '#ffffff66' }"></div>
                    <div class="nav-dot" :style="{ background: '#ffffff33' }"></div>
                  </div>
                </div>

                <!-- 主内容区域 -->
                <div
                  class="slide-main"
                  :style="{
                    gridTemplateColumns: `repeat(${layoutGrid.cols}, 1fr)`,
                    gap: layoutGrid.gap + 'px',
                    padding: layoutGrid.padding + 'px',
                  }"
                >
                  <!-- 标题区域 -->
                  <div
                    class="slide-title-area"
                    :style="{
                      gridColumn: `span ${Math.max(1, layoutGrid.cols - 1)}`,
                      color: templateData.colors.primary,
                      fontFamily: activePairing?.header || 'Source Han Sans CN'
                    }"
                  >
                    <div
                      class="title-underline"
                      :style="{ background: templateData.colors.accent }"
                    ></div>
                    <h1 class="slide-h1" :style="{ fontFamily: activePairing?.header || 'inherit' }">
                      演示文稿标题
                    </h1>
                    <h2
                      class="slide-h2"
                      :style="{ color: templateData.colors.secondary, fontFamily: activePairing?.header || 'inherit' }"
                    >
                      副标题描述文本
                    </h2>
                  </div>

                  <!-- 内容卡片 -->
                  <div
                    v-for="i in Math.min(layoutGrid.cols, 3)"
                    :key="'card-' + i"
                    class="slide-card"
                    :style="{
                      background: '#ffffff',
                      borderLeft: `4px solid ${templateData.colors.accent}`,
                      fontFamily: activePairing?.body || 'Source Han Serif CN',
                    }"
                  >
                    <div class="card-icon" :style="{ background: templateData.colors.primary + '22' }">
                      <span :style="{ color: templateData.colors.primary }">{{ ['📊', '💡', '🎯'][i-1] }}</span>
                    </div>
                    <h3 class="card-title" :style="{ color: templateData.colors.primary }">
                      标题 {{ i }}
                    </h3>
                    <p class="card-text">
                      内容描述示例，包含重要的信息和关键数据点。
                    </p>
                  </div>
                </div>

                <!-- 底部 -->
                <div class="slide-footer" :style="{ borderTop: `2px solid ${templateData.colors.primary}33` }">
                  <span class="footer-text" :style="{ color: templateData.colors.secondary }">
                    © 2026 Company Name
                  </span>
                  <div class="footer-accent" :style="{ background: templateData.colors.accent }">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>

    <!-- 预览弹窗 -->
    <Teleport to="body">
      <div v-if="showPreviewModal" class="preview-modal" @click.self="showPreviewModal = false">
        <div class="preview-modal-content">
          <button class="modal-close" @click="showPreviewModal = false">✕</button>
          <div class="preview-modal-slide" :style="{ background: previewGradient }">
            <div class="preview-slide-content">
              <div class="slide-top-bar" :style="{ background: templateData.colors.primary }">
                <span class="bar-text" :style="{ color: '#fff' }">LOGO</span>
              </div>
              <div class="slide-main" :style="{ padding: '40px' }">
                <h1
                  class="slide-h1"
                  :style="{
                    color: templateData.colors.primary,
                    fontFamily: activePairing?.header || 'inherit'
                  }"
                >
                  {{ templateData.name || '模板名称' }}
                </h1>
                <p class="slide-subtitle" :style="{ color: templateData.colors.secondary }">
                  {{ templateData.description || '模板描述' }}
                </p>
                <div class="preview-cards">
                  <div
                    v-for="i in 3"
                    :key="i"
                    class="preview-card"
                    :style="{
                      background: '#fff',
                      borderLeft: `4px solid ${templateData.colors.accent}`
                    }"
                  >
                    <span :style="{ color: templateData.colors.primary }">{{ ['内容卡片 1', '内容卡片 2', '内容卡片 3'][i-1] }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 吸管取色中提示 -->
    <Teleport to="body">
      <div v-if="eyedropperActive" class="eyedropper-overlay">
        <div class="eyedropper-hint">
          <span class="hint-icon">💉</span>
          <span>点击屏幕任意位置取色，ESC 取消</span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { api } from '../api/client'

const router = useRouter()

// ===== Template Data =====
const isEditing = ref(false)
const templateId = ref<string | null>(null)

const templateData = ref({
  name: '',
  description: '',
  scene: 'business',
  style: 'professional',
  visibility: 'private',
  colors: {
    primary: '#165DFF',
    secondary: '#0E42D2',
    accent: '#64D2FF',
  },
  fonts: {
    header: 'Source Han Sans CN',
    body: 'Source Han Serif CN',
  },
  layoutGrid: {
    cols: 3,
    rows: 2,
    gap: 16,
    padding: 32,
  },
})

// ===== Layout Grid =====
const layoutGrid = ref({
  cols: 3,
  rows: 2,
  gap: 16,
  padding: 32,
})

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
  { id: 'cormorant', header: 'Cormorant Garamond', body: 'Lato', headerName: 'Cormorant', bodyName: 'Lato' },
]

const activePairing = ref<FontPairing | null>(null)

const selectPairing = (pair: FontPairing) => {
  activePairing.value = pair
  templateData.value.fonts.header = pair.header
  templateData.value.fonts.body = pair.body
}

const selectDefaultPairing = () => {
  const defaultPair = fontPairings[0]
  activePairing.value = defaultPair
  templateData.value.fonts.header = defaultPair.header
  templateData.value.fonts.body = defaultPair.body
}

// ===== Color Presets =====
const colorPresets = [
  { id: 'biz-blue', name: '商务蓝', primary: '#165DFF', secondary: '#0E42D2', accent: '#64D2FF' },
  { id: 'elegant-gold', name: '高端金', primary: '#D4AF37', secondary: '#1a1a2e', accent: '#FFD700' },
  { id: 'fresh-green', name: '清新绿', primary: '#34C759', secondary: '#248A3D', accent: '#30D158' },
  { id: 'warm-orange', name: '活力橙', primary: '#FF9500', secondary: '#CC7A00', accent: '#FFB340' },
  { id: 'romantic-pink', name: '浪漫粉', primary: '#FF2D55', secondary: '#C41E3A', accent: '#FF6B8A' },
  { id: 'tech-purple', name: '科技紫', primary: '#5856D6', secondary: '#3634A3', accent: '#8B89FF' },
  { id: 'nature-teal', name: '自然青', primary: '#00B96B', secondary: '#00875A', accent: '#5DD879' },
  { id: 'ocean-blue', name: '海洋蓝', primary: '#007AFF', secondary: '#0055CC', accent: '#5AC8FA' },
  { id: 'minimal-gray', name: '极简灰', primary: '#1A1A1A', secondary: '#48484A', accent: '#98989D' },
  { id: 'creative-coral', name: '创意珊瑚', primary: '#FF6B6B', secondary: '#EE5A24', accent: '#FF9F7F' },
  { id: 'night-indigo', name: '午夜靛', primary: '#5856D6', secondary: '#1C1C1E', accent: '#BF5AF2' },
  { id: 'sunset-gold', name: '落日金', primary: '#FF9500', secondary: '#8B5A00', accent: '#FFD60A' },
]

const applyPreset = (preset: typeof colorPresets[0]) => {
  templateData.value.colors.primary = preset.primary
  templateData.value.colors.secondary = preset.secondary
  templateData.value.colors.accent = preset.accent
}

// ===== Preview Gradient =====
const previewGradient = computed(() =>
  `linear-gradient(135deg, ${templateData.value.colors.primary}22, ${templateData.value.colors.secondary}22)`
)

// ===== Eyedropper Tool =====
// Uses macOS AppleScript + screencapture to sample screen color at cursor position
const eyedropperActive = ref<string | null>(null)
let eyedropperClickHandler: ((e: MouseEvent) => void) | null = null
let eyedropperEscHandler: ((e: KeyboardEvent) => void) | null = null

const startEyedropper = async (colorSlot: string) => {
  if (eyedropperActive.value === colorSlot) {
    stopEyedropper()
    return
  }
  eyedropperActive.value = colorSlot

  eyedropperClickHandler = async () => {
    // Small delay to avoid capturing our own overlay UI
    await new Promise(resolve => setTimeout(resolve, 150))

    // macOS AppleScript: get cursor pos + screencapture + Python reads pixel
    const script = `python3 - << 'PYEOF'
from AppKit import NSEvent, NSScreen
from PIL import Image
import subprocess, sys
try:
    loc = NSEvent.mouseLocation()
    screen = NSScreen.mainScreen()
    if screen:
        frame = screen.frame
        px = int(loc.x)
        py = int(frame.size.height - loc.y)
        subprocess.run(
            ['screencapture', '-x', '-R', f'{px},{py},1,1', '/tmp/eyedropper_pixel.png'],
            check=True, capture_output=True
        )
        img = Image.open('/tmp/eyedropper_pixel.png')
        px_arr = img.load()
        r, g, b = px_arr[0, 0][:3]
        print(f'#{r:02X}{g:02X}{b:02X}', end='')
    else:
        print('ERROR:NoScreen', end='')
except Exception as e:
    print(f'ERROR:{e}', end='')
PYEOF`

    try {
      // Use native macOS command via window.api.exec if available (OpenClaw bridge)
      const execBridge = (window as any).__execBridge
      if (execBridge) {
        const hex = await execBridge(`osascript -e '${script}' 2>/dev/null`)
        applyColor(hex, colorSlot)
      } else {
        // Fallback: use a fetch-based bridge (Aito exec endpoint)
        try {
          const resp = await fetch('/.api/exec', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ command: `osascript -e '${script}' 2>/dev/null`, timeout: 8000 })
          })
          const text = await resp.text()
          applyColor(text, colorSlot)
        } catch (fetchErr) {
          console.warn('[Eyedropper] Bridge not available, using clipboard approach')
          // Last resort: put hex in clipboard via prompt
          prompt('[Eyedropper] Copy hex color and press Enter', '#165DFF')
        }
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

const applyColor = (hex: string, slot: string) => {
  const clean = (hex || '').trim()
  if (clean.match(/^#[0-9A-Fa-f]{6}$/)) {
    templateData.value.colors[slot as keyof typeof templateData.value.colors] = clean
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


const openColorPicker = (slot: string) => {
  // The native color picker will open when clicking the color swatch
  // which is associated with the hidden native input
}

// ===== Preview =====
const previewScale = ref(0.75)
const showPreviewModal = ref(false)

const previewTemplate = () => {
  showPreviewModal.value = true
}

const onColorChange = () => {
  // Trigger live update
}

// ===== Save Template =====
const saveTemplate = async () => {
  if (!templateData.value.name.trim()) {
    alert('请填写模板名称')
    return
  }

  try {
    const res = await api.template.uploadTemplate({
      name: templateData.value.name,
      description: templateData.value.description,
      scene: templateData.value.scene,
      style: templateData.value.style,
      visibility: templateData.value.visibility,
      colors: [
        templateData.value.colors.primary,
        templateData.value.colors.secondary,
        templateData.value.colors.accent,
      ],
      fonts: [templateData.value.fonts.header, templateData.value.fonts.body],
    })

    if (res.data.success) {
      alert(`✅ 模板「${templateData.value.name}」已保存！`)
      router.push('/templates')
    }
  } catch (err: any) {
    console.error('[TemplateEditor] Save error:', err)
    alert('保存失败，请稍后重试')
  }
}

// ===== Navigation =====
const goBack = () => {
  router.back()
}

// ===== Load template for editing =====
const loadTemplateForEditing = async (id: string) => {
  try {
    const res = await api.template.listMyTemplates()
    const tpl = res.data.templates?.find((t: any) => t.id === id)
    if (tpl) {
      templateData.value.name = tpl.name
      templateData.value.description = tpl.description || ''
      templateData.value.scene = tpl.scene || 'business'
      templateData.value.style = tpl.style || 'professional'
      templateData.value.visibility = tpl.visibility || 'private'
      if (tpl.colors && tpl.colors.length >= 3) {
        templateData.value.colors.primary = tpl.colors[0]
        templateData.value.colors.secondary = tpl.colors[1]
        templateData.value.colors.accent = tpl.colors[2]
      }
      isEditing.value = true
      templateId.value = id
    }
  } catch (err) {
    console.warn('[TemplateEditor] Failed to load template:', err)
  }
}

// ===== Lifecycle =====
onMounted(() => {
  selectDefaultPairing()

  // Check if we're editing an existing template
  const urlParams = new URLSearchParams(window.location.search)
  const editId = urlParams.get('edit')
  if (editId) {
    loadTemplateForEditing(editId)
  }
})

onUnmounted(() => {
  stopEyedropper()
})
</script>

<style scoped>
.template-editor {
  min-height: 100vh;
  background: var(--gray-100);
  display: flex;
  flex-direction: column;
}

.editor-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

/* Header */
.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: white;
  border-bottom: 1px solid var(--gray-200);
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: var(--gray-100);
  border: none;
  border-radius: var(--radius-md);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.back-btn:hover {
  background: var(--gray-200);
}

.header-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-title h1 {
  font-size: 20px;
  font-weight: 700;
  color: var(--gray-900);
  margin: 0;
}

.editor-badge {
  background: linear-gradient(135deg, #5856D6, #165DFF);
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
}

/* Body Layout */
.editor-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Sidebar */
.editor-sidebar {
  width: 360px;
  min-width: 320px;
  background: white;
  border-right: 1px solid var(--gray-200);
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.config-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--gray-800);
  margin: 0 0 4px;
  padding-bottom: 8px;
  border-bottom: 2px solid var(--gray-200);
}

/* Form items */
.form-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-item label {
  font-size: 12px;
  font-weight: 600;
  color: var(--gray-600);
}

.form-input,
.form-textarea,
.form-select {
  padding: 8px 12px;
  border: 2px solid var(--gray-200);
  border-radius: var(--radius-md);
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: var(--primary);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

/* Color pickers */
.color-pickers {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.color-field label {
  font-size: 11px;
  font-weight: 600;
  color: var(--gray-500);
  margin-bottom: 4px;
  display: block;
}

.color-input-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-swatch-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  gap: 4px;
}

.color-input-native {
  position: absolute;
  width: 36px;
  height: 36px;
  opacity: 0;
  cursor: pointer;
  z-index: 2;
}

.color-swatch {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-md);
  border: 2px solid rgba(0,0,0,0.1);
  cursor: pointer;
  transition: transform 0.2s;
  position: relative;
  z-index: 1;
}

.color-swatch:hover {
  transform: scale(1.1);
}

.eyedropper-btn {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid var(--gray-200);
  background: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.eyedropper-btn:hover {
  border-color: var(--primary);
  background: #f0f5ff;
}

.eyedropper-btn.active {
  border-color: var(--primary);
  background: var(--primary);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(22, 93, 255, 0.4); }
  50% { box-shadow: 0 0 0 6px rgba(22, 93, 255, 0); }
}

.hex-input {
  flex: 1;
  padding: 8px 10px;
  border: 2px solid var(--gray-200);
  border-radius: var(--radius-md);
  font-family: monospace;
  font-size: 13px;
}

/* Presets */
.preset-section {
  margin-top: 4px;
}

.preset-label {
  font-size: 11px;
  font-weight: 600;
  color: var(--gray-500);
  display: block;
  margin-bottom: 8px;
}

.preset-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 6px;
}

.preset-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 6px;
  background: var(--gray-100);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
}

.preset-btn:hover {
  border-color: var(--gray-300);
  transform: translateY(-1px);
}

.preset-colors {
  display: flex;
  gap: 2px;
}

.preset-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(0,0,0,0.1);
}

.preset-name {
  font-size: 9px;
  color: var(--gray-600);
  text-align: center;
}

/* Font Pairings */
.font-pairings {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.font-pair-card {
  padding: 10px;
  background: var(--gray-100);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.font-pair-card:hover {
  border-color: var(--gray-300);
  transform: translateY(-2px);
}

.font-pair-card.active {
  border-color: var(--primary);
  background: white;
  box-shadow: 0 2px 8px rgba(22, 93, 255, 0.15);
}

.pair-preview {
  border-radius: var(--radius-sm);
  padding: 8px;
  margin-bottom: 8px;
}

.preview-sample {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.sample-header {
  font-size: 9px;
  font-weight: 700;
  color: var(--gray-700);
  text-transform: uppercase;
}

.sample-title {
  font-size: 11px;
  font-weight: 700;
  color: var(--gray-900);
}

.sample-body {
  font-size: 9px;
  color: var(--gray-500);
}

.sample-accent {
  font-size: 9px;
  font-weight: 600;
  color: var(--primary);
}

.pair-info {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
}

.pair-header-font,
.pair-body-font {
  font-weight: 500;
  color: var(--gray-700);
}

.pair-sep {
  color: var(--primary);
}

.pair-check {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  background: var(--primary);
  color: white;
  border-radius: 50%;
  font-size: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Layout Grid */
.layout-grid-config {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.grid-preview-container {
  border: 2px solid var(--gray-200);
  border-radius: var(--radius-md);
  padding: 12px;
  background: var(--gray-50);
}

.grid-preview {
  display: grid;
  border: 1px dashed var(--gray-300);
  aspect-ratio: 16/9;
}

.grid-cell {
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cell-num {
  font-size: 10px;
  color: rgba(0,0,0,0.2);
  font-weight: 600;
}

.grid-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.grid-control-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.grid-control-item label {
  font-size: 11px;
  font-weight: 600;
  color: var(--gray-600);
}

.slider-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.slider {
  flex: 1;
  height: 4px;
  appearance: none;
  background: var(--gray-200);
  border-radius: 2px;
  outline: none;
}

.slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--primary);
  cursor: pointer;
}

.slider-value {
  font-size: 12px;
  font-weight: 600;
  color: var(--primary);
  min-width: 36px;
  text-align: right;
}

/* Radio group */
.radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 2px solid var(--gray-200);
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.radio-item:hover {
  border-color: var(--gray-300);
}

.radio-item.active {
  border-color: var(--primary);
  background: rgba(22, 93, 255, 0.05);
}

.radio-item input {
  accent-color: var(--primary);
}

/* Editor Preview */
.editor-preview {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--gray-200);
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 20px;
  background: var(--gray-100);
  border-bottom: 1px solid var(--gray-300);
}

.preview-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--gray-600);
}

.preview-scale-controls {
  display: flex;
  gap: 4px;
}

.scale-btn {
  padding: 4px 10px;
  border: 1px solid var(--gray-300);
  border-radius: var(--radius-sm);
  background: white;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.scale-btn.active {
  background: var(--primary);
  color: white;
  border-color: var(--primary);
}

.preview-wrapper {
  flex: 1;
  overflow: auto;
  padding: 32px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}

.slide-preview-frame {
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.2);
  overflow: hidden;
  transform-origin: top center;
  transition: transform 0.3s;
  position: relative;
}

.preview-slide-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.slide-top-bar {
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.bar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.logo-placeholder {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}

.bar-text {
  font-size: 11px;
  font-weight: 600;
}

.bar-right {
  display: flex;
  gap: 6px;
}

.nav-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  opacity: 0.8;
}

.slide-main {
  flex: 1;
  display: grid;
  align-content: start;
}

.slide-title-area {
  padding: 24px;
  position: relative;
}

.title-underline {
  width: 40px;
  height: 3px;
  border-radius: 2px;
  margin-bottom: 12px;
}

.slide-h1 {
  font-size: 32px;
  font-weight: 800;
  margin: 0 0 8px;
  line-height: 1.2;
}

.slide-h2 {
  font-size: 18px;
  font-weight: 400;
  margin: 0;
  opacity: 0.8;
}

.slide-card {
  margin: 0 24px 24px;
  padding: 16px;
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.card-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  font-size: 16px;
}

.card-title {
  font-size: 14px;
  font-weight: 700;
  margin: 0 0 6px;
}

.card-text {
  font-size: 12px;
  color: var(--gray-600);
  margin: 0;
  line-height: 1.5;
}

.slide-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
}

.footer-text {
  font-size: 10px;
}

.footer-accent {
  width: 60px;
  height: 4px;
  border-radius: 2px;
  opacity: 0.6;
}

/* Preview Modal */
.preview-modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.85);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-modal-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

.preview-modal-slide {
  width: 960px;
  height: 540px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 16px 48px rgba(0,0,0,0.4);
}

.modal-close {
  position: absolute;
  top: -40px;
  right: 0;
  width: 36px;
  height: 36px;
  background: rgba(255,255,255,0.2);
  border: none;
  border-radius: 50%;
  color: white;
  font-size: 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  background: rgba(255,255,255,0.3);
}

/* Eyedropper overlay */
.eyedropper-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  pointer-events: none;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 24px;
}

.eyedropper-hint {
  background: rgba(0,0,0,0.8);
  color: white;
  padding: 12px 20px;
  border-radius: 24px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  pointer-events: all;
}

.hint-icon {
  font-size: 18px;
}

/* Buttons */
.btn {
  padding: 10px 20px;
  border-radius: var(--radius-md);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(22, 93, 255, 0.3);
}

.btn-outline {
  background: white;
  border: 2px solid var(--gray-300);
  color: var(--gray-700);
}

.btn-outline:hover {
  border-color: var(--primary);
  color: var(--primary);
}

/* Responsive */
@media (max-width: 1024px) {
  .editor-body {
    flex-direction: column;
  }

  .editor-sidebar {
    width: 100%;
    min-width: unset;
    max-height: 50vh;
    border-right: none;
    border-bottom: 1px solid var(--gray-200);
  }

  .editor-preview {
    min-height: 400px;
  }
}
</style>
