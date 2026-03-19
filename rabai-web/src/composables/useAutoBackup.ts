// useAutoBackup.ts - 自动备份模块
import { ref, computed, watch } from 'vue'

export interface BackupData {
  id: string
  timestamp: number
  data: any
  size: number
}

export interface BackupConfig {
  enabled: boolean
  interval: number // 分钟
  maxBackups: number
  storageType: 'local' | 'cloud'
}

export function useAutoBackup() {
  const config = ref<BackupConfig>({
    enabled: true,
    interval: 5,
    maxBackups: 10,
    storageType: 'local'
  })

  const backups = ref<BackupData[]>([])
  const lastBackup = ref<number>(0)
  const backingUp = ref(false)

  // 创建备份
  const createBackup = async (data: any): Promise<BackupData | null> => {
    if (backingUp.value) return null
    backingUp.value = true

    try {
      const backup: BackupData = {
        id: `backup_${Date.now()}`,
        timestamp: Date.now(),
        data: JSON.parse(JSON.stringify(data)),
        size: JSON.stringify(data).length
      }

      backups.value.unshift(backup)
      lastBackup.value = Date.now()

      // 清理旧备份
      while (backups.value.length > config.value.maxBackups) {
        backups.value.pop()
      }

      return backup
    } finally {
      backingUp.value = false
    }
  }

  // 恢复备份
  const restoreBackup = (id: string): any => {
    const backup = backups.value.find(b => b.id === id)
    return backup?.data || null
  }

  // 删除备份
  const deleteBackup = (id: string): boolean => {
    const index = backups.value.findIndex(b => b.id === id)
    if (index > -1) {
      backups.value.splice(index, 1)
      return true
    }
    return false
  }

  // 清空备份
  const clearBackups = () => {
    backups.value = []
  }

  // 更新配置
  const updateConfig = (updates: Partial<BackupConfig>) => {
    Object.assign(config.value, updates)
  }

  // 统计
  const stats = computed(() => ({
    count: backups.value.length,
    totalSize: backups.value.reduce((sum, b) => sum + b.size, 0),
    lastBackup: lastBackup.value,
    enabled: config.value.enabled
  }))

  return { config, backups, lastBackup, backingUp, createBackup, restoreBackup, deleteBackup, clearBackups, updateConfig, stats }
}

export default useAutoBackup
