/**
 * useRemoteControl — WebSocket-based remote control for presentations
 * 
 * Architecture:
 * - Frontend creates a "room" (generates a 6-char code)
 * - Backend maintains WebSocket connections per room
 * - Phone/browser connects via the code and sends control commands
 * - Frontend receives commands and executes navigation actions
 * 
 * The backend is the message broker — no room state stored client-side
 */
import { ref, onUnmounted } from 'vue'

export type RemoteCommand = 
  | 'next_slide' 
  | 'prev_slide' 
  | 'go_slide'     // payload: { slideIndex: number }
  | 'toggle_annotations'
  | 'toggle_laser'
  | 'start_timer'
  | 'pause_timer'
  | 'reset_timer'
  | 'exit'          // 退出演示模式
  | 'ping'          // keepalive
  | 'ack'           // connection acknowledged

export interface RemoteControlOptions {
  roomCode?: string
  wsUrl?: string   // WebSocket server URL (defaults to same host)
  onCommand?: (cmd: RemoteCommand, payload?: any) => void
  onConnected?: () => void
  onDisconnected?: () => void
  onRoomInfo?: (info: { code: string; participantCount: number }) => void
}

export interface RemoteControlResult {
  roomCode: Ref<string | null>
  isConnected: Ref<boolean>
  isHost: Ref<boolean>         // 是否是主持人（创建房间者）
  participantCount: Ref<number>
  error: Ref<string | null>
  connectionState: Ref<'disconnected' | 'connecting' | 'connected' | 'error'>
  createRoom: () => Promise<string>   // 创建房间，返回 room code
  joinRoom: (code: string) => Promise<void>  // 加入已有房间
  leaveRoom: () => void
  sendCommand: (cmd: RemoteCommand, payload?: any) => void
  // 生成可在手机上打开的远程控制URL
  getRemoteURL: (baseUrl: string) => string
}

const DEFAULT_WS_PORT = 8003
const WS_PATH = '/ws/remote'
const RECONNECT_DELAY = 3000
const PING_INTERVAL = 15000

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'  // 避免歧义字符
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export function useRemoteControl(options: RemoteControlOptions = {}): RemoteControlResult {
  const {
    wsUrl,
    onCommand,
    onConnected,
    onDisconnected,
    onRoomInfo,
  } = options

  const roomCode = ref<string | null>(null)
  const isConnected = ref(false)
  const isHost = ref(false)
  const participantCount = ref(0)
  const error = ref<string | null>(null)
  const connectionState = ref<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')

  let ws: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let pingTimer: ReturnType<typeof setInterval> | null = null
  let currentRoomCode: string | null = null

  function getWsUrl(): string {
    if (wsUrl) return wsUrl
    // 默认为当前页面的 ws(s) 版本
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.hostname
    const port = DEFAULT_WS_PORT
    return `${protocol}//${host}:${port}${WS_PATH}`
  }

  function connect(code: string, asHost: boolean = false): Promise<void> {
    return new Promise((resolve, reject) => {
      if (ws) {
        ws.close()
        ws = null
      }

      connectionState.value = 'connecting'
      error.value = null
      const url = `${getWsUrl()}?room=${code}&host=${asHost ? '1' : '0'}`

      try {
        ws = new WebSocket(url)
      } catch (e: any) {
        error.value = 'WebSocket connection failed: ' + e.message
        connectionState.value = 'error'
        reject(e)
        return
      }

      ws.onopen = () => {
        isConnected.value = true
        connectionState.value = 'connected'
        currentRoomCode = code
        roomCode.value = code
        isHost.value = asHost
        onConnected?.()

        // 启动 ping 心跳
        pingTimer = setInterval(() => {
          if (ws?.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' }))
          }
        }, PING_INTERVAL)
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          switch (msg.type) {
            case 'ack':
              participantCount.value = msg.participantCount || 1
              onRoomInfo?.({ code: msg.room || currentRoomCode!, participantCount: participantCount.value })
              break

            case 'participant_count':
              participantCount.value = msg.count || 0
              break

            case 'command':
              onCommand?.(msg.command, msg.payload)
              break

            case 'pong':
              // keepalive response
              break

            case 'error':
              error.value = msg.message || 'Server error'
              break

            case 'room_closed':
              error.value = 'Room closed by host'
              leaveRoom()
              break
          }
        } catch (e) {
          console.warn('[useRemoteControl] Failed to parse message:', event.data)
        }
      }

      ws.onerror = () => {
        error.value = 'WebSocket connection error'
        connectionState.value = 'error'
      }

      ws.onclose = () => {
        isConnected.value = false
        connectionState.value = 'disconnected'
        onDisconnected?.()

        if (pingTimer) {
          clearInterval(pingTimer)
          pingTimer = null
        }

        // 非主动断开时尝试重连（仅主持人）
        if (currentRoomCode && isHost.value && connectionState.value !== 'disconnected') {
          reconnectTimer = setTimeout(() => {
            if (currentRoomCode) {
              connect(currentRoomCode, true).catch(() => {})
            }
          }, RECONNECT_DELAY)
        }
      }

      // Wait for ack
      const ackTimeout = setTimeout(() => {
        if (connectionState.value === 'connecting') {
          error.value = 'Connection timeout'
          connectionState.value = 'error'
          ws?.close()
          reject(new Error('Connection timeout'))
        }
      }, 5000)

      // Override onopen to resolve
      const originalOnOpen = ws.onopen
      ws.onopen = () => {
        originalOnOpen?.()
        clearTimeout(ackTimeout)
        resolve()
      }
    })
  }

  async function createRoom(): Promise<string> {
    const code = generateRoomCode()
    await connect(code, true)
    return code
  }

  async function joinRoom(code: string): Promise<void> {
    if (!code || code.length !== 6) {
      throw new Error('Invalid room code (must be 6 characters)')
    }
    await connect(code.toUpperCase(), false)
  }

  function leaveRoom() {
    currentRoomCode = null
    roomCode.value = null
    isHost.value = false
    participantCount.value = 0

    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    if (pingTimer) {
      clearInterval(pingTimer)
      pingTimer = null
    }
    if (ws) {
      ws.close()
      ws = null
    }
    isConnected.value = false
    connectionState.value = 'disconnected'
  }

  function sendCommand(cmd: RemoteCommand, payload?: any) {
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn('[useRemoteControl] Not connected, cannot send command:', cmd)
      return
    }
    ws.send(JSON.stringify({ type: 'command', command: cmd, payload }))
  }

  function getRemoteURL(baseUrl: string): string {
    if (!roomCode.value) return ''
    // 返回手机端使用的远程控制页面URL
    return `${baseUrl}/remote?room=${roomCode.value}`
  }

  onUnmounted(() => {
    leaveRoom()
  })

  return {
    roomCode,
    isConnected,
    isHost,
    participantCount,
    error,
    connectionState,
    createRoom,
    joinRoom,
    leaveRoom,
    sendCommand,
    getRemoteURL,
  }
}
