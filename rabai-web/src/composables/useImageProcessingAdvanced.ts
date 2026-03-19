// Image Processing Advanced - 图片处理高级功能
import { ref, computed } from 'vue'

export type ImageEffectType = 'vintage' | 'noir' | 'vivid' | 'warm' | 'cool' | 'dramatic' | 'fade' | 'chrome' | 'process' | 'transfer' | 'threshold'

export interface ImageLayer {
  id: string
  type: 'image' | 'text' | 'shape' | 'filter'
  opacity: number
  blendMode: string
  visible: boolean
  locked: boolean
}

export interface ImageProcessingPipeline {
  id: string
  name: string
  operations: ImageOperation[]
}

export interface ImageOperation {
  type: string
  params: Record<string, any>
  enabled: boolean
}

export function useImageProcessingAdvanced() {
  // 图层管理
  const layers = ref<ImageLayer[]>([])

  // 处理管道
  const pipelines = ref<ImageProcessingPipeline[]>([])

  // 当前管道
  const activePipeline = ref<ImageProcessingPipeline | null>(null)

  // 预设效果
  const effects: Record<ImageEffectType, ImageOperation[]> = {
    vintage: [
      { type: 'sepia', params: { value: 40 }, enabled: true },
      { type: 'contrast', params: { value: 110 }, enabled: true },
      { type: 'brightness', params: { value: 105 }, enabled: true }
    ],
    noir: [
      { type: 'grayscale', params: { value: 100 }, enabled: true },
      { type: 'contrast', params: { value: 150 }, enabled: true }
    ],
    vivid: [
      { type: 'saturate', params: { value: 150 }, enabled: true },
      { type: 'brightness', params: { value: 110 }, enabled: true },
      { type: 'contrast', params: { value: 120 }, enabled: true }
    ],
    warm: [
      { type: 'sepia', params: { value: 20 }, enabled: true },
      { type: 'brightness', params: { value: 105 }, enabled: true },
      { type: 'temperature', params: { value: 30 }, enabled: true }
    ],
    cool: [
      { type: 'brightness', params: { value: 105 }, enabled: true },
      { type: 'temperature', params: { value: -30 }, enabled: true },
      { type: 'saturate', params: { value: 90 }, enabled: true }
    ],
    dramatic: [
      { type: 'contrast', params: { value: 140 }, enabled: true },
      { type: 'brightness', params: { value: 90 }, enabled: true },
      { type: 'saturate', params: { value: 120 }, enabled: true }
    ],
    fade: [
      { type: 'brightness', params: { value: 115 }, enabled: true },
      { type: 'contrast', params: { value: 85 }, enabled: true },
      { type: 'saturate', params: { value: 80 }, enabled: true }
    ],
    chrome: [
      { type: 'grayscale', params: { value: 100 }, enabled: true },
      { type: 'contrast', params: { value: 150 }, enabled: true },
      { type: 'brightness', params: { value: 150 }, enabled: true }
    ],
    process: [
      { type: 'contrast', params: { value: 130 }, enabled: true },
      { type: 'brightness', params: { value: 110 }, enabled: true },
      { type: 'temperature', params: { value: 20 }, enabled: true }
    ],
    transfer: [
      { type: 'sepia', params: { value: 30 }, enabled: true },
      { type: 'contrast', params: { value: 120 }, enabled: true },
      { type: 'saturate', params: { value: 70 }, enabled: true }
    ],
    threshold: [
      { type: 'grayscale', params: { value: 100 }, enabled: true },
      { type: 'threshold', params: { value: 128 }, enabled: true }
    ]
  }

  // 添加图层
  const addLayer = (layer: Omit<ImageLayer, 'id'>) => {
    const newLayer: ImageLayer = {
      ...layer,
      id: `layer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
    layers.value.push(newLayer)
    return newLayer
  }

  // 移除图层
  const removeLayer = (id: string) => {
    layers.value = layers.value.filter(l => l.id !== id)
  }

  // 更新图层
  const updateLayer = (id: string, updates: Partial<ImageLayer>) => {
    const layer = layers.value.find(l => l.id === id)
    if (layer) {
      Object.assign(layer, updates)
    }
  }

  // 调整图层顺序
  const reorderLayers = (fromIndex: number, toIndex: number) => {
    const [removed] = layers.value.splice(fromIndex, 1)
    layers.value.splice(toIndex, 0, removed)
  }

  // 创建处理管道
  const createPipeline = (name: string): ImageProcessingPipeline => {
    const pipeline: ImageProcessingPipeline = {
      id: `pipeline_${Date.now()}`,
      name,
      operations: []
    }
    pipelines.value.push(pipeline)
    return pipeline
  }

  // 添加操作到管道
  const addOperation = (pipelineId: string, operation: ImageOperation) => {
    const pipeline = pipelines.value.find(p => p.id === pipelineId)
    if (pipeline) {
      pipeline.operations.push(operation)
    }
  }

  // 应用预设效果
  const applyEffect = (effect: ImageEffectType): ImageOperation[] => {
    return effects[effect] || []
  }

  // 创建混合效果
  const createBlendMode = (base: string, overlay: string, mode: string): string => {
    // 简化实现，返回CSS混合模式
    return mode
  }

  // 生成滤镜CSS
  const generateFilterCSS = (operations: ImageOperation[]): string => {
    const filters: string[] = []

    operations.filter(o => o.enabled).forEach(op => {
      switch (op.type) {
        case 'brightness':
          filters.push(`brightness(${op.params.value}%)`)
          break
        case 'contrast':
          filters.push(`contrast(${op.params.value}%)`)
          break
        case 'saturate':
          filters.push(`saturate(${op.params.value}%)`)
          break
        case 'grayscale':
          filters.push(`grayscale(${op.params.value}%)`)
          break
        case 'sepia':
          filters.push(`sepia(${op.params.value}%)`)
          break
        case 'blur':
          filters.push(`blur(${op.params.value}px)`)
          break
        case 'hue-rotate':
          filters.push(`hue-rotate(${op.params.value}deg)`)
          break
        case 'invert':
          filters.push(`invert(${op.params.value}%)`)
          break
        case 'opacity':
          filters.push(`opacity(${op.params.value}%)`)
          break
      }
    })

    return filters.join(' ')
  }

  // 智能裁剪建议
  const getSmartCropSuggestions = (width: number, height: number): { ratio: string; name: string }[] => {
    const suggestions = [
      { ratio: '1:1', name: '正方形' },
      { ratio: '4:3', name: '标准' },
      { ratio: '16:9', name: '宽屏' },
      { ratio: '9:16', name: '竖屏' },
      { ratio: '3:2', name: '摄影' },
      { ratio: '2:3', name: '人像' }
    ]

    // 基于宽高比推荐
    const currentRatio = width / height
    return suggestions.map(s => {
      const [w, h] = s.ratio.split(':').map(Number)
      const ratio = w / h
      const diff = Math.abs(currentRatio - ratio)
      return { ...s, score: 100 - diff * 100 }
    }).sort((a, b) => (b.score || 0) - (a.score || 0))
  }

  // 统计
  const stats = computed(() => ({
    layers: layers.value.length,
    visibleLayers: layers.value.filter(l => l.visible).length,
    pipelines: pipelines.value.length,
    effects: Object.keys(effects).length
  }))

  return {
    layers,
    pipelines,
    activePipeline,
    effects,
    stats,
    addLayer,
    removeLayer,
    updateLayer,
    reorderLayers,
    createPipeline,
    addOperation,
    applyEffect,
    createBlendMode,
    generateFilterCSS,
    getSmartCropSuggestions
  }
}

export default useImageProcessingAdvanced
