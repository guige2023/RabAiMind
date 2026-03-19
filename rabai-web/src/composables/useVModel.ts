// useVModel.ts - 双向绑定模块
import { ref, computed } from 'vue'

export function useVModel<T>(props: any, name: string, emit: Function) {
  const data = ref(props[name])
  const value = computed({
    get: () => props[name],
    set: (val) => emit(`update:${name}`, val)
  })
  return value
}

export default useVModel
