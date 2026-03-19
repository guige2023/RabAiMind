// Animation Effects - 动画效果库
import { ref, computed, onMounted, onUnmounted } from 'vue'

export type AnimationType = 'fade' | 'slide' | 'scale' | 'rotate' | 'bounce' | 'shake' | 'pulse' | 'flip' | 'zoom' | 'flipIn' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'zoomIn' | 'zoomOut' | 'bounceIn' | 'rubberBand' | 'headShake' | 'heartBeat' | 'jello' | 'swing' | 'tada' | 'wobble' | 'ripple'

export interface AnimationConfig {
  duration: number
  delay: number
  easing: string
  fill: 'none' | 'forwards' | 'backwards' | 'both'
  iterations: number | 'infinite'
}

export interface AnimationPreset {
  id: AnimationType
  name: string
  keyframes: Keyframe[]
  config: AnimationConfig
}

export const animationPresets: AnimationPreset[] = [
  {
    id: 'fade',
    name: '淡入淡出',
    keyframes: [
      { opacity: 0 },
      { opacity: 1 }
    ],
    config: { duration: 300, delay: 0, easing: 'ease', fill: 'forwards', iterations: 1 }
  },
  {
    id: 'slideUp',
    name: '上滑',
    keyframes: [
      { opacity: 0, transform: 'translateY(20px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ],
    config: { duration: 300, delay: 0, easing: 'ease-out', fill: 'forwards', iterations: 1 }
  },
  {
    id: 'slideDown',
    name: '下滑',
    keyframes: [
      { opacity: 0, transform: 'translateY(-20px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ],
    config: { duration: 300, delay: 0, easing: 'ease-out', fill: 'forwards', iterations: 1 }
  },
  {
    id: 'slideLeft',
    name: '左滑',
    keyframes: [
      { opacity: 0, transform: 'translateX(20px)' },
      { opacity: 1, transform: 'translateX(0)' }
    ],
    config: { duration: 300, delay: 0, easing: 'ease-out', fill: 'forwards', iterations: 1 }
  },
  {
    id: 'slideRight',
    name: '右滑',
    keyframes: [
      { opacity: 0, transform: 'translateX(-20px)' },
      { opacity: 1, transform: 'translateX(0)' }
    ],
    config: { duration: 300, delay: 0, easing: 'ease-out', fill: 'forwards', iterations: 1 }
  },
  {
    id: 'zoomIn',
    name: '放大',
    keyframes: [
      { opacity: 0, transform: 'scale(0.8)' },
      { opacity: 1, transform: 'scale(1)' }
    ],
    config: { duration: 300, delay: 0, easing: 'ease-out', fill: 'forwards', iterations: 1 }
  },
  {
    id: 'zoomOut',
    name: '缩小',
    keyframes: [
      { opacity: 0, transform: 'scale(1.2)' },
      { opacity: 1, transform: 'scale(1)' }
    ],
    config: { duration: 300, delay: 0, easing: 'ease-out', fill: 'forwards', iterations: 1 }
  },
  {
    id: 'bounceIn',
    name: '弹跳进入',
    keyframes: [
      { opacity: 0, transform: 'scale(0.3)' },
      { opacity: 1, transform: 'scale(1.05)' },
      { transform: 'scale(0.9)' },
      { transform: 'scale(1)' }
    ],
    config: { duration: 500, delay: 0, easing: 'ease', fill: 'forwards', iterations: 1 }
  },
  {
    id: 'bounce',
    name: '弹跳',
    keyframes: [
      { transform: 'translateY(0)' },
      { transform: 'translateY(-15px)' },
      { transform: 'translateY(0)' },
      { transform: 'translateY(-7px)' },
      { transform: 'translateY(0)' }
    ],
    config: { duration: 600, delay: 0, easing: 'ease-in-out', fill: 'forwards', iterations: 1 }
  },
  {
    id: 'shake',
    name: '摇晃',
    keyframes: [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(-10px)' },
      { transform: 'translateX(10px)' },
      { transform: 'translateX(0)' }
    ],
    config: { duration: 400, delay: 0, easing: 'ease-in-out', fill: 'forwards', iterations: 1 }
  },
  {
    id: 'pulse',
    name: '脉冲',
    keyframes: [
      { transform: 'scale(1)' },
      { transform: 'scale(1.05)' },
      { transform: 'scale(1)' }
    ],
    config: { duration: 1000, delay: 0, easing: 'ease-in-out', fill: 'forwards', iterations: 'infinite' }
  },
  {
    id: 'flipIn',
    name: '翻转进入',
    keyframes: [
      { opacity: 0, transform: 'rotateY(90deg)' },
      { opacity: 1, transform: 'rotateY(0)' }
    ],
    config: { duration: 500, delay: 0, easing: 'ease', fill: 'forwards', iterations: 1 }
  },
  {
    id: 'flip',
    name: '翻转',
    keyframes: [
      { transform: 'rotateY(0)' },
      { transform: 'rotateY(180deg)' },
      { transform: 'rotateY(0)' }
    ],
    config: { duration: 600, delay: 0, easing: 'ease', fill: 'forwards', iterations: 1 }
  },
  {
    id: 'rotate',
    name: '旋转',
    keyframes: [
      { transform: 'rotate(0deg)' },
      { transform: 'rotate(360deg)' }
    ],
    config: { duration: 500, delay: 0, easing: 'linear', fill: 'forwards', iterations: 1 }
  },
  {
    id: 'rubberBand',
    name: '橡皮筋',
    keyframes: [
      { transform: 'scale(1, 1)' },
      { transform: 'scale(1.25, 0.75)' },
      { transform: 'scale(0.75, 1.25)' },
      { transform: 'scale(1.15, 0.85)' },
      { transform: 'scale(0.95, 1.05)' },
      { transform: 'scale(1.05, 0.95)' },
      { transform: 'scale(1, 1)' }
    ],
    config: { duration: 600, delay: 0, easing: 'ease', fill: 'forwards', iterations: 1 }
  },
  {
    id: 'headShake',
    name: '摇头',
    keyframes: [
      { transform: 'translateX(0)' },
      { transform: 'translateX(-6px)' },
      { transform: 'translateX(6px)' },
      { transform: 'translateX(-6px)' },
      { transform: 'translateX(6px)' },
      { transform: 'translateX(0)' }
    ],
    config: { duration: 400, delay: 0, easing: 'ease-in-out', fill: 'forwards', iterations: 1 }
  },
  {
    id: 'heartBeat',
    name: '心跳',
    keyframes: [
      { transform: 'scale(1)' },
      { transform: 'scale(1.1)' },
      { transform: 'scale(1)' },
      { transform: 'scale(1.1)' },
      { transform: 'scale(1)' }
    ],
    config: { duration: 800, delay: 0, easing: 'ease-in-out', fill: 'forwards', iterations: 1 }
  },
  {
    id: 'jello',
    name: '果冻',
    keyframes: [
      { transform: 'scale(1, 1)' },
      { transform: 'scale(1.25, 0.75)' },
      { transform: 'scale(0.75, 1.25)' },
      { transform: 'scale(1.15, 0.85)' },
      { transform: 'scale(0.95, 1.05)' },
      { transform: 'scale(1.05, 0.95)' },
      { transform: 'scale(1, 1)' }
    ],
    config: { duration: 700, delay: 0, easing: 'ease', fill: 'forwards', iterations: 1 }
  },
  {
    id: 'swing',
    name: '摇摆',
    keyframes: [
      { transform: 'rotate(0deg)' },
      { transform: 'rotate(15deg)' },
      { transform: 'rotate(-10deg)' },
      { transform: 'rotate(5deg)' },
      { transform: 'rotate(-3deg)' },
      { transform: 'rotate(0deg)' }
    ],
    config: { duration: 500, delay: 0, easing: 'ease-in-out', fill: 'forwards', iterations: 1 }
  },
  {
    id: 'tada',
    name: '欢呼',
    keyframes: [
      { transform: 'scale(1) rotate(0)' },
      { transform: 'scale(0.9) rotate(-3deg)' },
      { transform: 'scale(0.9) rotate(-3deg)' },
      { transform: 'scale(1.1) rotate(3deg)' },
      { transform: 'scale(1.1) rotate(-3deg)' },
      { transform: 'scale(1.1) rotate(3deg)' },
      { transform: 'scale(1.1) rotate(-3deg)' },
      { transform: 'scale(1.1) rotate(3deg)' },
      { transform: 'scale(1) rotate(0)' }
    ],
    config: { duration: 700, delay: 0, easing: 'ease-in-out', fill: 'forwards', iterations: 1 }
  },
  {
    id: 'wobble',
    name: '摇晃不稳',
    keyframes: [
      { transform: 'translateX(0) rotate(0)' },
      { transform: 'translateX(-25%) rotate(-5deg)' },
      { transform: 'translateX(20%) rotate(3deg)' },
      { transform: 'translateX(-15%) rotate(-3deg)' },
      { transform: 'translateX(10%) rotate(2deg)' },
      { transform: 'translateX(0) rotate(0)' }
    ],
    config: { duration: 600, delay: 0, easing: 'ease-in-out', fill: 'forwards', iterations: 1 }
  },
  {
    id: 'ripple',
    name: '波纹',
    keyframes: [
      { transform: 'scale(0)', opacity: 1 },
      { transform: 'scale(4)', opacity: 0 }
    ],
    config: { duration: 1000, delay: 0, easing: 'ease-out', fill: 'forwards', iterations: 1 }
  }
]

export function useAnimationEffects() {
  // 当前动画
  const activeAnimations = ref<Map<string, AnimationType>>(new Map())

  // 配置
  const config = ref<AnimationConfig>({
    duration: 300,
    delay: 0,
    easing: 'ease',
    fill: 'forwards',
    iterations: 1
  })

  // 全局动画设置
  const globalSettings = ref({
    enabled: true,
    reducedMotion: false,
    defaultDuration: 300,
    staggerDelay: 50
  })

  // 应用动画到元素
  const applyAnimation = (
    element: HTMLElement,
    animation: AnimationType,
    customConfig?: Partial<AnimationConfig>
  ): Promise<void> => {
    if (!globalSettings.value.enabled) return Promise.resolve()
    if (globalSettings.value.reducedMotion) {
      element.style.opacity = '1'
      return Promise.resolve()
    }

    const preset = animationPresets.find(a => a.id === animation)
    if (!preset) return Promise.resolve()

    const animationConfig = { ...preset.config, ...customConfig }

    return new Promise((resolve) => {
      // 生成唯一动画名称
      const animationName = `anim_${animation}_${Date.now()}`

      // 创建关键帧动画
      const keyframes = new KeyframeTrack(
        `.${animationName}`,
        preset.keyframes
      )

      // 使用Web Animations API
      const animationInstance = element.animate(preset.keyframes, {
        duration: animationConfig.duration,
        delay: animationConfig.delay,
        easing: animationConfig.easing,
        fill: animationConfig.fill,
        iterations: animationConfig.iterations as number
      })

      // 记录活动动画
      activeAnimations.value.set(
        element.id || `element_${activeAnimations.value.size}`,
        animation
      )

      animationInstance.onfinish = () => {
        activeAnimations.value.delete(element.id || '')
        resolve()
      }
    })
  }

  // 停止动画
  const stopAnimation = (element: HTMLElement) => {
    const animations = element.getAnimations()
    animations.forEach(anim => anim.cancel())
  }

  // 批量应用动画（交错）
  const staggerAnimation = async (
    elements: HTMLElement[],
    animation: AnimationType,
    staggerDelay?: number
  ) => {
    const delay = staggerDelay || globalSettings.value.staggerDelay

    const promises = elements.map((el, index) => {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          applyAnimation(el, animation).then(() => resolve())
        }, index * delay)
      })
    })

    return Promise.all(promises)
  }

  // 创建CSS动画类
  const createAnimationClass = (animation: AnimationType): string => {
    const preset = animationPresets.find(a => a.id === animation)
    if (!preset) return ''

    const { duration, delay, easing, iterations } = preset.config
    const iter = iterations === 'infinite' ? 'infinite' : iterations

    return `
      animation: ${animation}-anim ${duration}ms ${easing} ${delay}ms ${iter} forwards;
    `
  }

  // 淡入效果
  const fadeIn = (element: HTMLElement, duration = 300) => {
    return applyAnimation(element, 'fade', { duration })
  }

  // 淡出效果
  const fadeOut = async (element: HTMLElement, duration = 300) => {
    element.style.transition = `opacity ${duration}ms`
    element.style.opacity = '0'

    return new Promise(resolve => setTimeout(resolve, duration))
  }

  // 滑入效果
  const slideIn = (
    element: HTMLElement,
    direction: 'up' | 'down' | 'left' | 'right' = 'up',
    duration = 300
  ) => {
    const animations: Record<string, AnimationType> = {
      up: 'slideUp',
      down: 'slideDown',
      left: 'slideLeft',
      right: 'slideRight'
    }
    return applyAnimation(element, animations[direction], { duration })
  }

  // 弹出效果
  const popIn = (element: HTMLElement, duration = 300) => {
    return applyAnimation(element, 'bounceIn', { duration })
  }

  // 摇晃效果
  const shake = (element: HTMLElement) => {
    return applyAnimation(element, 'shake')
  }

  // 脉冲效果
  const pulse = (element: HTMLElement) => {
    return applyAnimation(element, 'pulse')
  }

  // 翻转效果
  const flip = (element: HTMLElement) => {
    return applyAnimation(element, 'flipIn')
  }

  // 旋转效果
  const spin = (element: HTMLElement, duration = 500) => {
    return applyAnimation(element, 'rotate', { duration })
  }

  // 缩放效果
  const scale = (element: HTMLElement, scaleValue: number = 1.1, duration = 200) => {
    element.style.transition = `transform ${duration}ms`
    element.style.transform = `scale(${scaleValue})`

    return new Promise(resolve => setTimeout(resolve, duration))
  }

  // 涟漪效果（点击反馈）
  const createRipple = (event: MouseEvent, element: HTMLElement) => {
    const ripple = document.createElement('span')
    ripple.classList.add('ripple-effect')

    const rect = element.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)

    ripple.style.width = ripple.style.height = `${size}px`
    ripple.style.left = `${event.clientX - rect.left - size / 2}px`
    ripple.style.top = `${event.clientY - rect.top - size / 2}px`

    element.appendChild(ripple)

    setTimeout(() => ripple.remove(), 1000)
  }

  // 切换动画
  const toggleAnimations = (enabled: boolean) => {
    globalSettings.value.enabled = enabled
  }

  // 减少动画（无障碍）
  const setReducedMotion = (reduced: boolean) => {
    globalSettings.value.reducedMotion = reduced

    if (reduced) {
      document.documentElement.classList.add('reduced-motion')
    } else {
      document.documentElement.classList.remove('reduced-motion')
    }
  }

  // 获取动画列表
  const getAnimations = computed(() => animationPresets)

  return {
    // 配置和状态
    config,
    globalSettings,
    activeAnimations,
    // 方法
    applyAnimation,
    stopAnimation,
    staggerAnimation,
    createAnimationClass,
    fadeIn,
    fadeOut,
    slideIn,
    popIn,
    shake,
    pulse,
    flip,
    spin,
    scale,
    createRipple,
    toggleAnimations,
    setReducedMotion,
    // 数据
    animationPresets,
    getAnimations
  }
}

export default useAnimationEffects
