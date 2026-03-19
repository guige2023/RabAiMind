// usePortal.ts - 传送门模块
import { ref, onMounted, onUnmounted, createApp, h } from 'vue'

export function usePortal() {
  const container = ref<HTMLElement | null>(null)

  const render = (component: any, props = {}) => {
    if (!container.value) {
      container.value = document.createElement('div')
      document.body.appendChild(container.value)
    }

    const app = createApp(component, props)
    app.mount(container.value)
    return () => app.unmount()
  }

  const remove = () => {
    if (container.value) {
      container.value.remove()
      container.value = null
    }
  }

  onUnmounted(remove)

  return { container, render, remove }
}

export default usePortal
