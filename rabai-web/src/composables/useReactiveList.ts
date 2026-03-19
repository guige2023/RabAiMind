// useReactiveList.ts - 响应式列表模块
import { reactive, computed } from 'vue'

export function useReactiveList<T>(initial: T[] = []) {
  const list = reactive<T[]>([...initial])

  const push = (...items: T[]) => {
    list.push(...items)
  }

  const pop = (): T | undefined => {
    return list.pop()
  }

  const shift = (): T | undefined => {
    return list.shift()
  }

  const unshift = (...items: T[]) => {
    list.unshift(...items)
  }

  const splice = (start: number, deleteCount?: number, ...items: T[]) => {
    return list.splice(start, deleteCount, ...items)
  }

  const reverse = () => {
    list.reverse()
  }

  const sort = (compareFn?: (a: T, b: T) => number) => {
    list.sort(compareFn)
  }

  const clear = () => {
    list.splice(0, list.length)
  }

  const length = computed(() => list.length)

  const isEmpty = computed(() => list.length === 0)

  const first = computed(() => list[0])

  const last = computed(() => list[list.length - 1])

  return {
    list,
    push,
    pop,
    shift,
    unshift,
    splice,
    reverse,
    sort,
    clear,
    length,
    isEmpty,
    first,
    last
  }
}

export default useReactiveList
