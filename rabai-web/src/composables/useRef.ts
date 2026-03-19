// useRef.ts - Ref 模块
import { ref, Ref } from 'vue'

export function useRef<T>(initial?: T) {
  return { ref: ref<T>(initial) as Ref<T> }
}

export default useRef
