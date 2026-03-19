// useSteps.ts - 步骤管理模块
import { ref, computed } from 'vue'

export interface Step {
  key: string
  title: string
  description?: string
  status?: 'wait' | 'process' | 'finish' | 'error'
}

export function useSteps(steps: Step[] = [], initialStep = 0) {
  const currentStep = ref(initialStep)

  const total = computed(() => steps.length)
  const isFirst = computed(() => currentStep.value === 0)
  const isLast = computed(() => currentStep.value === steps.length - 1)

  const next = () => {
    if (!isLast.value) currentStep.value++
  }

  const prev = () => {
    if (!isFirst.value) currentStep.value--
  }

  const goTo = (index: number) => {
    if (index >= 0 && index < steps.length) {
      currentStep.value = index
    }
  }

  const reset = () => {
    currentStep.value = 0
  }

  const getStepStatus = (index: number): 'wait' | 'process' | 'finish' | 'error' => {
    if (index < currentStep.value) return 'finish'
    if (index === currentStep.value) return 'process'
    return 'wait'
  }

  return { currentStep, total, isFirst, isLast, next, prev, goTo, reset, getStepStatus }
}

export default useSteps
