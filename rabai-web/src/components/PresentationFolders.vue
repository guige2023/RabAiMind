<template>
  <div class="folders-panel" :class="{ 'dark': isDark }">
    <!-- Header -->
    <div class="panel-header">
      <div class="header-title">
        <span class="title-icon">📁</span>
        <span>我的文件夹</span>
      </div>
      <button class="action-btn" @click="showCreateModal = true" title="新建文件夹">
        +
      </button>
    </div>

    <!-- Breadcrumb -->
    <div v-if="currentPath.length > 0" class="breadcrumb">
      <button class="breadcrumb-item" @click="navigateToRoot">
        <span>🏠</span> 全部
      </button>
      <template v-for="(folder, idx) in currentPath" :key="folder.id">
        <span class="breadcrumb-sep">›</span>
        <button
          class="breadcrumb-item"
          :class="{ active: idx === currentPath.length - 1 }"
          @click="navigateToFolder(folder.id, idx)"
        >
          {{ folder.icon }} {{ folder.name }}
        </button>
      </template>
    </div>

    <!-- Folder List -->
    <div class="folder-list">
      <!-- Parent folder link -->
      <div v-if="currentParentId" class="folder-item parent-folder" @click="navigateUp">
        <span class="folder-icon">📂</span>
        <span class="folder-name">上一级</span>
      </div>

      <div
        v-for="folder in folders"
        :key="folder.id"
        class="folder-item"
        :class="{ selected: selectedFolderId === folder.id }"
        @click="selectFolder(folder)"
        @contextmenu.prevent="showContextMenu($event, folder)"
      >
        <span class="folder-icon" :style="{ color: folder.color }">{{ folder.icon }}</span>
        <div class="folder-info">
          <span class="folder-name">{{ folder.name }}</span>
          <span class="folder-meta">{{ folder.ppt_ids.length }} 个PPT</span>
        </div>
        <div v-if="folder.is_shared" class="shared-badge" title="已共享">👥</div>
        <div class="folder-actions">
          <button class="action-icon" @click.stop="editFolder(folder)" title="编辑">✏️</button>
          <button class="action-icon" @click.stop="shareFolder(folder)" title="共享">🔗</button>
          <button class="action-icon delete" @click.stop="confirmDelete(folder)" title="删除">🗑️</button>
        </div>
      </div>

      <!-- Empty state -->
      <div v-if="folders.length === 0 && !loading" class="empty-state">
        <span class="empty-icon">📂</span>
        <p>还没有文件夹</p>
        <button class="btn-create-folder" @click="showCreateModal = true">
          + 新建文件夹
        </button>
      </div>
    </div>

    <!-- PPTs in current folder -->
    <div v-if="selectedFolder && selectedFolder.ppt_ids.length > 0" class="folder-ppts">
      <div class="section-label">
        📄 文件夹中的演示 ({{ selectedFolder.ppt_ids.length }})
      </div>
      <div class="ppt-grid">
        <router-link
          v-for="ppt in folderPpts"
          :key="ppt.task_id"
          :to="`/result/${ppt.task_id}`"
          class="ppt-card-mini"
        >
          <div class="ppt-thumb" :style="{ background: thumbGradient(ppt.task_id) }">
            <span class="slide-count">{{ ppt.slide_count || '?' }}P</span>
          </div>
          <div class="ppt-info">
            <span class="ppt-title">{{ ppt.title || '无标题' }}</span>
            <span class="ppt-time">{{ formatTime(ppt.created_at) }}</span>
          </div>
        </router-link>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- Create/Edit Folder Modal -->
    <div v-if="showCreateModal || editingFolder" class="modal-mask" @click.self="closeModal">
      <div class="folder-modal">
        <div class="modal-header">
          <h3>{{ editingFolder ? '✏️ 编辑文件夹' : '📁 新建文件夹' }}</h3>
          <button class="close-btn" @click="closeModal">✕</button>
        </div>
        <div class="modal-body">
          <div class="form-item">
            <label>文件夹名称</label>
            <input
              v-model="form.name"
              class="form-input"
              placeholder="给文件夹起个名字"
              maxlength="50"
              @keyup.enter="saveFolder"
            />
          </div>
          <div class="form-item">
            <label>图标</label>
            <div class="icon-picker">
              <button
                v-for="icon in iconOptions"
                :key="icon"
                class="icon-btn"
                :class="{ selected: form.icon === icon }"
                @click="form.icon = icon"
              >
                {{ icon }}
              </button>
            </div>
          </div>
          <div class="form-item">
            <label>颜色</label>
            <div class="color-picker">
              <button
                v-for="color in colorOptions"
                :key="color"
                class="color-btn"
                :class="{ selected: form.color === color }"
                :style="{ background: color }"
                @click="form.color = color"
              ></button>
            </div>
          </div>
          <div class="form-item">
            <label>上一级 <span class="optional">(留空表示根目录)</span></label>
            <select v-model="form.parent_id" class="form-select">
              <option value="">根目录</option>
              <option v-for="f in allFolders" :key="f.id" :value="f.id">
                {{ f.icon }} {{ f.name }}
              </option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="closeModal">取消</button>
          <button class="btn btn-primary" @click="saveFolder" :disabled="!form.name.trim()">
            {{ editingFolder ? '保存' : '创建' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Share Folder Modal -->
    <div v-if="sharingFolder" class="modal-mask" @click.self="sharingFolder = null">
      <div class="folder-modal">
        <div class="modal-header">
          <h3>🔗 共享文件夹</h3>
          <button class="close-btn" @click="sharingFolder = null">✕</button>
        </div>
        <div class="modal-body">
          <p class="share-hint">
            共享「<strong>{{ sharingFolder.name }}</strong>」给以下邮箱，他们将可以查看文件夹中的所有PPT：
          </p>
          <div class="form-item">
            <label>添加共享成员邮箱</label>
            <div class="email-input-row">
              <input
                v-model="shareEmail"
                type="email"
                class="form-input"
                placeholder="colleague@company.com"
                @keyup.enter="addShareEmail"
              />
              <button class="btn-add-email" @click="addShareEmail">添加</button>
            </div>
          </div>
          <div class="shared-list">
            <div v-for="email in shareEmails" :key="email" class="shared-item">
              <span>👤 {{ email }}</span>
              <button class="remove-email" @click="removeShareEmail(email)">✕</button>
            </div>
            <div v-if="sharingFolder.shared_with.length > 0 && shareEmails.length === 0" class="shared-list-existing">
              <div v-for="email in sharingFolder.shared_with" :key="email" class="shared-item">
                <span>👤 {{ email }}</span>
                <button class="remove-email" @click="removeExistingShare(email)">✕</button>
              </div>
            </div>
            <div v-if="shareEmails.length === 0 && (!sharingFolder.shared_with || sharingFolder.shared_with.length === 0)" class="no-shares">
              暂未共享给任何人
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="sharingFolder = null">取消</button>
          <button class="btn btn-primary" @click="saveFolderShare">保存共享设置</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { apiClient } from '../api/client'

const props = defineProps<{
  workspaceId?: string
}>()

const isDark = ref(false)
const folders = ref<any[]>([])
const allFolders = ref<any[]>([])
const currentParentId = ref('')
const currentPath = ref<any[]>([])
const selectedFolderId = ref('')
const loading = ref(false)
const showCreateModal = ref(false)
const editingFolder = ref<any>(null)
const sharingFolder = ref<any>(null)
const shareEmail = ref('')
const shareEmails = ref<string[]>([])

const selectedFolder = computed(() =>
  allFolders.value.find(f => f.id === selectedFolderId.value)
)

const folderPpts = computed(() => {
  if (!selectedFolder.value) return []
  const ids = selectedFolder.value.ppt_ids || []
  // Would load PPT details from history
  return ids.map((id: string) => ({ task_id: id, title: id, created_at: '' }))
})

const form = ref({
  name: '',
  icon: '📁',
  color: '#165DFF',
  parent_id: '',
})

const iconOptions = ['📁', '📂', '💼', '📊', '📚', '🚀', '💡', '🎯', '⭐', '🔒', '🌐', '🎨', '📈', '🏆']
const colorOptions = ['#165DFF', '#00C850', '#FF9500', '#FF3B30', '#AF52DE', '#5AC8FA', '#FFCC00', '#8E8E93']

// Check dark mode
onMounted(() => {
  isDark.value = document.documentElement.classList.contains('dark') || false
  loadFolders()
  loadAllFolders()
})

const loadFolders = async () => {
  loading.value = true
  try {
    const res = await apiClient.get('/sharing/folders', {
      params: { workspace_id: props.workspaceId || 'default', parent_id: currentParentId.value }
    })
    folders.value = res.data.folders || []
  } catch {
    // Fallback to local
    folders.value = []
  } finally {
    loading.value = false
  }
}

const loadAllFolders = async () => {
  try {
    const res = await apiClient.get('/sharing/folders', {
      params: { workspace_id: props.workspaceId || 'default', parent_id: '' }
    })
    allFolders.value = res.data.folders || []
  } catch {
    allFolders.value = []
  }
}

const selectFolder = (folder: any) => {
  selectedFolderId.value = folder.id
  // Navigate into the folder
  currentPath.value.push(folder)
  currentParentId.value = folder.id
  loadFolders()
}

const navigateToRoot = () => {
  currentPath.value = []
  currentParentId.value = ''
  selectedFolderId.value = ''
  loadFolders()
}

const navigateToFolder = (folderId: string, index: number) => {
  currentPath.value = currentPath.value.slice(0, index + 1)
  currentParentId.value = folderId
  selectedFolderId.value = folderId
  loadFolders()
}

const navigateUp = () => {
  if (currentPath.value.length > 0) {
    currentPath.value.pop()
    currentParentId.value = currentPath.value.length > 0
      ? currentPath.value[currentPath.value.length - 1].id
      : ''
    selectedFolderId.value = ''
    loadFolders()
  }
}

const editFolder = (folder: any) => {
  editingFolder.value = folder
  form.value = {
    name: folder.name,
    icon: folder.icon,
    color: folder.color,
    parent_id: folder.parent_id,
  }
}

const shareFolder = (folder: any) => {
  sharingFolder.value = { ...folder }
  shareEmails.value = []
  shareEmail.value = ''
}

const addShareEmail = () => {
  const email = shareEmail.value.trim()
  if (email && !shareEmails.value.includes(email)) {
    shareEmails.value.push(email)
    shareEmail.value = ''
  }
}

const removeShareEmail = (email: string) => {
  shareEmails.value = shareEmails.value.filter(e => e !== email)
}

const removeExistingShare = async (email: string) => {
  if (!sharingFolder.value) return
  try {
    await apiClient.delete(`/sharing/folders/${sharingFolder.value.id}/share`, {
      params: { email }
    })
    sharingFolder.value.shared_with = sharingFolder.value.shared_with.filter((e: string) => e !== email)
  } catch {
    sharingFolder.value.shared_with = sharingFolder.value.shared_with.filter((e: string) => e !== email)
  }
}

const saveFolderShare = async () => {
  if (!sharingFolder.value) return
  const emails = [...new Set([...shareEmails.value, ...(sharingFolder.value.shared_with || [])])]
  try {
    await apiClient.post(`/sharing/folders/${sharingFolder.value.id}/share`, { emails })
    sharingFolder.value = null
  } catch {
    // continue
  }
}

const confirmDelete = (folder: any) => {
  if (confirm(`确定要删除文件夹「${folder.name}」吗？文件夹内的PPT不会被删除。`)) {
    deleteFolder(folder.id)
  }
}

const deleteFolder = async (folderId: string) => {
  try {
    await apiClient.delete(`/sharing/folders/${folderId}`)
    loadFolders()
    loadAllFolders()
  } catch {
    // ignore
  }
}

const closeModal = () => {
  showCreateModal.value = false
  editingFolder.value = null
  form.value = { name: '', icon: '📁', color: '#165DFF', parent_id: '' }
}

const saveFolder = async () => {
  if (!form.value.name.trim()) return
  try {
    if (editingFolder.value) {
      await apiClient.put(`/sharing/folders/${editingFolder.value.id}`, {
        name: form.value.name,
        icon: form.value.icon,
        color: form.value.color,
        parent_id: form.value.parent_id,
      })
    } else {
      await apiClient.post('/sharing/folders', {
        workspace_id: props.workspaceId || 'default',
        name: form.value.name,
        icon: form.value.icon,
        color: form.value.color,
        parent_id: currentParentId.value,
      })
    }
    closeModal()
    loadFolders()
    loadAllFolders()
  } catch {
    // ignore
  }
}

const showContextMenu = (event: MouseEvent, folder: any) => {
  // Simple context menu via browser context menu
}

const thumbGradient = (id: string): string => {
  const colors = ['#165DFF, #0E42D2', '#00C850, #00A040', '#FF9500, #CC7700', '#AF52DE, #8B42AE']
  const idx = id.charCodeAt(0) % colors.length
  return `linear-gradient(135deg, ${colors[idx]})`
}

const formatTime = (iso: string): string => {
  if (!iso) return ''
  try {
    const d = new Date(iso)
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
  } catch {
    return ''
  }
}
</script>

<style scoped>
.folders-panel {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  max-width: 400px;
  max-height: 600px;
  display: flex;
  flex-direction: column;
}

.dark, :global(.dark) .folders-panel {
  background: #1a1a1a;
}

/* Header */
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #f0f0f0;
}

.dark .panel-header {
  border-color: #333;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.dark .header-title {
  color: #eee;
}

.title-icon {
  font-size: 18px;
}

.action-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: #165DFF;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btn:hover {
  background: #0d47e6;
}

/* Breadcrumb */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 16px;
  background: #f8f9fa;
  border-bottom: 1px solid #f0f0f0;
  overflow-x: auto;
  flex-shrink: 0;
}

.dark .breadcrumb {
  background: #2a2a2a;
  border-color: #333;
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border: none;
  background: transparent;
  border-radius: 6px;
  font-size: 12px;
  color: #555;
  cursor: pointer;
  white-space: nowrap;
}

.dark .breadcrumb-item {
  color: #aaa;
}

.breadcrumb-item:hover, .breadcrumb-item.active {
  background: #e8f0ff;
  color: #165DFF;
}

.dark .breadcrumb-item:hover, .dark .breadcrumb-item.active {
  background: #1a2a4a;
  color: #5AACFF;
}

.breadcrumb-sep {
  color: #ccc;
  font-size: 14px;
}

/* Folder List */
.folder-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.folder-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s;
}

.folder-item:hover {
  background: #f0f7ff;
}

.dark .folder-item:hover {
  background: #2a2a2a;
}

.folder-item.selected {
  background: #e0eeff;
}

.dark .folder-item.selected {
  background: #1a2a4a;
}

.folder-item.parent-folder {
  color: #888;
  font-size: 13px;
}

.folder-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.folder-info {
  flex: 1;
  min-width: 0;
}

.folder-name {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dark .folder-name {
  color: #eee;
}

.folder-meta {
  font-size: 11px;
  color: #888;
}

.shared-badge {
  font-size: 14px;
  flex-shrink: 0;
}

.folder-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.15s;
}

.folder-item:hover .folder-actions {
  opacity: 1;
}

.action-icon {
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-icon:hover {
  background: #f0f0f0;
}

.action-icon.delete:hover {
  background: #fee;
}

.dark .action-icon:hover {
  background: #333;
}

/* PPT Grid */
.folder-ppts {
  border-top: 1px solid #f0f0f0;
  padding: 12px 16px;
  max-height: 300px;
  overflow-y: auto;
}

.dark .folder-ppts {
  border-color: #333;
}

.section-label {
  font-size: 12px;
  color: #888;
  margin-bottom: 8px;
}

.ppt-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.ppt-card-mini {
  display: flex;
  gap: 8px;
  padding: 8px;
  background: #f8f9fa;
  border-radius: 8px;
  text-decoration: none;
  transition: background 0.15s;
}

.ppt-card-mini:hover {
  background: #e8f0ff;
}

.dark .ppt-card-mini {
  background: #2a2a2a;
}

.dark .ppt-card-mini:hover {
  background: #1a2a4a;
}

.ppt-thumb {
  width: 48px;
  height: 32px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.slide-count {
  font-size: 10px;
  color: white;
  font-weight: 600;
}

.ppt-info {
  flex: 1;
  min-width: 0;
}

.ppt-title {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dark .ppt-title {
  color: #eee;
}

.ppt-time {
  font-size: 10px;
  color: #888;
}

/* Empty / Loading */
.empty-state {
  text-align: center;
  padding: 32px 16px;
  color: #888;
}

.empty-icon {
  font-size: 40px;
  display: block;
  margin-bottom: 8px;
}

.empty-state p {
  margin: 0 0 12px;
  font-size: 13px;
}

.btn-create-folder {
  padding: 8px 16px;
  border: 1px solid #165DFF;
  background: transparent;
  color: #165DFF;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
}

.btn-create-folder:hover {
  background: #f0f7ff;
}

.loading-state {
  text-align: center;
  padding: 24px;
  color: #888;
}

.spinner {
  width: 24px;
  height: 24px;
  border: 3px solid #e0e0e0;
  border-top-color: #165DFF;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin: 0 auto 8px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Modal */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.folder-modal {
  background: white;
  border-radius: 16px;
  width: 380px;
  max-width: 95vw;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.dark .folder-modal {
  background: #2a2a2a;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.dark .modal-header {
  border-color: #333;
}

.modal-header h3 {
  margin: 0;
  font-size: 15px;
  color: #333;
}

.dark .modal-header h3 {
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
  padding: 16px 20px;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid #f0f0f0;
}

.dark .modal-footer {
  border-color: #333;
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

.dark .form-item label {
  color: #aaa;
}

.optional {
  font-weight: 400;
  color: #999;
  font-size: 12px;
}

.form-input, .form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 13px;
  box-sizing: border-box;
  font-family: inherit;
}

.dark .form-input, .dark .form-select {
  background: #1a1a1a;
  border-color: #444;
  color: #fff;
}

.icon-picker {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.icon-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #e0e0e0;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dark .icon-btn {
  background: #1a1a1a;
  border-color: #444;
}

.icon-btn.selected {
  border-color: #165DFF;
  background: #f0f7ff;
}

.dark .icon-btn.selected {
  background: #1a2a4a;
}

.color-picker {
  display: flex;
  gap: 6px;
}

.color-btn {
  width: 28px;
  height: 28px;
  border: 2px solid transparent;
  border-radius: 50%;
  cursor: pointer;
}

.color-btn.selected {
  border-color: #333;
  transform: scale(1.15);
}

.dark .color-btn.selected {
  border-color: #fff;
}

/* Share */
.share-hint {
  font-size: 13px;
  color: #555;
  margin: 0 0 12px;
  line-height: 1.5;
}

.dark .share-hint {
  color: #aaa;
}

.email-input-row {
  display: flex;
  gap: 8px;
}

.btn-add-email {
  padding: 10px 16px;
  border: none;
  background: #165DFF;
  color: white;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  white-space: nowrap;
}

.btn-add-email:hover {
  background: #0d47e6;
}

.shared-list {
  margin-top: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.shared-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 4px;
  font-size: 13px;
  color: #333;
}

.dark .shared-item {
  background: #1a1a1a;
  color: #eee;
}

.remove-email {
  border: none;
  background: transparent;
  color: #ff4757;
  cursor: pointer;
  font-size: 12px;
  padding: 2px 6px;
  border-radius: 4px;
}

.remove-email:hover {
  background: #fee;
}

.no-shares {
  text-align: center;
  color: #888;
  font-size: 13px;
  padding: 16px;
}

/* Buttons */
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

.dark .btn-outline {
  background: #2a2a2a;
  border-color: #444;
  color: #aaa;
}

.btn-outline:hover {
  background: #f0f0f0;
}

.dark .btn-outline:hover {
  background: #333;
}

.btn-primary {
  background: #165DFF;
  color: white;
}

.btn-primary:hover {
  background: #0d47e6;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
