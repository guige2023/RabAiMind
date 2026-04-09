// useAnimation.ts - Advanced Animation Engine for RabAiMind
// Supports: custom sequences, preset library, bezier curves, text animations, 3D transitions

export type EasingType =
  | 'linear'
  | 'ease'
  | 'ease-in'
  | 'ease-out'
  | 'ease-in-out'
  | 'bounce'
  | 'elastic'
  | 'sharp'
  | 'smooth'
  | 'snappy'
  | 'gentle'
  | 'overshoot'
  | 'spring'
  // Bezier presets
  | 'bezier-smooth'
  | 'bezier-snappy'
  | 'bezier-bounce'
  | 'bezier-overshoot'
  | 'bezier-linear'

export type AnimationType =
  | 'fade'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'scale-in'
  | 'scale-out'
  | 'rotate-in'
  | 'bounce-in'
  | 'zoom-in'
  | 'zoom-out'
  | 'flip-x'
  | 'flip-y'
  | 'wipe'
  | 'blur-in'
  | 'typewriter'
  | 'letter-by-letter'
  | 'word-by-word'

export type BezierCurve = [number, number, number, number]

// Built-in bezier curves
export const BEZIER_CURVES: Record<string, BezierCurve> = {
  'linear':            [0, 0, 1, 1],
  'ease':              [0.25, 0.1, 0.25, 1.0],
  'ease-in':           [0.42, 0, 1.0, 1.0],
  'ease-out':          [0, 0, 0.58, 1.0],
  'ease-in-out':       [0.42, 0, 0.58, 1.0],
  'smooth':           [0.4, 0, 0.2, 1.0],       // Material standard
  'snappy':           [0.0, 0.0, 0.2, 1.0],     // Quick start
  'bounce':           [0.68, -0.55, 0.265, 1.55], // Bounce end
  'overshoot':        [0.175, 0.885, 0.32, 1.275], // Slight overshoot
  'spring':           [0.34, 1.56, 0.64, 1.0],   // Spring physics
  'gentle':           [0.25, 0.1, 0.25, 1.0],    // Gentle
  'sharp':            [0.0, 0.0, 0.6, 1.0],      // Sharp deceleration
  'dramatic':         [0.6, 0.0, 0.4, 1.0],       // Dramatic
  'wipe':             [0.0, 1.0, 1.0, 1.0],       // Linear start
}

export function easingToCubic(easing: EasingType): string {
  const curve = BEZIER_CURVES[easing]
  if (curve) return `cubic-bezier(${curve.join(', ')})`
  return `cubic-bezier(0.25, 0.1, 0.25, 1.0)`
}

// Animation preset library
export interface AnimationPreset {
  id: string
  name: string
  nameZh: string
  description: string
  animation: AnimationConfig
}

export interface AnimationConfig {
  type: AnimationType
  duration: number      // seconds
  delay: number         // seconds before start
  easing: EasingType
  // For sequences
  sequence?: AnimationStep[]
  // For text animations
  textMode?: 'letter' | 'word' | 'line'
  textStagger?: number  // ms between each letter/word
  // 3D
  perspective?: number
  rotate3d?: string      // CSS transform rotate3d string
  // Curve overrides
  customCurve?: BezierCurve
}

export interface AnimationStep {
  type: AnimationType
  duration: number
  easing: EasingType
  delay?: number
}

export const ANIMATION_PRESETS: AnimationPreset[] = [
  {
    id: 'fade-in-up',
    name: 'Fade In Up',
    nameZh: '淡入上浮',
    description: 'Elements fade in while moving up',
    animation: { type: 'slide-up', duration: 0.5, delay: 0, easing: 'smooth' }
  },
  {
    id: 'scale-in',
    name: 'Scale In',
    nameZh: '缩放淡入',
    description: 'Elements scale from small to full size',
    animation: { type: 'scale-in', duration: 0.4, delay: 0, easing: 'bounce' }
  },
  {
    id: 'flip-banner',
    name: '3D Flip Banner',
    nameZh: '3D翻转横幅',
    description: 'Card flips in with 3D perspective',
    animation: { type: 'flip-y', duration: 0.6, delay: 0, easing: 'smooth', perspective: 1200 }
  },
  {
    id: 'typewriter',
    name: 'Typewriter',
    nameZh: '打字机效果',
    description: 'Text appears letter by letter',
    animation: { type: 'typewriter', duration: 1.5, delay: 0, easing: 'linear', textMode: 'letter', textStagger: 50 }
  },
  {
    id: 'word-reveal',
    name: 'Word Reveal',
    nameZh: '逐词显示',
    description: 'Words appear one at a time',
    animation: { type: 'word-by-word', duration: 2.0, delay: 0, easing: 'ease-out', textMode: 'word', textStagger: 200 }
  },
  {
    id: 'bounce-attention',
    name: 'Bounce Attention',
    nameZh: '弹跳吸引',
    description: 'Element bounces to get attention',
    animation: { type: 'bounce-in', duration: 0.6, delay: 0, easing: 'bounce' }
  },
  {
    id: 'slide-sequential',
    name: 'Sequential Slide',
    nameZh: '顺序滑入',
    description: 'Multiple elements slide in one by one',
    animation: {
      type: 'slide-up',
      duration: 0.5,
      delay: 0,
      easing: 'smooth',
      sequence: [
        { type: 'slide-up', duration: 0.5, easing: 'smooth' },
        { type: 'fade', duration: 0.3, easing: 'ease-out', delay: 0.1 },
        { type: 'scale-in', duration: 0.4, easing: 'snappy', delay: 0.2 }
      ]
    }
  },
  {
    id: 'wipe-in',
    name: 'Wipe In',
    nameZh: '擦拭进入',
    description: 'Element wipes in from left',
    animation: { type: 'wipe', duration: 0.5, delay: 0, easing: 'linear' }
  },
  {
    id: 'blur-sharp',
    name: 'Blur to Sharp',
    nameZh: '模糊变清晰',
    description: 'Element transitions from blurred to sharp',
    animation: { type: 'blur-in', duration: 0.6, delay: 0, easing: 'sharp' }
  },
  {
    id: 'zoom-punch',
    name: 'Zoom Punch',
    nameZh: '缩放冲击',
    description: 'Quick zoom with slight overshoot',
    animation: { type: 'zoom-in', duration: 0.4, delay: 0, easing: 'overshoot' }
  },
  {
    id: 'combo-entrance',
    name: 'Combo Entrance',
    nameZh: '组合入场',
    description: 'Fade + slide + scale combined',
    animation: {
      type: 'slide-up',
      duration: 0.6,
      delay: 0,
      easing: 'smooth',
      sequence: [
        { type: 'fade', duration: 0.3, easing: 'ease-out' },
        { type: 'slide-up', duration: 0.5, easing: 'snappy', delay: 0.1 },
        { type: 'scale-in', duration: 0.4, easing: 'gentle', delay: 0.2 }
      ]
    }
  },
  {
    id: '3d-carousel',
    name: '3D Carousel Slide',
    nameZh: '3D轮播滑动',
    description: 'Slide with 3D carousel effect',
    animation: { type: 'slide-left', duration: 0.7, delay: 0, easing: 'spring', perspective: 1500 }
  },
  {
    id: 'flip-3d-x',
    name: '3D Flip Horizontal',
    nameZh: '3D水平翻转',
    description: 'Element flips horizontally in 3D',
    animation: { type: 'flip-x', duration: 0.6, delay: 0, easing: 'smooth', perspective: 1200 }
  },
]

// CSS keyframes template for animations
export function generateAnimationCSS(preset: AnimationPreset, elementId: string): string {
  const { type, duration, easing, perspective } = preset.animation
  const curve = easingToCubic(easing as EasingType)
  const persp = perspective ? `perspective(${perspective}px)` : ''

  const keyframesMap: Record<string, string> = {
    'fade': `@keyframes ${elementId}_anim {
  from { opacity: 0; }
  to { opacity: 1; }
}`,
    'slide-up': `@keyframes ${elementId}_anim {
  from { opacity: 0; transform: translateY(30px) ${persp}; }
  to { opacity: 1; transform: translateY(0) ${persp}; }
}`,
    'slide-down': `@keyframes ${elementId}_anim {
  from { opacity: 0; transform: translateY(-30px) ${persp}; }
  to { opacity: 1; transform: translateY(0) ${persp}; }
}`,
    'slide-left': `@keyframes ${elementId}_anim {
  from { opacity: 0; transform: translateX(40px) ${persp}; }
  to { opacity: 1; transform: translateX(0) ${persp}; }
}`,
    'slide-right': `@keyframes ${elementId}_anim {
  from { opacity: 0; transform: translateX(-40px) ${persp}; }
  to { opacity: 1; transform: translateX(0) ${persp}; }
}`,
    'scale-in': `@keyframes ${elementId}_anim {
  from { opacity: 0; transform: scale(0.7) ${persp}; }
  to { opacity: 1; transform: scale(1) ${persp}; }
}`,
    'scale-out': `@keyframes ${elementId}_anim {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(1.3); }
}`,
    'bounce-in': `@keyframes ${elementId}_anim {
  0% { opacity: 0; transform: scale(0.3) ${persp}; }
  50% { transform: scale(1.1); }
  70% { transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1) ${persp}; }
}`,
    'zoom-in': `@keyframes ${elementId}_anim {
  from { opacity: 0; transform: scale(0.5) ${persp}; }
  to { opacity: 1; transform: scale(1) ${persp}; }
}`,
    'zoom-out': `@keyframes ${elementId}_anim {
  from { opacity: 1; transform: scale(1); }
  to { opacity: 0; transform: scale(1.5); }
}`,
    'flip-x': `@keyframes ${elementId}_anim {
  from { opacity: 0; transform: rotateX(-90deg) ${persp}; }
  to { opacity: 1; transform: rotateX(0deg) ${persp}; }
}`,
    'flip-y': `@keyframes ${elementId}_anim {
  from { opacity: 0; transform: rotateY(90deg) ${persp}; }
  to { opacity: 1; transform: rotateY(0deg) ${persp}; }
}`,
    'rotate-in': `@keyframes ${elementId}_anim {
  from { opacity: 0; transform: rotate(-20deg) scale(0.9) ${persp}; }
  to { opacity: 1; transform: rotate(0deg) scale(1) ${persp}; }
}`,
    'wipe': `@keyframes ${elementId}_anim {
  from { clip-path: inset(0 100% 0 0); }
  to { clip-path: inset(0 0% 0 0); }
}`,
    'blur-in': `@keyframes ${elementId}_anim {
  from { opacity: 0; filter: blur(12px); transform: scale(1.05) ${persp}; }
  to { opacity: 1; filter: blur(0); transform: scale(1) ${persp}; }
}`,
    'typewriter': `@keyframes ${elementId}_anim {
  from { clip-path: inset(0 100% 0 0); }
  to { clip-path: inset(0 0% 0 0); }
}`,
    'letter-by-letter': `@keyframes ${elementId}_anim {
  from { opacity: 0; transform: translateY(8px); filter: blur(4px); }
  to { opacity: 1; transform: translateY(0); filter: blur(0); }
}`,
    'word-by-word': `@keyframes ${elementId}_anim {
  from { opacity: 0; transform: translateX(-10px); }
  to { opacity: 1; transform: translateX(0); }
}`,
  }

  return keyframesMap[type] || keyframesMap['fade']
}

export function getAnimationStyle(preset: AnimationPreset, elementId: string): Record<string, string> {
  const { type, duration, delay, easing } = preset.animation
  const curve = easingToCubic(easing as EasingType)

  const specialStyles: Record<string, Record<string, string>> = {
    'wipe': { 'clip-path': 'inset(0 100% 0 0)', 'animation': `${elementId}_anim ${duration}s ${curve} forwards` },
    'typewriter': { 'clip-path': 'inset(0 100% 0 0)', 'animation': `${elementId}_anim ${duration}s ${curve} forwards` },
    'blur-in': { 'filter': 'blur(12px)', 'transform-origin': 'center' },
  }

  const base: Record<string, string> = {
    'animation-name': `${elementId}_anim`,
    'animation-duration': `${duration}s`,
    'animation-timing-function': curve,
    'animation-delay': `${delay}s`,
    'animation-fill-mode': 'forwards',
    'animation-iteration-count': '1',
  }

  if (specialStyles[type]) {
    return { ...base, ...specialStyles[type] }
  }

  return base
}
