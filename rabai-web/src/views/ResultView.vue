<template>
  <div class="result">
    <div class="container">
      <div class="result-card">
        <!-- 成功状态 -->
        <div v-if="status === 'completed'" class="result-success">
          <div class="success-icon">🎉</div>
          <h2 class="result-title">PPT 生成成功!</h2>
          <p class="result-desc">你的演示文稿已准备就绪</p>

          <!-- 文件信息 -->
          <div class="file-info">
            <div class="info-item">
              <span class="info-label">幻灯片</span>
              <span class="info-value">{{ slideCount }} 页</span>
            </div>
            <div class="info-item">
              <span class="info-label">文件大小</span>
              <span class="info-value">{{ fileSize }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">格式</span>
              <span class="info-value">PPTX</span>
            </div>
          </div>

          <!-- PPT预览 -->
          <div class="ppt-preview-section">
            <h3 class="preview-title">PPT 预览</h3>
            <div class="preview-loading" v-if="!previewLoaded">
              <div class="loading-spinner"></div>
              <p>加载预览中...</p>
            </div>
            <div class="preview-grid" v-else>
              <div
                v-for="i in Math.min(slideCount, 6)"
                :key="i"
                class="preview-slide"
              >
                <div class="preview-placeholder">
                  <span>第 {{ i }} 页</span>
                </div>
              </div>
              <div v-if="slideCount > 6" class="preview-more">
                +{{ slideCount - 6 }} 页
              </div>
            </div>
            <p class="preview-tip">点击"下载PPT"查看完整内容</p>
          </div>

          <!-- 操作按钮 -->
          <div class="result-actions">
            <button class="btn btn-primary btn-lg" @click="handleDownload">
              <span>⬇️</span> 下载 PPT
            </button>
            <button class="btn btn-lg btn-presentation" @click="showPresentation = true">
              <span>🎬</span> 演示模式
            </button>
            <button
              class="btn btn-lg"
              :class="isFavorite ? 'btn-favorite-active' : 'btn-favorite'"
              @click="toggleFavorite"
            >
              <span>{{ isFavorite ? '⭐' : '☆' }}</span> {{ isFavorite ? '已收藏' : '收藏' }}
            </button>
            <button class="btn btn-export btn-lg" @click="showExportMenu = !showExportMenu">
              <span>📄</span> 导出其他格式
            </button>
            <button class="btn btn-share btn-lg" @click="showShareMenu = !showShareMenu">
              <span>📤</span> 分享
            </button>
            <button class="btn btn-secondary btn-lg" @click="handleNew">
              <span>✨</span> 创建新的
            </button>
          </div>

          <!-- 导出菜单 -->
          <div v-if="showExportMenu" class="export-menu">
            <!-- 导出格式选择 -->
            <div class="export-format-section">
              <div class="export-section-title">选择导出格式</div>
              <div class="format-grid">
                <label
                  v-for="format in exportFormats"
                  :key="format.id"
                  class="format-option"
                  :class="{ active: selectedFormat === format.id }"
                >
                  <input
                    type="radio"
                    :value="format.id"
                    v-model="selectedFormat"
                    class="format-radio"
                  />
                  <span class="format-icon">{{ format.icon }}</span>
                  <span class="format-name">{{ format.name }}</span>
                  <span class="format-desc">{{ format.desc }}</span>
                </label>
              </div>
            </div>

            <!-- 主题切换 -->
            <div class="export-theme-toggle">
              <span class="export-section-title">主题风格</span>
              <div class="theme-buttons">
                <button
                  class="theme-btn"
                  :class="{ active: exportTheme === 'light' }"
                  @click="exportTheme = 'light'"
                >
                  ☀️ 亮色
                </button>
                <button
                  class="theme-btn"
                  :class="{ active: exportTheme === 'dark' }"
                  @click="exportTheme = 'dark'"
                >
                  🌙 暗色
                </button>
              </div>
            </div>

            <!-- 导出按钮 -->
            <button
              class="export-confirm-btn"
              @click="handleExport"
              :disabled="isExporting"
            >
              <span v-if="isExporting">导出中...</span>
              <span v-else>📥 导出 {{ exportFormats.find(f => f.id === selectedFormat)?.name }}</span>
            </button>

            <!-- 其他选项 -->
            <div class="export-others">
              <button class="export-option" @click="handleBatchExport">
                <span class="export-icon">📦</span>
                <span>批量导出</span>
              </button>
              <button class="export-option" @click="handlePrint">
                <span class="export-icon">🖨️</span>
                <span>打印</span>
              </button>
            </div>
          </div>

          <!-- 分享菜单 -->
          <div v-if="showShareMenu" class="share-menu">
            <button
              v-for="opt in shareOptions"
              :key="opt.id"
              class="share-option"
              @click="handleShare(opt.id)"
            >
              <span class="share-icon">{{ opt.icon }}</span>
              <span>{{ opt.name }}</span>
            </button>
          </div>
        </div>

        <!-- 失败状态 -->
        <div v-else-if="status === 'failed'" class="result-failed">
          <div class="failed-icon">😔</div>
          <h2 class="result-title">生成失败</h2>
          <p class="result-error">{{ errorMessage }}</p>
          <div class="error-suggestions">
            <p class="suggestion-title">可能的原因：</p>
            <ul class="suggestion-list">
              <li>网络不稳定，请检查网络连接</li>
              <li>服务器繁忙，请稍后重试</li>
              <li>内容包含敏感词，请修改后重试</li>
            </ul>
          </div>

          <div class="result-actions">
            <button class="btn btn-primary btn-lg" @click="handleRetry">
              <span>🔄</span> 重试
            </button>
            <button class="btn btn-secondary btn-lg" @click="handleNew">
              <span>✨</span> 重新输入
            </button>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-else class="result-loading">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>
      </div>
    </div>

    <!-- 演示模式 -->
    <PresentationMode
      v-model:active="showPresentation"
      :slides="presentationSlides"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { api } from '../api/client'
import PresentationMode from '../components/PresentationMode.vue'

const router = useRouter()
const route = useRoute()

const taskId = ref((route.query.taskId as string) || '')
const status = ref('loading')
const slideCount = ref(0)
const fileSize = ref('0 KB')
const errorMessage = ref('')
const showExportMenu = ref(false)
const previewLoaded = ref(false)
const isFavorite = ref(false)
const exportTheme = ref<'light' | 'dark'>('light')
const showPresentation = ref(false)

// 导出格式选项
type ExportFormat = 'pptx' | 'pdf' | 'images' | 'html'
const selectedFormat = ref<ExportFormat>('pptx')
const isExporting = ref(false)

const exportFormats = [
  { id: 'pptx', name: 'PPTX', icon: '📊', desc: 'PowerPoint演示文稿', ext: '.pptx' },
  { id: 'pdf', name: 'PDF', icon: '📕', desc: '便携式文档格式', ext: '.pdf' },
  { id: 'images', name: '图片', icon: '🖼️', desc: 'PNG高清图片', ext: '.zip' },
  { id: 'html', name: 'HTML', icon: '🌐', desc: '网页版演示', ext: '.html' }
]

const handleExport = () => {
  switch (selectedFormat.value) {
    case 'pptx':
      handleDownload()
      break
    case 'pdf':
      handleExportPDF()
      break
    case 'images':
      handleExportImages()
      break
    case 'html':
      handleExportHTML()
      break
  }
}

// Mock slides for presentation mode
const presentationSlides = computed(() => {
  return Array.from({ length: slideCount.value }, (_, i) => ({
    title: `幻灯片 ${i + 1}`,
    content: '点击"演示模式"预览PPT效果',
    background: `linear-gradient(${['135deg, #667eea, #764ba2', '11998e, #38ef7d', '0f0c29, #302b63', '232526, #414345'][i % 4]})`
  }))
})

// 检查并加载收藏状态
const checkFavorite = () => {
  const saved = localStorage.getItem('ppt_history')
  if (saved) {
    const historyList = JSON.parse(saved)
    const item = historyList.find((h: any) => h.taskId === taskId.value)
    if (item) {
      isFavorite.value = item.favorite || false
    }
  }
}

// 切换收藏状态
const toggleFavorite = () => {
  const saved = localStorage.getItem('ppt_history')
  if (saved) {
    const historyList = JSON.parse(saved)
    const index = historyList.findIndex((h: any) => h.taskId === taskId.value)
    if (index > -1) {
      historyList[index].favorite = !historyList[index].favorite
      isFavorite.value = historyList[index].favorite
      localStorage.setItem('ppt_history', JSON.stringify(historyList))
    }
  }
}

// 模拟加载预览（实际应该调用API获取预览图）
const loadPreview = () => {
  setTimeout(() => {
    previewLoaded.value = true
  }, 500)
}

// 加载任务状态
const loadStatus = async () => {
  if (!taskId.value) {
    status.value = 'failed'
    errorMessage.value = '任务ID不存在'
    return
  }

  try {
    const response = await api.ppt.getTask(taskId.value)
    const data = response.data

    status.value = data.status

    if (data.status === 'completed' && data.result) {
      slideCount.value = data.result.slide_count || 0
      // 显示实际文件大小
      const bytes = data.result.file_size || 0
      fileSize.value = formatSize(bytes)
    } else if (data.status === 'failed') {
      errorMessage.value = data.error?.message || '未知错误'
    }
  } catch (error) {
    status.value = 'failed'
    errorMessage.value = '加载失败，请重试'
  }
}

// 格式化文件大小
const formatSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

// 下载
const handleDownload = async () => {
  if (!taskId.value || isExporting.value) return

  isExporting.value = true
  showExportMenu.value = false

  try {
    const response = await api.ppt.downloadPpt(taskId.value)

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = `presentation_${taskId.value}.pptx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('下载失败:', error)
    alert('下载失败，请重试')
  } finally {
    isExporting.value = false
  }
}

// 重试
const handleRetry = () => {
  router.push('/create')
}

// 新建
const handleNew = () => {
  router.push('/create')
}

// 导出 PDF
const handleExportPDF = async () => {
  if (isExporting.value) return

  isExporting.value = true
  showExportMenu.value = false

  try {
    const response = await api.ppt.exportPdf(taskId.value)

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = `presentation_${taskId.value}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    console.error('PDF导出失败:', error)
    alert('PDF导出功能暂不可用，请下载PPTX后使用Office转换')
  } finally {
    isExporting.value = false
  }
}

// 批量导出
const handleBatchExport = async () => {
  showExportMenu.value = false
  alert('批量导出功能开发中，将同时导出PDF和图片格式')
}

// 导出图片
const handleExportImages = async () => {
  if (isExporting.value) return

  isExporting.value = true
  showExportMenu.value = false

  try {
    // 模拟导出图片（实际应该调用API）
    await new Promise(resolve => setTimeout(resolve, 1000))
    alert('图片导出功能开发中，请期待更新')
  } catch (error) {
    console.error('图片导出失败:', error)
    alert('图片导出失败，请重试')
  } finally {
    isExporting.value = false
  }
}

// 导出 HTML
const handleExportHTML = async () => {
  if (isExporting.value) return

  isExporting.value = true
  showExportMenu.value = false

  try {
    // 模拟导出HTML（实际应该调用API）
    await new Promise(resolve => setTimeout(resolve, 1000))
    alert('HTML导出功能开发中，请期待更新')
  } catch (error) {
    console.error('HTML导出失败:', error)
    alert('HTML导出失败，请重试')
  } finally {
    isExporting.value = false
  }
}

// 打印
const handlePrint = () => {
  showExportMenu.value = false
  window.print()
}

// 分享
const showShareMenu = ref(false)

const shareOptions = [
  { id: 'copy', name: '复制链接', icon: '📋' },
  { id: 'wechat', name: '微信', icon: '💬' },
  { id: 'weibo', name: '微博', icon: '🌐' },
  { id: 'email', name: '邮件', icon: '📧' }
]

const handleShare = async (type: string) => {
  const shareUrl = `${window.location.origin}/result?taskId=${taskId.value}`

  switch (type) {
    case 'copy':
      try {
        await navigator.clipboard.writeText(shareUrl)
        alert('链接已复制！')
      } catch {
        prompt('复制链接:', shareUrl)
      }
      break
    case 'wechat':
      alert('微信分享：请使用微信扫一扫扫描二维码')
      break
    case 'weibo':
      const weiboUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(shareUrl)}&title=RabAi%20Mind%20PPT`
      window.open(weiboUrl, '_blank')
      break
    case 'email':
      const mailto = `mailto:?subject=RabAi%20Mind%20PPT&body=来看看我创建的PPT:%0A${shareUrl}`
      window.location.href = mailto
      break
  }
  showShareMenu.value = false
}

onMounted(() => {
  loadStatus()
  loadPreview()
  checkFavorite()
})
</script>

<style scoped>
.result {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.result-card {
  max-width: 500px;
  width: 100%;
  padding: 60px 40px;
  background: #fff;
  border-radius: 24px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.1);
  text-align: center;
}

/* 成功状态 */
.success-icon {
  font-size: 72px;
  margin-bottom: 24px;
  animation: bounce 0.6s ease;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.result-title {
  font-size: 28px;
  font-weight: 700;
  color: #1A1A1A;
  margin-bottom: 8px;
}

.result-desc {
  font-size: 16px;
  color: #666;
  margin-bottom: 32px;
}

.file-info {
  display: flex;
  justify-content: center;
  gap: 32px;
  padding: 20px;
  background: #F5F5F5;
  border-radius: 12px;
  margin-bottom: 32px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #999;
}

.info-value {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A1A;
}

/* PPT预览 */
.ppt-preview-section {
  margin-bottom: 32px;
}

.preview-title {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 16px;
  text-align: center;
}

.preview-loading {
  text-align: center;
  padding: 40px;
  color: #999;
}

.preview-loading .loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #f3f3f3;
  border-top: 3px solid #165DFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 12px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.preview-slide {
  aspect-ratio: 16/9;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-placeholder {
  color: rgba(255,255,255,0.8);
  font-size: 14px;
}

.preview-more {
  aspect-ratio: 16/9;
  background: #f0f0f0;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 14px;
}

.preview-tip {
  text-align: center;
  font-size: 13px;
  color: #999;
  margin-top: 12px;
}

/* 失败状态 */
.failed-icon {
  font-size: 72px;
  margin-bottom: 24px;
}

.result-error {
  font-size: 14px;
  color: #FF3B30;
  margin-bottom: 16px;
  padding: 12px;
  background: #FFEBEE;
  border-radius: 8px;
}

.error-suggestions {
  margin-bottom: 24px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 8px;
  text-align: left;
}

.suggestion-title {
  font-size: 14px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
}

.suggestion-list {
  margin: 0;
  padding-left: 20px;
  font-size: 13px;
  color: #888;
}

.suggestion-list li {
  margin-bottom: 4px;
}

/* 加载状态 */
.loading-spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #E5E5E5;
  border-top-color: #165DFF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 24px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 操作按钮 */
.result-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.btn-lg {
  padding: 14px 32px;
  font-size: 16px;
}

.btn-export {
  background: #34C759;
  color: #fff;
}

.btn-export:hover {
  background: #2dad4a;
}

.btn-share {
  background: #5856D6;
  color: #fff;
}

.btn-share:hover {
  background: #4644cd;
}

.btn-presentation {
  background: #FF9500;
  color: #fff;
}

.btn-presentation:hover {
  background: #e08600;
}

.btn-favorite {
  background: #f5f5f5;
  color: #666;
}

.btn-favorite:hover {
  background: #ffe4b3;
  color: #b8860b;
}

.btn-favorite-active {
  background: #FFF3CD;
  color: #FFB800;
}

.btn-favorite-active:hover {
  background: #ffe4b3;
}

/* 导出菜单 */
.export-menu {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 20px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 12px;
}

.export-format-section {
  margin-bottom: 12px;
}

.export-section-title {
  font-size: 13px;
  color: #666;
  margin-bottom: 10px;
  font-weight: 500;
}

.format-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.format-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  background: #fff;
  border: 2px solid #e5e5e5;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.format-option:hover {
  border-color: #b3b3b3;
}

.format-option.active {
  border-color: var(--primary);
  background: #f0f5ff;
}

.format-radio {
  display: none;
}

.format-icon {
  font-size: 24px;
}

.format-name {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.format-desc {
  font-size: 11px;
  color: #999;
}

.export-theme-toggle {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e5e5;
  margin-bottom: 4px;
}

.theme-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.theme-btn {
  padding: 8px 16px;
  border: 1px solid #e5e5e5;
  background: #fff;
  border-radius: 20px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.theme-btn:hover {
  border-color: var(--primary);
}

.theme-btn.active {
  background: var(--primary);
  color: #fff;
  border-color: var(--primary);
}

.export-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.export-option:hover {
  border-color: #165DFF;
  background: #f0f7ff;
}

.export-option.export-batch {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  border: none;
}

.export-option.export-batch:hover {
  opacity: 0.9;
  transform: translateY(-2px);
}

.export-icon {
  font-size: 24px;
}

/* 分享菜单 */
.share-menu {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 16px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 12px;
}

.share-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 12px 20px;
  background: #fff;
  border: 1px solid #e5e5e5;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.share-option:hover {
  border-color: #165DFF;
  background: #f0f7ff;
}

.share-icon {
  font-size: 24px;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .result-card {
    margin: 20px;
    padding: 24px 16px;
  }

  .success-icon {
    font-size: 56px;
  }

  .result-title {
    font-size: 24px;
  }

  .file-info {
    flex-wrap: wrap;
    gap: 16px;
  }

  .result-actions {
    flex-direction: column;
  }

  .btn-lg {
    width: 100%;
    justify-content: center;
  }

  .export-menu {
    flex-direction: column;
  }

  .preview-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
