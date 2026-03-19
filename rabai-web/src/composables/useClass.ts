// useClass.ts - 类名模块
import { computed } from 'vue'

export function useClass() {
  const join = (...classes: (string | boolean | undefined | null)[]): string => {
    return classes.filter(c => typeof c === 'string' && c).join(' ')
  }

  const conditional = (condition: boolean, trueClass: string, falseClass = ''): string => {
    return condition ? trueClass : falseClass
  }

  const prefix = (prefix: string, ...classes: string[]): string => {
    return classes.map(c => prefix + c).join(' ')
  }

  return { join, conditional, prefix }
}

export default useClass
