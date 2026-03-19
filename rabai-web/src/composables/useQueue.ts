// useQueue.ts - 队列模块
import { ref } from 'vue'

export function useQueue<T>(maxLength = 0) {
  const queue = ref<T[]>([])

  const enqueue = (item: T) => {
    if (maxLength > 0 && queue.value.length >= maxLength) {
      queue.value.shift()
    }
    queue.value.push(item)
  }

  const dequeue = (): T | undefined => queue.value.shift()

  const front = (): T | undefined => queue.value[0]

  const rear = (): T | undefined => queue.value[queue.value.length - 1]

  const clear = () => { queue.value = [] }

  const size = () => queue.value.length

  const isEmpty = () => queue.value.length === 0

  const isFull = () => maxLength > 0 && queue.value.length >= maxLength

  return { queue, enqueue, dequeue, front, rear, clear, size, isEmpty, isFull }
}

export default useQueue
