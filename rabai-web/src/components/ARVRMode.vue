<template>
  <Teleport to="body">
    <div v-if="isActive" class="arvr-overlay" ref="overlayRef">

      <!-- WebXR canvas mount point -->
      <canvas ref="threeCanvas" class="three-canvas" />

      <!-- Loading screen -->
      <div v-if="arvr.isLoading.value" class="arvr-loading">
        <div class="loading-spinner"></div>
        <p>{{ arvr.mode.value === 'ar' ? '启动AR模式...' : '启动VR模式...' }}</p>
      </div>

      <!-- Error screen -->
      <div v-if="arvr.error.value" class="arvr-error">
        <p>⚠️ {{ arvr.error.value }}</p>
        <button class="btn btn-sm" @click="arvr.stop()">返回</button>
      </div>

      <!-- Toolbar -->
      <div class="arvr-toolbar" v-if="!arvr.isLoading.value && !arvr.error.value">
        <span class="arvr-badge">{{ arvr.mode.value === 'ar' ? '📷 AR' : '🕶 VR' }}</span>
        <span class="slide-counter">{{ currentSlide + 1 }} / {{ slides.length }}</span>

        <!-- Presentation mode selector -->
        <div class="arvr-mode-tabs">
          <button
            v-for="m in arvrModes"
            :key="m.id"
            class="mode-tab"
            :class="{ active: selectedMode === m.id }"
            @click="switchMode(m.id)"
            :title="m.label"
          >{{ m.icon }} {{ m.label }}</button>
        </div>

        <!-- 3D Transition selector (hidden in auditorium mode) -->
        <div class="transition-3d-selector" v-if="selectedMode !== 'auditorium'">
          <select v-model="selected3DTransition" class="transition-select">
            <option value="cube">3D立方体</option>
            <option value="cylinder">3D圆柱</option>
            <option value="carousel">3D轮播</option>
            <option value="flip">3D翻转</option>
            <option value="depth">景深推进</option>
            <option value="flythrough">穿越飞行</option>
          </select>
        </div>

        <!-- Insert 3D Object -->
        <button class="toolbar-btn" @click="showModelPanel = !showModelPanel" title="插入3D模型">
          🧊
        </button>

        <!-- Gesture help -->
        <button class="toolbar-btn" @click="showGestureHelp = !showGestureHelp" title="手势说明">
          👋
        </button>

        <button class="toolbar-btn" @click="exit" title="退出 (ESC)">✕</button>
      </div>

      <!-- 3D Model insertion panel -->
      <Transition name="slide-up">
        <div v-if="showModelPanel && !arvr.isLoading.value" class="model-insert-panel" @click.stop>
          <div class="panel-title">🧊 插入3D对象</div>
          <div class="model-grid">
            <div
              v-for="preset in presetModels"
              :key="preset.id"
              class="model-card"
              @click="insertModel(preset)"
            >
              <span class="model-icon">{{ preset.icon }}</span>
              <span class="model-name">{{ preset.name }}</span>
            </div>
          </div>
          <div class="model-url-input">
            <input
              v-model="modelUrlInput"
              class="form-input"
              placeholder="输入 glTF/OBJ URL..."
            />
            <button class="btn btn-sm" @click="insertCustomModel">加载</button>
          </div>
        </div>
      </Transition>

      <!-- Gesture help overlay -->
      <Transition name="fade">
        <div v-if="showGestureHelp" class="gesture-help" @click="showGestureHelp = false">
          <div class="gesture-help-content">
            <h3>👋 手势控制</h3>
            <div class="gesture-row"><span>👈 swipe left</span><span>下一页</span></div>
            <div class="gesture-row"><span>👉 swipe right</span><span>上一页</span></div>
            <div class="gesture-row"><span>👆 swipe up</span><span>下一页</span></div>
            <div class="gesture-row"><span>👇 swipe down</span><span>上一页</span></div>
            <div class="gesture-row"><span>🤏 pinch</span><span>缩小</span></div>
            <div class="gesture-row"><span>✋ spread</span><span>放大</span></div>
            <div class="gesture-row"><span>👆 tap</span><span>确认/激光笔</span></div>
            <div class="gesture-row"><span>👆 double-tap</span><span>重置视角</span></div>
            <button class="btn btn-sm btn-outline" @click="showGestureHelp = false">关闭</button>
          </div>
        </div>
      </Transition>

      <!-- Slide SVG layers rendered as 3D planes -->
      <canvas ref="slideLayersCanvas" class="slide-layers-canvas" />

    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted, computed } from 'vue'
import { useARVR, type GestureEvent, type Model3D } from '../composables/useARVR'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'

interface Slide {
  title?: string
  content?: string
  background?: string
  svgUrl?: string
  presenterNotes?: string
}

interface PresetModel {
  id: string
  name: string
  icon: string
  type: 'gltf' | 'obj'
  url: string
  scale: number
}

const props = defineProps<{
  isActive: boolean
  slides: Slide[]
  initialSlide?: number
  presentMode?: 'vr' | 'panorama' | 'ar' | 'hologram' | 'auditorium'
}>()

const emit = defineEmits<{
  'update:isActive': [val: boolean]
  'slideChange': [index: number]
}>()

const arvr = useARVR()
const overlayRef = ref<HTMLElement | null>(null)
const threeCanvas = ref<HTMLCanvasElement | null>(null)
const slideLayersCanvas = ref<HTMLCanvasElement | null>(null)

const currentSlide = ref(props.initialSlide || 0)
const selected3DTransition = ref<'cube' | 'cylinder' | 'carousel' | 'flip' | 'depth' | 'flythrough'>('depth')
const selectedMode = ref<'vr' | 'panorama' | 'ar' | 'hologram' | 'auditorium'>(props.presentMode || 'vr')
const showModelPanel = ref(false)
const showGestureHelp = ref(false)
const modelUrlInput = ref('')

// Three.js internals
let threeScene: THREE.Scene | null = null
let threeCamera: THREE.PerspectiveCamera | null = null
let threeRenderer: THREE.WebGLRenderer | null = null
let slidePlanes: THREE.Mesh[] = []
let slidePlaneTextures: Map<number, THREE.Texture> = new Map()
let animationFrameId: number | null = null
let carouselAngle = 0

const presetModels: PresetModel[] = [
  { id: 'sphere', name: '球体', icon: '⚪', type: 'obj', url: '', scale: 0.5 },
  { id: 'cube', name: '立方体', icon: '🧊', type: 'obj', url: '', scale: 0.5 },
  { id: 'cylinder', name: '圆柱', icon: '🛢', type: 'obj', url: '', scale: 0.5 },
  { id: 'cone', name: '圆锥', icon: '🔺', type: 'obj', url: '', scale: 0.5 },
  { id: 'torus', name: '圆环', icon: '⭕', type: 'obj', url: '', scale: 0.4 },
]

interface ARVRModeOption {
  id: 'vr' | 'panorama' | 'ar' | 'hologram' | 'auditorium'
  label: string
  icon: string
}

const arvrModes: ARVRModeOption[] = [
  { id: 'vr', label: 'VR沉浸', icon: '🕶' },
  { id: 'panorama', label: '360°全景', icon: '🌐' },
  { id: 'ar', label: 'AR叠加', icon: '📷' },
  { id: 'hologram', label: '全息投影', icon: '🔮' },
  { id: 'auditorium', label: '虚拟礼堂', icon: '🏛' },
]

// Auditorium audience avatars
interface Avatar {
  mesh: THREE.Object3D
  targetX: number
  targetZ: number
  speed: number
}
let audienceAvatars: Avatar[] = []

const loader = new GLTFLoader()

// ── Init Three.js ────────────────────────────────────────────

function initThree() {
  if (!threeCanvas.value) return
  threeRenderer = new THREE.WebGLRenderer({ canvas: threeCanvas.value, antialias: true, alpha: true })
  threeRenderer.setPixelRatio(window.devicePixelRatio)
  threeRenderer.setSize(window.innerWidth, window.innerHeight)
  threeRenderer.xr.enabled = true

  threeScene = new THREE.Scene()
  threeCamera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.01, 100)
  threeCamera.position.set(0, 0, 5)

  // Lighting
  const ambient = new THREE.AmbientLight(0xffffff, 0.9)
  threeScene.add(ambient)
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0)
  dirLight.position.set(2, 4, 3)
  threeScene.add(dirLight)
  const rimLight = new THREE.DirectionalLight(0x4488ff, 0.4)
  rimLight.position.set(-2, 1, -2)
  threeScene.add(rimLight)

  // Apply mode-specific scene setup
  applySceneSetup()
  // Build slide planes
  buildSlidePlanes()
  startAnimationLoop()
}

// ── Mode-specific scene setup ────────────────────────────────

function applySceneSetup() {
  if (!threeScene || !threeCamera) return

  // Reset camera
  threeCamera.position.set(0, 0, 5)
  threeCamera.lookAt(0, 0, 0)

  if (selectedMode.value === 'panorama') {
    setupPanoramaScene()
  } else if (selectedMode.value === 'auditorium') {
    setupAuditoriumScene()
  } else if (selectedMode.value === 'ar') {
    setupARScene()
  } else {
    // vr / hologram: remove panorama and auditorium objects
    removePanoramaSphere()
    removeAuditorium()
  }
}

function setupPanoramaScene() {
  if (!threeScene) return
  removePanoramaSphere()

  // Create a large sphere for the 360° panorama background
  const sphereGeo = new THREE.SphereGeometry(50, 64, 32)
  // Create gradient panorama texture using canvas
  const canvas = document.createElement('canvas')
  canvas.width = 2048
  canvas.height = 1024
  const ctx = canvas.getContext('2d')!
  // Deep space gradient
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height)
  grad.addColorStop(0, '#0a0a2e')
  grad.addColorStop(0.4, '#1a1a4e')
  grad.addColorStop(0.7, '#2d1b4e')
  grad.addColorStop(1, '#1a0a2e')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  // Add some stars
  for (let i = 0; i < 500; i++) {
    ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.8 + 0.2})`
    ctx.beginPath()
    ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height * 0.6, Math.random() * 1.5, 0, Math.PI * 2)
    ctx.fill()
  }
  // Add horizon glow
  const hGrad = ctx.createLinearGradient(0, canvas.height * 0.6, 0, canvas.height * 0.9)
  hGrad.addColorStop(0, 'rgba(74, 144, 226, 0)')
  hGrad.addColorStop(0.5, 'rgba(74, 144, 226, 0.15)')
  hGrad.addColorStop(1, 'rgba(74, 144, 226, 0.05)')
  ctx.fillStyle = hGrad
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  const sphereMat = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide })
  const sphere = new THREE.Mesh(sphereGeo, sphereMat)
  sphere.name = 'panorama-sphere'
  threeScene.add(sphere)

  // Camera inside the sphere
  if (threeCamera) {
    threeCamera.position.set(0, 0, 0)
  }
}

function removePanoramaSphere() {
  if (!threeScene) return
  const sphere = threeScene.getObjectByName('panorama-sphere')
  if (sphere) {
    threeScene.remove(sphere)
    const mat = (sphere as THREE.Mesh).material as THREE.Material
    if (mat) mat.dispose()
  }
}

function setupARScene() {
  // Start AR camera stream as background
  arvr.startAR().then(() => {
    setupCameraOverlayForAR()
  })
}

function setupCameraOverlayForAR() {
  if (!threeScene || !threeRenderer) return
  // Camera background - the video element is appended by useARVR
  const bgGeo = new THREE.PlaneGeometry(16, 9)
  const bgMat = new THREE.MeshBasicMaterial({ color: 0x111111, side: THREE.FrontSide })
  const bgMesh = new THREE.Mesh(bgGeo, bgMat)
  bgMesh.position.z = -5
  bgMesh.name = 'ar-bg'
  threeScene.add(bgMesh)
}

function setupAuditoriumScene() {
  if (!threeScene) return
  removeAuditorium()

  // Floor
  const floorGeo = new THREE.PlaneGeometry(20, 30)
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.8, metalness: 0.1 })
  const floor = new THREE.Mesh(floorGeo, floorMat)
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -1
  floor.name = 'auditorium-floor'
  threeScene.add(floor)

  // Stage platform
  const stageGeo = new THREE.BoxGeometry(10, 0.3, 3)
  const stageMat = new THREE.MeshStandardMaterial({ color: 0x2d1b4e, roughness: 0.5, metalness: 0.2 })
  const stage = new THREE.Mesh(stageGeo, stageMat)
  stage.position.set(0, -0.85, -5)
  stage.name = 'auditorium-stage'
  threeScene.add(stage)

  // Stage spotlight
  const spotLight = new THREE.SpotLight(0xffffff, 50)
  spotLight.position.set(0, 5, -3)
  spotLight.target.position.set(0, -0.85, -5)
  spotLight.angle = Math.PI / 6
  spotLight.penumbra = 0.5
  spotLight.name = 'auditorium-spotlight'
  threeScene.add(spotLight)
  threeScene.add(spotLight.target)

  // Seating rows (simple geometry)
  const seatColors = [0x1e3a5f, 0x1a3350, 0x162a45, 0x12203a]
  for (let row = 0; row < 4; row++) {
    const seatsInRow = 8 - row
    for (let col = 0; col < seatsInRow; col++) {
      const seatGeo = new THREE.BoxGeometry(0.6, 0.6, 0.5)
      const seatMat = new THREE.MeshStandardMaterial({
        color: seatColors[row],
        roughness: 0.7
      })
      const seat = new THREE.Mesh(seatGeo, seatMat)
      seat.position.set(
        (col - (seatsInRow - 1) / 2) * 1.1,
        -0.7 + row * 0.6,
        -3 + row * 1.5
      )
      seat.name = `auditorium-seat-${row}-${col}`
      threeScene!.add(seat)
    }
  }

  // Audience avatars (simple capsule shapes)
  audienceAvatars = []
  const avatarPositions = [
    [-3, -0.5, -2.5], [0, -0.5, -2.5], [3, -0.5, -2.5],
    [-2, 0.1, -1.0], [2, 0.1, -1.0],
    [-1, 0.1, -1.0], [1, 0.1, -1.0],
    [-3, 0.1, -1.0], [0, 0.1, -1.0], [3, 0.1, -1.0],
    [-2, 0.7, 0.5], [0, 0.7, 0.5], [2, 0.7, 0.5],
    [-3, 0.7, 0.5], [1.5, 0.7, 0.5], [3.5, 0.7, 0.5],
  ]
  avatarPositions.forEach((pos, idx) => {
    const bodyGeo = new THREE.CylinderGeometry(0.12, 0.15, 0.5, 8)
    const bodyMat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(Math.random(), 0.6, 0.4),
      roughness: 0.6,
    })
    const body = new THREE.Mesh(bodyGeo, bodyMat)
    body.position.set(pos[0], pos[1], pos[2])

    const headGeo = new THREE.SphereGeometry(0.1, 8, 8)
    const headMat = new THREE.MeshStandardMaterial({ color: 0xffdbac, roughness: 0.8 })
    const head = new THREE.Mesh(headGeo, headMat)
    head.position.y = 0.35
    body.add(head)

    body.name = `auditorium-avatar-${idx}`
    threeScene!.add(body)
    audienceAvatars.push({
      mesh: body,
      targetX: pos[0] + (Math.random() - 0.5) * 0.2,
      targetZ: pos[2] + (Math.random() - 0.5) * 0.2,
      speed: 0.5 + Math.random() * 0.5,
    })
  })

  // Camera positioned in the audience
  if (threeCamera) {
    threeCamera.position.set(0, 0.5, 3)
    threeCamera.lookAt(0, 0, -4)
  }
}

function removeAuditorium() {
  if (!threeScene) return
  const toRemove: THREE.Object3D[] = []
  threeScene.traverse((obj) => {
    const name = obj.name
    if (name.startsWith('auditorium-') || name === 'auditorium-floor' || name === 'auditorium-stage' || name === 'auditorium-spotlight') {
      toRemove.push(obj)
    }
  })
  toRemove.forEach(obj => {
    threeScene!.remove(obj)
    if ((obj as THREE.Mesh).geometry) (obj as THREE.Mesh).geometry.dispose()
    const mat = (obj as THREE.Mesh).material
    if (mat) {
      if (Array.isArray(mat)) mat.forEach(m => m.dispose())
      else mat.dispose()
    }
  })
  audienceAvatars = []
}

// ── Slide plane material by mode ────────────────────────────

function makeSlideMaterial(i: number): THREE.Material {
  if (selectedMode.value === 'hologram') {
    return new THREE.MeshStandardMaterial({
      color: 0x00ffff,
      emissive: new THREE.Color(0x003333),
      emissiveIntensity: 0.5,
      transparent: true,
      opacity: i === currentSlide.value ? 0.75 : 0.15,
      side: THREE.DoubleSide,
      wireframe: false,
      metalness: 0.8,
      roughness: 0.1,
    })
  }
  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    side: THREE.FrontSide,
    transparent: true,
    opacity: i === currentSlide.value ? 1 : 0.2,
  })
}

// ── Switch mode ──────────────────────────────────────────────

function switchMode(mode: 'vr' | 'panorama' | 'ar' | 'hologram' | 'auditorium') {
  selectedMode.value = mode
  // Rebuild scene for the new mode
  if (threeScene && threeRenderer) {
    stopRenderLoop()
    clearSlidePlanes()
    removePanoramaSphere()
    removeAuditorium()
    applySceneSetup()
    buildSlidePlanes()
    startAnimationLoop()
  }
}

function buildSlidePlanes() {
  if (!threeScene) return
  clearSlidePlanes()
  const textureLoader = new THREE.TextureLoader()
  props.slides.forEach((slide, i) => {
    const isHologram = selectedMode.value === 'hologram'
    const geo = new THREE.PlaneGeometry(3.2, 2.4)
    const mat = makeSlideMaterial(i)
    const mesh = new THREE.Mesh(geo, mat)
    mesh.userData.slideIndex = i

    // Hologram mode: add wireframe outline
    if (isHologram) {
      const frameGeo = new THREE.EdgesGeometry(geo)
      const frameMat = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8 })
      const frame = new THREE.LineSegments(frameGeo, frameMat)
      mesh.add(frame)
    }

    if (slide.svgUrl) {
      textureLoader.load(slide.svgUrl, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace
        const targetMat = mat as THREE.MeshStandardMaterial
        if (isHologram) {
          // Tint SVG in hologram mode
          targetMat.emissive = new THREE.Color(0x003333)
        } else {
          targetMat.map = tex
        }
        mat.needsUpdate = true
        slidePlaneTextures.set(i, tex)
      })
    }
    slidePlanes.push(mesh)
    threeScene!.add(mesh)
  })
  updateSlidePlanePositions()
}

function clearSlidePlanes() {
  if (!threeScene) return
  slidePlanes.forEach(p => threeScene!.remove(p))
  slidePlanes = []
  slidePlaneTextures.forEach(t => t.dispose())
  slidePlaneTextures.clear()
}

function updateSlidePlanePositions() {
  const t = selected3DTransition.value
  const isHologram = selectedMode.value === 'hologram'
  slidePlanes.forEach((plane, i) => {
    const rel = i - currentSlide.value
    if (t === 'carousel') {
      const angle = rel * (Math.PI / 3)
      plane.position.x = Math.sin(angle) * 3
      plane.position.y = isHologram ? Math.sin(Date.now() * 0.002 + i) * 0.1 : 0
      plane.position.z = Math.cos(angle) * 3 - 3
      plane.rotation.y = -angle
    } else if (t === 'cube') {
      const side = Math.abs(rel) % 4
      if (side === 0) { plane.position.set(0, 0, -rel * 0.01); plane.rotation.set(0, 0, 0) }
      else if (side === 1) { plane.position.set(rel * 0.01, 0, 0); plane.rotation.set(0, Math.PI / 2, 0) }
      else if (side === 2) { plane.position.set(0, 0, rel * 0.01); plane.rotation.set(0, Math.PI, 0) }
      else { plane.position.set(-rel * 0.01, 0, 0); plane.rotation.set(0, -Math.PI / 2, 0) }
    } else if (t === 'cylinder') {
      const angle = rel * (Math.PI / 5)
      plane.position.x = Math.sin(angle) * 2
      plane.position.y = isHologram ? Math.sin(Date.now() * 0.002 + i) * 0.1 : 0
      plane.position.z = Math.cos(angle) * 2 - 3
      plane.rotation.y = -angle
    } else if (t === 'depth' || t === 'flythrough') {
      plane.position.x = isHologram ? Math.sin(Date.now() * 0.001 + i) * 0.15 : 0
      plane.position.y = isHologram ? Math.sin(Date.now() * 0.002 + i * 0.5) * 0.1 : 0
      plane.position.z = -rel * 2
      plane.rotation.set(0, 0, 0)
    } else {
      // flip
      plane.position.x = rel * 3.2
      plane.position.y = isHologram ? Math.sin(Date.now() * 0.002 + i) * 0.1 : 0
      plane.position.z = 0
      plane.rotation.set(0, rel === 0 ? 0 : Math.PI, 0)
    }

    // Active slide opacity
    const mat = plane.material as THREE.MeshStandardMaterial
    mat.opacity = i === currentSlide.value ? (isHologram ? 0.8 : 1) : (isHologram ? 0.1 : 0.2)
    mat.transparent = true
    mat.needsUpdate = true
  })
}

function startAnimationLoop() {
  if (animationFrameId !== null) return
  function loop() {
    animationFrameId = requestAnimationFrame(loop)
    if (threeRenderer && threeScene && threeCamera) {
      if (selected3DTransition.value === 'carousel') {
        carouselAngle += 0.003
        slidePlanes.forEach((plane, i) => {
          const rel = i - currentSlide.value
          const angle = rel * (Math.PI / 3) + carouselAngle
          const isHologram = selectedMode.value === 'hologram'
          plane.position.x = Math.sin(angle) * 3
          plane.position.z = Math.cos(angle) * 3 - 3
          plane.position.y = isHologram ? Math.sin(Date.now() * 0.002 + i) * 0.1 : 0
          plane.rotation.y = -angle
        })
      }
      if (selected3DTransition.value === 'flythrough' && threeCamera) {
        threeCamera.position.z = Math.sin(Date.now() * 0.001) * 0.5
      }

      // Auditorium: animate audience avatars
      if (selectedMode.value === 'auditorium') {
        audienceAvatars.forEach((avatar) => {
          avatar.mesh.position.x += (avatar.targetX - avatar.mesh.position.x) * 0.02 * avatar.speed
          avatar.mesh.position.z += (avatar.targetZ - avatar.mesh.position.z) * 0.02 * avatar.speed
          // Subtle idle animation
          avatar.mesh.rotation.y = Math.sin(Date.now() * 0.001 * avatar.speed) * 0.05
        })
        // Slow camera orbit in auditorium
        const angle = Date.now() * 0.0001
        threeCamera.position.x = Math.sin(angle) * 0.3
      }

      // Hologram: pulsing emissive glow
      if (selectedMode.value === 'hologram') {
        slidePlanes.forEach((plane, i) => {
          const mat = plane.material as THREE.MeshStandardMaterial
          if (mat.emissive) {
            const pulse = 0.4 + Math.sin(Date.now() * 0.003 + i) * 0.2
            mat.emissiveIntensity = pulse
          }
        })
        // Slide float animation for depth/flythrough
        if (selected3DTransition.value === 'depth' || selected3DTransition.value === 'flythrough') {
          slidePlanes.forEach((plane, i) => {
            plane.position.x = Math.sin(Date.now() * 0.001 + i) * 0.15
            plane.position.y = Math.sin(Date.now() * 0.002 + i * 0.5) * 0.1
          })
        }
      }

      // Panorama: subtle camera rotation
      if (selectedMode.value === 'panorama') {
        threeCamera.rotation.y = Math.sin(Date.now() * 0.0002) * 0.05
      }

      threeRenderer.render(threeScene, threeCamera)
    }
  }
  loop()
}

// ── Navigation ────────────────────────────────────────────────

function goToSlide(index: number) {
  if (index < 0 || index >= props.slides.length) return
  currentSlide.value = index
  updateSlidePlanePositions()
  emit('slideChange', index)
}

function nextSlide() { goToSlide(currentSlide.value + 1) }
function prevSlide() { goToSlide(currentSlide.value - 1) }

// ── Keyboard ──────────────────────────────────────────────────

function onKeyDown(e: KeyboardEvent) {
  if (!props.isActive) return
  if (e.key === 'ArrowRight' || e.key === ' ') nextSlide()
  else if (e.key === 'ArrowLeft') prevSlide()
  else if (e.key === 'Escape') exit()
  else if (e.key === 'ArrowUp') nextSlide()
  else if (e.key === 'ArrowDown') prevSlide()
}

// ── 3D Model insertion ────────────────────────────────────────

async function insertModel(preset: PresetModel) {
  if (!threeScene) return
  showModelPanel.value = false
  // Create primitive geometry as placeholder for preset models
  let geo: THREE.BufferGeometry
  switch (preset.id) {
    case 'sphere': geo = new THREE.SphereGeometry(0.3, 32, 32); break
    case 'cube': geo = new THREE.BoxGeometry(0.4, 0.4, 0.4); break
    case 'cylinder': geo = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 32); break
    case 'cone': geo = new THREE.ConeGeometry(0.2, 0.5, 32); break
    case 'torus': geo = new THREE.TorusGeometry(0.2, 0.08, 16, 100); break
    default: geo = new THREE.SphereGeometry(0.3, 16, 16)
  }
  const mat = new THREE.MeshStandardMaterial({ color: 0x4a90e2, metalness: 0.3, roughness: 0.5 })
  const mesh = new THREE.Mesh(geo, mat)
  mesh.position.set(Math.random() * 2 - 1, Math.random(), -1)
  mesh.userData.modelId = preset.id
  threeScene.add(mesh)

  // Make it float/bob animation
  const baseY = mesh.position.y
  function animatedLoop() {
    if (animationFrameId !== null) {
      mesh.position.y = baseY + Math.sin(Date.now() * 0.002) * 0.1
      mesh.rotation.y += 0.01
    }
  }
  // Simple per-frame animation added to render loop
  const origRender = threeRenderer?.render?.bind(threeRenderer)
  if (threeCamera) threeRenderer?.render(threeScene, threeCamera)
}

async function insertCustomModel() {
  if (!modelUrlInput.value.trim() || !threeScene) return
  const url = modelUrlInput.value.trim()
  const isGLTF = url.endsWith('.gltf') || url.endsWith('.glb')
  if (!isGLTF) {
    alert('仅支持 glTF/GLB 格式')
    return
  }
  showModelPanel.value = false
  const loader = new GLTFLoader()
  try {
    const gltf = await new Promise<any>((res, rej) => loader.load(url, res, undefined, rej))
    const obj = gltf.scene
    obj.scale.setScalar(0.3)
    obj.position.set(0, 0, -2)
    obj.userData.modelId = 'custom'
    threeScene!.add(obj)
  } catch (e) {
    alert('模型加载失败: ' + (e as Error).message)
  }
}

// ── Lifecycle ──────────────────────────────────────────────────

async function enter(mode: 'vr' | 'panorama' | 'ar' | 'hologram' | 'auditorium') {
  if (mode === 'ar') await arvr.startAR()
  else if (mode === 'vr') await arvr.startVR()
  // panorama, hologram, auditorium: just use Three.js (no WebXR needed)
  initThree()
  window.addEventListener('keydown', onKeyDown)
  arvr.setupGestureListeners(overlayRef.value || document.body)
  arvr.onGesture(handleGesture)
}

function handleGesture(e: GestureEvent) {
  if (e.type === 'swipe_left' || e.type === 'swipe_up') nextSlide()
  else if (e.type === 'swipe_right' || e.type === 'swipe_down') prevSlide()
  else if (e.type === 'double_tap') {
    if (threeCamera) threeCamera.position.set(0, 0, 5)
  }
}

async function exit() {
  stop()
  emit('update:isActive', false)
}

function stop() {
  window.removeEventListener('keydown', onKeyDown)
  if (overlayRef.value) arvr.removeGestureListeners(overlayRef.value)
  stopRenderLoop()
  clearSlidePlanes()
  removePanoramaSphere()
  removeAuditorium()
  if (threeRenderer) {
    threeRenderer.dispose()
    threeRenderer = null
  }
  threeScene = null
  threeCamera = null
  arvr.stop()
}

function stopRenderLoop() {
  if (animationFrameId !== null) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

// Watch for active prop changes
watch(() => props.isActive, (active) => {
  if (active) {
    enter(selectedMode.value)
  } else {
    stop()
  }
})

// Watch slide changes from parent
watch(() => props.slides, () => {
  if (props.isActive && threeScene) {
    buildSlidePlanes()
  }
}, { deep: true })

onMounted(() => {
  if (props.isActive) enter(selectedMode.value)
})

onUnmounted(() => {
  stop()
})
</script>

<style scoped>
.arvr-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: #000;
  overflow: hidden;
}

.three-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

.arvr-loading,
.arvr-error {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: #fff;
  font-size: 18px;
  z-index: 10;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255,255,255,0.2);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* Toolbar */
.arvr-toolbar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: rgba(0,0,0,0.7);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 16px;
  z-index: 20;
  color: #fff;
}

.arvr-badge {
  font-size: 14px;
  font-weight: 600;
  background: rgba(255,255,255,0.15);
  padding: 4px 10px;
  border-radius: 12px;
}

/* Presentation mode tabs */
.arvr-mode-tabs {
  display: flex;
  gap: 4px;
  margin-left: 4px;
}

.mode-tab {
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.15);
  color: rgba(255,255,255,0.7);
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}
.mode-tab:hover {
  background: rgba(255,255,255,0.15);
  color: #fff;
}
.mode-tab.active {
  background: rgba(74,144,226,0.6);
  border-color: rgba(74,144,226,0.8);
  color: #fff;
  font-weight: 600;
}

.slide-counter {
  font-size: 14px;
  opacity: 0.8;
}

.arvr-toolbar .toolbar-btn {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: #fff;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.2s;
}
.arvr-toolbar .toolbar-btn:hover {
  background: rgba(255,255,255,0.2);
}

.transition-select {
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: #fff;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 13px;
}

/* Model insertion panel */
.model-insert-panel {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(20,20,30,0.9);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 16px;
  padding: 16px;
  min-width: 300px;
  z-index: 30;
  color: #fff;
}

.panel-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  opacity: 0.9;
}

.model-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.model-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 10px 6px;
  background: rgba(255,255,255,0.08);
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;
}
.model-card:hover { background: rgba(255,255,255,0.15); }
.model-icon { font-size: 24px; }
.model-name { font-size: 11px; opacity: 0.8; }

.model-url-input {
  display: flex;
  gap: 8px;
}
.form-input {
  flex: 1;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.2);
  color: #fff;
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 13px;
}
.btn-sm {
  background: #4a90e2;
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 13px;
  cursor: pointer;
}
.btn-outline {
  background: transparent;
  border: 1px solid rgba(255,255,255,0.3);
  color: #fff;
}

/* Gesture help */
.gesture-help {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 30;
  color: #fff;
}

.gesture-help-content {
  background: rgba(30,30,40,0.95);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 16px;
  padding: 24px 32px;
  max-width: 320px;
  width: 90%;
}
.gesture-help-content h3 {
  margin-bottom: 16px;
  font-size: 16px;
}
.gesture-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  font-size: 14px;
}
.gesture-row:last-of-type { border-bottom: none; }
.gesture-row span:first-child { opacity: 0.7; font-family: monospace; }

/* Transitions */
.slide-up-enter-active, .slide-up-leave-active {
  transition: transform 0.3s, opacity 0.3s;
}
.slide-up-enter-from, .slide-up-leave-to {
  transform: translateX(-50%) translateY(20px);
  opacity: 0;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>
