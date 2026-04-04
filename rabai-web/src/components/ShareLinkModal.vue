<template>
  <div v-if="show" class="modal-mask" @click.self="$emit('close')">
    <div class="share-link-modal">
      <div class="modal-header">
        <h3>📤 自定义分享</h3>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <!-- Preview Card -->
        <div class="share-preview-card">
          <div v-if="form.thumbnail" class="preview-thumbnail">
            <img :src="form.thumbnail" alt="预览图" @error="form.thumbnail = ''" />
          </div>
          <div v-else class="preview-thumbnail placeholder">
            <span>🖼️</span>
            <p>添加缩略图</p>
          </div>
          <div class="preview-content">
            <div class="preview-title">{{ form.title || 'RabAi Mind PPT' }}</div>
            <div class="preview-desc">{{ form.description || '来看看我创建的精彩演示文稿' }}</div>
            <div class="preview-domain">rabai.com</div>
          </div>
        </div>

        <!-- Form -->
        <div class="form-item">
          <label>分享标题</label>
          <input
            v-model="form.title"
            class="form-input"
            placeholder="给你的PPT起个标题"
            maxlength="100"
          />
        </div>

        <div class="form-item">
          <label>分享描述</label>
          <textarea
            v-model="form.description"
            class="form-textarea"
            placeholder="描述一下这个PPT的内容"
            rows="3"
            maxlength="300"
          ></textarea>
        </div>

        <div class="form-item">
          <label>缩略图URL <span class="optional">(可选)</span></label>
          <input
            v-model="form.thumbnail"
            class="form-input"
            placeholder="https://example.com/image.jpg"
          />
          <div class="thumbnail-hint">
            建议尺寸 1200×630 或 1.91:1 比例
          </div>
        </div>

        <!-- Generated URL Preview -->
        <div class="url-preview">
          <label>分享链接</label>
          <div class="url-box">
            <input
              :value="generatedUrl"
              class="url-input"
              readonly
              ref="urlInputRef"
            />
            <button class="copy-btn" @click="copyUrl">
              {{ copied ? '✅ 已复制' : '📋 复制' }}
            </button>
          </div>
        </div>

        <!-- Quick Presets -->
        <div class="quick-presets">
          <label>快速填充</label>
          <div class="preset-buttons">
            <button
              v-for="preset in presets"
              :key="preset.label"
              class="preset-btn"
              @click="applyPreset(preset)"
            >
              {{ preset.emoji }} {{ preset.label }}
            </button>
          </div>
        </div>

        <!-- Share Platforms -->
        <div class="share-platforms">
          <label>分享到</label>
          <div class="platform-grid">
            <button class="platform-btn" @click="shareTo('wechat')">
              <span class="platform-icon">💬</span>
              <span>微信</span>
            </button>
            <button class="platform-btn" @click="shareTo('weibo')">
              <span class="platform-icon">🌐</span>
              <span>微博</span>
            </button>
            <button class="platform-btn" @click="shareTo('qq')">
              <span class="platform-icon">🐧</span>
              <span>QQ</span>
            </button>
            <button class="platform-btn" @click="shareTo('linkedin')">
              <span class="platform-icon">💼</span>
              <span>领英</span>
            </button>
            <button class="platform-btn" @click="shareTo('twitter')">
              <span class="platform-icon">🐦</span>
              <span>Twitter</span>
            </button>
            <button class="platform-btn" @click="shareTo('copy')">
              <span class="platform-icon">🔗</span>
              <span>复制链接</span>
            </button>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn btn-outline" @click="$emit('close')">取消</button>
        <button class="btn btn-primary" @click="saveAndClose" :disabled="saving">
          {{ saving ? '保存中...' : '💾 保存并分享' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useEngagement } from '../composables/useEngagement'

interface Props {
  show: boolean
  taskId: string
  initialTitle?: string
  initialDescription?: string
  initialThumbnail?: string
}

interface Emits {
  (e: 'close'): void
  (e: 'saved', data: { title: string; description: string; thumbnail?: string }): void
}

const props = withDefaults(defineProps<Props>(), {
  initialTitle: '',
  initialDescription: '',
  initialThumbnail: ''
})

const emit = defineEmits<Emits>()

const { updateShareLink, shareLink, loadShareLink } = useEngagement(props.taskId)

const form = ref({
  title: props.initialTitle || 'RabAi Mind PPT',
  description: props.initialDescription || '来看看我创建的精彩演示文稿！',
  thumbnail: props.initialThumbnail || ''
})

const saving = ref(false)
const copied = ref(false)
const urlInputRef = ref<HTMLInputElement | null>(null)

const presets = [
  { emoji: '📊', label: '数据分析', title: '数据分析报告', description: '基于最新数据的深度分析，洞察业务趋势' },
  { emoji: '🚀', label: '产品发布', title: '产品发布会 PPT', description: '全新产品发布，引领行业创新' },
  { emoji: '💼', label: '商业计划', title: '商业计划书', description: '完整的商业模式与市场分析' },
  { emoji: '📚', label: '教育培训', title: '培训课程 PPT', description: '专业培训材料，助你快速成长' },
  { emoji: '🎨', label: '创意展示', title: '创意设计方案', description: '突破常规的创新设计方案' },
  { emoji: '📈', label: '工作汇报', title: '月度工作汇报', description: '月度工作成果与下月计划' }
]

const generatedUrl = computed(() => {
  return shareLink.value?.share_url || `${window.location.origin}/result?taskId=${props.taskId}`
})

watch(() => props.show, async (val) => {
  if (val) {
    // Load existing share link data
    await loadShareLink()
    if (shareLink.value) {
      form.value.title = shareLink.value.title || props.initialTitle || 'RabAi Mind PPT'
      form.value.description = shareLink.value.description || props.initialDescription || '来看看我创建的精彩演示文稿！'
      form.value.thumbnail = shareLink.value.thumbnail || ''
    }
  }
})

const applyPreset = (preset: { title: string; description: string }) => {
  form.value.title = preset.title
  form.value.description = preset.description
}

const copyUrl = async () => {
  try {
    await navigator.clipboard.writeText(generatedUrl.value)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    urlInputRef.value?.select()
    document.execCommand('copy')
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}

const saveAndClose = async () => {
  saving.value = true
  try {
    await updateShareLink(form.value.title, form.value.description, form.value.thumbnail || undefined)
    emit('saved', {
      title: form.value.title,
      description: form.value.description,
      thumbnail: form.value.thumbnail || undefined
    })
    emit('close')
  } catch (e) {
    console.error('Failed to save share link:', e)
  } finally {
    saving.value = false
  }
}

const shareTo = async (platform: string) => {
  // Save first
  await saveAndClose()

  const url = generatedUrl.value
  const title = form.value.title
  const desc = form.value.description

  switch (platform) {
    case 'wechat':
      // WeChat doesn't support direct URL sharing from web - show QR code instead
      alert('请使用下方二维码分享到微信群')
      break
    case 'weibo':
      window.open(
        `https://service.weibo.com/share/share.php?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title + ' ' + desc)}`,
        '_blank', 'width=600,height=400'
      )
      break
    case 'qq':
      window.open(
        `http://connect.qq.com/widget/shareqq/index.html?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}&desc=${encodeURIComponent(desc)}`,
        '_blank', 'width=600,height=400'
      )
      break
    case 'linkedin':
      window.open(
        `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
        '_blank', 'width=600,height=400'
      )
      break
    case 'twitter':
      window.open(
        `https://twitter.com/intent/tweet?text=${encodeURIComponent(title + ' ' + desc)}&url=${encodeURIComponent(url)}`,
        '_blank', 'width=600,height=400'
      )
      break
    case 'copy':
      await copyUrl()
      break
  }
}
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.share-link-modal {
  background: white;
  border-radius: 16px;
  width: 480px;
  max-width: 95vw;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

:global(.dark) .share-link-modal {
  background: #2a2a2a;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

:global(.dark) .modal-header {
  border-color: #333;
}

.modal-header h3 {
  margin: 0;
  font-size: 16px;
  color: #333;
}

:global(.dark) .modal-header h3 {
  color: #eee;
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 16px;
  border-radius: 6px;
  color: #888;
}

.close-btn:hover {
  background: #f0f0f0;
}

.modal-body {
  padding: 20px;
  overflow-y: auto;
  flex: 1;
}

/* Preview Card */
.share-preview-card {
  display: flex;
  gap: 12px;
  background: #f8f9fa;
  border: 1px solid #e0e0e0;
  border-radius: 12px;
  padding: 12px;
  margin-bottom: 16px;
}

:global(.dark) .share-preview-card {
  background: #1a1a1a;
  border-color: #333;
}

.preview-thumbnail {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.preview-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-thumbnail.placeholder {
  background: #e0e0e0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

:global(.dark) .preview-thumbnail.placeholder {
  background: #333;
}

.preview-thumbnail.placeholder p {
  font-size: 10px;
  color: #888;
  margin: 4px 0 0;
}

.preview-content {
  flex: 1;
  min-width: 0;
}

.preview-title {
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.dark) .preview-title {
  color: #eee;
}

.preview-desc {
  font-size: 12px;
  color: #666;
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

:global(.dark) .preview-desc {
  color: #aaa;
}

.preview-domain {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

/* Form */
.form-item {
  margin-bottom: 14px;
}

.form-item label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #555;
  margin-bottom: 6px;
}

:global(.dark) .form-item label {
  color: #aaa;
}

.optional {
  font-weight: 400;
  color: #999;
  font-size: 12px;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  box-sizing: border-box;
}

:global(.dark) .form-input,
:global(.dark) .form-textarea {
  background: #1a1a1a;
  border-color: #444;
  color: #fff;
}

.form-textarea {
  resize: vertical;
  min-height: 60px;
}

.thumbnail-hint {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

/* URL Preview */
.url-preview {
  margin-bottom: 16px;
}

.url-preview label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #555;
  margin-bottom: 6px;
}

:global(.dark) .url-preview label {
  color: #aaa;
}

.url-box {
  display: flex;
  gap: 8px;
}

.url-input {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 12px;
  background: #f8f9fa;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

:global(.dark) .url-input {
  background: #1a1a1a;
  border-color: #333;
  color: #aaa;
}

.copy-btn {
  padding: 8px 14px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  white-space: nowrap;
}

:global(.dark) .copy-btn {
  background: #2a2a2a;
  border-color: #444;
  color: #aaa;
}

.copy-btn:hover {
  background: #f0f0f0;
}

/* Quick Presets */
.quick-presets {
  margin-bottom: 16px;
}

.quick-presets label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #555;
  margin-bottom: 8px;
}

:global(.dark) .quick-presets label {
  color: #aaa;
}

.preset-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.preset-btn {
  padding: 6px 10px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
}

:global(.dark) .preset-btn {
  background: #2a2a2a;
  border-color: #444;
  color: #aaa;
}

.preset-btn:hover {
  background: #f0f7ff;
  border-color: #165DFF;
  color: #165DFF;
}

/* Share Platforms */
.share-platforms label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #555;
  margin-bottom: 10px;
}

:global(.dark) .share-platforms label {
  color: #aaa;
}

.platform-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 8px;
}

.platform-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 4px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 10px;
  cursor: pointer;
  font-size: 11px;
  color: #555;
}

:global(.dark) .platform-btn {
  background: #2a2a2a;
  border-color: #444;
  color: #aaa;
}

.platform-btn:hover {
  background: #f0f7ff;
  border-color: #165DFF;
  color: #165DFF;
}

.platform-icon {
  font-size: 20px;
}

/* Footer */
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}

:global(.dark) .modal-footer {
  border-color: #333;
}

.btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  border: none;
}

.btn-outline {
  background: white;
  border: 1px solid #e0e0e0;
  color: #555;
}

:global(.dark) .btn-outline {
  background: #2a2a2a;
  border-color: #444;
  color: #aaa;
}

.btn-primary {
  background: #165DFF;
  color: white;
}

.btn-primary:hover {
  background: #0d47e6;
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
