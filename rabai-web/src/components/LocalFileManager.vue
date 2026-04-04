<template>
  <div class="local-file-manager">
    <!-- Save/Load Actions -->
    <div class="action-bar">
      <button class="action-btn save" @click="handleSave" :disabled="isLoading">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
          <polyline points="17,21 17,13 7,13 7,21"/>
          <polyline points="7,3 7,8 15,8"/>
        </svg>
        <span>{{ isDesktopMode ? '保存到本地' : '下载 PPT' }}</span>
      </button>
      
      <button class="action-btn load" @click="handleLoad" :disabled="isLoading">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
          <line x1="12" y1="11" x2="12" y2="17"/>
          <polyline points="9,14 12,17 15,14"/>
        </svg>
        <span>打开本地文件</span>
      </button>

      <button class="action-btn history" @click="showHistory = !showHistory">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12,6 12,12 16,14"/>
        </svg>
        <span>历史记录</span>
        <span v-if="savedFiles.length" class="badge">{{ savedFiles.length }}</span>
      </button>

      <button class="action-btn clear" @click="handleClear" v-if="savedFiles.length">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3,6 5,6 21,6"/>
          <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
        </svg>
        <span>清理</span>
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <span>{{ loadingMessage }}</span>
    </div>

    <!-- History Panel -->
    <div v-if="showHistory && savedFiles.length" class="history-panel">
      <div class="history-header">
        <h3>本地存储的历史</h3>
        <button class="close-btn" @click="showHistory = false">×</button>
      </div>
      <div class="history-list">
        <div 
          v-for="file in savedFiles" 
          :key="file.id" 
          class="history-item"
          @click="handleOpenHistory(file.id!)"
        >
          <div class="file-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
              <polyline points="14,2 14,8 20,8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
          </div>
          <div class="file-info">
            <span class="file-name">{{ file.name }}</span>
            <span class="file-meta">
              {{ formatSize(file.size) }} · {{ formatDate(file.timestamp) }}
            </span>
          </div>
          <button class="delete-btn" @click.stop="handleDelete(file.id!)">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Error Toast -->
    <Transition name="fade">
      <div v-if="error" class="error-toast">
        <span>{{ error }}</span>
        <button @click="error = null">×</button>
      </div>
    </Transition>

    <!-- Success Toast -->
    <Transition name="fade">
      <div v-if="successMessage" class="success-toast">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20,6 9,17 4,12"/>
        </svg>
        <span>{{ successMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useLocalFileStorage } from '@/composables/useLocalFileStorage'

const props = defineProps<{
  pptData?: Blob | ArrayBuffer
  filename?: string
}>()

const emit = defineEmits<{
  (e: 'file-loaded', data: Blob, name: string): void
}>()

const {
  isLoading,
  error,
  savedFiles,
  savePPT,
  loadPPT,
  listSavedFiles,
  loadFromIndexedDB,
  deleteFromIndexedDB,
  clearStorage,
  isDesktopMode
} = useLocalFileStorage()

const showHistory = ref(false)
const loadingMessage = ref('')
const successMessage = ref('')

onMounted(() => {
  listSavedFiles()
})

const handleSave = async () => {
  if (!props.pptData) {
    error.value = '没有可保存的 PPT 数据'
    return
  }
  
  loadingMessage.value = isDesktopMode.value ? '正在保存到本地...' : '正在下载...'
  const filename = props.filename || `RabAiMind_PPT_${Date.now()}.pptx`
  const result = await savePPT(props.pptData, filename)
  
  if (result) {
    successMessage.value = isDesktopMode.value ? `已保存到: ${result}` : '下载完成'
    await listSavedFiles()
    setTimeout(() => { successMessage.value = '' }, 3000)
  }
  loadingMessage.value = ''
}

const handleLoad = async () => {
  loadingMessage.value = '正在打开文件...'
  const file = await loadPPT()
  if (file) {
    emit('file-loaded', file.data as Blob, file.name)
    successMessage.value = `已加载: ${file.name}`
    setTimeout(() => { successMessage.value = '' }, 3000)
  }
  loadingMessage.value = ''
}

const handleOpenHistory = async (id: number) => {
  loadingMessage.value = '正在打开...'
  const file = await loadFromIndexedDB(id)
  if (file) {
    emit('file-loaded', file.data as Blob, file.name)
    successMessage.value = `已加载: ${file.name}`
    setTimeout(() => { successMessage.value = '' }, 3000)
  }
  loadingMessage.value = ''
}

const handleDelete = async (id: number) => {
  await deleteFromIndexedDB(id)
  await listSavedFiles()
  if (savedFiles.value.length === 0) {
    showHistory.value = false
  }
}

const handleClear = async () => {
  if (confirm('确定要清空所有本地历史记录吗？')) {
    await clearStorage()
    showHistory.value = false
  }
}

const formatSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const formatDate = (ts: number): string => {
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`
  return d.toLocaleDateString('zh-CN')
}
</script>

<style scoped>
.local-file-manager {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.action-bar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  background: var(--bg-secondary, #fff);
  color: var(--text-primary, #374151);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.action-btn:hover:not(:disabled) {
  background: var(--bg-hover, #f3f4f6);
  border-color: var(--accent-color, #165DFF);
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-btn.save:hover:not(:disabled) {
  background: #EEF2FF;
  border-color: #165DFF;
  color: #165DFF;
}

.action-btn.load:hover:not(:disabled) {
  background: #F0FDF4;
  border-color: #16A34A;
  color: #16A34A;
}

.action-btn svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.badge {
  background: #165DFF;
  color: #fff;
  border-radius: 10px;
  padding: 1px 6px;
  font-size: 11px;
  font-weight: 600;
}

.loading-state {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--bg-secondary, #f9fafb);
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-secondary, #6b7280);
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--border-color, #e5e7eb);
  border-top-color: #165DFF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.history-panel {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 100;
  width: 320px;
  max-height: 400px;
  overflow: hidden;
  background: var(--bg-primary, #fff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.15);
  margin-top: 4px;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.history-header h3 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: var(--text-secondary, #6b7280);
  padding: 0;
  line-height: 1;
}

.history-list {
  overflow-y: auto;
  max-height: 340px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid var(--border-color, #f3f4f6);
}

.history-item:hover {
  background: var(--bg-hover, #f9fafb);
}

.history-item:last-child {
  border-bottom: none;
}

.file-icon {
  width: 36px;
  height: 36px;
  background: #EEF2FF;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.file-icon svg {
  width: 20px;
  height: 20px;
  color: #165DFF;
}

.file-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.file-name {
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.file-meta {
  font-size: 11px;
  color: var(--text-secondary, #6b7280);
}

.delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary, #9ca3af);
  padding: 4px;
  border-radius: 4px;
  transition: all 0.15s;
  opacity: 0;
}

.history-item:hover .delete-btn {
  opacity: 1;
}

.delete-btn:hover {
  color: #EF4444;
  background: #FEF2F2;
}

.delete-btn svg {
  width: 14px;
  height: 14px;
}

.error-toast,
.success-toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 10px;
  font-size: 13px;
  z-index: 1000;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}

.error-toast {
  background: #FEF2F2;
  color: #DC2626;
  border: 1px solid #FECACA;
}

.success-toast {
  background: #F0FDF4;
  color: #16A34A;
  border: 1px solid #BBF7D0;
}

.success-toast svg {
  width: 18px;
  height: 18px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
