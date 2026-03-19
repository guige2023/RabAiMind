// Cloud sync composable - 云同步功能
import { ref, computed, watch, onMounted } from 'vue'

export interface SyncItem {
  id: string
  key: string
  value: any
  timestamp: number
  synced: boolean
}

export interface SyncStatus {
  lastSyncTime: number | null
  isSyncing: boolean
  syncError: string | null
  pendingChanges: number
}

export interface CloudSyncConfig {
  autoSync: boolean
  syncInterval: number // 毫秒
  maxRetries: number
  encryptData: boolean
}

const DEFAULT_CONFIG: CloudSyncConfig = {
  autoSync: true,
  syncInterval: 30000, // 30秒
  maxRetries: 3,
  encryptData: false
}

// 本地存储键前缀
const SYNC_PREFIX = 'sync_'
const SYNC_META_KEY = 'sync_metadata'

export function useCloudSync() {
  // 同步状态
  const syncStatus = ref<SyncStatus>({
    lastSyncTime: null,
    isSyncing: false,
    syncError: null,
    pendingChanges: 0
  })

  // 同步配置
  const config = ref<CloudSyncConfig>({ ...DEFAULT_CONFIG })

  // 同步队列
  const syncQueue = ref<SyncItem[]>([])

  // 同步历史记录
  const syncHistory = ref<{ timestamp: number; action: string; success: boolean }[]>([])

  // 加载配置
  const loadConfig = () => {
    try {
      const saved = localStorage.getItem('cloud_sync_config')
      if (saved) {
        config.value = { ...DEFAULT_CONFIG, ...JSON.parse(saved) }
      }
    } catch {
      // 使用默认配置
    }
  }

  // 保存配置
  const saveConfig = () => {
    try {
      localStorage.setItem('cloud_sync_config', JSON.stringify(config.value))
    } catch {
      // 忽略错误
    }
  }

  // 加载同步元数据
  const loadSyncMeta = (): Record<string, SyncItem> => {
    try {
      const saved = localStorage.getItem(SYNC_META_KEY)
      if (saved) {
        return JSON.parse(saved)
      }
    } catch {
      // 忽略错误
    }
    return {}
  }

  // 保存同步元数据
  const saveSyncMeta = (meta: Record<string, SyncItem>) => {
    try {
      localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta))
    } catch {
      // 忽略错误
    }
  }

  // 存储数据（带同步标记）
  const setItem = (key: string, value: any): void => {
    const syncKey = `${SYNC_PREFIX}${key}`
    const item: SyncItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      key,
      value,
      timestamp: Date.now(),
      synced: false
    }

    // 存储到本地
    try {
      localStorage.setItem(syncKey, JSON.stringify(value))

      // 添加到同步队列
      const existingIndex = syncQueue.value.findIndex(i => i.key === key)
      if (existingIndex >= 0) {
        syncQueue.value[existingIndex] = item
      } else {
        syncQueue.value.push(item)
      }

      // 更新待同步数量
      syncStatus.value.pendingChanges = syncQueue.value.length

      // 更新元数据
      const meta = loadSyncMeta()
      meta[key] = item
      saveSyncMeta(meta)

      // 自动同步
      if (config.value.autoSync && !syncStatus.value.isSyncing) {
        syncToCloud()
      }
    } catch (e) {
      console.error('Failed to save to localStorage:', e)
    }
  }

  // 获取数据
  const getItem = <T>(key: string, defaultValue?: T): T | undefined => {
    const syncKey = `${SYNC_PREFIX}${key}`
    try {
      const saved = localStorage.getItem(syncKey)
      if (saved) {
        return JSON.parse(saved) as T
      }
    } catch {
      // 忽略错误
    }
    return defaultValue
  }

  // 删除数据
  const removeItem = (key: string): void => {
    const syncKey = `${SYNC_PREFIX}${key}`
    try {
      localStorage.removeItem(syncKey)

      // 从队列中移除
      syncQueue.value = syncQueue.value.filter(i => i.key !== key)
      syncStatus.value.pendingChanges = syncQueue.value.length

      // 更新元数据
      const meta = loadSyncMeta()
      delete meta[key]
      saveSyncMeta(meta)
    } catch {
      // 忽略错误
    }
  }

  // 同步到云端（模拟）
  const syncToCloud = async (): Promise<boolean> => {
    if (syncStatus.value.isSyncing) {
      return false
    }

    syncStatus.value.isSyncing = true
    syncStatus.value.syncError = null

    let retries = 0
    let success = false

    while (retries < config.value.maxRetries && !success) {
      try {
        // 模拟云端同步请求
        await new Promise(resolve => setTimeout(resolve, 500))

        // 模拟成功（90%概率）
        if (Math.random() > 0.1) {
          // 标记所有待同步项为已同步
          const meta = loadSyncMeta()
          syncQueue.value.forEach(item => {
            item.synced = true
            if (meta[item.key]) {
              meta[item.key].synced = true
            }
          })
          saveSyncMeta(meta)

          // 清空队列
          syncQueue.value = []
          syncStatus.value.pendingChanges = 0
          syncStatus.value.lastSyncTime = Date.now()

          // 记录历史
          syncHistory.value.unshift({
            timestamp: Date.now(),
            action: 'sync',
            success: true
          })

          success = true
        } else {
          throw new Error('Sync failed')
        }
      } catch (e) {
        retries++
        if (retries >= config.value.maxRetries) {
          syncStatus.value.syncError = '同步失败，请检查网络'
          syncHistory.value.unshift({
            timestamp: Date.now(),
            action: 'sync',
            success: false
          })
        }
      }
    }

    syncStatus.value.isSyncing = false
    return success
  }

  // 从云端同步（模拟）
  const syncFromCloud = async (): Promise<boolean> => {
    if (syncStatus.value.isSyncing) {
      return false
    }

    syncStatus.value.isSyncing = true

    try {
      // 模拟从云端拉取
      await new Promise(resolve => setTimeout(resolve, 500))

      // 这里应该是实际的API调用
      // const response = await fetch('/api/sync/ pull')

      syncStatus.value.lastSyncTime = Date.now()
      syncHistory.value.unshift({
        timestamp: Date.now(),
        action: 'pull',
        success: true
      })

      return true
    } catch (e) {
      syncStatus.value.syncError = '拉取失败'
      syncHistory.value.unshift({
        timestamp: Date.now(),
        action: 'pull',
        success: false
      })
      return false
    } finally {
      syncStatus.value.isSyncing = false
    }
  }

  // 强制同步
  const forceSync = async (): Promise<boolean> => {
    // 先上传本地更改
    await syncToCloud()
    // 再拉取云端更改
    return await syncFromCloud()
  }

  // 获取同步状态文本
  const syncStatusText = computed(() => {
    if (syncStatus.value.isSyncing) {
      return '同步中...'
    }
    if (syncStatus.value.syncError) {
      return syncStatus.value.syncError
    }
    if (syncStatus.value.pendingChanges > 0) {
      return `${syncStatus.value.pendingChanges} 项待同步`
    }
    if (syncStatus.value.lastSyncTime) {
      const time = new Date(syncStatus.value.lastSyncTime)
      const now = new Date()
      const diff = now.getTime() - time.getTime()

      if (diff < 60000) {
        return '刚刚同步'
      } else if (diff < 3600000) {
        return `${Math.floor(diff / 60000)} 分钟前同步`
      } else if (diff < 86400000) {
        return `${Math.floor(diff / 3600000)} 小时前同步`
      } else {
        return time.toLocaleDateString()
      }
    }
    return '未同步'
  })

  // 获取同步状态颜色
  const syncStatusColor = computed(() => {
    if (syncStatus.value.isSyncing) {
      return '#165DFF'
    }
    if (syncStatus.value.syncError) {
      return '#FF3B30'
    }
    if (syncStatus.value.pendingChanges > 0) {
      return '#FF9500'
    }
    return '#00C850'
  })

  // 清除所有同步数据
  const clearAllSyncData = () => {
    try {
      const keysToRemove: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(SYNC_PREFIX)) {
          keysToRemove.push(key)
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key))

      syncQueue.value = []
      syncStatus.value = {
        lastSyncTime: null,
        isSyncing: false,
        syncError: null,
        pendingChanges: 0
      }
      localStorage.removeItem(SYNC_META_KEY)
    } catch {
      // 忽略错误
    }
  }

  // 初始化
  loadConfig()

  // 定期自动同步
  let syncInterval: number | null = null
  onMounted(() => {
    if (config.value.autoSync) {
      syncInterval = window.setInterval(() => {
        if (syncQueue.value.length > 0 && !syncStatus.value.isSyncing) {
          syncToCloud()
        }
      }, config.value.syncInterval)
    }
  })

  return {
    config,
    syncStatus,
    syncQueue,
    syncHistory,
    syncStatusText,
    syncStatusColor,
    setItem,
    getItem,
    removeItem,
    syncToCloud,
    syncFromCloud,
    forceSync,
    loadConfig,
    saveConfig,
    clearAllSyncData
  }
}

export default useCloudSync
