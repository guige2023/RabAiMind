/**
 * useHandGesture — Webcam-based hand gesture recognition for presentation control
 * Uses MediaPipe Hands to detect air gestures and map them to slide navigation
 * 
 * Gestures:
 * - Open palm (stop/pause)
 * - Closed fist (lock/go to slide)
 * - Pointing up (laser pointer)
 * - Swipe left/right (prev/next slide)
 * - Thumb up (start presentation)
 * - Peace sign (toggle annotation)
 */
import { ref, onUnmounted, type Ref } from 'vue'
import { Hands, Results } from '@mediapipe/hands'
import { Camera } from '@mediapipe/camera_utils'
import { drawLandmarks } from '@mediapipe/drawing_utils'

export type AirGesture = 
  | 'swipe_left' 
  | 'swipe_right' 
  | 'swipe_up' 
  | 'swipe_down'
  | 'point_up'        // 食指指向 — 激光笔
  | 'fist'            // 握拳 — 暂停/锁定
  | 'palm_open'       // 张开手掌 — 继续/解锁
  | 'thumb_up'        // 拇指朝上 — 开始演示
  | 'peace'           // V字手势 — 切换标注
  | 'ok_sign'         // OK手势
  | 'none'

export interface HandGestureOptions {
  videoElement: Ref<HTMLVideoElement | null>
  onGesture?: (gesture: AirGesture, confidence: number) => void
  onHandDetected?: (detected: boolean) => void
  onLandmarks?: (landmarks: any[]) => void
  enabled?: Ref<boolean>
  mirror?: boolean  // 前置摄像头镜像
}

export interface HandGestureResult {
  isActive: Ref<boolean>
  isDetecting: Ref<boolean>
  currentGesture: Ref<AirGesture>
  confidence: Ref<number>
  error: Ref<string | null>
  start: () => Promise<void>
  stop: () => void
  toggleEnabled: () => void
  isEnabled: Ref<boolean>
}

const GESTURE_THRESHOLD = 0.75
const SWIPE_THRESHOLD = 0.05  // 手部移动距离阈值（相对于画面宽度）
const FIST_THRESHOLD = 0.15  // 手指弯曲阈值
const POINT_THRESHOLD = 0.08 // 指向手势阈值

// 计算手指是否弯曲（基于 landmark 距离）
function isFingerCurled(landmarks: any[], fingerTips: number[], fingerBase: number): boolean {
  const tip = landmarks[fingerTips]
  const base = landmarks[fingerBase]
  const mcp = landmarks[fingerTips - 1] // MCP joint
  if (!tip || !base || !mcp) return false
  const tipToBase = Math.hypot(tip.x - base.x, tip.y - base.y)
  const mcpToBase = Math.hypot(mcp.x - base.x, mcp.y - base.y)
  return tipToBase < mcpToBase * (1 - FIST_THRESHOLD)
}

// 计算手掌是否张开
function isPalmOpen(landmarks: any[]): boolean {
  const fingerTips = [8, 12, 16, 20]  // 食指-小指指尖
  const curled = fingerTips.map(tip => isFingerCurled(landmarks, tip, tip === 8 ? 5 : tip - 2))
  return curled.filter(Boolean).length >= 3
}

// 计算是否为指向手势（食指伸直，其他弯曲）
function isPointingUp(landmarks: any[]): boolean {
  const indexTip = landmarks[8]
  const indexBase = landmarks[5]
  if (!indexTip || !indexBase) return false
  // 食指伸直（指尖在手掌上方）
  const indexExtended = indexTip.y < indexBase.y - POINT_THRESHOLD
  // 其他手指弯曲
  const otherCurled = [12, 16, 20].map(tip => isFingerCurled(landmarks, tip, tip === 12 ? 9 : tip - 2))
  const thumbCurled = Math.abs(landmarks[4].x - landmarks[3].x) < 0.03
  return indexExtended && otherCurled.filter(Boolean).length >= 2 && thumbCurled
}

// 检测是否为 OK 手势（拇指与食指捏合）
function isOkSign(landmarks: any[]): boolean {
  const thumb = landmarks[4]
  const index = landmarks[8]
  if (!thumb || !index) return false
  const dist = Math.hypot(thumb.x - index.x, thumb.y - index.y)
  return dist < 0.05
}

// 检测是否为拇指朝上手势
function isThumbUp(landmarks: any[]): boolean {
  const thumb = landmarks[4]
  const wrist = landmarks[0]
  const index = landmarks[8]
  if (!thumb || !wrist || !index) return false
  return thumb.y < wrist.y && thumb.y < index.y && Math.abs(thumb.x - wrist.x) < 0.05
}

// 检测 V 字手势（食指+中指伸直，其他弯曲）
function isPeaceSign(landmarks: any[]): boolean {
  const index = landmarks[8]
  const middle = landmarks[12]
  const ring = landmarks[16]
  const wrist = landmarks[0]
  if (!index || !middle || !ring || !wrist) return false
  const indexUp = index.y < wrist.y - 0.05
  const middleUp = middle.y < wrist.y - 0.05
  const ringCurled = isFingerCurled(landmarks, 16, 14)
  const pinkyCurled = isFingerCurled(landmarks, 20, 18)
  return indexUp && middleUp && ringCurled && pinkyCurled
}

// 检测滑动手势（手掌边缘移动）
let lastPalmCenterX = 0
let lastPalmCenterY = 0
let swipeStartTime = 0

function detectSwipeGesture(landmarks: any[]): { gesture: AirGesture; confidence: number } | null {
  const wrist = landmarks[0]
  const pinky = landmarks[17]
  const index = landmarks[5]
  if (!wrist || !pinky || !index) return null

  const centerX = (wrist.x + index.x) / 2
  const centerY = (wrist.y + index.y) / 2

  if (lastPalmCenterX === 0) {
    lastPalmCenterX = centerX
    lastPalmCenterY = centerY
    swipeStartTime = Date.now()
    return null
  }

  const dx = centerX - lastPalmCenterX
  const dy = centerY - lastPalmCenterY
  const elapsed = Date.now() - swipeStartTime

  // 快速移动才触发
  if (elapsed < 500 && elapsed > 100) {
    if (Math.abs(dx) > SWIPE_THRESHOLD) {
      lastPalmCenterX = centerX
      lastPalmCenterY = centerY
      swipeStartTime = Date.now()
      return { gesture: dx < 0 ? 'swipe_left' : 'swipe_right', confidence: Math.min(Math.abs(dx) / 0.15, 1) }
    }
    if (Math.abs(dy) > SWIPE_THRESHOLD) {
      lastPalmCenterX = centerX
      lastPalmCenterY = centerY
      swipeStartTime = Date.now()
      return { gesture: dy < 0 ? 'swipe_up' : 'swipe_down', confidence: Math.min(Math.abs(dy) / 0.15, 1) }
    }
  }

  lastPalmCenterX = centerX
  lastPalmCenterY = centerY
  swipeStartTime = Date.now()
  return null
}

export function useHandGesture(options: HandGestureOptions): HandGestureResult {
  const {
    videoElement,
    onGesture,
    onHandDetected,
    onLandmarks,
    enabled = ref(true),
    mirror = true
  } = options

  const isActive = ref(false)
  const isDetecting = ref(false)
  const currentGesture = ref<AirGesture>('none')
  const confidence = ref(0)
  const error = ref<string | null>(null)
  const isEnabled = ref(enabled.value ?? true)

  let hands: Hands | null = null
  let camera: Camera | null = null
  let canvasCtx: CanvasRenderingContext2D | null = null
  let overlayCanvas: HTMLCanvasElement | null = null
  let lastGesture = 'none'
  let lastGestureTime = 0
  const GESTURE_COOLDOWN = 800  // 手势触发冷却时间（ms）

  function createOverlayCanvas(): HTMLCanvasElement {
    const canvas = document.createElement('canvas')
    canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;'
    canvas.width = videoElement.value?.videoWidth || 640
    canvas.height = videoElement.value?.videoHeight || 480
    canvasCtx = canvas.getContext('2d')
    return canvas
  }

  async function start(): Promise<void> {
    if (isActive.value) return
    error.value = null

    try {
      // 初始化 MediaPipe Hands
      hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      })

      hands.setOptions({
        maxNumHands: 2,
        modelComplexity: 1,  // 0=lite, 1=full
        minDetectionConfidence: 0.7,
        minTrackingConfidence: 0.5,
      })

      hands.onResults(onResults)

      // 等待视频元素就绪
      if (!videoElement.value) {
        throw new Error('Video element not available')
      }

      // 添加手势可视化覆盖层
      overlayCanvas = createOverlayCanvas()
      videoElement.value.parentElement?.appendChild(overlayCanvas)

      // 启动摄像头
      camera = new Camera(videoElement.value, {
        onFrame: async () => {
          if (hands && isEnabled.value) {
            await hands.send({ image: videoElement.value! })
          }
        },
        width: 640,
        height: 480,
        facingMode: 'user',
      })

      await camera.start()
      isActive.value = true
      isDetecting.value = true
      lastPalmCenterX = 0
      lastPalmCenterY = 0
    } catch (e: any) {
      error.value = e.message || 'Hand gesture detection failed to start'
      console.error('[useHandGesture] start error:', e)
    }
  }

  function onResults(results: Results) {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) {
      onHandDetected?.(false)
      // 清除可视化
      if (canvasCtx && overlayCanvas) {
        canvasCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height)
      }
      currentGesture.value = 'none'
      return
    }

    onHandDetected?.(true)

    for (const landmarks of results.multiHandLandmarks) {
      // 绘制手部 landmark
      if (canvasCtx) {
        canvasCtx.clearRect(0, 0, overlayCanvas!.width, overlayCanvas!.height)
        drawLandmarks(canvasCtx, landmarks, { color: '#00FF00', lineWidth: 1, radius: 2 })
      }

      onLandmarks?.(landmarks)

      // 检测手势
      let detected: AirGesture = 'none'
      let conf = 0

      // 优先检测滑动手势
      const swipe = detectSwipeGesture(landmarks)
      if (swipe && swipe.confidence > GESTURE_THRESHOLD) {
        detected = swipe.gesture
        conf = swipe.confidence
      } else if (isPalmOpen(landmarks)) {
        detected = 'palm_open'
        conf = 0.9
      } else if (isPointingUp(landmarks)) {
        detected = 'point_up'
        conf = 0.85
      } else if (isThumbUp(landmarks)) {
        detected = 'thumb_up'
        conf = 0.8
      } else if (isPeaceSign(landmarks)) {
        detected = 'peace'
        conf = 0.8
      } else if (isOkSign(landmarks)) {
        detected = 'ok_sign'
        conf = 0.75
      } else if (isFingerCurled(landmarks, 8, 5) && 
                  isFingerCurled(landmarks, 12, 9) && 
                  isFingerCurled(landmarks, 16, 14) && 
                  isFingerCurled(landmarks, 20, 18)) {
        detected = 'fist'
        conf = 0.8
      }

      // 节流：避免同一手势频繁触发
      const now = Date.now()
      if (detected !== 'none' && detected !== lastGesture) {
        currentGesture.value = detected
        confidence.value = conf
        onGesture?.(detected, conf)
        lastGesture = detected
        lastGestureTime = now
      } else if (detected === lastGesture && now - lastGestureTime > GESTURE_COOLDOWN) {
        // 同一手势在冷却后重复触发
        lastGestureTime = now
        onGesture?.(detected, conf)
      }
    }
  }

  function stop() {
    if (camera) {
      camera.stop()
      camera = null
    }
    if (hands) {
      hands.close()
      hands = null
    }
    if (overlayCanvas && overlayCanvas.parentElement) {
      overlayCanvas.parentElement.removeChild(overlayCanvas)
      overlayCanvas = null
    }
    isActive.value = false
    isDetecting.value = false
    currentGesture.value = 'none'
    confidence.value = 0
    lastPalmCenterX = 0
    lastPalmCenterY = 0
  }

  function toggleEnabled() {
    isEnabled.value = !isEnabled.value
  }

  onUnmounted(() => {
    stop()
  })

  return {
    isActive,
    isDetecting,
    currentGesture,
    confidence,
    error,
    start,
    stop,
    toggleEnabled,
    isEnabled,
  }
}
