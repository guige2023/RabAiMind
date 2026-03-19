// useMedia.ts - 媒体统一模块
import { ref, computed } from 'vue'

export interface MediaItem {
  id: string
  type: 'image' | 'video' | 'audio'
  url: string
  name: string
  size: number
}

export interface MediaConfig {
  maxSize: number
  allowedTypes: string[]
  compression: boolean
}

export function useMedia() {
  // 媒体列表
  const items = ref<MediaItem[]>([])

  // 配置
  const config = ref<MediaConfig>({
    maxSize: 10 * 1024 * 1024,
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
    compression: true
  })

  // 上传媒体
  const upload = async (file: File): Promise<MediaItem | null> => {
    // 检查大小
    if (file.size > config.value.maxSize) {
      console.warn('File too large')
      return null
    }

    // 检查类型
    if (!config.value.allowedTypes.includes(file.type)) {
      console.warn('File type not allowed')
      return null
    }

    // 创建URL
    const url = URL.createObjectURL(file)

    const item: MediaItem = {
      id: `media_${Date.now()}`,
      type: file.type.startsWith('image') ? 'image' : file.type.startsWith('video') ? 'video' : 'audio',
      url,
      name: file.name,
      size: file.size
    }

    items.value.push(item)
    return item
  }

  // 删除媒体
  const remove = (id: string) => {
    const index = items.value.findIndex(i => i.id === id)
    if (index > -1) {
      URL.revokeObjectURL(items.value[index].url)
      items.value.splice(index, 1)
    }
  }

  // 获取媒体
  const get = (id: string) => items.value.find(i => i.id === id)

  // 清空
  const clear = () => {
    items.value.forEach(i => URL.revokeObjectURL(i.url))
    items.value = []
  }

  // 更新配置
  const updateConfig = (updates: Partial<MediaConfig>) => {
    Object.assign(config.value, updates)
  }

  return {
    items,
    config,
    upload,
    remove,
    get,
    clear,
    updateConfig
  }
}

export default useMedia
