// Pinia Stores - 统一导出
export { useTaskStore } from './taskStore'
export { useTemplateStore } from './templateStore'
export { useUserStore } from './userStore'
export { useSettingsStore } from './settingsStore'

// Re-export types
export type { Task, TaskStatus, PreviewSlide } from './taskStore'
export type { Template, Category, Style } from './templateStore'
export type { User } from './userStore'
export type { AppSettings } from './settingsStore'
