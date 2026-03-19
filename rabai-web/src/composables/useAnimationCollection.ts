// Animation Collection - 动画集合
import { ref, computed } from 'vue'

export type AnimationType =
  | 'fade' | 'slide' | 'scale' | 'rotate' | 'flip' | 'bounce' | 'shake' | 'pulse'
  | 'zoom' | 'flip' | 'hinge' | 'roll' | 'jackInTheBox' | 'rollOut' | 'slideIn' | 'slideOut'
  | 'lightSpeed' | 'special' | 'particle' | 'wave' | 'cascade' | 'parallax' | 'typewriter' | 'glitch'

export type AnimationDirection = 'up' | 'down' | 'left' | 'right' | 'center'
export type AnimationEase = 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'spring' | 'bounce'

export interface AnimationPreset {
  id: string
  name: string
  nameEn: string
  type: AnimationType
  duration: number
  delay: number
  timing: AnimationEase
  fillMode: 'none' | 'forwards' | 'backwards' | 'both'
}

export interface ParticleConfig {
  count: number
  speed: number
  size: number
  color: string
  shape: 'circle' | 'square' | 'star'
  spread: number
}

export interface AnimationSequence {
  id: string
  name: string
  animations: AnimationPreset[]
  loop: boolean
}

export function useAnimationCollection() {
  // 动画预设集合
  const presets = ref<AnimationPreset[]>([
    // Fade 淡入淡出
    { id: 'fade-in', name: '淡入', nameEn: 'Fade In', type: 'fade', duration: 600, delay: 0, timing: 'ease-out', fillMode: 'forwards' },
    { id: 'fade-out', name: '淡出', nameEn: 'Fade Out', type: 'fade', duration: 600, delay: 0, timing: 'ease-in', fillMode: 'forwards' },
    { id: 'fade-in-up', name: '上浮淡入', nameEn: 'Fade In Up', type: 'fade', duration: 600, delay: 0, timing: 'ease-out', fillMode: 'forwards' },
    { id: 'fade-in-down', name: '下沉淡入', nameEn: 'Fade In Down', type: 'fade', duration: 600, delay: 0, timing: 'ease-out', fillMode: 'forwards' },
    { id: 'fade-in-left', name: '左移淡入', nameEn: 'Fade In Left', type: 'fade', duration: 600, delay: 0, timing: 'ease-out', fillMode: 'forwards' },
    { id: 'fade-in-right', name: '右移淡入', nameEn: 'Fade In Right', type: 'fade', duration: 600, delay: 0, timing: 'ease-out', fillMode: 'forwards' },

    // Slide 滑动
    { id: 'slide-in-up', name: '上滑进入', nameEn: 'Slide In Up', type: 'slide', duration: 500, delay: 0, timing: 'ease-out', fillMode: 'forwards' },
    { id: 'slide-in-down', name: '下滑进入', nameEn: 'Slide In Down', type: 'slide', duration: 500, delay: 0, timing: 'ease-out', fillMode: 'forwards' },
    { id: 'slide-in-left', name: '左滑进入', nameEn: 'Slide In Left', type: 'slide', duration: 500, delay: 0, timing: 'ease-out', fillMode: 'forwards' },
    { id: 'slide-in-right', name: '右滑进入', nameEn: 'Slide In Right', type: 'slide', duration: 500, delay: 0, timing: 'ease-out', fillMode: 'forwards' },
    { id: 'slide-out-up', name: '上滑离开', nameEn: 'Slide Out Up', type: 'slide', duration: 500, delay: 0, timing: 'ease-in', fillMode: 'forwards' },
    { id: 'slide-out-down', name: '下滑离开', nameEn: 'Slide Out Down', type: 'slide', duration: 500, delay: 0, timing: 'ease-in', fillMode: 'forwards' },

    // Scale 缩放
    { id: 'scale-in', name: '缩放进入', nameEn: 'Scale In', type: 'scale', duration: 400, delay: 0, timing: 'ease-out', fillMode: 'forwards' },
    { id: 'scale-out', name: '缩放离开', nameEn: 'Scale Out', type: 'scale', duration: 400, delay: 0, timing: 'ease-in', fillMode: 'forwards' },
    { id: 'zoom-in', name: '放大进入', nameEn: 'Zoom In', type: 'zoom', duration: 400, delay: 0, timing: 'ease-out', fillMode: 'forwards' },
    { id: 'zoom-out', name: '缩小离开', nameEn: 'Zoom Out', type: 'zoom', duration: 400, delay: 0, timing: 'ease-in', fillMode: 'forwards' },
    { id: 'pop-in', name: '弹出', nameEn: 'Pop In', type: 'scale', duration: 300, delay: 0, timing: 'spring', fillMode: 'forwards' },

    // Rotate 旋转
    { id: 'rotate-in', name: '旋转进入', nameEn: 'Rotate In', type: 'rotate', duration: 600, delay: 0, timing: 'ease-out', fillMode: 'forwards' },
    { id: 'rotate-out', name: '旋转离开', nameEn: 'Rotate Out', type: 'rotate', duration: 600, delay: 0, timing: 'ease-in', fillMode: 'forwards' },
    { id: 'spin', name: '旋转', nameEn: 'Spin', type: 'rotate', duration: 1000, delay: 0, timing: 'linear', fillMode: 'both' },

    // Flip 翻转
    { id: 'flip-in-x', name: 'X轴翻转进入', nameEn: 'Flip In X', type: 'flip', duration: 600, delay: 0, timing: 'ease-out', fillMode: 'forwards' },
    { id: 'flip-in-y', name: 'Y轴翻转进入', nameEn: 'Flip In Y', type: 'flip', duration: 600, delay: 0, timing: 'ease-out', fillMode: 'forwards' },
    { id: 'flip-out-x', name: 'X轴翻转离开', nameEn: 'Flip Out X', type: 'flip', duration: 600, delay: 0, timing: 'ease-in', fillMode: 'forwards' },
    { id: 'flip-out-y', name: 'Y轴翻转离开', nameEn: 'Flip Out Y', type: 'flip', duration: 600, delay: 0, timing: 'ease-in', fillMode: 'forwards' },

    // Bounce 弹跳
    { id: 'bounce-in', name: '弹跳进入', nameEn: 'Bounce In', type: 'bounce', duration: 800, delay: 0, timing: 'spring', fillMode: 'forwards' },
    { id: 'bounce-out', name: '弹跳离开', nameEn: 'Bounce Out', type: 'bounce', duration: 600, delay: 0, timing: 'ease-in', fillMode: 'forwards' },
    { id: 'bounce', name: '弹跳', nameEn: 'Bounce', type: 'bounce', duration: 1000, delay: 0, timing: 'spring', fillMode: 'both' },

    // Special 特殊
    { id: 'hinge', name: '铰链', nameEn: 'Hinge', type: 'hinge', duration: 2000, delay: 0, timing: 'ease-in-out', fillMode: 'forwards' },
    { id: 'roll-in', name: '滚入', nameEn: 'Roll In', type: 'roll', duration: 1000, delay: 0, timing: 'ease-out', fillMode: 'forwards' },
    { id: 'roll-out', name: '滚出', nameEn: 'Roll Out', type: 'rollOut', duration: 1000, delay: 0, timing: 'ease-in', fillMode: 'forwards' },
    { id: 'jack-in-box', name: '魔术盒', nameEn: 'Jack In The Box', type: 'jackInTheBox', duration: 700, delay: 0, timing: 'ease-out', fillMode: 'forwards' },
    { id: 'light-speed-in', name: '光速进入', nameEn: 'Light Speed In', type: 'lightSpeed', duration: 500, delay: 0, timing: 'ease-out', fillMode: 'forwards' },
    { id: 'light-speed-out', name: '光速离开', nameEn: 'Light Speed Out', type: 'lightSpeed', duration: 500, delay: 0, timing: 'ease-in', fillMode: 'forwards' },

    // Pulse 脉冲
    { id: 'pulse', name: '脉冲', nameEn: 'Pulse', type: 'pulse', duration: 1000, delay: 0, timing: 'ease-in-out', fillMode: 'both' },
    { id: 'heart-beat', name: '心跳', nameEn: 'Heart Beat', type: 'pulse', duration: 800, delay: 0, timing: 'ease-in-out', fillMode: 'both' },
    { id: 'wiggle', name: '摆动', nameEn: 'Wiggle', type: 'shake', duration: 500, delay: 0, timing: 'ease-in-out', fillMode: 'forwards' },
    { id: 'shake', name: '摇晃', nameEn: 'Shake', type: 'shake', duration: 500, delay: 0, timing: 'linear', fillMode: 'forwards' },
    { id: 'rubber-band', name: '橡皮筋', nameEn: 'Rubber Band', type: 'bounce', duration: 800, delay: 0, timing: 'spring', fillMode: 'forwards' },

    // Typewriter 打字机
    { id: 'typewriter', name: '打字机', nameEn: 'Typewriter', type: 'typewriter', duration: 2000, delay: 0, timing: 'linear', fillMode: 'forwards' },
    { id: 'blink', name: '闪烁', nameEn: 'Blink', type: 'pulse', duration: 1000, delay: 0, timing: 'linear', fillMode: 'both' },

    // Glitch 故障
    { id: 'glitch', name: '故障', nameEn: 'Glitch', type: 'glitch', duration: 500, delay: 0, timing: 'linear', fillMode: 'both' },

    // Complex 复合动画
    { id: 'flip-diagonal', name: '对角翻转', nameEn: 'Flip Diagonal', type: 'flip', duration: 700, delay: 0, timing: 'ease-out', fillMode: 'forwards' },
    { id: 'swing', name: '摇摆', nameEn: 'Swing', type: 'rotate', duration: 600, delay: 0, timing: 'ease-in-out', fillMode: 'forwards' }
  ])

  // 粒子配置
  const particleConfig = ref<ParticleConfig>({
    count: 50,
    speed: 2,
    size: 5,
    color: '#3b82f6',
    shape: 'circle',
    spread: 100
  })

  // 动画序列
  const sequences = ref<AnimationSequence[]>([])

  // 当前动画
  const currentAnimation = ref<string | null>(null)

  // 生成CSS动画
  const generateCSS = (preset: AnimationPreset): string => {
    const animations: Record<string, string> = {
      'fade-in': `opacity: 0; animation: fadeIn ${preset.duration}ms ${preset.timing} forwards`,
      'fade-out': `opacity: 1; animation: fadeOut ${preset.duration}ms ${preset.timing} forwards`,
      'fade-in-up': `opacity: 0; transform: translateY(20px); animation: fadeInUp ${preset.duration}ms ${preset.timing} forwards`,
      'fade-in-down': `opacity: 0; transform: translateY(-20px); animation: fadeInDown ${preset.duration}ms ${preset.timing} forwards`,
      'slide-in-up': `transform: translateY(100%); animation: slideInUp ${preset.duration}ms ${preset.timing} forwards`,
      'slide-in-down': `transform: translateY(-100%); animation: slideInDown ${preset.duration}ms ${preset.timing} forwards`,
      'slide-in-left': `transform: translateX(-100%); animation: slideInLeft ${preset.duration}ms ${preset.timing} forwards`,
      'slide-in-right': `transform: translateX(100%); animation: slideInRight ${preset.duration}ms ${preset.timing} forwards`,
      'scale-in': `transform: scale(0); animation: scaleIn ${preset.duration}ms ${preset.timing} forwards`,
      'zoom-in': `transform: scale(0); animation: zoomIn ${preset.duration}ms ${preset.timing} forwards`,
      'rotate-in': `transform: rotate(-180deg) scale(0); animation: rotateIn ${preset.duration}ms ${preset.timing} forwards`,
      'flip-in-x': `transform: rotateX(90deg); animation: flipInX ${preset.duration}ms ${preset.timing} forwards`,
      'flip-in-y': `transform: rotateY(90deg); animation: flipInY ${preset.duration}ms ${preset.timing} forwards`,
      'bounce-in': `transform: scale(0); animation: bounceIn ${preset.duration}ms ${preset.timing} forwards`,
      'pop-in': `transform: scale(0); animation: popIn ${preset.duration}ms ${preset.timing} forwards`,
      'pulse': `animation: pulse ${preset.duration}ms ${preset.timing} infinite`,
      'shake': `animation: shake ${preset.duration}ms ${preset.timing} forwards`,
      'spin': `animation: spin ${preset.duration}ms linear infinite`,
      'glitch': `animation: glitch ${preset.duration}ms ${preset.timing} forwards`
    }

    return animations[preset.id] || ''
  }

  // 应用动画
  const applyAnimation = (element: HTMLElement, presetId: string) => {
    const preset = presets.value.find(p => p.id === presetId)
    if (!preset) return

    currentAnimation.value = presetId

    const css = generateCSS(preset)
    element.style.cssText += css

    setTimeout(() => {
      currentAnimation.value = null
    }, preset.duration + preset.delay)
  }

  // 创建序列
  const createSequence = (name: string, animationIds: string[], loop = false): AnimationSequence => {
    const animations = animationIds
      .map(id => presets.value.find(p => p.id === id))
      .filter(Boolean) as AnimationPreset[]

    const sequence: AnimationSequence = {
      id: `seq_${Date.now()}`,
      name,
      animations,
      loop
    }

    sequences.value.push(sequence)
    return sequence
  }

  // 播放序列
  const playSequence = async (element: HTMLElement, sequenceId: string) => {
    const sequence = sequences.value.find(s => s.id === sequenceId)
    if (!sequence) return

    const play = async () => {
      for (const preset of sequence.animations) {
        applyAnimation(element, preset.id)
        await new Promise(r => setTimeout(r, preset.duration + preset.delay))
      }

      if (sequence.loop) {
        play()
      }
    }

    play()
  }

  // 获取分类动画
  const getByType = (type: AnimationType) => {
    return presets.value.filter(p => p.type === type)
  }

  // 随机动画
  const getRandom = () => {
    const index = Math.floor(Math.random() * presets.value.length)
    return presets.value[index]
  }

  // 随机应用
  const applyRandom = (element: HTMLElement) => {
    const random = getRandom()
    applyAnimation(element, random.id)
    return random
  }

  // 统计
  const stats = computed(() => ({
    total: presets.value.length,
    byType: presets.value.reduce((acc, p) => {
      acc[p.type] = (acc[p.type] || 0) + 1
      return acc
    }, {} as Record<string, number>),
    sequences: sequences.value.length,
    current: currentAnimation.value
  }))

  return {
    // 预设
    presets,
    getByType,
    getRandom,
    // CSS生成
    generateCSS,
    applyAnimation,
    applyRandom,
    // 序列
    sequences,
    createSequence,
    playSequence,
    // 粒子
    particleConfig,
    // 状态
    currentAnimation,
    // 统计
    stats
  }
}

export default useAnimationCollection
