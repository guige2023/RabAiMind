/**
 * useARVR.ts — AR/VR mode composable
 * Handles: camera access, WebXR session, gesture recognition, 3D rendering
 */
import { ref, onUnmounted } from 'vue'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js'

export type ARVRMode = 'none' | 'ar' | 'vr'

export interface Model3D {
  id: string
  url: string
  type: 'gltf' | 'obj'
  position: { x: number; y: number; z: number }
  rotation: { x: number; y: number; z: number }
  scale: number
  visible: boolean
}

export interface GestureEvent {
  type: 'swipe_left' | 'swipe_right' | 'swipe_up' | 'swipe_down' | 'pinch' | 'spread' | 'tap' | 'double_tap' | 'hold'
  direction?: 'left' | 'right' | 'up' | 'down'
  scale?: number
}

export function useARVR() {
  const mode = ref<ARVRMode>('none')
  const cameraStream = ref<MediaStream | null>(null)
  const xrSession = ref<XRSession | null>(null)
  const models3D = ref<Model3D[]>([])
  const isLoading = ref(false)
  const error = ref<string | null>(null)
  const gestureCallback = ref<((e: GestureEvent) => void) | null>(null)

  // Three.js rendering
  let threeRenderer: THREE.WebGLRenderer | null = null
  let threeScene: THREE.Scene | null = null
  let threeCamera: THREE.PerspectiveCamera | null = null
  let threeModels: Map<string, THREE.Object3D> = new Map()
  let animationFrameId: number | null = null

  // Gesture state
  let gestureStartX = 0
  let gestureStartY = 0
  let gestureStartTime = 0
  let lastTapTime = 0
  let tapTimeout: ReturnType<typeof setTimeout> | null = null

  // ── Camera / AR ──────────────────────────────────────────

  async function startAR(): Promise<boolean> {
    error.value = null
    isLoading.value = true
    try {
      // Try WebXR AR first
      if (navigator.xr) {
        const supported = await navigator.xr.isSessionSupported('immersive-ar').catch(() => false)
        if (supported) {
          const session = await navigator.xr.requestSession('immersive-ar', {
            requiredFeatures: ['hit-test', 'dom-overlay'],
            optionalFeatures: ['hand-tracking'],
            domOverlay: { root: document.body }
          } as any)
          xrSession.value = session
          mode.value = 'ar'
          setupXRRenderLoop(session)
          isLoading.value = false
          return true
        }
      }
      // Fallback: camera stream overlay (WebRTC)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      cameraStream.value = stream
      mode.value = 'ar'
      setupCameraOverlay(stream)
      isLoading.value = false
      return true
    } catch (e: any) {
      error.value = e.message || 'AR启动失败'
      mode.value = 'none'
      isLoading.value = false
      return false
    }
  }

  function setupCameraOverlay(stream: MediaStream) {
    // Renderer already set up via THREE
    if (!threeRenderer || !threeScene || !threeCamera) return
    const video = document.createElement('video')
    video.srcObject = stream
    video.autoplay = true
    video.playsInline = true
    video.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;opacity:0.8;'
    document.body.appendChild(video)

    // Create background plane with video texture
    const videoTexture = new THREE.VideoTexture(video)
    const bgGeo = new THREE.PlaneGeometry(16, 9)
    const bgMat = new THREE.MeshBasicMaterial({ map: videoTexture, side: THREE.FrontSide })
    const bgMesh = new THREE.Mesh(bgGeo, bgMat)
    bgMesh.position.z = -5
    bgMesh.name = 'camera-bg'
    threeScene.add(bgMesh)
  }

  async function setupXRRenderLoop(session: XRSession) {
    if (!threeRenderer) {
      threeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      threeRenderer.setPixelRatio(window.devicePixelRatio)
      threeRenderer.setSize(window.innerWidth, window.innerHeight)
      threeRenderer.xr.enabled = true
      document.body.appendChild(threeRenderer.domElement)
    }
    if (!threeScene) {
      threeScene = new THREE.Scene()
      threeCamera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 20)
    }
    threeRenderer.xr.setSession(session)
    startRenderLoop()
  }

  // ── VR ───────────────────────────────────────────────────

  async function startVR(): Promise<boolean> {
    error.value = null
    isLoading.value = true
    try {
      if (navigator.xr) {
        const supported = await navigator.xr.isSessionSupported('immersive-vr').catch(() => false)
        if (supported) {
          const session = await navigator.xr.requestSession('immersive-vr', {
            requiredFeatures: ['local-floor'],
            optionalFeatures: ['hand-tracking', 'spatial-tracking']
          } as any)
          xrSession.value = session
          mode.value = 'vr'
          initThreeRenderer()
          setupXRRenderLoop(session)
          isLoading.value = false
          return true
        }
      }
      // Fallback: fullscreen immersive
      initThreeRenderer()
      mode.value = 'vr'
      isLoading.value = false
      startRenderLoop()
      return true
    } catch (e: any) {
      error.value = e.message || 'VR启动失败'
      mode.value = 'none'
      isLoading.value = false
      return false
    }
  }

  // ── Three.js Setup ────────────────────────────────────────

  function initThreeRenderer() {
    if (!threeRenderer) {
      threeRenderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
      threeRenderer.setPixelRatio(window.devicePixelRatio)
      threeRenderer.setSize(window.innerWidth, window.innerHeight)
      threeRenderer.xr.enabled = true
      threeRenderer.domElement.style.cssText = 'position:fixed;inset:0;z-index:10;background:#000;'
      document.body.appendChild(threeRenderer.domElement)
    }
    if (!threeScene) {
      threeScene = new THREE.Scene()
      threeCamera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 100)
      threeCamera.position.set(0, 1.6, 3)
      // Lighting
      const ambient = new THREE.AmbientLight(0xffffff, 0.8)
      threeScene.add(ambient)
      const dirLight = new THREE.DirectionalLight(0xffffff, 1.0)
      dirLight.position.set(2, 4, 3)
      threeScene.add(dirLight)
    }
  }

  function startRenderLoop() {
    if (animationFrameId !== null) return
    function loop() {
      animationFrameId = requestAnimationFrame(loop)
      if (threeRenderer && threeScene && threeCamera) {
        threeRenderer.render(threeScene, threeCamera)
      }
    }
    loop()
  }

  function stopRenderLoop() {
    if (animationFrameId !== null) {
      cancelAnimationFrame(animationFrameId)
      animationFrameId = null
    }
  }

  // ── 3D Model Loading ─────────────────────────────────────

  const gltfLoader = new GLTFLoader()
  const dracoLoader = new DRACOLoader()
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
  gltfLoader.setDRACOLoader(dracoLoader)

  function addModel(model: Model3D): Promise<THREE.Object3D | null> {
    return new Promise((resolve) => {
      if (!threeScene) { resolve(null); return }
      if (model.type === 'gltf') {
        gltfLoader.load(model.url, (gltf) => {
          const obj = gltf.scene
          obj.position.set(model.position.x, model.position.y, model.position.z)
          obj.rotation.set(model.rotation.x, model.rotation.y, model.rotation.z)
          obj.scale.setScalar(model.scale)
          obj.visible = model.visible
          obj.name = model.id
          threeScene!.add(obj)
          threeModels.set(model.id, obj)
          resolve(obj)
        }, undefined, () => resolve(null))
      } else {
        // OBJ — simple placeholder cube as fallback
        const geo = new THREE.BoxGeometry(0.5, 0.5, 0.5)
        const mat = new THREE.MeshStandardMaterial({ color: 0x4a90e2 })
        const obj = new THREE.Mesh(geo, mat)
        obj.position.set(model.position.x, model.position.y, model.position.z)
        obj.scale.setScalar(model.scale)
        obj.name = model.id
        threeScene!.add(obj)
        threeModels.set(model.id, obj)
        resolve(obj)
      }
    })
  }

  function removeModel(id: string) {
    const obj = threeModels.get(id)
    if (obj && threeScene) {
      threeScene.remove(obj)
      threeModels.delete(id)
    }
    models3D.value = models3D.value.filter(m => m.id !== id)
  }

  function setModelVisible(id: string, visible: boolean) {
    const obj = threeModels.get(id)
    if (obj) obj.visible = visible
    const m = models3D.value.find(m => m.id === id)
    if (m) m.visible = visible
  }

  // ── Slide as 3D Plane ─────────────────────────────────────

  function addSlidePlane(svgUrl: string, z: number = 0): THREE.Mesh | null {
    if (!threeScene) return null
    const geo = new THREE.PlaneGeometry(4, 3)
    const textureLoader = new THREE.TextureLoader()
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.FrontSide })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.z = z
    mesh.name = `slide-plane-${z}`
    threeScene.add(mesh)
    textureLoader.load(svgUrl, (tex) => {
      (mat as THREE.MeshBasicMaterial).map = tex
      mat.needsUpdate = true
    })
    return mesh
  }

  function clearSlidePlanes() {
    if (!threeScene) return
    const toRemove: THREE.Object3D[] = []
    threeScene.traverse((obj) => {
      if (obj.name.startsWith('slide-plane-')) toRemove.push(obj)
    })
    toRemove.forEach(obj => threeScene!.remove(obj))
  }

  // ── Gesture Recognition (Touch) ──────────────────────────

  function setupGestureListeners(domEl: HTMLElement) {
    domEl.addEventListener('touchstart', onTouchStart, { passive: false })
    domEl.addEventListener('touchend', onTouchEnd, { passive: false })
    domEl.addEventListener('touchmove', onTouchMove, { passive: false })
  }

  function removeGestureListeners(domEl: HTMLElement) {
    domEl.removeEventListener('touchstart', onTouchStart)
    domEl.removeEventListener('touchend', onTouchEnd)
    domEl.removeEventListener('touchmove', onTouchMove)
  }

  let lastTouchDist = 0
  let lastTouchMidX = 0
  let lastTouchMidY = 0

  function onTouchStart(e: TouchEvent) {
    e.preventDefault()
    if (e.touches.length === 1) {
      gestureStartX = e.touches[0].clientX
      gestureStartY = e.touches[0].clientY
      gestureStartTime = Date.now()
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX
      const dy = e.touches[0].clientY - e.touches[1].clientY
      lastTouchDist = Math.sqrt(dx * dx + dy * dy)
      lastTouchMidX = (e.touches[0].clientX + e.touches[1].clientX) / 2
      lastTouchMidY = (e.touches[0].clientY + e.touches[1].clientY) / 2
    }
  }

  function onTouchEnd(e: TouchEvent) {
    e.preventDefault()
    const now = Date.now()
    const dt = now - gestureStartTime

    if (e.changedTouches.length === 1 && dt < 300) {
      const dx = e.changedTouches[0].clientX - gestureStartX
      const dy = e.changedTouches[0].clientY - gestureStartY
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)
      const threshold = 50

      if (absDx > threshold && absDx > absDy) {
        emitGesture({ type: dx < 0 ? 'swipe_left' : 'swipe_right', direction: dx < 0 ? 'left' : 'right' })
      } else if (absDy > threshold && absDy > absDx) {
        emitGesture({ type: dy < 0 ? 'swipe_up' : 'swipe_down', direction: dy < 0 ? 'up' : 'down' })
      } else if (absDx < 10 && absDy < 10) {
        // Tap
        if (now - lastTapTime < 300) {
          emitGesture({ type: 'double_tap' })
          lastTapTime = 0
        } else {
          lastTapTime = now
          tapTimeout = setTimeout(() => {
            emitGesture({ type: 'tap' })
          }, 300)
        }
      }
    } else if (e.touches.length === 0 && e.changedTouches.length === 2) {
      const dx = e.changedTouches[0].clientX - e.changedTouches[1].clientX
      const dy = e.changedTouches[0].clientY - e.changedTouches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist > lastTouchDist + 20) emitGesture({ type: 'spread', scale: dist / lastTouchDist })
      else if (dist < lastTouchDist - 20) emitGesture({ type: 'pinch', scale: dist / lastTouchDist })
    }
  }

  function onTouchMove(e: TouchEvent) {
    e.preventDefault()
  }

  function emitGesture(gesture: GestureEvent) {
    if (tapTimeout) { clearTimeout(tapTimeout); tapTimeout = null }
    gestureCallback.value?.(gesture)
  }

  function onGesture(cb: (e: GestureEvent) => void) {
    gestureCallback.value = cb
  }

  // ── Cleanup ────────────────────────────────────────────────

  async function stop() {
    stopRenderLoop()
    if (cameraStream.value) {
      cameraStream.value.getTracks().forEach(t => t.stop())
      cameraStream.value = null
    }
    if (xrSession.value) {
      await xrSession.value.end()
      xrSession.value = null
    }
    if (threeRenderer) {
      threeRenderer.dispose()
      document.body.removeChild(threeRenderer.domElement)
      threeRenderer = null
    }
    threeScene = null
    threeCamera = null
    threeModels.clear()
    models3D.value = []
    mode.value = 'none'
  }

  onUnmounted(() => {
    stop()
  })

  return {
    mode,
    cameraStream,
    xrSession,
    models3D,
    isLoading,
    error,
    startAR,
    startVR,
    stop,
    addModel,
    removeModel,
    setModelVisible,
    addSlidePlane,
    clearSlidePlanes,
    setupGestureListeners,
    removeGestureListeners,
    onGesture,
    initThreeRenderer,
    threeScene: () => threeScene,
    threeCamera: () => threeCamera,
    threeRenderer: () => threeRenderer,
    startRenderLoop,
  }
}
