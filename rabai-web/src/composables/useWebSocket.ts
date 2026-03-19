// useWebSocket.ts - WebSocket模块
import { ref, onUnmounted } from 'vue'

export function useWebSocket(url: string) {
  const socket = ref<WebSocket | null>(null)
  const isConnected = ref(false)
  const message = ref<any>(null)

  const connect = () => {
    socket.value = new WebSocket(url)
    socket.value.onopen = () => { isConnected.value = true }
    socket.value.onclose = () => { isConnected.value = false }
    socket.value.onmessage = (e) => { message.value = e.data }
  }

  const send = (data: any) => {
    socket.value?.send(typeof data === 'string' ? data : JSON.stringify(data))
  }

  const close = () => { socket.value?.close() }

  onUnmounted(close)

  return { socket, isConnected, message, connect, send, close }
}

export default useWebSocket
