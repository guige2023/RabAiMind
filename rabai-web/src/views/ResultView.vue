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
            <button class="btn btn-export btn-lg" @click="showExportMenu = !showExportMenu">
              <span>📄</span> 导出其他格式
            </button>
            <button class="btn btn-share btn-lg" @click="handleShare">
              <span>📤</span> 分享
            </button>
            <button class="btn btn-secondary btn-lg" @click="handleNew">
              <span>✨</span> 创建新的
            </button>
          </div>

          <!-- 导出菜单 -->
          <div v-if="showExportMenu" class="export-menu">
            <button class="export-option" @click="handleExportPDF">
              <span class="export-icon">📕</span>
              <span>导出 PDF</span>
            </button>
            <button class="export-option" @click="handleExportImages">
              <span class="export-icon">🖼️</span>
              <span>导出图片</span>
            </button>
            <button class="export-option" @click="handleExportHTML">
              <span class="export-icon">🌐</span>
              <span>导出 HTML</span>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import axios from 'axios'

const router = useRouter()
const route = useRoute()

const taskId = ref((route.query.taskId as string) || '')
const status = ref('loading')
const slideCount = ref(0)
const fileSize = ref('0 KB')
const errorMessage = ref('')
const showExportMenu = ref(false)
const previewLoaded = ref(false)

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
    const response = await axios.get(`/api/v1/ppt/task/${taskId.value}`)
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
  if (!taskId.value) return

  try {
    const response = await axios.get(`/api/v1/ppt/download/${taskId.value}`, {
      responseType: 'blob'
    })

    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.download = `presentation_${taskId.value}.pptx`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  } catch (error) {
    alert('下载失败，请重试')
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
  showExportMenu.value = false

  try {
    const response = await axios.get(`/api/v1/ppt/export/pdf/${taskId.value}`, {
      responseType: 'blob'
    })

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
  }
}

// 导出图片
const handleExportImages = async () => {
  showExportMenu.value = false
  alert('图片导出功能开发中...')
}

// 导出 HTML
const handleExportHTML = async () => {
  showExportMenu.value = false
  alert('HTML导出功能开发中...')
}

// 分享
const handleShare = async () => {
  const shareUrl = `${window.location.origin}/result?taskId=${taskId.value}`

  if (navigator.share) {
    try {
      await navigator.share({
        title: 'RabAi Mind PPT',
        text: '来看看我创建的PPT',
        url: shareUrl
      })
    } catch (err) {
      console.log('分享取消')
    }
  } else {
    // 复制链接
    try {
      await navigator.clipboard.writeText(shareUrl)
      alert('分享链接已复制到剪贴板！')
    } catch {
      prompt('复制以下链接分享:', shareUrl)
    }
  }
}

onMounted(() => {
  loadStatus()
  loadPreview()
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

/* 导出菜单 */
.export-menu {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
  padding: 16px;
  background: #f9f9f9;
  border-radius: 12px;
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

.export-icon {
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
