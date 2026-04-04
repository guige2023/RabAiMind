<template>
  <div class="media-library">
    <div class="library-header">
      <h1 class="page-title">素材库</h1>
      <div class="header-actions">
        <button class="btn btn-ai" @click="showAIGenerate = true">
          <span>🎨</span> AI生图
        </button>
        <button class="btn btn-secondary" @click="showRemoveBg = true">
          <span>✂️</span> 抠图
        </button>
        <button class="btn btn-secondary" @click="showEnhance = true">
          <span>✨</span> 增强
        </button>
        <button class="btn btn-secondary" @click="showIconGen = true">
          <span>🚀</span> 生成图标
        </button>
        <button class="btn btn-primary" @click="showUpload = true">
          <span>+</span> 上传素材
        </button>
      </div>
    </div>

    <!-- ==================== AI生图弹窗 ==================== -->
    <div v-if="showAIGenerate" class="modal-overlay" @click.self="showAIGenerate = false">
      <div class="modal-content ai-generate-modal">
        <div class="modal-header">
          <h2>AI 生成图片</h2>
          <button class="close-btn" @click="showAIGenerate = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>图片描述</label>
            <textarea v-model="aiPrompt" placeholder="描述你想要的图片，例如：一只可爱的橘猫坐在草地上，阳光明媚" rows="4"></textarea>
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
          <div v-if="aiResults.length > 0" class="ai-results">
            <div v-for="(img, idx) in aiResults" :key="idx" class="ai-result-item">
              <img :src="img.url" :alt="`AI生成 ${idx + 1}`" />
              <div class="result-actions">
                <button class="btn-sm btn-download" @click="downloadImage(img.url)">下载</button>
                <button class="btn-sm btn-use" @click="useForPPT(img.url)">用于PPT</button>
              </div>
            </div>
          </div>
          <div v-if="aiLoading" class="ai-loading">
            <div class="loading-spinner"></div>
            <p>AI 正在生成图片，请稍候...</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showAIGenerate = false">取消</button>
          <button class="btn btn-ai" @click="generateImage" :disabled="aiLoading || !aiPrompt.trim()">
            {{ aiLoading ? '生成中...' : '开始生成' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== 背景移除弹窗 ==================== -->
    <div v-if="showRemoveBg" class="modal-overlay" @click.self="showRemoveBg = false">
      <div class="modal-content bg-remove-modal">
        <div class="modal-header">
          <h2>AI 背景移除</h2>
          <button class="close-btn" @click="showRemoveBg = false">×</button>
        </div>
        <div class="modal-body">
          <p class="modal-desc">上传图片，自动移除背景并返回透明PNG</p>
          <div class="upload-area" :class="{ 'drag-over': isDragOverBg }" @dragover.prevent="isDragOverBg = true"
            @dragleave="isDragOverBg = false" @drop.prevent="handleBgDrop" @click="bgFileInput?.click()">
            <input type="file" ref="bgFileInput" accept="image/*" @change="handleBgFileSelect" hidden />
            <div class="upload-icon">✂️</div>
            <p class="upload-text">拖拽或点击上传图片</p>
            <p class="upload-hint">支持 JPG、PNG、WebP</p>
          </div>
          <!-- 或输入URL -->
          <div class="form-group" style="margin-top: 16px;">
            <label>或者输入图片URL</label>
            <input type="text" v-model="bgImageUrl" placeholder="https://example.com/image.jpg" class="url-input" />
          </div>
          <div v-if="bgResultUrl" class="bg-result">
            <img :src="bgResultUrl" alt="背景移除结果" class="bg-result-img" />
            <p class="bg-result-hint">✅ 背景已移除！点击下载或用于PPT</p>
            <div class="result-actions">
              <button class="btn-sm btn-download" @click="downloadImage(bgResultUrl)">下载PNG</button>
              <button class="btn-sm btn-use" @click="useForPPT(bgResultUrl)">用于PPT</button>
            </div>
          </div>
          <div v-if="bgLoading" class="ai-loading">
            <div class="loading-spinner"></div>
            <p>AI 正在移除背景，请稍候...</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showRemoveBg = false">关闭</button>
          <button class="btn btn-primary" @click="doRemoveBg" :disabled="bgLoading || (!bgSelectedFile && !bgImageUrl)">
            {{ bgLoading ? '处理中...' : '开始处理' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== 图片增强弹窗 ==================== -->
    <div v-if="showEnhance" class="modal-overlay" @click.self="showEnhance = false">
      <div class="modal-content enhance-modal">
        <div class="modal-header">
          <h2>AI 图片增强</h2>
          <button class="close-btn" @click="showEnhance = false">×</button>
        </div>
        <div class="modal-body">
          <div class="upload-area" @dragover.prevent @dragleave="enhanceDragOver = false" @drop.prevent="handleEnhanceDrop"
            @click="enhanceFileInput?.click()">
            <input type="file" ref="enhanceFileInput" accept="image/*" @change="handleEnhanceFileSelect" hidden />
            <div class="upload-icon">✨</div>
            <p class="upload-text">拖拽或点击上传图片</p>
            <p class="upload-hint">支持 JPG、PNG、WebP</p>
          </div>
          <div class="form-group" style="margin-top: 16px;">
            <label>或者输入图片URL</label>
            <input type="text" v-model="enhanceImageUrl" placeholder="https://example.com/image.jpg" class="url-input" />
          </div>
          <div class="form-group">
            <label>增强类型</label>
            <div class="enhance-options">
              <label class="enhance-option" :class="{ active: enhanceAction === 'all' }">
                <input type="radio" v-model="enhanceAction" value="all" />
                <span>综合增强</span>
                <small>2x放大+降噪+锐化</small>
              </label>
              <label class="enhance-option" :class="{ active: enhanceAction === 'upscale' }">
                <input type="radio" v-model="enhanceAction" value="upscale" />
                <span>智能放大</span>
                <small>2倍分辨率</small>
              </label>
              <label class="enhance-option" :class="{ active: enhanceAction === 'sharpen' }">
                <input type="radio" v-model="enhanceAction" value="sharpen" />
                <span>清晰锐化</span>
                <small>边缘增强</small>
              </label>
              <label class="enhance-option" :class="{ active: enhanceAction === 'denoise' }">
                <input type="radio" v-model="enhanceAction" value="denoise" />
                <span>降噪处理</span>
                <small>去除噪点</small>
              </label>
            </div>
          </div>
          <div v-if="enhanceResultUrl" class="bg-result">
            <img :src="enhanceResultUrl" alt="增强结果" class="bg-result-img" />
            <div class="result-actions">
              <button class="btn-sm btn-download" @click="downloadImage(enhanceResultUrl)">下载</button>
              <button class="btn-sm btn-use" @click="useForPPT(enhanceResultUrl)">用于PPT</button>
            </div>
          </div>
          <div v-if="enhanceLoading" class="ai-loading">
            <div class="loading-spinner"></div>
            <p>AI 正在增强图片，请稍候...</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showEnhance = false">关闭</button>
          <button class="btn btn-primary" @click="doEnhance" :disabled="enhanceLoading || (!enhanceSelectedFile && !enhanceImageUrl)">
            {{ enhanceLoading ? '处理中...' : '开始增强' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== 图标生成弹窗 ==================== -->
    <div v-if="showIconGen" class="modal-overlay" @click.self="showIconGen = false">
      <div class="modal-content icon-gen-modal">
        <div class="modal-header">
          <h2>AI 生成图标</h2>
          <button class="close-btn" @click="showIconGen = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>图标描述</label>
            <textarea v-model="iconPrompt" placeholder="例如：火箭发射、科技创新、数据分析" rows="3"></textarea>
          </div>
          <div class="form-group">
            <label>图标风格</label>
            <div class="style-options">
              <label class="style-option" :class="{ active: iconStyle === 'flat' }">
                <input type="radio" v-model="iconStyle" value="flat" />
                <span>扁平化</span>
              </label>
              <label class="style-option" :class="{ active: iconStyle === 'outline' }">
                <input type="radio" v-model="iconStyle" value="outline" />
                <span>线性图标</span>
              </label>
              <label class="style-option" :class="{ active: iconStyle === '3d' }">
                <input type="radio" v-model="iconStyle" value="3d" />
                <span>3D立体</span>
              </label>
              <label class="style-option" :class="{ active: iconStyle === 'hand-drawn' }">
                <input type="radio" v-model="iconStyle" value="hand-drawn" />
                <span>手绘风</span>
              </label>
            </div>
          </div>
          <div class="form-group">
            <label>主色调</label>
            <div class="color-picker">
              <input type="color" v-model="iconColor" class="color-input" />
              <span class="color-label">{{ iconColor }}</span>
            </div>
          </div>
          <div v-if="iconResultUrl" class="bg-result">
            <img :src="iconResultUrl" alt="生成的图标" class="bg-result-img icon-result" />
            <div class="result-actions">
              <button class="btn-sm btn-download" @click="downloadImage(iconResultUrl)">下载</button>
              <button class="btn-sm btn-use" @click="useForPPT(iconResultUrl)">用于PPT</button>
            </div>
          </div>
          <div v-if="iconLoading" class="ai-loading">
            <div class="loading-spinner"></div>
            <p>AI 正在生成图标，请稍候...</p>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showIconGen = false">关闭</button>
          <button class="btn btn-ai" @click="doGenerateIcon" :disabled="iconLoading || !iconPrompt.trim()">
            {{ iconLoading ? '生成中...' : '生成图标' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ==================== 上传弹窗 ==================== -->
    <div v-if="showUpload" class="modal-overlay" @click.self="showUpload = false">
      <div class="modal-content upload-modal">
        <div class="modal-header">
          <h2>上传素材</h2>
          <button class="close-btn" @click="showUpload = false">×</button>
        </div>
        <div class="modal-body">
          <div class="upload-area" :class="{ 'drag-over': isDragOver }" @dragover.prevent="isDragOver = true"
            @dragleave="isDragOver = false" @drop.prevent="handleDrop">
            <input type="file" ref="fileInput" accept="image/*" multiple @change="handleFileSelect" hidden />
            <div class="upload-icon">📁</div>
            <p class="upload-text">拖拽文件到此处或点击上传</p>
            <p class="upload-hint">支持 PNG、JPG、GIF、SVG 等格式</p>
          </div>
          <div v-if="uploadProgress > 0 && uploadProgress < 100" class="upload-progress">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${uploadProgress}%` }"></div>
            </div>
            <span class="progress-text">上传中... {{ uploadProgress }}%</span>
          </div>
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
          <button class="btn btn-primary" @click="startUpload" :disabled="uploadQueue.length === 0">开始上传</button>
        </div>
      </div>
    </div>

    <!-- ==================== 素材分类 ==================== -->
    <div class="category-tabs">
      <button v-for="cat in categories" :key="cat.id" class="category-btn" :class="{ active: activeCategory === cat.id }"
        @click="activeCategory = cat.id">
        {{ cat.name }}
      </button>
    </div>

    <!-- ==================== 搜索栏 ==================== -->
    <div class="search-bar">
      <input type="text" v-model="searchQuery" placeholder="搜索素材..." class="search-input" @keyup.enter="doSearch" />
      <select v-model="searchSource" class="source-select">
        <option value="all">全部来源</option>
        <option value="unsplash">Unsplash</option>
        <option value="pexels">Pexels</option>
      </select>
      <button class="btn btn-primary" @click="doSearch">搜索</button>
    </div>

    <!-- ==================== 搜索结果 ==================== -->
    <div v-if="searchResults.length > 0" class="search-results">
      <div class="search-results-header">
        <h3>搜索结果: {{ searchQuery }}</h3>
        <span class="result-count">{{ searchResults.length }} 张图片</span>
      </div>
      <div class="media-grid">
        <div v-for="item in searchResults" :key="item.id" class="media-item" @click="selectMedia(item)">
          <img :src="item.thumbnail_url || item.url" :alt="item.description" class="media-img" />
          <div class="media-overlay">
            <span class="media-name">{{ item.source }}</span>
            <div class="media-actions">
              <button class="action-btn action-btn-ppt" @click.stop="useForPPT(item.url)" title="用于PPT">📊</button>
              <button class="action-btn" @click.stop="viewImage(item)" title="查看">👁️</button>
            </div>
          </div>
          <span class="source-badge">{{ item.source }}</span>
        </div>
      </div>
    </div>

    <!-- ==================== 本地素材网格 ==================== -->
    <div v-if="searchResults.length === 0" class="media-grid">
      <div v-for="item in filteredMedia" :key="item.id" class="media-item" @click="selectMedia(item)">
        <img :src="item.url" :alt="item.name" class="media-img" />
        <div class="media-overlay">
          <span class="media-name">{{ item.name }}</span>
          <div class="media-actions">
            <button class="action-btn action-btn-ppt" @click.stop="useForPPT(item.url)" title="用于PPT">📊</button>
            <button class="action-btn" @click.stop="editMedia(item)">✏️</button>
            <button class="action-btn" @click.stop="deleteMedia(item)">🗑️</button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { apiClient } from '../api/client'
import { compressImage } from '../utils/imageCompressor'

const showUpload = ref(false)
const showAIGenerate = ref(false)
const showRemoveBg = ref(false)
const showEnhance = ref(false)
const showIconGen = ref(false)
const isDragOver = ref(false)
const isDragOverBg = ref(false)
const enhanceDragOver = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const bgFileInput = ref<HTMLInputElement | null>(null)
const enhanceFileInput = ref<HTMLInputElement | null>(null)
const activeCategory = ref('all')
const searchQuery = ref('')
const searchSource = ref('all')
const searchResults = ref<any[]>([])

// AI生图
const aiPrompt = ref('')
const aiSize = ref('1024x1024')
const aiCount = ref(1)
const aiLoading = ref(false)
const aiResults = ref<{ url: string }[]>([])

// 背景移除
const bgImageUrl = ref('')
const bgSelectedFile = ref<File | null>(null)
const bgLoading = ref(false)
const bgResultUrl = ref('')

// 图片增强
const enhanceImageUrl = ref('')
const enhanceSelectedFile = ref<File | null>(null)
const enhanceLoading = ref(false)
const enhanceResultUrl = ref('')
const enhanceAction = ref('all')

// 图标生成
const iconPrompt = ref('')
const iconStyle = ref('flat')
const iconColor = ref('#165DFF')
const iconLoading = ref(false)
const iconResultUrl = ref('')

interface UploadItem {
  file: File
  preview: string
  status: 'pending' | 'uploading' | 'done' | 'error'
}

const uploadQueue = ref<UploadItem[]>([])
const uploadProgress = ref(0)

const categories = [
  { id: 'all', name: '全部' },
  { id: 'image', name: '图片' },
  { id: 'background', name: '背景' },
  { id: 'icon', name: '图标' }
]

const loadMediaList = (): MediaItem[] => {
  const saved = localStorage.getItem('media_library')
  if (saved) {
    try { return JSON.parse(saved) } catch { /* ignore */ }
  }
  return [
    { id: 'bg1', name: '商务蓝渐变', url: 'https://picsum.photos/seed/bgblue/800/600', type: 'background', size: 245760, createdAt: '2024-01-15' },
    { id: 'bg2', name: '科技深色', url: 'https://picsum.photos/seed/bgtech/800/600', type: 'background', size: 204800, createdAt: '2024-01-16' },
    { id: 'bg3', name: '清新绿', url: 'https://picsum.photos/seed/bggreen/800/600', type: 'background', size: 189000, createdAt: '2024-01-17' },
    { id: 'img1', name: '城市建筑', url: 'https://picsum.photos/seed/city/800/600', type: 'image', size: 350000, createdAt: '2024-01-20' },
    { id: 'img2', name: '自然风景', url: 'https://picsum.photos/seed/nature/800/600', type: 'image', size: 420000, createdAt: '2024-01-21' },
    { id: 'img3', name: '科技创新', url: 'https://picsum.photos/seed/tech/800/600', type: 'image', size: 380000, createdAt: '2024-01-22' },
    { id: 'icon1', name: '图标-商务', url: 'https://picsum.photos/seed/iconbiz/400/400', type: 'icon', size: 45000, createdAt: '2024-01-25' },
    { id: 'icon2', name: '图标-科技', url: 'https://picsum.photos/seed/icontech/400/400', type: 'icon', size: 52000, createdAt: '2024-01-26' }
  ]
}

interface MediaItem {
  id: string; name: string; url: string; type: string; size: number; createdAt: string
}

const mediaList = ref<MediaItem[]>(loadMediaList())
const saveMediaList = () => localStorage.setItem('media_library', JSON.stringify(mediaList.value))

const filteredMedia = computed(() => {
  if (activeCategory.value === 'all') return mediaList.value
  return mediaList.value.filter(m => m.type === activeCategory.value)
})

const formatSize = (bytes: number): string => {
  if (!bytes) return '0 B'
  const k = 1024, sizes = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// ===== 文件上传 =====
const handleFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files) addFiles(Array.from(target.files))
}
const handleDrop = (e: DragEvent) => {
  isDragOver.value = false
  if (e.dataTransfer?.files) addFiles(Array.from(e.dataTransfer.files))
}
const addFiles = async (files: File[]) => {
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue
    let processedFile = file
    if (file.size > 1024 * 1024) {
      processedFile = await compressImage(file, { maxWidth: 1920, maxHeight: 1080, quality: 0.85 }).catch(() => file)
    }
    const preview = URL.createObjectURL(processedFile)
    uploadQueue.value.push({ file: processedFile, preview, status: 'pending' })
  }
}
const startUpload = async () => {
  const pending = uploadQueue.value.filter(i => i.status === 'pending')
  let done = 0
  for (const item of uploadQueue.value) {
    if (item.status !== 'pending') continue
    item.status = 'uploading'
    await new Promise(r => setTimeout(r, 500))
    done++
    uploadProgress.value = Math.round((done / pending.length) * 100)
    mediaList.value.unshift({
      id: Date.now().toString(),
      name: item.file.name,
      url: item.preview,
      type: 'image',
      size: item.file.size,
      createdAt: new Date().toISOString().split('T')[0]
    })
    item.status = 'done'
  }
  setTimeout(() => { showUpload.value = false; uploadQueue.value = []; uploadProgress.value = 0 }, 500)
}

// ===== AI生图 =====
const generateImage = async () => {
  if (!aiPrompt.value.trim()) return
  aiLoading.value = true
  aiResults.value = []
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

// ===== 背景移除 =====
const handleBgFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files?.[0]) bgSelectedFile.value = target.files[0]
}
const handleBgDrop = (e: DragEvent) => {
  isDragOverBg.value = false
  if (e.dataTransfer?.files?.[0]) bgSelectedFile.value = e.dataTransfer.files[0]
}
const doRemoveBg = async () => {
  bgLoading.value = true
  bgResultUrl.value = ''
  try {
    let imageData = bgImageUrl.value
    if (bgSelectedFile.value) {
      imageData = await fileToBase64(bgSelectedFile.value)
    }
    if (!imageData) {
      alert('请上传图片或输入URL')
      return
    }
    const response = await apiClient.post('/images/remove-background',
      { image_url: imageData },
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    if (response.data.success) {
      // 拼接后端地址
      bgResultUrl.value = getBackendUrl(response.data.image_url)
    } else {
      alert(response.data.message || '背景移除失败')
    }
  } catch (error: any) {
    console.error('背景移除失败:', error)
    alert(error.response?.data?.detail || '背景移除失败，请重试')
  } finally {
    bgLoading.value = false
  }
}

// ===== 图片增强 =====
const handleEnhanceFileSelect = (e: Event) => {
  const target = e.target as HTMLInputElement
  if (target.files?.[0]) enhanceSelectedFile.value = target.files[0]
}
const handleEnhanceDrop = (e: DragEvent) => {
  enhanceDragOver.value = false
  if (e.dataTransfer?.files?.[0]) enhanceSelectedFile.value = e.dataTransfer.files[0]
}
const doEnhance = async () => {
  enhanceLoading.value = true
  enhanceResultUrl.value = ''
  try {
    let imageData = enhanceImageUrl.value
    if (enhanceSelectedFile.value) {
      imageData = await fileToBase64(enhanceSelectedFile.value)
    }
    if (!imageData) {
      alert('请上传图片或输入URL')
      return
    }
    const response = await apiClient.post('/images/enhance',
      { image_url: imageData, action: enhanceAction.value },
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
    if (response.data.success) {
      enhanceResultUrl.value = getBackendUrl(response.data.image_url)
    } else {
      alert(response.data.message || '图片增强失败')
    }
  } catch (error: any) {
    console.error('图片增强失败:', error)
    alert(error.response?.data?.detail || '图片增强失败，请重试')
  } finally {
    enhanceLoading.value = false
  }
}

// ===== 图标生成 =====
const doGenerateIcon = async () => {
  if (!iconPrompt.value.trim()) return
  iconLoading.value = true
  iconResultUrl.value = ''
  try {
    const response = await apiClient.post('/images/generate-icon', {
      prompt: iconPrompt.value,
      style: iconStyle.value,
      color: iconColor.value
    })
    if (response.data.success) {
      iconResultUrl.value = response.data.image_url
    } else {
      alert(response.data.message || '图标生成失败')
    }
  } catch (error: any) {
    console.error('图标生成失败:', error)
    alert(error.response?.data?.detail || '图标生成失败，请重试')
  } finally {
    iconLoading.value = false
  }
}

// ===== 搜索 =====
const doSearch = async () => {
  if (!searchQuery.value.trim()) return
  searchResults.value = []
  try {
    const response = await apiClient.get('/images/search', {
      params: { q: searchQuery.value, source: searchSource.value, limit: 30 }
    })
    if (response.data.success) {
      searchResults.value = response.data.images
    }
  } catch (error: any) {
    console.error('搜索失败:', error)
  }
}

// ===== 辅助函数 =====
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const getBackendUrl = (path: string) => {
  if (path.startsWith('http')) return path
  return `http://localhost:8003${path}`
}

const downloadImage = (url: string) => {
  const a = document.createElement('a')
  a.href = url
  a.download = `rabai-${Date.now()}.png`
  a.click()
}

const useForPPT = (url: string) => {
  const pptImages = JSON.parse(localStorage.getItem('ppt_images') || '[]')
  pptImages.push({ id: Date.now().toString(), url, name: `图片_${Date.now()}`, addedAt: new Date().toISOString() })
  localStorage.setItem('ppt_images', JSON.stringify(pptImages))
  alert('已添加到PPT素材，可以去创建页面使用啦！')
}

const selectMedia = (item: any) => console.log('选择素材:', item)
const viewImage = (item: any) => window.open(item.url, '_blank')
const editMedia = (item: MediaItem) => console.log('编辑素材:', item)
const deleteMedia = (item: MediaItem) => {
  const idx = mediaList.value.findIndex(m => m.id === item.id)
  if (idx > -1) mediaList.value.splice(idx, 1)
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
  flex-wrap: wrap;
  gap: 12px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: #1D2129;
}

.header-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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
  max-width: 560px;
  max-height: 85vh;
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
  max-height: 60vh;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px;
  border-top: 1px solid #eee;
}

.modal-desc {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
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

.url-input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  box-sizing: border-box;
}

.url-input:focus {
  outline: none;
  border-color: #165DFF;
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

.upload-progress {
  margin-bottom: 16px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
}

.progress-bar {
  height: 6px;
  background: #e5e5e5;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #165DFF, #5AC8FA);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 13px;
  color: #666;
}

/* Category */
.category-tabs {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
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

/* Search Bar */
.search-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.search-input {
  flex: 1;
  min-width: 200px;
  padding: 10px 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
}

.search-input:focus {
  outline: none;
  border-color: #165DFF;
}

.source-select {
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  background: #fff;
}

/* Search Results */
.search-results {
  margin-bottom: 32px;
}

.search-results-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.search-results-header h3 {
  font-size: 18px;
  font-weight: 600;
}

.result-count {
  font-size: 13px;
  color: #999;
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
  background: linear-gradient(transparent 50%, rgba(0, 0, 0, 0.7));
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
  background: rgba(255, 255, 255, 0.9);
  border: none;
  border-radius: 6px;
  padding: 6px 10px;
  cursor: pointer;
}

.action-btn-ppt {
  background: #165DFF;
  color: white;
}

.source-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
}

/* Empty */
.empty-state {
  text-align: center;
  padding: 60px;
  grid-column: 1 / -1;
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
  background: #fff;
  color: #333;
  border: 1px solid #ddd;
}

.btn-secondary:hover {
  background: #f5f5f5;
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

/* AI Results */
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

.result-actions {
  display: flex;
  gap: 8px;
  padding: 8px;
}

.btn-sm {
  flex: 1;
  padding: 6px 8px;
  border: none;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
}

.btn-download {
  background: #165DFF;
  color: #fff;
}

.btn-use {
  background: #34C759;
  color: #fff;
}

/* AI Loading */
.ai-loading {
  text-align: center;
  padding: 40px;
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* BG Result */
.bg-result {
  margin-top: 20px;
  text-align: center;
}

.bg-result-img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 12px;
  border: 1px solid #eee;
}

.bg-result-img.icon-result {
  width: 200px;
  height: 200px;
  object-fit: contain;
  background: #f5f5f5;
}

.bg-result-hint {
  font-size: 13px;
  color: #34C759;
  margin: 12px 0;
}

/* Enhance Options */
.enhance-options {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.enhance-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  border: 2px solid #eee;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.enhance-option input {
  display: none;
}

.enhance-option.active {
  border-color: #165DFF;
  background: #f0f7ff;
}

.enhance-option span {
  font-size: 14px;
  font-weight: 500;
}

.enhance-option small {
  font-size: 11px;
  color: #999;
  margin-top: 2px;
}

/* Style Options */
.style-options {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.style-option {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: 2px solid #eee;
  border-radius: 20px;
  cursor: pointer;
  font-size: 14px;
}

.style-option input {
  display: none;
}

.style-option.active {
  border-color: #165DFF;
  background: #f0f7ff;
}

/* Color Picker */
.color-picker {
  display: flex;
  align-items: center;
  gap: 12px;
}

.color-input {
  width: 50px;
  height: 40px;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
}

.color-label {
  font-size: 14px;
  color: #666;
  font-family: monospace;
}

/* Form */
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
.form-group select,
.form-group input[type="text"] {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  box-sizing: border-box;
}

.form-group textarea:focus,
.form-group select:focus,
.form-group input:focus {
  outline: none;
  border-color: #165DFF;
}
</style>
