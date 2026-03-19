// useClick.ts - 单次点击模块
import { ref, onMounted, onUnmounted } from 'vue'

export function useClick(elRef: any, callback: () => void, delay = 300) {
  const clicked = ref(false)
  let timer: ReturnType<typeof setTimeout> | null = null

  const handleClick = () => {
    if (clicked.value) {
      callback()
      clicked.value = false
    } else {
      clicked.value = true
      timer = setTimeout(() => { clicked.value = false }, delay)
    }
  }

  onMounted(() => {
    elRef.value?.addEventListener('click', handleClick)
  })

  onUnmounted(() => {
    elRef.value?.removeEventListener('click', handleClick)
    timer && clearTimeout(timer)
  })
}

export function useDoubleClick(elRef: any, callback: () => void) {
  const handleClick = () => {
    callback()
  }

  onMounted(() => {
    elRef.value?.addEventListener('dblclick', handleClick)
  })

  onUnmounted(() => {
    elRef.value?.removeEventListener('dblclick', handleClick)
  })
}

export default useClick
