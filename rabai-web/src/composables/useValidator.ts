// useValidator.ts - 表单验证模块
import { ref, computed } from 'vue'

export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  email?: boolean
  url?: boolean
  custom?: (value: any) => boolean | string
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export interface FieldValidation {
  name: string
  value: any
  rules: ValidationRule
}

export function useValidator() {
  const errors = ref<Record<string, string[]>>({})

  const validate = (field: FieldValidation): ValidationResult => {
    const { name, value, rules } = field
    const fieldErrors: string[] = []

    if (rules.required && (value === undefined || value === null || value === '')) {
      fieldErrors.push(`${name}不能为空`)
    }

    if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
      fieldErrors.push(`${name}最少${rules.minLength}个字符`)
    }

    if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
      fieldErrors.push(`${name}最多${rules.maxLength}个字符`)
    }

    if (rules.email && typeof value === 'string') {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        fieldErrors.push(`${name}格式不正确`)
      }
    }

    if (rules.url && typeof value === 'string') {
      try { new URL(value) } catch {
        fieldErrors.push(`${name}不是有效的URL`)
      }
    }

    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      fieldErrors.push(`${name}格式不正确`)
    }

    if (rules.custom) {
      const result = rules.custom(value)
      if (result !== true) {
        fieldErrors.push(typeof result === 'string' ? result : `${name}验证失败`)
      }
    }

    errors.value[name] = fieldErrors
    return { valid: fieldErrors.length === 0, errors: fieldErrors }
  }

  const validateAll = (fields: FieldValidation[]): boolean => {
    let allValid = true
    fields.forEach(field => {
      if (!validate(field).valid) allValid = false
    })
    return allValid
  }

  const clearError = (name: string) => {
    delete errors.value[name]
  }

  const clearAllErrors = () => {
    errors.value = {}
  }

  const hasError = computed(() => Object.keys(errors.value).length > 0)

  return { errors, validate, validateAll, clearError, clearAllErrors, hasError }
}

export default useValidator
