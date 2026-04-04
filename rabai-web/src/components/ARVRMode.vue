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

        <!-- 3D Transition selector -->
        <div class="transition-3d-selector">
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

  // Build slide planes
  buildSlidePlanes()
  startAnimationLoop()
}

function buildSlidePlanes() {
  if (!threeScene) return
  clearSlidePlanes()
  const textureLoader = new THREE.TextureLoader()
  props.slides.forEach((slide, i) => {
    const geo = new THREE.PlaneGeometry(3.2, 2.4)
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      side: THREE.FrontSide,
      transparent: true,
      opacity: i === currentSlide.value ? 1 : 0.3,
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.userData.slideIndex = i

    if (slide.svgUrl) {
      textureLoader.load(slide.svgUrl, (tex) => {
        tex.colorSpace = THREE.SRGBColorSpace
        ;(mat as THREE.MeshStandardMaterial).map = tex
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
  slidePlanes.forEach((plane, i) => {
    const rel = i - currentSlide.value
    if (t === 'carousel') {
      const angle = rel * (Math.PI / 3)
      plane.position.x = Math.sin(angle) * 3
      plane.position.y = 0
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
      plane.position.y = 0
      plane.position.z = Math.cos(angle) * 2 - 3
      plane.rotation.y = -angle
    } else if (t === 'depth' || t === 'flythrough') {
      plane.position.x = 0
      plane.position.y = 0
      plane.position.z = -rel * 2
      plane.rotation.set(0, 0, 0)
    } else {
      // flip
      plane.position.x = rel * 3.2
      plane.position.y = 0
      plane.position.z = 0
      plane.rotation.set(0, rel === 0 ? 0 : Math.PI, 0)
    }

    // Active slide opacity
    const mat = plane.material as THREE.MeshStandardMaterial
    mat.opacity = i === currentSlide.value ? 1 : 0.2
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
          plane.position.x = Math.sin(angle) * 3
          plane.position.z = Math.cos(angle) * 3 - 3
          plane.rotation.y = -angle
        })
      }
      if (selected3DTransition.value === 'flythrough' && threeCamera) {
        threeCamera.position.z = Math.sin(Date.now() * 0.001) * 0.5
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
  const originalUpdate = loop
  function animatedLoop() {
    if (animationFrameId !== null) {
      mesh.position.y = baseY + Math.sin(Date.now() * 0.002) * 0.1
      mesh.rotation.y += 0.01
    }
  }
  // Simple per-frame animation added to render loop
  const origRender = threeRenderer?.render.bind(threeRenderer)
  threeRenderer?.render(threeScene, threeCamera)
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

async function enter(mode: 'ar' | 'vr') {
  if (mode === 'ar') await arvr.startAR()
  else await arvr.startVR()
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
    // Default to VR mode (most compatible)
    enter('vr')
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
  if (props.isActive) enter('vr')
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
