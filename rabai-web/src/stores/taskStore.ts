// Task Store - 全局任务状态管理
// 替代分散在多个composables中的task状态管理
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { apiClient } from '../api/client'

export type TaskStatus = 'idle' | 'pending' | 'generating' | 'completed' | 'failed'

export interface Task {
  taskId: string
  status: TaskStatus
  title?: string
  slideCount: number
  fileSize?: string
  createdAt?: string
  scene?: string
  style?: string
  error?: string
  progress?: number
}

export interface PreviewSlide {
  index: number
  type: 'title' | 'toc' | 'content' | 'two_column' | 'data_visualization' | 'ending'
  title: string
  subtitle?: string
  items?: string[]
  layout: string
  colors: string[]
  content_preview?: string
  svg_url?: string
}

export const useTaskStore = defineStore('task', () => {
  // State
  const currentTask = ref<Task | null>(null)
  const previewSlides = ref<PreviewSlide[]>([])
  const taskList = ref<Task[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const hasActiveTask = computed(() => currentTask.value !== null)
  const isGenerating = computed(() => currentTask.value?.status === 'generating')
  const isCompleted = computed(() => currentTask.value?.status === 'completed')
  const taskId = computed(() => currentTask.value?.taskId || null)
  const slideCount = computed(() => currentTask.value?.slideCount || 0)

  // Actions
  const setCurrentTask = (task: Task | null) => {
    currentTask.value = task
    if (task) {
      // Add to task list if not exists
      const existingIndex = taskList.value.findIndex(t => t.taskId === task.taskId)
      if (existingIndex >= 0) {
        taskList.value[existingIndex] = task
      } else {
        taskList.value.unshift(task)
      }
    }
  }

  const updateTaskStatus = (taskId: string, status: TaskStatus, extra?: Partial<Task>) => {
    const task = taskList.value.find(t => t.taskId === taskId)
    if (task) {
      task.status = status
      Object.assign(task, extra)
    }
    if (currentTask.value?.taskId === taskId) {
      currentTask.value.status = status
      if (extra) {
        Object.assign(currentTask.value, extra)
      }
    }
  }

  const setPreviewSlides = (slides: PreviewSlide[]) => {
    previewSlides.value = slides
  }

  const updatePreviewSlide = (index: number, slide: Partial<PreviewSlide>) => {
    if (previewSlides.value[index]) {
      previewSlides.value[index] = { ...previewSlides.value[index], ...slide }
    }
  }

  const setLoading = (loading: boolean) => {
    isLoading.value = loading
  }

  const setError = (err: string | null) => {
    error.value = err
  }

  const clearCurrentTask = () => {
    currentTask.value = null
    previewSlides.value = []
    error.value = null
  }

  // Fetch task status from API
  const fetchTaskStatus = async (taskId: string) => {
    try {
      const res = await apiClient.get(`/ppt/task/${taskId}`)
      const data = res.data
      return {
        status: data.status as TaskStatus,
        slideCount: data.slide_count || 0,
        fileSize: data.file_size,
        title: data.title
      }
    } catch (e) {
      console.error('[TaskStore] Failed to fetch task status:', e)
      return null
    }
  }

  // Fetch task preview from API
  const fetchTaskPreview = async (taskId: string) => {
    try {
      const res = await apiClient.get(`/ppt/preview/${taskId}`)
      if (res.data?.slides) {
        previewSlides.value = res.data.slides
      }
      return res.data
    } catch (e) {
      console.error('[TaskStore] Failed to fetch task preview:', e)
      return null
    }
  }

  return {
    // State
    currentTask,
    previewSlides,
    taskList,
    isLoading,
    error,
    // Getters
    hasActiveTask,
    isGenerating,
    isCompleted,
    taskId,
    slideCount,
    // Actions
    setCurrentTask,
    updateTaskStatus,
    setPreviewSlides,
    updatePreviewSlide,
    setLoading,
    setError,
    clearCurrentTask,
    fetchTaskStatus,
    fetchTaskPreview
  }
})
