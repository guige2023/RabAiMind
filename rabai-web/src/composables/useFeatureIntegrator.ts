// Feature Integrator - 功能集成与协调器
// 统一管理各功能模块间的通信和协调
import { ref, computed, reactive, provide, inject } from 'vue'

// ============================================
// 类型定义
// ============================================

export interface FeatureModule {
  id: string
  name: string
  status: 'idle' | 'active' | 'error'
  priority: number
  dependencies: string[]
}

export interface ModuleEvent {
  id: string
  source: string
  target: string
  type: string
  payload: any
  timestamp: number
}

export interface FeatureConfig {
  autoInit: boolean
  enableLogging: boolean
  eventBufferSize: number
  maxRetries: number
}

// ============================================
// 核心功能
// ============================================

const eventBus = ref<ModuleEvent[]>([])
const moduleRegistry = ref<Map<string, FeatureModule>>(new Map())
const pendingEvents = ref<ModuleEvent[]>([])

const config = reactive<FeatureConfig>({
  autoInit: true,
  enableLogging: false,
  eventBufferSize: 100,
  maxRetries: 3
})

// 注册模块
const registerModule = (module: FeatureModule): void => {
  moduleRegistry.value.set(module.id, module)
}

// 注销模块
const unregisterModule = (moduleId: string): boolean => {
  return moduleRegistry.value.delete(moduleId)
}

// 获取模块
const getModule = (moduleId: string): FeatureModule | undefined => {
  return moduleRegistry.value.get(moduleId)
}

// 获取所有模块
const getAllModules = (): FeatureModule[] => {
  return Array.from(moduleRegistry.value.values())
}

// 发送事件
const sendEvent = (source: string, target: string, type: string, payload?: any): void => {
  const event: ModuleEvent = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    source,
    target,
    type,
    payload,
    timestamp: Date.now()
  }

  // 添加到事件总线
  eventBus.value.push(event)

  // 限制事件数量
  if (eventBus.value.length > config.eventBufferSize) {
    eventBus.value.shift()
  }

  // 立即处理事件
  processEvent(event)
}

// 处理事件
const processEvent = (event: ModuleEvent): void => {
  // 记录日志
  if (config.enableLogging) {
    console.log(`[FeatureIntegrator] Event: ${event.type} from ${event.source} to ${event.target}`, event.payload)
  }

  // 触发回调
  const handlers = eventHandlers.value.get(event.type) || []
  handlers.forEach(handler => {
    try {
      handler(event)
    } catch (error) {
      console.error(`[FeatureIntegrator] Handler error:`, error)
    }
  })
}

// 事件处理器
const eventHandlers = ref<Map<string, Array<(event: ModuleEvent) => void>>>(new Map())

// 订阅事件
const subscribe = (eventType: string, handler: (event: ModuleEvent) => void): () => void => {
  const handlers = eventHandlers.value.get(eventType) || []
  handlers.push(handler)
  eventHandlers.value.set(eventType, handlers)

  // 返回取消订阅函数
  return () => {
    const current = eventHandlers.value.get(eventType) || []
    const index = current.indexOf(handler)
    if (index > -1) {
      current.splice(index, 1)
    }
  }
}

// 获取事件历史
const getEventHistory = (limit = 50): ModuleEvent[] => {
  return eventBus.value.slice(-limit)
}

// 获取模块事件
const getModuleEvents = (moduleId: string): ModuleEvent[] => {
  return eventBus.value.filter(e => e.source === moduleId || e.target === moduleId)
}

// 清空事件
const clearEvents = (): void => {
  eventBus.value = []
  pendingEvents.value = []
}

// 更新配置
const updateConfig = (updates: Partial<FeatureConfig>): void => {
  Object.assign(config, updates)
}

// 初始化模块
const initializeModules = async (): Promise<void> => {
  const modules = getAllModules()

  // 按优先级排序
  modules.sort((a, b) => b.priority - a.priority)

  // 初始化
  for (const module of modules) {
    try {
      module.status = 'active'
    } catch (error) {
      module.status = 'error'
      console.error(`[FeatureIntegrator] Failed to init module: ${module.id}`, error)
    }
  }
}

// 检查依赖
const checkDependencies = (moduleId: string): { satisfied: boolean; missing: string[] } => {
  const module = getModule(moduleId)
  if (!module) {
    return { satisfied: false, missing: [moduleId] }
  }

  const missing: string[] = []

  for (const depId of module.dependencies) {
    const dep = getModule(depId)
    if (!dep || dep.status !== 'active') {
      missing.push(depId)
    }
  }

  return { satisfied: missing.length === 0, missing }
}

// 统计信息
const stats = computed(() => ({
  registeredModules: moduleRegistry.value.size,
  totalEvents: eventBus.value.length,
  pendingEvents: pendingEvents.value.length,
  config: { ...config }
}))

// 导出 composable
export function useFeatureIntegrator() {
  return {
    // 配置
    config,

    // 模块管理
    registerModule,
    unregisterModule,
    getModule,
    getAllModules,
    checkDependencies,
    initializeModules,

    // 事件系统
    sendEvent,
    subscribe,
    getEventHistory,
    getModuleEvents,
    clearEvents,

    // 配置
    updateConfig,

    // 统计
    stats
  }
}

// ============================================
// 预设功能模块
// ============================================

// PPT生成模块
export const registerPPTGenerationModule = () => {
  useFeatureIntegrator().registerModule({
    id: 'ppt_generation',
    name: 'PPT生成',
    status: 'idle',
    priority: 10,
    dependencies: ['ai_chat', 'template_matcher']
  })
}

// 编辑模块
export const registerEditingModule = () => {
  useFeatureIntegrator().registerModule({
    id: 'editing',
    name: '编辑',
    status: 'idle',
    priority: 20,
    dependencies: []
  })
}

// 导出模块
export const registerExportModule = () => {
  useFeatureIntegrator().registerModule({
    id: 'export',
    name: '导出',
    status: 'idle',
    priority: 5,
    dependencies: ['ppt_generation']
  })
}

// 预设初始化
export const initializeDefaultModules = () => {
  registerPPTGenerationModule()
  registerEditingModule()
  registerExportModule()
}

export default useFeatureIntegrator
