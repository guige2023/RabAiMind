<template>
  <div class="media-library">
    <div class="library-header">
      <h1 class="page-title">素材库</h1>
      <div class="header-actions">
        <button class="btn btn-ai" @click="showAIGenerate = true">
          <span>🎨</span> AI生图
        </button>
        <button class="btn btn-primary" @click="showUpload = true">
          <span>+</span> 上传素材
        </button>
      </div>
    </div>

    <!-- AI生图弹窗 -->
    <div v-if="showAIGenerate" class="modal-overlay" @click.self="showAIGenerate = false">
      <div class="modal-content ai-generate-modal">
        <div class="modal-header">
          <h2>AI 生成图片</h2>
          <button class="close-btn" @click="showAIGenerate = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>图片描述</label>
            <textarea
              v-model="aiPrompt"
              placeholder="描述你想要的图片，例如：一只可爱的橘猫坐在草地上，阳光明媚"
              rows="4"
            ></textarea>
          </div>
          <div class="form-group">
            <label>图片尺寸</label>
            <select v-model="aiSize">
              <option value="1024x1024">方形 (1024×1024)</option>
              <option value="1024x1792">竖版 (1024×1792)</option>
              <option value="1792x1024">横版 (1792×1024)</option>
            </select>
          </div>
          <div class="form-group">
            <label>生成数量</label>
            <select v-model="aiCount">
              <option :value="1">1 张</option>
              <option :value="2">2 张</option>
              <option :value="4">4 张</option>
            </select>
          </div>

          <!-- 生成结果 -->
          <div v-if="aiResults.length > 0" class="ai-results">
            <div v-for="(img, idx) in aiResults" :key="idx" class="ai-result-item">
              <img :src="img.url" :alt="`AI生成 ${idx + 1}`" />
              <button class="btn-download" @click="downloadImage(img.url)">下载</button>
            </div>
          </div>

          <div v-if="aiLoading" class="ai-loading">
            <div class="loading-spinner"></div>
            <p>AI 正在生成图片，请稍候...</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showAIGenerate = false">取消</button>
          <button
            class="btn btn-ai"
            @click="generateImage"
            :disabled="aiLoading || !aiPrompt.trim()"
          >
            {{ aiLoading ? '生成中...' : '开始生成' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 上传弹窗 -->
    <div v-if="showUpload" class="modal-overlay" @click.self="showUpload = false">
      <div class="modal-content upload-modal">
        <div class="modal-header">
          <h2>上传素材</h2>
          <button class="close-btn" @click="showUpload = false">×</button>
        </div>
        <div class="modal-body">
          <div
            class="upload-area"
            :class="{ 'drag-over': isDragOver }"
            @dragover.prevent="isDragOver = true"
            @dragleave="isDragOver = false"
            @drop.prevent="handleDrop"
          >
            <input
              type="file"
              ref="fileInput"
              accept="image/*"
              multiple
              @change="handleFileSelect"
              hidden
            />
            <div class="upload-icon">📁</div>
            <p class="upload-text">拖拽文件到此处或点击上传</p>
            <p class="upload-hint">支持 PNG、JPG、GIF、SVG 等格式</p>
          </div>

          <!-- 上传列表 -->
          <div v-if="uploadQueue.length > 0" class="upload-queue">
            <div v-for="(item, index) in uploadQueue" :key="index" class="upload-item">
              <img :src="item.preview" class="upload-preview" />
              <div class="upload-info">
                <span class="upload-name">{{ item.file.name }}</span>
                <span class="upload-size">{{ formatSize(item.file.size) }}</span>
              </div>
              <div class="upload-status">
                <span v-if="item.status === 'pending'" class="status-pending">等待中</span>
                <span v-else-if="item.status === 'uploading'" class="status-uploading">上传中...</span>
                <span v-else-if="item.status === 'done'" class="status-done">✓</span>
                <span v-else-if="item.status === 'error'" class="status-error">✗</span>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showUpload = false">取消</button>
          <button class="btn btn-primary" @click="startUpload" :disabled="uploadQueue.length === 0">
            开始上传
          </button>
        </div>
      </div>
    </div>

    <!-- 素材分类 -->
    <div class="category-tabs">
      <button
        v-for="cat in categories"
        :key="cat.id"
        class="category-btn"
        :class="{ active: activeCategory === cat.id }"
        @click="activeCategory = cat.id"
      >
        {{ cat.name }}
      </button>
    </div>

    <!-- 素材网格 -->
    <div class="media-grid">
      <div v-for="item in filteredMedia" :key="item.id" class="media-item" @click="selectMedia(item)">
        <img :src="item.url" :alt="item.name" class="media-img" />
        <div class="media-overlay">
          <span class="media-name">{{ item.name }}</span>
          <div class="media-actions">
            <button class="action-btn action-btn-ppt" @click.stop="useForPPT(item)" title="用于PPT">📊</button>
            <button class="action-btn" @click.stop="editMedia(item)">✏️</button>
            <button class="action-btn" @click.stop="deleteMedia(item)">🗑️</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="filteredMedia.length === 0" class="empty-state">
      <div class="empty-icon">📂</div>
      <p>暂无素材</p>
      <button class="btn btn-primary" @click="showUpload = true">上传素材</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { apiClient } from '../api/client'

interface MediaItem {
  id: string
  name: string
  url: string
  type: string
  size: number
  createdAt: string
}

const showUpload = ref(false)
const showAIGenerate = ref(false)
const isDragOver = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const activeCategory = ref('all')

// AI生图相关
const aiPrompt = ref('')
const aiSize = ref('1024x1024')
const aiCount = ref(1)
const aiLoading = ref(false)
const aiResults = ref<{ url: string }[]>([])

interface UploadItem {
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'done' | 'error'
}

const uploadQueue = ref<UploadItem[]>([])

const categories = [
  { id: 'all', name: '全部' },
  { id: 'image', name: '图片' },
  { id: 'background', name: '背景' },
  { id: 'icon', name: '图标' }
]

// 模拟素材数据
const mediaList = ref<MediaItem[]>([
  { id: '1', name: '背景1', url: 'https://picsum.photos/400/300?random=1', type: 'background', size: 102400, createdAt: '2024-01-01' },
  { id: '2', name: '背景2', url: 'https://picsum.photos/400/300?random=2', type: 'background', size: 102400, createdAt: '2024-01-02' },
  { id: '3', name: '图片1', url: 'https://picsum.photos/400/300?random=3', type: 'image', size: 204800, createdAt: '2024-01-03' }
])

const filteredMedia = computed(() => {
  if (activeCategory.value === 'all') return mediaList.value
  return mediaList.value.filter(m => m.type === activeCategory.value)
})

const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files) {
    addFiles(Array.from(target.files))
  }
}

const handleDrop = (e: DragEvent) => {
  isDragOver.value = false
  if (e.dataTransfer?.files) {
    addFiles(Array.from(e.dataTransfer.files))
  }
}

const addFiles = (files: File[]) => {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue
    const preview = URL.createObjectURL(file)
    uploadQueue.value.push({
      file,
      preview,
      status: 'pending'
    })
  }
}

const startUpload = async () => {
  for (const item of uploadQueue.value) {
    if (item.status !== 'pending') continue
    item.status = 'uploading'

    // 模拟上传
    await new Promise(resolve => setTimeout(resolve, 1000))

    // 模拟成功
    const newMedia: MediaItem = {
      id: Date.now().toString(),
      name: item.file.name,
      url: item.preview,
      type: 'image',
      size: item.file.size,
      createdAt: new Date().toISOString().split('T')[0]
    }
    mediaList.value.unshift(newMedia)
    item.status = 'done'
  }

  setTimeout(() => {
    showUpload.value = false
    uploadQueue.value = []
  }, 500)
}

const selectMedia = (item: MediaItem) => {
  console.log('选择素材:', item)
}

const editMedia = (item: MediaItem) => {
  console.log('编辑素材:', item)
}

const deleteMedia = (item: MediaItem) => {
  const index = mediaList.value.findIndex(m => m.id === item.id)
  if (index > -1) {
    mediaList.value.splice(index, 1)
  }
}

// AI生图
const generateImage = async () => {
  if (!aiPrompt.value.trim()) return

  aiLoading.value = true
  aiResults.value = []

  // 优化提示词，添加质量修饰
  const enhancedPrompt = `${aiPrompt.value}, high quality, professional, 4k, detailed, visually stunning, professional presentation slide background`

  try {
    const response = await apiClient.post('/ppt/ai-image', {
      prompt: enhancedPrompt,
      size: aiSize.value,
      n: aiCount.value
    })

    if (response.data.success && response.data.images) {
      aiResults.value = response.data.images.map((url: string) => ({ url }))
    }
  } catch (error: any) {
    console.error('AI生图失败:', error)
    alert(error.response?.data?.detail || 'AI生图失败，请重试')
  } finally {
    aiLoading.value = false
  }
}

const downloadImage = (url: string) => {
  const link = document.createElement('a')
  link.href = url
  link.download = `ai-image-${Date.now()}.png`
  link.click()
}

// 用于PPT
const useForPPT = (item: MediaItem) => {
  // 保存到 localStorage
  const pptImages = JSON.parse(localStorage.getItem('ppt_images') || '[]')
  pptImages.push({
    id: item.id,
    url: item.url,
    name: item.name,
    addedAt: new Date().toISOString()
  })
  localStorage.setItem('ppt_images', JSON.stringify(pptImages))

  alert('已添加到PPT素材，可以去创建页面使用啦！')
}
</script>

<style scoped>
.media-library {
  min-height: 100vh;
  background: #f5f5f5;
  padding: 24px;
}

.library-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #1D2129;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #fff;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
}

.modal-header h2 {
  font-size: 20px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 28px;
  cursor: pointer;
  color: #999;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #eee;
}

/* Upload Area */
.upload-area {
  border: 2px dashed #ddd;
  border-radius: 12px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-area:hover,
.upload-area.drag-over {
  border-color: #165DFF;
  background: #f0f7ff;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.upload-text {
  font-size: 16px;
  color: #333;
  margin-bottom: 8px;
}

.upload-hint {
  font-size: 14px;
  color: #999;
}

/* Upload Queue */
.upload-queue {
  margin-top: 20px;
}

.upload-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f9f9f9;
  border-radius: 8px;
  margin-bottom: 8px;
}

.upload-preview {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
}

.upload-info {
  flex: 1;
}

.upload-name {
  display: block;
  font-size: 14px;
  color: #333;
}

.upload-size {
  font-size: 12px;
  color: #999;
}

.upload-status {
  font-size: 14px;
}

.status-pending { color: #999; }
.status-uploading { color: #165DFF; }
.status-done { color: #34C759; }
.status-error { color: #FF3B30; }

/* Category */
.category-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.category-btn {
  padding: 8px 20px;
  border: none;
  background: #fff;
  border-radius: 20px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.category-btn.active {
  background: #165DFF;
  color: #fff;
}

/* Media Grid */
.media-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.media-item {
  position: relative;
  aspect-ratio: 4/3;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  background: #fff;
}

.media-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.media-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(transparent 50%, rgba(0,0,0,0.7));
  opacity: 0;
  transition: opacity 0.2s;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 12px;
}

.media-item:hover .media-overlay {
  opacity: 1;
}

.media-name {
  color: #fff;
  font-size: 14px;
}

.media-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.action-btn {
  background: rgba(255,255,255,0.9);
  border: none;
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
}

.action-btn-ppt {
  background: #165DFF;
  color: white;
}

/* Empty */
.empty-state {
  text-align: center;
  padding: 60px;
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.empty-state p {
  color: #999;
  margin-bottom: 20px;
}

/* Buttons */
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #165DFF;
  color: #fff;
}

.btn-primary:hover {
  background: #0e42d2;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f0f0f0;
  color: #333;
}

.btn-secondary:hover {
  background: #e0e0e0;
}

.btn-ai {
  background: linear-gradient(135deg, #722ED1, #EB2F96);
  color: #fff;
}

.btn-ai:hover {
  opacity: 0.9;
}

.btn-ai:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* AI生图弹窗样式 */
.ai-generate-modal {
  max-width: 500px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 8px;
}

.form-group textarea,
.form-group select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
}

.form-group textarea:focus,
.form-group select:focus {
  outline: none;
  border-color: #165DFF;
}

.ai-results {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-top: 20px;
}

.ai-result-item {
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
}

.ai-result-item img {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.btn-download {
  width: 100%;
  padding: 8px;
  background: #165DFF;
  color: #fff;
  border: none;
  cursor: pointer;
}

.ai-loading {
  text-align: center;
  padding: 40px;
}

.ai-loading .loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #165DFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #165DFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}
</style>
