<template>
  <div class="backup-panel-overlay" @click.self="$emit('close')">
    <div class="backup-panel">
      <div class="panel-header">
        <h2 class="panel-title">💾 备份管理</h2>
        <button class="btn btn-sm btn-close-panel" @click="$emit('close')">✕</button>
      </div>

      <!-- 操作按钮栏 -->
      <div class="panel-actions">
        <button class="btn btn-primary" @click="handleCreateBackup" :disabled="creating">
          <span v-if="creating">创建中...</span>
          <span v-else>☁️ 创建备份</span>
        </button>
        <button class="btn btn-outline" @click="showImportDialog = true">📥 导入备份</button>
        <input v-if="showImportDialog" type="file" accept=".rabak" @change="handleImportFile" class="file-input" ref="fileInput" />
      </div>

      <!-- 备份类型筛选 -->
      <div class="filter-tabs">
        <button :class="['tab-btn', filterType === 'all' ? 'active' : '']" @click="filterType = 'all'">全部</button>
        <button :class="['tab-btn', filterType === 'manual' ? 'active' : '']" @click="filterType = 'manual'">手动</button>
        <button :class="['tab-btn', filterType === 'auto' ? 'active' : '']" @click="filterType = 'auto'">自动</button>
        <button :class="['tab-btn', filterType === 'cloud' ? 'active' : '']" @click="filterType = 'cloud'">云端</button>
      </div>

      <!-- 加载状态 -->
      <div v-if="loading" class="panel-loading">
        <div class="loading-spinner"></div>
        <p>加载备份历史...</p>
      </div>

      <!-- 备份列表 -->
      <div v-else-if="filteredBackups.length > 0" class="backup-list">
        <div v-for="backup in filteredBackups" :key="backup.backup_id" class="backup-item">
          <div class="backup-info">
            <div class="backup-name">{{ backup.name }}</div>
            <div class="backup-meta">
              <span class="backup-type-badge" :class="backup.backup_type">{{ backup.backup_type }}</span>
              <span class="backup-time">{{ formatTime(backup.created_at) }}</span>
              <span class="backup-size">{{ backup.size_str || '—' }}</span>
              <span class="backup-slides">{{ backup.slide_count || 0 }} 页</span>
            </div>
          </div>
          <div class="backup-actions">
            <button class="btn btn-sm" @click="showRestoreDialog(backup)" title="恢复">
              ↩️ 恢复
            </button>
            <button class="btn btn-sm btn-outline" @click="handleSelectiveRestore(backup)" title="选择性恢复">
              📄 选择页
            </button>
            <button class="btn btn-sm" @click="handleDownloadBackup(backup)" title="下载备份">
              ⬇️
            </button>
            <button class="btn btn-sm btn-danger" @click="handleDeleteBackup(backup)" title="删除">
              🗑️
            </button>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="panel-empty">
        <p>暂无备份记录</p>
        <p class="empty-hint">点击「创建备份」保存当前演示文稿</p>
      </div>

      <!-- 恢复对话框 -->
      <div v-if="restoreDialog.visible" class="modal-mask" @click.self="restoreDialog.visible = false">
        <div class="restore-modal">
          <div class="modal-title">↩️ 恢复备份</div>
          <div class="restore-info">
            <p><strong>{{ restoreDialog.backup?.name }}</strong></p>
            <p class="restore-time">{{ formatTime(restoreDialog.backup?.created_at) }}</p>
          </div>

          <div class="form-item">
            <text class="form-label">恢复方式</text>
            <div class="radio-group">
              <label class="radio-item">
                <input type="radio" v-model="restoreDialog.type" value="full" />
                <span>全量恢复（覆盖当前内容）</span>
              </label>
              <label class="radio-item">
                <input type="radio" v-model="restoreDialog.type" value="config" />
                <span>仅恢复配置（场景/风格/模板）</span>
              </label>
            </div>
          </div>

          <div class="modal-actions">
            <button class="btn btn-outline" @click="restoreDialog.visible = false">取消</button>
            <button class="btn btn-primary" @click="confirmRestore" :disabled="restoreDialog.loading">
              {{ restoreDialog.loading ? '恢复中...' : '确认恢复' }}
            </button>
          </div>
        </div>
      </div>

      <!-- 选择性恢复对话框 -->
      <div v-if="selectiveDialog.visible" class="modal-mask" @click.self="closeSelectiveDialog">
        <div class="selective-restore-modal">
          <div class="modal-title">📄 选择要恢复的页面</div>
          <div class="selective-hint">勾选要恢复的页面，然后点击「确认恢复」</div>

          <div v-if="selectiveDialog.loading" class="panel-loading">
            <div class="loading-spinner"></div>
            <p>加载幻灯片...</p>
          </div>

          <div v-else-if="selectiveDialog.slides.length > 0" class="selective-slides-grid">
            <div
              v-for="slide in selectiveDialog.slides"
              :key="slide.slide_num"
              :class="['selective-slide-card', { selected: selectiveDialog.selected.includes(slide.slide_num) }]"
              @click="toggleSlideSelection(slide.slide_num)"
            >
              <div class="slide-checkbox">
                <input type="checkbox" :checked="selectiveDialog.selected.includes(slide.slide_num)" />
              </div>
              <div class="slide-number">{{ slide.slide_num }}</div>
              <div class="slide-title">{{ slide.title || '无标题' }}</div>
              <div v-if="slide.has_chart" class="slide-chart-badge">{{ slide.chart_type }}</div>
              <img v-if="slide.svg_path" :src="getSlidePreviewUrl(slide.svg_path)" class="slide-preview-img" alt="" @error="e => e.target && (e.target.style.display='none')" />
            </div>
          </div>

          <div class="selective-actions">
            <button class="btn btn-outline" @click="selectAllSlides">全选</button>
            <button class="btn btn-outline" @click="deselectAllSlides">取消全选</button>
          </div>

          <div class="modal-actions">
            <button class="btn btn-outline" @click="closeSelectiveDialog">取消</button>
            <button class="btn btn-primary" @click="confirmSelectiveRestore" :disabled="selectiveDialog.selected.length === 0 || selectiveDialog.loading">
              {{ selectiveDialog.loading ? '恢复中...' : `确认恢复 (${selectiveDialog.selected.length}页)` }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { api } from '../api/client'

const props = defineProps<{
  taskId: string
}>()

const emit = defineEmits(['close', 'restored'])

const loading = ref(false)
const creating = ref(false)
const backups = ref<any[]>([])
const filterType = ref('all')
const showImportDialog = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const restoreDialog = ref({
  visible: false,
  backup: null as any,
  type: 'full',
  loading: false,
})

const selectiveDialog = ref({
  visible: false,
  backup: null as any,
  slides: [] as any[],
  selected: [] as number[],
  loading: false,
})

const filteredBackups = computed(() => {
  if (filterType.value === 'all') return backups.value
  return backups.value.filter(b => b.backup_type === filterType.value)
})

onMounted(() => {
  loadBackups()
})

async function loadBackups() {
  loading.value = true
  try {
    const res = await api.ppt.listBackups(props.taskId)
    if (res.data && res.data.success) {
      backups.value = res.data.backups || []
    }
  } catch (e) {
    console.error('加载备份失败:', e)
  } finally {
    loading.value = false
  }
}

async function handleCreateBackup() {
  creating.value = true
  try {
    await api.ppt.createBackup(props.taskId, `备份 ${formatTime(new Date().toISOString())}`)
    await loadBackups()
  } catch (e) {
    console.error('创建备份失败:', e)
  } finally {
    creating.value = false
  }
}

async function handleImportFile(e: Event) {
  const input = e.target as HTMLInputElement
  if (!input.files || input.files.length === 0) return
  const file = input.files[0]
  try {
    await api.ppt.importBackup(file)
    showImportDialog.value = false
    await loadBackups()
  } catch (err) {
    console.error('导入备份失败:', err)
  }
  if (input) input.value = ''
}

function showRestoreDialog(backup: any) {
  restoreDialog.value = {
    visible: true,
    backup,
    type: 'full',
    loading: false,
  }
}

async function confirmRestore() {
  if (!restoreDialog.value.backup) return
  restoreDialog.value.loading = true
  try {
    await api.ppt.restoreBackup(
      props.taskId,
      restoreDialog.value.backup.backup_id,
      restoreDialog.value.type as 'full' | 'config'
    )
    restoreDialog.value.visible = false
    emit('restored')
  } catch (e) {
    console.error('恢复失败:', e)
  } finally {
    restoreDialog.value.loading = false
  }
}

async function handleSelectiveRestore(backup: any) {
  selectiveDialog.value = {
    visible: true,
    backup,
    slides: [],
    selected: [],
    loading: true,
  }
  try {
    const res = await api.ppt.getBackupSlides(props.taskId, backup.backup_id)
    if (res.data && res.data.success) {
      selectiveDialog.value.slides = res.data.slides || []
    }
  } catch (e) {
    console.error('加载幻灯片失败:', e)
  } finally {
    selectiveDialog.value.loading = false
  }
}

function toggleSlideSelection(slideNum: number) {
  const idx = selectiveDialog.value.selected.indexOf(slideNum)
  if (idx >= 0) {
    selectiveDialog.value.selected.splice(idx, 1)
  } else {
    selectiveDialog.value.selected.push(slideNum)
  }
}

function selectAllSlides() {
  selectiveDialog.value.selected = selectiveDialog.value.slides.map((s: any) => s.slide_num)
}

function deselectAllSlides() {
  selectiveDialog.value.selected = []
}

async function confirmSelectiveRestore() {
  if (selectiveDialog.value.selected.length === 0) return
  selectiveDialog.value.loading = true
  try {
    await api.ppt.restoreBackup(
      props.taskId,
      selectiveDialog.value.backup.backup_id,
      'slides',
      selectiveDialog.value.selected
    )
    closeSelectiveDialog()
    emit('restored')
  } catch (e) {
    console.error('选择性恢复失败:', e)
  } finally {
    selectiveDialog.value.loading = false
  }
}

function closeSelectiveDialog() {
  selectiveDialog.value.visible = false
}

async function handleDownloadBackup(backup: any) {
  try {
    const blob = await api.ppt.downloadBackup(props.taskId, backup.backup_id)
    const url = URL.createObjectURL(blob as any)
    const a = document.createElement('a')
    a.href = url
    a.download = `backup_${backup.backup_id}.rabak`
    a.click()
    URL.revokeObjectURL(url)
  } catch (e) {
    console.error('下载备份失败:', e)
  }
}

async function handleDeleteBackup(backup: any) {
  if (!confirm(`确认删除备份「${backup.name}」？此操作不可恢复。`)) return
  try {
    await api.ppt.deleteBackup(props.taskId, backup.backup_id)
    await loadBackups()
  } catch (e) {
    console.error('删除备份失败:', e)
  }
}

function getSlidePreviewUrl(svgPath: string): string {
  if (!svgPath) return ''
  // 将本地路径转换为API URL
  return `/api/v1/ppt/svg/${props.taskId}/${svgPath.split('/').pop()?.replace('slide_', '').replace('.svg', '')}`
}

function formatTime(isoString: string): string {
  if (!isoString) return '—'
  try {
    const d = new Date(isoString)
    return d.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch {
    return isoString
  }
}
</script>

<style scoped>
.backup-panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.backup-panel {
  background: #fff;
  border-radius: 12px;
  width: 680px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.panel-title {
  font-size: 18px;
  margin: 0;
  color: #222;
}

.panel-actions {
  display: flex;
  gap: 8px;
  padding: 12px 20px;
  border-bottom: 1px solid #f0f0f0;
  flex-wrap: wrap;
  align-items: center;
}

.file-input {
  margin-left: 8px;
  font-size: 13px;
}

.filter-tabs {
  display: flex;
  gap: 4px;
  padding: 8px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.tab-btn {
  padding: 4px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
  border-radius: 4px;
  font-size: 13px;
  color: #666;
}

.tab-btn.active {
  background: #165DFF;
  color: #fff;
}

.panel-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #999;
}

.loading-spinner {
  width: 32px;
  height: 32px;
  border: 3px solid #eee;
  border-top-color: #165DFF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.backup-list {
  overflow-y: auto;
  flex: 1;
  padding: 8px 12px;
}

.backup-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  border-radius: 8px;
  margin-bottom: 6px;
  background: #f9fafb;
  gap: 12px;
}

.backup-item:hover {
  background: #f0f4ff;
}

.backup-info {
  flex: 1;
  min-width: 0;
}

.backup-name {
  font-weight: 500;
  color: #222;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.backup-meta {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: 4px;
  flex-wrap: wrap;
}

.backup-type-badge {
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 3px;
  font-weight: 500;
}

.backup-type-badge.manual { background: #e8f4ff; color: #165DFF; }
.backup-type-badge.auto { background: #fff7e6; color: #fa8c16; }
.backup-type-badge.cloud { background: #f6ffed; color: #52c41a; }
.backup-type-badge.imported { background: #f9f0ff; color: #722ed1; }

.backup-time {
  font-size: 12px;
  color: #999;
}

.backup-size, .backup-slides {
  font-size: 12px;
  color: #888;
}

.backup-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.panel-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: #999;
}

.empty-hint {
  font-size: 13px;
  color: #bbb;
  margin-top: 8px;
}

.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
}

.restore-modal, .selective-restore-modal {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  width: 420px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
  color: #222;
}

.restore-info {
  background: #f9fafb;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.restore-time {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.form-item {
  margin-bottom: 16px;
}

.form-label {
  display: block;
  font-size: 13px;
  color: #666;
  margin-bottom: 6px;
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  cursor: pointer;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}

.selective-hint {
  font-size: 13px;
  color: #888;
  margin-bottom: 12px;
}

.selective-slides-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 12px;
}

.selective-slide-card {
  border: 2px solid #e8e8e8;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  position: relative;
  transition: border-color 0.15s;
}

.selective-slide-card:hover {
  border-color: #165DFF;
}

.selective-slide-card.selected {
  border-color: #165DFF;
  background: #f0f4ff;
}

.slide-checkbox {
  position: absolute;
  top: 4px;
  left: 4px;
}

.slide-number {
  font-size: 11px;
  color: #999;
  text-align: right;
}

.slide-title {
  font-size: 12px;
  font-weight: 500;
  margin: 4px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.slide-chart-badge {
  font-size: 10px;
  background: #fff7e6;
  color: #fa8c16;
  padding: 1px 4px;
  border-radius: 2px;
}

.slide-preview-img {
  width: 100%;
  height: 60px;
  object-fit: cover;
  border-radius: 4px;
  margin-top: 4px;
  background: #f5f5f5;
}

.selective-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.btn {
  padding: 6px 14px;
  border-radius: 6px;
  border: 1px solid #d9d9d9;
  background: #fff;
  cursor: pointer;
  font-size: 13px;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.btn-primary {
  background: #165DFF;
  color: #fff;
  border-color: #165DFF;
}

.btn-outline {
  background: #fff;
}

.btn-sm {
  padding: 3px 8px;
  font-size: 12px;
}

.btn-danger {
  background: #fff1f0;
  border-color: #ffccc7;
  color: #ff4d4f;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
