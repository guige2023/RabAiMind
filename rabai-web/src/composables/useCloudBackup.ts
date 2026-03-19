// Cloud backup utility - export/import data

export interface BackupData {
  version: string
  exportedAt: string
  data: {
    history: any[]
    favorites: any[]
    statistics: any
    settings: Record<string, string>
  }
}

const BACKUP_VERSION = '1.0'

// Export all app data to JSON file
export const exportBackup = (): void => {
  try {
    // Collect all data
    const history = JSON.parse(localStorage.getItem('ppt_history') || '[]')
    const statistics = localStorage.getItem('ppt_statistics')
    const theme = localStorage.getItem('theme')
    const lang = localStorage.getItem('lang')

    const settings: Record<string, string> = {}
    if (theme) settings.theme = theme
    if (lang) settings.lang = lang

    // Filter favorites from history
    const favorites = history.filter((h: any) => h.favorite)

    const backup: BackupData = {
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      data: {
        history,
        favorites,
        statistics: statistics ? JSON.parse(statistics) : null,
        settings
      }
    }

    // Create and download file
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rabai-mind-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Export failed:', error)
    throw new Error('导出失败')
  }
}

// Import data from JSON file
export const importBackup = async (file: File): Promise<{ success: boolean; message: string }> => {
  try {
    const text = await file.text()
    const backup: BackupData = JSON.parse(text)

    // Validate backup format
    if (!backup.version || !backup.data) {
      return { success: false, message: '无效的备份文件格式' }
    }

    // Import history
    if (backup.data.history && Array.isArray(backup.data.history)) {
      const currentHistory = JSON.parse(localStorage.getItem('ppt_history') || '[]')
      const mergedHistory = [...backup.data.history, ...currentHistory]
      // Deduplicate by taskId
      const uniqueHistory = mergedHistory.filter((item: any, index: number, self: any[]) =>
        index === self.findIndex((h: any) => h.taskId === item.taskId)
      )
      // Keep only last 20
      localStorage.setItem('ppt_history', JSON.stringify(uniqueHistory.slice(0, 20)))
    }

    // Import statistics
    if (backup.data.statistics) {
      localStorage.setItem('ppt_statistics', JSON.stringify(backup.data.statistics))
    }

    // Import settings
    if (backup.data.settings) {
      Object.entries(backup.data.settings).forEach(([key, value]) => {
        localStorage.setItem(key, value as string)
      })
    }

    return { success: true, message: '数据导入成功' }
  } catch (error) {
    console.error('Import failed:', error)
    return { success: false, message: '导入失败，请检查文件格式' }
  }
}

// Auto backup to localStorage (keeps last 3 backups)
export const autoBackup = (): void => {
  const backupKey = 'ppt_auto_backups'
  const history = localStorage.getItem('ppt_history')
  if (!history) return

  try {
    const backups = JSON.parse(localStorage.getItem(backupKey) || '[]')

    // Add current backup
    backups.unshift({
      date: new Date().toISOString(),
      history: JSON.parse(history)
    })

    // Keep only last 3
    const trimmed = backups.slice(0, 3)
    localStorage.setItem(backupKey, JSON.stringify(trimmed))
  } catch (e) {
    console.warn('Auto backup failed:', e)
  }
}
