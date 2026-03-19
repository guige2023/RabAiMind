// useForm.ts - 表单模块
import { ref, reactive, computed } from 'vue'

export interface FormRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  validator?: (value: any) => boolean | string
}

export interface FormRules {
  [key: string]: FormRule[]
}

export function useForm<T extends Record<string, any>>(initialValues: T, rules?: FormRules) {
  const values = reactive({ ...initialValues })
  const errors = reactive<Record<string, string>>({})
  const touched = reactive<Record<string, boolean>>({})

  const validateField = (field: string): boolean => {
    const ruleList = rules?.[field]
    if (!ruleList) return true

    const value = values[field]
    for (const rule of ruleList) {
      if (rule.required && !value) {
        errors[field] = '此字段为必填项'
        return false
      }
      if (rule.minLength && String(value).length < rule.minLength) {
        errors[field] = `最少${rule.minLength}个字符`
        return false
      }
      if (rule.maxLength && String(value).length > rule.maxLength) {
        errors[field] = `最多${rule.maxLength}个字符`
        return false
      }
      if (rule.pattern && !rule.pattern.test(String(value))) {
        errors[field] = '格式不正确'
        return false
      }
      if (rule.validator) {
        const result = rule.validator(value)
        if (result !== true) {
          errors[field] = typeof result === 'string' ? result : '验证失败'
          return false
        }
      }
    }

    errors[field] = ''
    return true
  }

  const validate = (): boolean => {
    let valid = true
    Object.keys(values).forEach(key => {
      touched[key] = true
      if (!validateField(key)) valid = false
    })
    return valid
  }

  const reset = () => {
    Object.assign(values, initialValues)
    Object.keys(errors).forEach(key => errors[key] = '')
    Object.keys(touched).forEach(key => touched[key] = false)
  }

  const setValue = (field: string, value: any) => {
    values[field] = value
    if (touched[field]) validateField(field)
  }

  const isValid = computed(() => Object.values(errors).every(e => !e))

  return { values, errors, touched, validateField, validate, reset, setValue, isValid }
}

export default useForm
