// useTick.ts - 帧更新模块
import { ref, onMounted } from 'vue'

export function useTick() {
  const frame = ref(0)
  let id: number

  const loop = () => {
    frame.value++
    id = requestAnimationFrame(loop)
  }

  onMounted(() => { id = requestAnimationFrame(loop) })

  return { frame }
}

export default useTick
