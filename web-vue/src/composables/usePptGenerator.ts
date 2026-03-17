/**
 * PPT 生成器 Composable
 *
 * 提供 PPT 生成的状态管理和业务流程
 * 使用 Vue3 Composition API
 */

import { ref, computed, onUnmounted } from 'vue'
import type { Ref } from 'vue'
import {
  pptApi,
  pollTaskStatus,
  downloadBlob
} from '../api'
import type {
  GenerateRequest,
  TaskStatusResponse,
  TaskState,
  TaskError,
  ValidationError,
  SceneType,
  StyleType,
  TemplateType
} from '../types'

/**
 * PPT 生成器 Composable
 *
 * @example
 * ```ts
 * const {
 *   formState,
 *   taskState,
 *   isGenerating,
 *   error,
 *   generatePpt,
 *   cancelTask,
 *   downloadPpt
 * } = usePptGenerator()
 * ```
 */
export function usePptGenerator() {
  // ==================== 响应式状态 ====================

  /** 表单状态 */
  const formState: Ref<{
    userRequest: string
    slideCount: number
    scene: SceneType
    style: StyleType
    template: TemplateType
    themeColor: string
  }> = ref({
    userRequest: '',
    slideCount: 10,
    scene: 'business',
    style: 'professional',
    template: 'default',
    themeColor: '#165DFF'
  })

  /** 任务状态 */
  const taskState: Ref<TaskState> = ref({
    taskId: null,
    status: 'pending',
    progress: 0,
    currentStep: '',
    result: null,
    error: null
  })

  /** 验证错误 */
  const validationErrors: Ref<ValidationError[]> = ref([])

  /** 全局错误 */
  const error: Ref<TaskError | null> = ref(null)

  /** 轮询定时器 */
  let pollTimer: ReturnType<typeof setInterval> | null = null

  // ==================== 计算属性 ====================

  /** 是否正在生成 */
  const isGenerating = computed(() =>
    taskState.value.status === 'pending' ||
    taskState.value.status === 'processing'
  )

  /** 是否已完成 */
  const isCompleted = computed(() =>
    taskState.value.status === 'completed'
  )

  /** 是否失败 */
  const isFailed = computed(() =>
    taskState.value.status === 'failed'
  )

  /** 表单是否有效 */
  const isFormValid = computed(() => {
    const { userRequest } = formState.value
    return userRequest.length >= 10 && userRequest.length <= 2000
  })

  // ==================== 方法 ====================

  /**
   * 验证表单
   * @returns 是否验证通过
   */
  function validateForm(): boolean {
    validationErrors.value = []
    const { userRequest } = formState.value

    if (!userRequest || userRequest.trim().length === 0) {
      validationErrors.value.push({
        field: 'userRequest',
        message: '请输入 PPT 需求描述'
      })
    } else if (userRequest.length < 10) {
      validationErrors.value.push({
        field: 'userRequest',
        message: '需求描述至少需要 10 个字符'
      })
    } else if (userRequest.length > 2000) {
      validationErrors.value.push({
        field: 'userRequest',
        message: '需求描述不能超过 2000 个字符'
      })
    }

    return validationErrors.value.length === 0
  }

  /**
   * 提交生成任务
   * @returns 是否提交成功
   */
  async function generatePpt(): Promise<boolean> {
    // 验证表单
    if (!validateForm()) {
      return false
    }

    // 重置状态
    error.value = null
    taskState.value = {
      taskId: null,
      status: 'pending',
      progress: 0,
      currentStep: '',
      result: null,
      error: null
    }

    try {
      // 构建请求参数
      const request: GenerateRequest = {
        user_request: formState.value.userRequest,
        slide_count: formState.value.slideCount,
        scene: formState.value.scene,
        style: formState.value.style,
        template: formState.value.template,
        theme_color: formState.value.themeColor
      }

      // 提交任务
      const response = await pptApi.generate(request)

      // 更新任务状态
      taskState.value.taskId = response.task_id
      taskState.value.status = response.status

      // 开始轮询
      startPolling(response.task_id)

      return true
    } catch (err: any) {
      error.value = {
        code: err.code || 'GENERATE_ERROR',
        message: err.message || '提交任务失败',
        details: err.details
      }
      taskState.value.status = 'failed'
      return false
    }
  }

  /**
   * 开始轮询任务状态
   * @param taskId - 任务 ID
   */
  function startPolling(taskId: string) {
    // 清除之前的定时器
    if (pollTimer) {
      clearInterval(pollTimer)
    }

    // 开始轮询
    pollTimer = setInterval(async () => {
      try {
        const status = await pptApi.getTaskStatus(taskId)
        updateTaskStatus(status)
      } catch (err) {
        console.error('轮询任务状态失败:', err)
      }
    }, 2000)
  }

  /**
   * 更新任务状态
   * @param status - 任务状态响应
   */
  function updateTaskStatus(status: TaskStatusResponse) {
    taskState.value.status = status.status
    taskState.value.progress = status.progress
    taskState.value.currentStep = status.current_step

    // 完成后清除轮询
    if (status.status === 'completed') {
      taskState.value.result = status.result || null
      stopPolling()
    }

    // 失败后清除轮询
    if (status.status === 'failed') {
      taskState.value.error = status.error || null
      error.value = status.error || null
      stopPolling()
    }
  }

  /**
   * 停止轮询
   */
  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
    }
  }

  /**
   * 取消任务
   * @returns 是否取消成功
   */
  async function cancelTask(): Promise<boolean> {
    if (!taskState.value.taskId) {
      return false
    }

    try {
      await pptApi.cancelTask(taskState.value.taskId)
      taskState.value.status = 'cancelled'
      stopPolling()
      return true
    } catch (err: any) {
      error.value = {
        code: err.code || 'CANCEL_ERROR',
        message: err.message || '取消任务失败'
      }
      return false
    }
  }

  /**
   * 下载 PPT
   * @param filename - 文件名
   */
  async function downloadPpt(filename?: string): Promise<boolean> {
    if (!taskState.value.taskId) {
      return false
    }

    try {
      const blob = await pptApi.downloadPpt(taskState.value.taskId)
      const name = filename || `presentation_${taskState.value.taskId}.pptx`
      downloadBlob(blob, name)
      return true
    } catch (err: any) {
      error.value = {
        code: err.code || 'DOWNLOAD_ERROR',
        message: err.message || '下载失败'
      }
      return false
    }
  }

  /**
   * 重置表单
   */
  function resetForm() {
    formState.value = {
      userRequest: '',
      slideCount: 10,
      scene: 'business',
      style: 'professional',
      template: 'default',
      themeColor: '#165DFF'
    }
    validationErrors.value = []
  }

  /**
   * 重置任务状态
   */
  function resetTask() {
    stopPolling()
    taskState.value = {
      taskId: null,
      status: 'pending',
      progress: 0,
      currentStep: '',
      result: null,
      error: null
    }
  }

  // ==================== 生命周期 ====================

  // 组件卸载时清除定时器
  onUnmounted(() => {
    stopPolling()
  })

  // ==================== 返回值 ====================

  return {
    // 状态
    formState,
    taskState,
    validationErrors,
    error,

    // 计算属性
    isGenerating,
    isCompleted,
    isFailed,
    isFormValid,

    // 方法
    validateForm,
    generatePpt,
    cancelTask,
    downloadPpt,
    resetForm,
    resetTask,
    updateTaskStatus
  }
}
