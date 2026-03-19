// Animation Effects Pro - 动画效果增强
import { ref, computed, onMounted, onUnmounted } from 'vue'

export type AnimationType =
  | 'fade' | 'fadeIn' | 'fadeOut'
  | 'slide' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight'
  | 'scale' | 'scaleIn' | 'scaleOut'
  | 'rotate' | 'rotateIn' | 'rotateOut'
  | 'bounce' | 'bounceIn' | 'bounceOut'
  | 'flip' | 'flipIn' | 'flipOut'
  | 'shake' | 'wiggle' | 'shudder'
  | 'pulse' | 'heartbeat'
  | 'rubberBand' | 'jello' | 'swing'
  | 'tada' | 'wobble' | 'twist'
  | 'ripple' | 'wave' | 'float'
  | 'glitch' | 'blur' | 'glow'

export interface AnimationConfig {
  duration: number
  delay: number
  easing: string
  iterations: number | 'infinite'
  direction: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse'
  fill: 'none' | 'forwards' | 'backwards' | 'both'
}

export interface AnimationPreset {
  id: AnimationType
  name: string
  nameEn: string
  keyframes: Keyframe[]
  config: AnimationConfig
}

export const animationPresets: AnimationPreset[] = [
  // 淡入淡出
  { id: 'fadeIn', name: '淡入', nameEn: 'Fade In', keyframes: [{ opacity: 0 }, { opacity: 1 }], config: { duration: 300, delay: 0, easing: 'ease', iterations: 1, direction: 'normal', fill: 'both' }},
  { id: 'fadeOut', name: '淡出', nameEn: 'Fade Out', keyframes: [{ opacity: 1 }, { opacity: 0 }], config: { duration: 300, delay: 0, easing: 'ease', iterations: 1, direction: 'normal', fill: 'both' }},
  // 滑动
  { id: 'slideUp', name: '上滑', nameEn: 'Slide Up', keyframes: [{ transform: 'translateY(20px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], config: { duration: 300, delay: 0, easing: 'ease-out', iterations: 1, direction: 'normal', fill: 'both' }},
  { id: 'slideDown', name: '下滑', nameEn: 'Slide Down', keyframes: [{ transform: 'translateY(-20px)', opacity: 0 }, { transform: 'translateY(0)', opacity: 1 }], config: { duration: 300, delay: 0, easing: 'ease-out', iterations: 1, direction: 'normal', fill: 'both' }},
  { id: 'slideLeft', name: '左滑', nameEn: 'Slide Left', keyframes: [{ transform: 'translateX(20px)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }], config: { duration: 300, delay: 0, easing: 'ease-out', iterations: 1, direction: 'normal', fill: 'both' }},
  { id: 'slideRight', name: '右滑', nameEn: 'Slide Right', keyframes: [{ transform: 'translateX(-20px)', opacity: 0 }, { transform: 'translateX(0)', opacity: 1 }], config: { duration: 300, delay: 0, easing: 'ease-out', iterations: 1, direction: 'normal', fill: 'both' }},
  // 缩放
  { id: 'scaleIn', name: '放大', nameEn: 'Scale In', keyframes: [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], config: { duration: 300, delay: 0, easing: 'ease-out', iterations: 1, direction: 'normal', fill: 'both' }},
  { id: 'scaleOut', name: '缩小', nameEn: 'Scale Out', keyframes: [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(0)', opacity: 0 }], config: { duration: 300, delay: 0, easing: 'ease-in', iterations: 1, direction: 'normal', fill: 'both' }},
  // 旋转
  { id: 'rotateIn', name: '旋转进入', nameEn: 'Rotate In', keyframes: [{ transform: 'rotate(-180deg) scale(0)', opacity: 0 }, { transform: 'rotate(0) scale(1)', opacity: 1 }], config: { duration: 400, delay: 0, easing: 'ease-out', iterations: 1, direction: 'normal', fill: 'both' }},
  { id: 'rotateOut', name: '旋转退出', nameEn: 'Rotate Out', keyframes: [{ transform: 'rotate(0) scale(1)', opacity: 1 }, { transform: 'rotate(180deg) scale(0)', opacity: 0 }], config: { duration: 400, delay: 0, easing: 'ease-in', iterations: 1, direction: 'normal', fill: 'both' }},
  // 弹跳
  { id: 'bounceIn', name: '弹跳进入', nameEn: 'Bounce In', keyframes: [{ transform: 'scale(0)', opacity: 0 }, { transform: 'scale(1.2)', opacity: 1 }, { transform: 'scale(0.9)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }], config: { duration: 500, delay: 0, easing: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)', iterations: 1, direction: 'normal', fill: 'both' }},
  { id: 'bounce', name: '弹跳', nameEn: 'Bounce', keyframes: [{ transform: 'translateY(0)' }, { transform: 'translateY(-15px)' }, { transform: 'translateY(0)' }, { transform: 'translateY(-7px)' }, { transform: 'translateY(0)' }], config: { duration: 600, delay: 0, easing: 'ease-in-out', iterations: 1, direction: 'normal', fill: 'both' }},
  // 翻转
  { id: 'flipIn', name: '翻转进入', nameEn: 'Flip In', keyframes: [{ transform: 'perspective(400px) rotateY(90deg)', opacity: 0 }, { transform: 'perspective(400px) rotateY(0)', opacity: 1 }], config: { duration: 500, delay: 0, easing: 'ease', iterations: 1, direction: 'normal', fill: 'both' }},
  { id: 'flip', name: '翻转', nameEn: 'Flip', keyframes: [{ transform: 'perspective(400px) rotateY(0)' }, { transform: 'perspective(400px) rotateY(180deg)' }, { transform: 'perspective(400px) rotateY(0)' }], config: { duration: 600, delay: 0, easing: 'ease', iterations: 1, direction: 'normal', fill: 'both' }},
  // 摇晃
  { id: 'shake', name: '摇晃', nameEn: 'Shake', keyframes: [{ transform: 'translateX(0)' }, { transform: 'translateX(-10px)' }, { transform: 'translateX(10px)' }, { transform: 'translateX(-10px)' }, { transform: 'translateX(10px)' }, { transform: 'translateX(0)' }], config: { duration: 400, delay: 0, easing: 'ease-in-out', iterations: 1, direction: 'normal', fill: 'both' }},
  { id: 'wiggle', name: '扭动', nameEn: 'Wiggle', keyframes: [{ transform: 'rotate(0)' }, { transform: 'rotate(-3deg)' }, { transform: 'rotate(3deg)' }, { transform: 'rotate(-3deg)' }, { transform: 'rotate(3deg)' }, { transform: 'rotate(0)' }], config: { duration: 400, delay: 0, easing: 'ease-in-out', iterations: 1, direction: 'normal', fill: 'both' }},
  // 脉冲
  { id: 'pulse', name: '脉冲', nameEn: 'Pulse', keyframes: [{ transform: 'scale(1)' }, { transform: 'scale(1.05)' }, { transform: 'scale(1)' }], config: { duration: 1000, delay: 0, easing: 'ease-in-out', iterations: 'infinite', direction: 'normal', fill: 'both' }},
  { id: 'heartbeat', name: '心跳', nameEn: 'Heartbeat', keyframes: [{ transform: 'scale(1)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }], config: { duration: 800, delay: 0, easing: 'ease-in-out', iterations: 'infinite', direction: 'normal', fill: 'both' }},
  // 橡皮筋
  { id: 'rubberBand', name: '橡皮筋', nameEn: 'Rubber Band', keyframes: [{ transform: 'scale(1, 1)' }, { transform: 'scale(1.25, 0.75)' }, { transform: 'scale(0.75, 1.25)' }, { transform: 'scale(1.15, 0.85)' }, { transform: 'scale(0.95, 1.05)' }, { transform: 'scale(1.05, 0.95)' }, { transform: 'scale(1, 1)' }], config: { duration: 600, delay: 0, easing: 'ease', iterations: 1, direction: 'normal', fill: 'both' }},
  // 摇摆
  { id: 'swing', name: '摇摆', nameEn: 'Swing', keyframes: [{ transform: 'rotate(0)' }, { transform: 'rotate(15deg)' }, { transform: 'rotate(-10deg)' }, { transform: 'rotate(5deg)' }, { transform: 'rotate(-3deg)' }, { transform: 'rotate(0)' }], config: { duration: 500, delay: 0, easing: 'ease-in-out', iterations: 1, direction: 'normal', fill: 'both' }},
  // 欢呼
  { id: 'tada', name: '欢呼', nameEn: 'Tada', keyframes: [{ transform: 'scale(1) rotate(0)' }, { transform: 'scale(0.9) rotate(-3deg)' }, { transform: 'scale(1.1) rotate(3deg)' }, { transform: 'scale(1.1) rotate(-3deg)' }, { transform: 'scale(1.1) rotate(3deg)' }, { transform: 'scale(1) rotate(0)' }], config: { duration: 700, delay: 0, easing: 'ease-in-out', iterations: 1, direction: 'normal', fill: 'both' }},
  // 摇晃不稳
  { id: 'wobble', name: '摇晃不稳', nameEn: 'Wobble', keyframes: [{ transform: 'translateX(0) rotate(0)' }, { transform: 'translateX(-25%) rotate(-5deg)' }, { transform: 'translateX(20%) rotate(3deg)' }, { transform: 'translateX(-15%) rotate(-3deg)' }, { transform: 'translateX(10%) rotate(2deg)' }, { transform: 'translateX(0) rotate(0)' }], config: { duration: 600, delay: 0, easing: 'ease-in-out', iterations: 1, direction: 'normal', fill: 'both' }},
  // 波纹
  { id: 'ripple', name: '波纹', nameEn: 'Ripple', keyframes: [{ transform: 'scale(0)', opacity: 1 }, { transform: 'scale(4)', opacity: 0 }], config: { duration: 1000, delay: 0, easing: 'ease-out', iterations: 1, direction: 'normal', fill: 'both' }},
  // 浮动
  { id: 'float', name: '浮动', nameEn: 'Float', keyframes: [{ transform: 'translateY(0)' }, { transform: 'translateY(-10px)' }, { transform: 'translateY(0)' }], config: { duration: 2000, delay: 0, easing: 'ease-in-out', iterations: 'infinite', direction: 'alternate', fill: 'both' }},
  // 模糊
  { id: 'blur', name: '模糊', nameEn: 'Blur', keyframes: [{ filter: 'blur(0)' }, { filter: 'blur(5px)' }, { filter: 'blur(0)' }], config: { duration: 500, delay: 0, easing: 'ease', iterations: 1, direction: 'normal', fill: 'both' }},
  // 发光
  { id: 'glow', name: '发光', nameEn: 'Glow', keyframes: [{ boxShadow: '0 0 5px rgba(0,0,0,0)' }, { boxShadow: '0 0 20px rgba(255,215,0,0.8)' }, { boxShadow: '0 0 5px rgba(0,0,0,0)' }], config: { duration: 1000, delay: 0, easing: 'ease-in-out', iterations: 'infinite', direction: 'normal', fill: 'both' }}
]

export function useAnimationEffectsPro() {
  // 当前动画
  const activeAnimations = ref<Map<string, AnimationType>>(new Map())

  // 全局设置
  const settings = ref({
    enabled: true,
    reducedMotion: false,
    defaultDuration: 300
  })

  // 应用动画
  const applyAnimation = (element: HTMLElement, animation: AnimationType, customConfig?: Partial<AnimationConfig>): Promise<void> => {
    if (!settings.value.enabled || settings.value.reducedMotion) {
      return Promise.resolve()
    }

    const preset = animationPresets.find(a => a.id === animation)
    if (!preset) return Promise.resolve()

    const config = { ...preset.config, ...customConfig }
    const id = element.id || `anim_${Date.now()}`

    activeAnimations.value.set(id, animation)

    const animationInstance = element.animate(preset.keyframes, {
      duration: config.duration,
      delay: config.delay,
      easing: config.easing,
      iterations: config.iterations === 'infinite' ? Infinity : config.iterations,
      direction: config.direction,
      fill: config.fill
    })

    return new Promise(resolve => {
      animationInstance.onfinish = () => {
        activeAnimations.value.delete(id)
        resolve()
      }
    })
  }

  // 淡入
  const fadeIn = (element: HTMLElement, duration = 300) => applyAnimation(element, 'fadeIn', { duration })

  // 淡出
  const fadeOut = (element: HTMLElement, duration = 300) => applyAnimation(element, 'fadeOut', { duration })

  // 弹跳
  const bounce = (element: HTMLElement) => applyAnimation(element, 'bounce')

  // 脉冲
  const pulse = (element: HTMLElement) => applyAnimation(element, 'pulse')

  // 摇晃
  const shake = (element: HTMLElement) => applyAnimation(element, 'shake')

  // 滑动
  const slide = (element: HTMLElement, direction: 'up' | 'down' | 'left' | 'right' = 'up') => {
    const animations = { up: 'slideUp', down: 'slideDown', left: 'slideLeft', right: 'slideRight' }
    return applyAnimation(element, animations[direction])
  }

  // 缩放
  const scale = (element: HTMLElement, direction: 'in' | 'out' = 'in') => {
    return applyAnimation(element, direction === 'in' ? 'scaleIn' : 'scaleOut')
  }

  // 翻转
  const flip = (element: HTMLElement) => applyAnimation(element, 'flipIn')

  // 波纹点击效果
  const createRipple = (event: MouseEvent, element: HTMLElement) => {
    const ripple = document.createElement('span')
    ripple.style.cssText = `
      position: absolute;
      border-radius: 50%;
      background: rgba(255,255,255,0.4);
      transform: scale(0);
      animation: ripple 0.6s linear;
      pointer-events: none;
    `

    const rect = element.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    ripple.style.width = ripple.style.height = `${size}px`
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`

    element.appendChild(ripple)
    setTimeout(() => ripple.remove(), 600)
  }

  // 获取所有动画
  const getAnimations = computed(() => animationPresets)

  // 获取动画列表
  const getAnimationList = () => animationPresets

  return {
    activeAnimations,
    settings,
    applyAnimation,
    fadeIn,
    fadeOut,
    bounce,
    pulse,
    shake,
    slide,
    scale,
    flip,
    createRipple,
    getAnimations,
    getAnimationList
  }
}

export default useAnimationEffectsPro
