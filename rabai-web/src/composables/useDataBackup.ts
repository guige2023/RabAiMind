// Data Backup - 数据备份管理
import { ref, computed, watch } from 'vue'

export type BackupStatus = 'idle' | 'creating' | 'uploading' | 'completed' | 'failed' | 'restoring'

export interface BackupMetadata {
  id: string
  name: string
  createdAt: number
  size: number
  type: 'full' | 'partial' | 'incremental'
  includes: string[]
  checksum: string
}

export interface BackupConfig {
  autoBackup: boolean
  backupInterval: number // 小时
  maxBackups: number
  compressData: boolean
  encryptData: boolean
  includeTemplates: boolean
  includeHistory: boolean
  includeSettings: boolean
  includeMedia: boolean
}

export interface BackupProgress {
  status: BackupStatus
  progress: number
  currentStep: string
  error?: string
}

const defaultConfig: BackupConfig = {
  autoBackup: false,
  backupInterval: 24,
  maxBackups: 10,
  compressData: true,
  encryptData: false,
  includeTemplates: true,
  includeHistory: true,
  includeSettings: true,
  includeMedia: false
}

export function useDataBackup() {
  // 配置
  const config = ref<BackupConfig>({ ...defaultConfig })

  // 备份列表
  const backups = ref<BackupMetadata[]>([])

  // 当前进度
  const progress = ref<BackupProgress>({
    status: 'idle',
    progress: 0,
    currentStep: ''
  })

  // 备份定时器
  let autoBackupTimer: ReturnType<typeof setInterval> | null = null

  // 加载备份列表
  const loadBackups = (): BackupMetadata[] => {
    try {
      const stored = localStorage.getItem('backups')
      if (stored) {
        backups.value = JSON.parse(stored)
      }
    } catch (e) {
      console.error('Failed to load backups:', e)
    }
    return backups.value
  }

  // 保存备份列表
  const saveBackups = () => {
    try {
      localStorage.setItem('backups', JSON.stringify(backups.value))
    } catch (e) {
      console.error('Failed to save backups:', e)
    }
  }

  // 收集需要备份的数据
  const collectData = async (): Promise<Record<string, any>> => {
    const data: Record<string, any> = {}

    if (config.value.includeTemplates) {
      try {
        const templates = localStorage.getItem('templates')
        if (templates) data.templates = JSON.parse(templates)
      } catch { /* ignore */ }
    }

    if (config.value.includeHistory) {
      try {
        const history = localStorage.getItem('history')
        if (history) data.history = JSON.parse(history)
      } catch { /* ignore */ }
    }

    if (config.value.includeSettings) {
      try {
        const settings = localStorage.getItem('settings')
        if (settings) data.settings = JSON.parse(settings)
      } catch { /* ignore */ }
    }

    if (config.value.includeMedia) {
      try {
        const media = localStorage.getItem('media')
        if (media) data.media = JSON.parse(media)
      } catch { /* ignore */ }
    }

    // 添加收藏
    try {
      const favorites = localStorage.getItem('favorites')
      if (favorites) data.favorites = JSON.parse(favorites)
    } catch { /* ignore */ }

    // 添加草稿
    try {
      const drafts = localStorage.getItem('drafts')
      if (drafts) data.drafts = JSON.parse(drafts)
    } catch { /* ignore */ }

    return data
  }

  // 压缩数据
  const compressData = async (data: string): Promise<Blob> => {
    const encoder = new TextEncoder()
    const encoded = encoder.encode(data)

    // 简单的压缩模拟（实际应该用CompressionStream）
    return new Blob([encoded], { type: 'application/json' })
  }

  // 计算校验和
  const calculateChecksum = async (data: string): Promise<string> => {
    const encoder = new TextEncoder()
    const encoded = encoder.encode(data)
    let hash = 0

    for (let i = 0; i < encoded.length; i++) {
      const char = encoded[i]
      hash = ((hash << 5) - hash) + char
      hash = hash & hash
    }

    return Math.abs(hash).toString(16)
  }

  // 创建备份
  const createBackup = async (name?: string): Promise<BackupMetadata | null> => {
    progress.value = {
      status: 'creating',
      progress: 0,
      currentStep: '收集数据...'
    }

    try {
      // 收集数据
      const data = await collectData()
      progress.value.progress = 30
      progress.value.currentStep = '序列化数据...'

      // 序列化为JSON
      const jsonData = JSON.stringify(data)
      progress.value.progress = 50
      progress.value.currentStep = '压缩数据...'

      // 压缩
      let blob: Blob
      if (config.value.compressData) {
        blob = await compressData(jsonData)
      } else {
        blob = new Blob([jsonData], { type: 'application/json' })
      }
      progress.value.progress = 70
      progress.value.currentStep = '计算校验和...'

      // 计算校验和
      const checksum = await calculateChecksum(jsonData)
      progress.value.progress = 80
      progress.value.currentStep = '保存备份...'

      // 创建备份元数据
      const backup: BackupMetadata = {
        id: `backup_${Date.now()}`,
        name: name || `备份 ${new Date().toLocaleString()}`,
        createdAt: Date.now(),
        size: blob.size,
        type: 'full',
        includes: Object.keys(data),
        checksum
      }

      // 保存到localStorage
      const backupKey = `backup_${backup.id}`
      localStorage.setItem(backupKey, jsonData)

      // 添加到列表
      backups.value.unshift(backup)

      // 清理旧备份
      if (backups.value.length > config.value.maxBackups) {
        const oldBackups = backups.value.slice(config.value.maxBackups)
        oldBackups.forEach(b => {
          localStorage.removeItem(`backup_${b.id}`)
        })
        backups.value = backups.value.slice(0, config.value.maxBackups)
      }

      saveBackups()

      progress.value.progress = 100
      progress.value.status = 'completed'
      progress.value.currentStep = '完成'

      // 重置进度
      setTimeout(() => {
        progress.value.status = 'idle'
        progress.value.currentStep = ''
      }, 2000)

      return backup
    } catch (error: any) {
      progress.value.status = 'failed'
      progress.value.error = error.message
      return null
    }
  }

  // 恢复备份
  const restoreBackup = async (backupId: string): Promise<boolean> => {
    progress.value = {
      status: 'restoring',
      progress: 0,
      currentStep: '读取备份...'
    }

    try {
      const backupKey = `backup_${backupId}`
      const dataStr = localStorage.getItem(backupKey)

      if (!dataStr) {
        throw new Error('Backup not found')
      }

      progress.value.progress = 30
      progress.value.currentStep = '解析数据...'

      const data = JSON.parse(dataStr)

      progress.value.progress = 50
      progress.value.currentStep = '恢复数据...'

      // 恢复各部分数据
      if (data.templates && config.value.includeTemplates) {
        localStorage.setItem('templates', JSON.stringify(data.templates))
      }
      progress.value.progress = 60

      if (data.history && config.value.includeHistory) {
        localStorage.setItem('history', JSON.stringify(data.history))
      }
      progress.value.progress = 70

      if (data.settings && config.value.includeSettings) {
        localStorage.setItem('settings', JSON.stringify(data.settings))
      }
      progress.value.progress = 80

      if (data.favorites) {
        localStorage.setItem('favorites', JSON.stringify(data.favorites))
      }
      progress.value.progress = 90

      if (data.drafts) {
        localStorage.setItem('drafts', JSON.stringify(data.drafts))
      }
      progress.value.progress = 100
      progress.value.status = 'completed'
      progress.value.currentStep = '完成'

      setTimeout(() => {
        progress.value.status = 'idle'
        progress.value.currentStep = ''
      }, 2000)

      return true
    } catch (error: any) {
      progress.value.status = 'failed'
      progress.value.error = error.message
      return false
    }
  }

  // 删除备份
  const deleteBackup = (backupId: string): boolean => {
    try {
      localStorage.removeItem(`backup_${backupId}`)
      backups.value = backups.value.filter(b => b.id !== backupId)
      saveBackups()
      return true
    } catch (e) {
      return false
    }
  }

  // 导出备份到文件
  const exportBackup = async (backupId: string): Promise<boolean> => {
    const backup = backups.value.find(b => b.id === backupId)
    if (!backup) return false

    try {
      const data = localStorage.getItem(`backup_${backupId}`)
      if (!data) return false

      const blob = new Blob([data], { type: 'application/json' })
      const url = URL.createObjectURL(blob)

      const a = document.createElement('a')
      a.href = url
      a.download = `${backup.name.replace(/[^a-z0-9]/gi, '_')}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      return true
    } catch (e) {
      return false
    }
  }

  // 从文件导入备份
  const importBackup = async (file: File): Promise<boolean> => {
    try {
      const text = await file.text()
      const data = JSON.parse(text)

      const backup: BackupMetadata = {
        id: `backup_${Date.now()}`,
        name: file.name.replace('.json', ''),
        createdAt: Date.now(),
        size: file.size,
        type: 'imported',
        includes: Object.keys(data),
        checksum: await calculateChecksum(text)
      }

      localStorage.setItem(`backup_${backup.id}`, text)
      backups.value.unshift(backup)
      saveBackups()

      return true
    } catch (e) {
      return false
    }
  }

  // 启动自动备份
  const startAutoBackup = () => {
    if (autoBackupTimer) return

    config.value.autoBackup = true

    autoBackupTimer = setInterval(async () => {
      await createBackup()
    }, config.value.backupInterval * 60 * 60 * 1000)
  }

  // 停止自动备份
  const stopAutoBackup = () => {
    if (autoBackupTimer) {
      clearInterval(autoBackupTimer)
      autoBackupTimer = null
    }
    config.value.autoBackup = false
  }

  // 更新配置
  const updateConfig = (newConfig: Partial<BackupConfig>) => {
    config.value = { ...config.value, ...newConfig }

    // 如果启用了自动备份，重新启动
    if (config.value.autoBackup) {
      startAutoBackup()
    } else {
      stopAutoBackup()
    }
  }

  // 备份统计
  const stats = computed(() => ({
    totalBackups: backups.value.length,
    totalSize: backups.value.reduce((sum, b) => sum + b.size, 0),
    oldestBackup: backups.value.length > 0 ? backups.value[backups.value.length - 1].createdAt : null,
    newestBackup: backups.value.length > 0 ? backups.value[0].createdAt : null,
    autoBackupEnabled: config.value.autoBackup
  }))

  // 格式化大小
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }

  // 初始化
  const init = () => {
    loadBackups()
    if (config.value.autoBackup) {
      startAutoBackup()
    }
  }

  return {
    // 配置和状态
    config,
    backups,
    progress,
    // 方法
    createBackup,
    restoreBackup,
    deleteBackup,
    exportBackup,
    importBackup,
    startAutoBackup,
    stopAutoBackup,
    updateConfig,
    loadBackups,
    // 计算属性
    stats,
    formatSize,
    init
  }
}

export default useDataBackup
