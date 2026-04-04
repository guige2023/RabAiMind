<template>
  <div class="brand-center">
    <div class="brand-header">
      <h2>🛡️ 品牌中心</h2>
      <p class="subtitle">自定义您的企业品牌标识，支持 LOGO 上传、配色素取和 White-label 全站重品牌</p>
    </div>

    <!-- White-label 模式提示 -->
    <div v-if="brand.white_label_mode" class="wl-banner">
      <span>🎯 White-label 模式已开启 — RabAiMind 品牌标识已隐藏</span>
    </div>

    <div class="brand-layout">
      <!-- 左侧：表单 -->
      <div class="brand-form-panel">
        <!-- 品牌名称 & Slogan -->
        <section class="form-section">
          <h3>基本信息</h3>
          <div class="form-item">
            <label>品牌名称</label>
            <input v-model="brand.brand_name" placeholder="例如：我的公司" />
          </div>
          <div class="form-item">
            <label>Slogan</label>
            <input v-model="brand.slogan" placeholder="品牌口号" />
          </div>
        </section>

        <!-- LOGO 上传 -->
        <section class="form-section">
          <h3>LOGO 设置</h3>
          <div class="logo-upload-area" @click="triggerLogoUpload" @dragover.prevent @drop.prevent="handleLogoDrop">
            <input ref="logoInput" type="file" accept="image/*" style="display:none" @change="handleLogoFile" />
            <div v-if="brand.logo_data" class="logo-preview-wrap">
              <img :src="brand.logo_data" class="logo-preview-img" alt="LOGO" />
              <button class="logo-remove-btn" @click.stop="removeLogo">✕</button>
            </div>
            <div v-else class="logo-placeholder">
              <span class="logo-icon">🖼️</span>
              <p>点击上传 / 拖拽 LOGO</p>
              <p class="hint">PNG、JPG、SVG，≤2MB</p>
            </div>
          </div>

          <!-- LOGO 位置 -->
          <div class="form-item">
            <label>LOGO 位置</label>
            <div class="position-grid">
              <button
                v-for="pos in positions"
                :key="pos.value"
                :class="['pos-btn', { active: brand.logo_position === pos.value }]"
                @click="brand.logo_position = pos.value"
                :title="pos.label"
              >
                <span class="pos-icon">{{ pos.icon }}</span>
                <span class="pos-label">{{ pos.label }}</span>
              </button>
            </div>
          </div>

          <!-- 从 LOGO 提取颜色 -->
          <div class="form-item">
            <label>智能配色</label>
            <div class="color-helper-row">
              <button class="btn-detect" @click="triggerColorDetect" :disabled="!brand.logo_data">
                🎨 从 LOGO 提取配色
              </button>
              <label class="toggle-label">
                <input type="checkbox" v-model="brand.auto_color_detection" />
                <span>自动应用到主题</span>
              </label>
            </div>
            <div v-if="detectedColors.length > 0" class="detected-colors">
              <span
                v-for="(c, i) in detectedColors"
                :key="i"
                class="detected-color-dot"
                :style="{ background: c }"
                :title="c"
                @click="applyDetectedColor(i, c)"
              ></span>
              <span class="detected-hint">点击颜色应用到主题</span>
            </div>
          </div>
        </section>

        <!-- 品牌配色 -->
        <section class="form-section">
          <h3>品牌配色</h3>
          <div class="color-row">
            <div class="color-item">
              <label>主色</label>
              <div class="color-input-wrap">
                <input type="color" v-model="brand.primary_color" />
                <span class="color-hex">{{ brand.primary_color }}</span>
              </div>
            </div>
            <div class="color-item">
              <label>辅色</label>
              <div class="color-input-wrap">
                <input type="color" v-model="brand.secondary_color" />
                <span class="color-hex">{{ brand.secondary_color }}</span>
              </div>
            </div>
            <div class="color-item">
              <label>强调色</label>
              <div class="color-input-wrap">
                <input type="color" v-model="brand.accent_color" />
                <span class="color-hex">{{ brand.accent_color }}</span>
              </div>
            </div>
          </div>
        </section>

        <!-- 字体 -->
        <section class="form-section">
          <h3>品牌字体</h3>
          <div class="form-item">
            <label>字体列表</label>
            <input v-model="brand.fonts" placeholder="字体1, 字体2" />
            <p class="hint">多个字体用逗号分隔，PPT 生成时会优先使用第一个可用字体</p>
          </div>
        </section>

        <!-- 页脚 & Branding -->
        <section class="form-section">
          <h3>页脚 & Branding</h3>
          <div class="form-item">
            <label>自定义页脚文本</label>
            <input v-model="brand.footer_text" placeholder="例如：© 2024 我的公司 | www.example.com" />
          </div>
          <div class="form-item toggle-row">
            <label class="toggle-label">
              <input type="checkbox" v-model="brand.powered_by_toggle" />
              <span class="toggle-switch"></span>
              <span>显示 "Powered by RabAiMind"</span>
            </label>
          </div>
          <div class="form-item toggle-row">
            <label class="toggle-label">
              <input type="checkbox" v-model="brand.white_label_mode" />
              <span class="toggle-switch"></span>
              <span>White-label 模式</span>
            </label>
            <p class="hint wl-hint">开启后隐藏所有 RabAiMind 品牌标识，支持全站重品牌</p>
          </div>
        </section>

        <!-- 自定义域名 (R104) -->
        <section class="form-section">
          <h3>🌐 自定义域名</h3>
          <div class="form-item">
            <label>自定义域名</label>
            <input v-model="brand.custom_domain" placeholder="例如：ppt.yourcompany.com" />
          </div>
          <p class="hint">设置后，分享链接将使用此域名。需配置 DNS CNAME 指向 RabAiMind 服务器。</p>
        </section>

        <!-- 品牌邮件模板 (R104) -->
        <section class="form-section">
          <h3>📧 品牌邮件模板</h3>
          <div class="form-item toggle-row">
            <label class="toggle-label">
              <input type="checkbox" v-model="brand.email_template_enabled" />
              <span class="toggle-switch"></span>
              <span>启用品牌邮件模板</span>
            </label>
            <p class="hint">开启后，邮件分享将使用品牌配色和 LOGO</p>
          </div>
          <div class="form-item">
            <label>邮件签名语</label>
            <input v-model="brand.email_tagline" placeholder="例如：由 XX 公司提供" />
          </div>
        </section>

        <!-- 品牌套件 (R104) -->
        <section class="form-section">
          <h3>🎨 品牌套件</h3>
          <p class="hint" style="margin-bottom:12px">将当前配色方案保存为可复用的品牌套件，方便在不同场合快速切换</p>
          <div class="form-item">
            <label>套件名称</label>
            <input v-model="newKitName" placeholder="例如：企业蓝、活力橙" style="flex:1" />
            <button class="btn-save-kit" @click="saveKit" :disabled="!newKitName.trim()">保存当前为套件</button>
          </div>
          <div v-if="brand.brand_kits && brand.brand_kits.length > 0" class="kit-list">
            <div v-for="kit in brand.brand_kits" :key="kit.kit_id" class="kit-item">
              <div class="kit-info">
                <span class="kit-name">{{ kit.kit_name }}</span>
                <span class="kit-colors">
                  <span class="color-dot" :style="{ background: kit.primary_color }"></span>
                  <span class="color-dot" :style="{ background: kit.secondary_color }"></span>
                  <span class="color-dot" :style="{ background: kit.accent_color }"></span>
                </span>
              </div>
              <div class="kit-actions">
                <button class="kit-btn apply" @click="applyKit(kit.kit_id)">应用</button>
                <button class="kit-btn delete" @click="deleteKit(kit.kit_id)">删除</button>
              </div>
            </div>
          </div>
          <p v-else class="hint">暂无品牌套件，保存当前配置后可创建</p>
        </section>

        <button class="btn-save" @click="saveBrand">💾 保存品牌配置</button>
      </div>

      <!-- 右侧：预览 -->
      <div class="brand-preview-panel">
        <h3>📽️ 尾页预览</h3>
        <div class="preview-slide" :style="previewSlideStyle">
          <!-- LOGO -->
          <div v-if="brand.logo_data" :class="['preview-logo', `pos-${brand.logo_position}`]">
            <img :src="brand.logo_data" alt="LOGO" />
          </div>

          <!-- 品牌信息 -->
          <div class="preview-brand-info">
            <h4>{{ brand.brand_name || '品牌名称' }}</h4>
            <p>{{ brand.slogan || '品牌口号' }}</p>
          </div>

          <!-- 页脚 -->
          <div class="preview-footer">
            <span v-if="brand.footer_text">{{ brand.footer_text }}</span>
            <span v-if="brand.powered_by_toggle && !brand.white_label_mode" class="powered-by">
              Powered by RabAiMind
            </span>
          </div>
        </div>

        <!-- 品牌一致性评分 (R132) -->
        <div class="consistency-section">
          <h3>📊 品牌一致性评分</h3>
          <p class="hint" style="margin-bottom:12px">检查 PPT 是否符合品牌配色和设计规范</p>

          <!-- 选择 PPT -->
          <div class="form-item" style="flex-direction:column; align-items:stretch">
            <label style="width:auto;margin-bottom:6px">选择 PPT</label>
            <select v-model="selectedTaskId" class="task-select">
              <option value="">— 请选择 —</option>
              <option v-for="task in recentTasks" :key="task.task_id" :value="task.task_id">
                {{ task.title || task.task_id?.slice(0, 12) }} ({{ task.slide_count || task.result?.slide_count || '?' }}页)
              </option>
            </select>
          </div>

          <button class="btn-check-consistency" @click="checkConsistency" :disabled="!selectedTaskId || checkingConsistency">
            {{ checkingConsistency ? '检查中...' : '🔍 检查一致性' }}
          </button>

          <!-- 评分结果 -->
          <div v-if="consistencyResult" class="consistency-result">
            <!-- 总分 -->
            <div class="score-display">
              <div class="score-circle" :style="{ borderColor: consistencyScoreColor }">
                <span class="score-num" :style="{ color: consistencyScoreColor }">
                  {{ consistencyResult.overall_score ?? consistencyResult.data?.overall_score ?? 0 }}
                </span>
                <span class="score-max">/ 100</span>
              </div>
              <span class="score-label" :style="{ color: consistencyScoreColor }">{{ consistencyScoreLabel }}</span>
            </div>

            <!-- 问题统计 -->
            <div class="violation-summary" v-if="consistencyResult.data || consistencyResult.violations">
              <span class="vio-tag critical" v-if="(consistencyResult.critical_count ?? 0) > 0">
                🔴 严重 {{ consistencyResult.critical_count }}
              </span>
              <span class="vio-tag warning" v-if="(consistencyResult.warning_count ?? 0) > 0">
                🟡 警告 {{ consistencyResult.warning_count }}
              </span>
              <span class="vio-tag suggestion" v-if="(consistencyResult.suggestion_count ?? 0) > 0">
                🔵 建议 {{ consistencyResult.suggestion_count }}
              </span>
            </div>

            <!-- 违规列表 -->
            <div v-if="(consistencyResult.data?.violations?.length ?? 0) > 0" class="violation-list">
              <div
                v-for="(v, i) in (consistencyResult.data?.violations || []).slice(0, 5)"
                :key="i"
                class="violation-item"
                :class="'sev-' + v.severity"
              >
                <span class="vio-sev">{{ v.severity === 'critical' ? '🔴' : v.severity === 'warning' ? '🟡' : '🔵' }}</span>
                <div class="vio-content">
                  <div class="vio-desc">{{ v.description }}</div>
                  <div class="vio-fix" v-if="v.suggested_fix">→ {{ v.suggested_fix }}</div>
                </div>
              </div>
            </div>

            <!-- 改进建议 -->
            <div v-if="(consistencyResult.data?.recommendations?.length ?? 0) > 0" class="recommendations">
              <p class="rec-title">💡 改进建议</p>
              <ul>
                <li v-for="(rec, i) in (consistencyResult.data?.recommendations || []).slice(0, 3)" :key="i">{{ rec }}</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- 已有品牌 -->
        <div class="history" v-if="brandList.length > 0">
          <h3>已有品牌配置</h3>
          <div class="brand-list">
            <div
              v-for="b in brandList"
              :key="b.user_id"
              class="brand-item"
              @click="loadBrand(b)"
            >
              <span class="brand-name">{{ b.brand_name || '未命名' }}</span>
              <span class="brand-colors">
                <span
                  v-for="c in [b.primary_color, b.secondary_color, b.accent_color]"
                  :key="c"
                  class="color-dot"
                  :style="{ background: c }"
                ></span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '../api/client'

const brand = ref({
  brand_name: '',
  primary_color: '#165DFF',
  secondary_color: '#0E42D2',
  accent_color: '#FF9500',
  fonts: '思源黑体, Arial',
  slogan: '',
  logo_data: '',
  logo_position: 'bottom-right',
  powered_by_toggle: true,
  footer_text: '',
  white_label_mode: false,
  auto_color_detection: false,
  custom_domain: '',
  brand_kits: [],
  email_template_enabled: true,
  email_tagline: '',
})

const brandList = ref([])
const detectedColors = ref([])
const logoInput = ref(null)
const newKitName = ref('')
const newKitLogo = ref('')

// ===== 品牌套件管理 (R104) =====

const saveKit = async () => {
  if (!newKitName.value.trim()) return
  try {
    const payload = {
      kit_name: newKitName.value.trim(),
      primary_color: brand.value.primary_color,
      secondary_color: brand.value.secondary_color,
      accent_color: brand.value.accent_color,
      fonts: brand.value.fonts.split(',').map(f => f.trim()).filter(Boolean),
      logo_data: brand.value.logo_data,
      logo_position: brand.value.logo_position,
    }
    await api.post('/brand/kit/save', payload)
    newKitName.value = ''
    alert('✅ 品牌套件已保存')
    loadCurrentBrand()
  } catch (e) {
    console.error('保存套件失败:', e)
    alert('保存套件失败')
  }
}

const applyKit = async (kitId) => {
  try {
    const res = await api.post(`/brand/kit/apply/default/${kitId}`)
    if (res.data?.kit) {
      const k = res.data.kit
      brand.value.primary_color = k.primary_color
      brand.value.secondary_color = k.secondary_color
      brand.value.accent_color = k.accent_color
      brand.value.fonts = Array.isArray(k.fonts) ? k.fonts.join(', ') : (k.fonts || '思源黑体, Arial')
      brand.value.logo_data = k.logo_data || ''
      brand.value.logo_position = k.logo_position || 'bottom-right'
      alert('✅ 品牌套件已应用')
    }
  } catch (e) {
    console.error('应用套件失败:', e)
    alert('应用套件失败')
  }
}

const deleteKit = async (kitId) => {
  if (!confirm('确定删除该品牌套件？')) return
  try {
    await api.delete(`/brand/kit/default/${kitId}`)
    alert('✅ 品牌套件已删除')
    loadCurrentBrand()
  } catch (e) {
    console.error('删除套件失败:', e)
    alert('删除套件失败')
  }
}

// ===== 品牌一致性评分 (R132) =====

const recentTasks = ref([])
const selectedTaskId = ref('')
const consistencyResult = ref(null)
const checkingConsistency = ref(false)

const loadRecentTasks = async () => {
  try {
    const res = await api.get('/ppt/history?status=completed')
    if (res.data?.tasks) {
      recentTasks.value = (res.data.tasks || [])
        .filter((t) => t.status === 'completed')
        .slice(0, 10)
    }
  } catch (e) {
    console.error('加载历史任务失败:', e)
  }
}

const checkConsistency = async () => {
  if (!selectedTaskId.value) {
    alert('请先选择一个 PPT')
    return
  }
  checkingConsistency.value = true
  consistencyResult.value = null
  try {
    const res = await api.post('/brand/consistency-check', {
      task_id: selectedTaskId.value,
      user_id: 'default',
    })
    if (res.data?.success !== false) {
      consistencyResult.value = res.data
    } else {
      alert(res.data?.message || '检查失败')
    }
  } catch (e) {
    console.error('品牌一致性检查失败:', e)
    alert('检查失败: ' + (e?.message || '未知错误'))
  } finally {
    checkingConsistency.value = false
  }
}

const consistencyScoreLabel = computed(() => {
  if (!consistencyResult.value) return ''
  const s = consistencyResult.value.overall_score ?? consistencyResult.value.data?.overall_score ?? 0
  if (s >= 90) return '优秀'
  if (s >= 75) return '良好'
  if (s >= 60) return '一般'
  return '需改进'
})

const consistencyScoreColor = computed(() => {
  if (!consistencyResult.value) return '#999'
  const s = consistencyResult.value.overall_score ?? consistencyResult.value.data?.overall_score ?? 0
  if (s >= 90) return '#52c41a'
  if (s >= 75) return '#165DFF'
  if (s >= 60) return '#faad14'
  return '#ff4d4f'
})

const positions = [
  { value: 'top-left', label: '左上', icon: '↖' },
  { value: 'top-right', label: '右上', icon: '↗' },
  { value: 'bottom-left', label: '左下', icon: '↙' },
  { value: 'bottom-right', label: '右下', icon: '↘' },
  { value: 'center', label: '居中', icon: '◉' },
]

const previewSlideStyle = computed(() => ({
  background: `linear-gradient(135deg, ${brand.value.primary_color}22, ${brand.value.secondary_color}44)`,
  borderColor: brand.value.primary_color,
}))

const triggerLogoUpload = () => {
  logoInput.value?.click()
}

const handleLogoFile = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  await processLogoFile(file)
}

const handleLogoDrop = async (e) => {
  const file = e.dataTransfer.files[0]
  if (!file || !file.type.startsWith('image/')) return
  await processLogoFile(file)
}

const processLogoFile = async (file) => {
  if (file.size > 2 * 1024 * 1024) {
    alert('图片大小不能超过 2MB')
    return
  }
  const reader = new FileReader()
  reader.onload = async (e) => {
    brand.value.logo_data = e.target.result
    // 自动检测颜色
    if (brand.value.auto_color_detection) {
      await detectColorsFromLogo()
    }
  }
  reader.readAsDataURL(file)
}

const removeLogo = () => {
  brand.value.logo_data = ''
  detectedColors.value = []
}

const triggerColorDetect = async () => {
  if (!brand.value.logo_data) return
  // 触发隐藏的文件选择
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    await detectColorsFromFile(file)
  }
  input.click()
}

const detectColorsFromFile = async (file) => {
  try {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch('/api/v1/brand/detect-colors', {
      method: 'POST',
      body: formData,
    })
    const data = await res.json()
    if (data.success) {
      detectedColors.value = data.colors || []
      // 自动应用
      brand.value.primary_color = data.primary_color
      brand.value.secondary_color = data.secondary_color
      brand.value.accent_color = data.accent_color
    } else {
      alert(data.message || '颜色提取失败')
    }
  } catch (e) {
    console.error('颜色提取失败:', e)
    alert('颜色提取失败，请手动设置配色')
  }
}

const applyDetectedColor = (index, color) => {
  const map = { 0: 'primary_color', 1: 'secondary_color', 2: 'accent_color' }
  if (map[index]) {
    brand.value[map[index]] = color
  }
}

const saveBrand = async () => {
  try {
    const payload = {
      ...brand.value,
      fonts: brand.value.fonts.split(',').map(f => f.trim()).filter(Boolean),
    }
    await api.post('/brand/save', payload)
    alert('✅ 品牌配置已保存')
    loadBrandList()
  } catch (e) {
    console.error('保存失败:', e)
    alert('保存失败: ' + (e.message || '未知错误'))
  }
}

const loadBrand = (b) => {
  brand.value = {
    brand_name: b.brand_name || '',
    primary_color: b.primary_color || '#165DFF',
    secondary_color: b.secondary_color || '#0E42D2',
    accent_color: b.accent_color || '#FF9500',
    fonts: Array.isArray(b.fonts) ? b.fonts.join(', ') : (b.fonts || '思源黑体, Arial'),
    slogan: b.slogan || '',
    logo_data: b.logo_data || '',
    logo_position: b.logo_position || 'bottom-right',
    powered_by_toggle: b.powered_by_toggle !== false,
    footer_text: b.footer_text || '',
    white_label_mode: b.white_label_mode || false,
    auto_color_detection: b.auto_color_detection || false,
  }
  detectedColors.value = []
}

const loadBrandList = async () => {
  try {
    const res = await api.get('/brand/get/default')
    if (res.data?.brand) {
      // 只显示当前用户的
      brandList.value = res.data.brand.brand_name ? [res.data.brand] : []
    }
  } catch (e) {
    console.error('加载品牌列表失败:', e)
  }
}

const loadCurrentBrand = async () => {
  try {
    const res = await api.get('/brand/get/default')
    if (res.data?.brand) {
      loadBrand(res.data.brand)
    }
  } catch (e) {
    console.error('加载品牌失败:', e)
  }
}

onMounted(() => {
  loadCurrentBrand()
  loadBrandList()
  loadRecentTasks()
})
</script>

<style scoped>
.brand-center {
  padding: 24px;
  max-width: 1100px;
  margin: 0 auto;
}

.brand-header {
  margin-bottom: 24px;
}

.brand-header h2 {
  margin: 0 0 8px;
  font-size: 24px;
}

.subtitle {
  color: #666;
  margin: 0;
}

.wl-banner {
  background: linear-gradient(135deg, #1a1a2e, #16213e);
  color: #fff;
  padding: 12px 20px;
  border-radius: 10px;
  margin-bottom: 20px;
  font-size: 14px;
}

.brand-layout {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 24px;
}

@media (max-width: 900px) {
  .brand-layout {
    grid-template-columns: 1fr;
  }
}

/* 表单面板 */
.brand-form-panel {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-section {
  border-bottom: 1px solid #eee;
  padding-bottom: 20px;
}

.form-section:last-of-type {
  border-bottom: none;
}

.form-section h3 {
  margin: 0 0 16px;
  font-size: 15px;
  color: #333;
}

.form-item {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.form-item label {
  width: 100px;
  font-weight: 600;
  font-size: 14px;
  flex-shrink: 0;
}

.form-item input[type='text'] {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  min-width: 0;
}

.form-item input[type='text']:focus {
  outline: none;
  border-color: #165DFF;
}

/* LOGO 上传 */
.logo-upload-area {
  border: 2px dashed #ddd;
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 16px;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-upload-area:hover {
  border-color: #165DFF;
  background: #f0f6ff;
}

.logo-preview-wrap {
  position: relative;
  display: inline-block;
}

.logo-preview-img {
  max-height: 80px;
  max-width: 200px;
  object-fit: contain;
}

.logo-remove-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: none;
  background: #ff4d4f;
  color: #fff;
  font-size: 12px;
  cursor: pointer;
  line-height: 1;
}

.logo-placeholder {
  color: #999;
}

.logo-placeholder .logo-icon {
  font-size: 32px;
  display: block;
  margin-bottom: 8px;
}

.logo-placeholder p {
  margin: 4px 0;
}

.logo-placeholder .hint {
  font-size: 12px;
  color: #bbb;
}

/* 位置选择器 */
.position-grid {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pos-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.pos-btn:hover {
  border-color: #165DFF;
  background: #f0f6ff;
}

.pos-btn.active {
  border-color: #165DFF;
  background: #165DFF;
  color: #fff;
}

.pos-icon {
  font-size: 16px;
}

.pos-label {
  font-size: 11px;
}

/* 颜色检测 */
.color-helper-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.btn-detect {
  padding: 8px 16px;
  background: linear-gradient(135deg, #165DFF, #0E42D2);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: opacity 0.2s;
}

.btn-detect:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-detect:hover:not(:disabled) {
  opacity: 0.9;
}

.detected-colors {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.detected-color-dot {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid rgba(0,0,0,0.1);
  transition: transform 0.2s;
}

.detected-color-dot:hover {
  transform: scale(1.15);
}

.detected-hint {
  font-size: 12px;
  color: #999;
}

/* 配色行 */
.color-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.color-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.color-item label {
  font-size: 12px;
  color: #666;
  width: auto;
}

.color-input-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}

.color-input-wrap input[type='color'] {
  width: 44px;
  height: 36px;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  padding: 2px;
}

.color-hex {
  font-family: monospace;
  font-size: 13px;
  color: #666;
}

/* Toggle */
.toggle-row {
  align-items: flex-start;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 14px;
}

.toggle-label input[type='checkbox'] {
  display: none;
}

.toggle-switch {
  width: 40px;
  height: 22px;
  background: #ddd;
  border-radius: 11px;
  position: relative;
  transition: background 0.2s;
  flex-shrink: 0;
}

.toggle-switch::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  background: #fff;
  border-radius: 50%;
  transition: left 0.2s;
}

.toggle-label input:checked + .toggle-switch {
  background: #165DFF;
}

.toggle-label input:checked + .toggle-switch::after {
  left: 21px;
}

.hint {
  font-size: 12px;
  color: #999;
  margin: 4px 0 0;
}

.wl-hint {
  margin-left: 112px;
}

/* 保存按钮 */
.btn-save {
  width: 100%;
  padding: 14px;
  background: linear-gradient(135deg, #165DFF, #0E42D2);
  color: #fff;
  border: none;
  border-radius: 10px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  transition: opacity 0.2s;
}

.btn-save:hover {
  opacity: 0.9;
}

/* 预览面板 */
.brand-preview-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.brand-preview-panel h3 {
  margin: 0 0 8px;
  font-size: 15px;
  color: #333;
}

.preview-slide {
  aspect-ratio: 16/9;
  border-radius: 12px;
  border: 2px solid #eee;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
  background-size: cover !important;
  min-height: 200px;
}

.preview-logo {
  position: absolute;
}

.preview-logo.pos-top-left { top: 12px; left: 12px; }
.preview-logo.pos-top-right { top: 12px; right: 12px; }
.preview-logo.pos-bottom-left { bottom: 40px; left: 12px; }
.preview-logo.pos-bottom-right { bottom: 40px; right: 12px; }
.preview-logo.pos-center { top: 50%; left: 50%; transform: translate(-50%, -50%); }

.preview-logo img {
  max-height: 40px;
  max-width: 120px;
  object-fit: contain;
}

.preview-brand-info {
  text-align: center;
}

.preview-brand-info h4 {
  margin: 0 0 4px;
  font-size: 18px;
  color: #333;
}

.preview-brand-info p {
  margin: 0;
  font-size: 12px;
  color: #666;
}

.preview-footer {
  position: absolute;
  bottom: 8px;
  left: 0;
  right: 0;
  text-align: center;
  font-size: 10px;
  color: #999;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.powered-by {
  color: #bbb;
  font-size: 10px;
}

/* 历史品牌列表 */
.history {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
}

.brand-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.brand-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid #eee;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.brand-item:hover {
  background: #f5f5f5;
}

.brand-name {
  font-weight: 600;
  font-size: 14px;
}

.brand-colors {
  display: flex;
  gap: 6px;
}

.color-dot {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: inline-block;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

/* 品牌一致性评分 (R132) */
.consistency-section {
  background: #fff;
  border-radius: 12px;
  padding: 16px;
}

.consistency-section h3 {
  margin: 0 0 8px;
  font-size: 15px;
}

.task-select {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 13px;
  color: #333;
  background: #fff;
  margin-bottom: 10px;
}

.task-select:focus {
  outline: none;
  border-color: #165DFF;
}

.btn-check-consistency {
  width: 100%;
  padding: 10px;
  background: linear-gradient(135deg, #165DFF, #0E42D2);
  color: #fff;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: opacity 0.2s;
  margin-bottom: 12px;
}

.btn-check-consistency:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-check-consistency:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.consistency-result {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.score-display {
  display: flex;
  align-items: center;
  gap: 12px;
}

.score-circle {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  border: 4px solid;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.score-num {
  font-size: 22px;
  font-weight: 700;
  line-height: 1;
}

.score-max {
  font-size: 11px;
  color: #999;
}

.score-label {
  font-size: 16px;
  font-weight: 600;
}

.violation-summary {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.vio-tag {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
}

.vio-tag.critical { background: #fff1f0; color: #cf1322; }
.vio-tag.warning { background: #fffbe6; color: #d46b08; }
.vio-tag.suggestion { background: #f0f5ff; color: #1677ff; }

.violation-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.violation-item {
  display: flex;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 12px;
  align-items: flex-start;
}

.violation-item.sev-critical { background: #fff1f0; }
.violation-item.sev-warning { background: #fffbe6; }
.violation-item.sev-suggestion { background: #f0f5ff; }

.vio-sev {
  font-size: 14px;
  flex-shrink: 0;
}

.vio-content {
  flex: 1;
}

.vio-desc {
  color: #333;
  line-height: 1.4;
}

.vio-fix {
  color: #666;
  font-size: 11px;
  margin-top: 2px;
}

.recommendations {
  background: #f6ffed;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 12px;
}

.rec-title {
  margin: 0 0 6px;
  font-weight: 600;
  color: #389e0d;
}

.recommendations ul {
  margin: 0;
  padding-left: 18px;
}

.recommendations li {
  margin-bottom: 4px;
  color: #333;
}

/* 品牌套件按钮 */
.btn-save-kit {
  padding: 8px 14px;
  background: #f0f5ff;
  color: #165DFF;
  border: 1px solid #165DFF;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.btn-save-kit:hover:not(:disabled) {
  background: #165DFF;
  color: #fff;
}

.btn-save-kit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.kit-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.kit-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border: 1px solid #eee;
  border-radius: 8px;
}

.kit-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.kit-name {
  font-weight: 600;
  font-size: 14px;
}

.kit-colors {
  display: flex;
  gap: 4px;
}

.kit-actions {
  display: flex;
  gap: 6px;
}

.kit-btn {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  border: none;
  transition: all 0.2s;
}

.kit-btn.apply {
  background: #f0f5ff;
  color: #165DFF;
}

.kit-btn.apply:hover {
  background: #165DFF;
  color: #fff;
}

.kit-btn.delete {
  background: #fff1f0;
  color: #cf1322;
}

.kit-btn.delete:hover {
  background: #ff4d4f;
  color: #fff;
}
</style>
