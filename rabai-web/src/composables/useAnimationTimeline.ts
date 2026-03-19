// Animation Timeline - 动画时间线与序列
import { ref, computed, onMounted, onUnmounted } from 'vue'

export interface TimelineKeyframe {
  id: string
  time: number
  element: HTMLElement
  animation: string
  duration?: number
  delay?: number
  easing?: string
}

export interface AnimationSequence {
  id: string
  name: string
  keyframes: TimelineKeyframe[]
  autoplay: boolean
  loop: boolean
}

export interface AnimationTimelineConfig {
  defaultDuration: number
  defaultEasing: string
  enableStagger: boolean
  staggerDelay: number
}

export function useAnimationTimeline() {
  // 配置
  const config = ref<AnimationTimelineConfig>({
    defaultDuration: 300,
    defaultEasing: 'ease-out',
    enableStagger: true,
    staggerDelay: 50
  })

  // 时间线
  const sequences = ref<AnimationSequence[]>([])
  const activeSequence = ref<string | null>(null)
  const currentTime = ref(0)
  const isPlaying = ref(false)

  // 动画状态
  const animationStates = ref<Map<string, 'idle' | 'playing' | 'paused' | 'completed'>>(new Map())

  // 创建序列
  const createSequence = (name: string, options?: Partial<AnimationSequence>): AnimationSequence => {
    const sequence: AnimationSequence = {
      id: `seq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      keyframes: [],
      autoplay: false,
      loop: false,
      ...options
    }
    sequences.value.push(sequence)
    return sequence
  }

  // 添加关键帧
  const addKeyframe = (
    sequenceId: string,
    element: HTMLElement,
    animation: string,
    time: number,
    options?: { duration?: number; delay?: number; easing?: string }
  ): TimelineKeyframe => {
    const sequence = sequences.value.find(s => s.id === sequenceId)
    if (!sequence) throw new Error('Sequence not found')

    const keyframe: TimelineKeyframe = {
      id: `kf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      time,
      element,
      animation,
      duration: options?.duration ?? config.value.defaultDuration,
      delay: options?.delay ?? 0,
      easing: options?.easing ?? config.value.defaultEasing
    }

    sequence.keyframes.push(keyframe)
    sequence.keyframes.sort((a, b) => a.time - b.time)

    return keyframe
  }

  // 播放序列
  const playSequence = async (sequenceId: string) => {
    const sequence = sequences.value.find(s => s.id === sequenceId)
    if (!sequence) return

    activeSequence.value = sequenceId
    isPlaying.value = true
    animationStates.value.set(sequenceId, 'playing')

    const maxTime = Math.max(...sequence.keyframes.map(k => k.time + (k.duration || 0)))
    const startTime = performance.now()

    const animate = (timestamp: number) => {
      if (!isPlaying.value || activeSequence.value !== sequenceId) return

      const elapsed = timestamp - startTime
      currentTime.value = elapsed

      // 执行当前时间点的关键帧
      sequence.keyframes.forEach(keyframe => {
        if (elapsed >= keyframe.time && elapsed < keyframe.time + (keyframe.duration || 0)) {
          // 触发动画
          keyframe.element.classList.add(`animate-${keyframe.animation}`)
        }
      })

      if (elapsed < maxTime) {
        requestAnimationFrame(animate)
      } else {
        completeSequence(sequenceId)
      }
    }

    requestAnimationFrame(animate)
  }

  // 完成序列
  const completeSequence = (sequenceId: string) => {
    const sequence = sequences.value.find(s => s.id === sequenceId)
    if (!sequence) return

    isPlaying.value = false
    animationStates.value.set(sequenceId, 'completed')
    currentTime.value = 0

    if (sequence.loop) {
      setTimeout(() => playSequence(sequenceId), 500)
    }
  }

  // 暂停
  const pauseSequence = () => {
    isPlaying.value = false
    if (activeSequence.value) {
      animationStates.value.set(activeSequence.value, 'paused')
    }
  }

  // 恢复
  const resumeSequence = () => {
    if (activeSequence.value) {
      isPlaying.value = true
      animationStates.value.set(activeSequence.value, 'playing')
      // 重新开始播放
      playSequence(activeSequence.value)
    }
  }

  // 停止
  const stopSequence = (sequenceId?: string) => {
    const id = sequenceId || activeSequence.value
    if (!id) return

    isPlaying.value = false
    activeSequence.value = null
    currentTime.value = 0
    animationStates.value.set(id, 'idle')

    // 清除动画类
    const sequence = sequences.value.find(s => s.id === id)
    if (sequence) {
      sequence.keyframes.forEach(k => {
        k.element.className = k.element.className.replace(/animate-\w+/g, '').trim()
      })
    }
  }

  // 交错动画 - 批量添加
  const staggerAnimations = (
    sequenceId: string,
    elements: HTMLElement[],
    animation: string,
    startTime: number,
    options?: { duration?: number; easing?: string }
  ) => {
    elements.forEach((element, index) => {
      const time = startTime + index * config.value.staggerDelay
      addKeyframe(sequenceId, element, animation, time, options)
    })
  }

  // 并行动画 - 同时执行
  const parallelAnimations = (
    sequenceId: string,
    animations: { element: HTMLElement; animation: string; delay?: number }[],
    startTime: number,
    options?: { duration?: number; easing?: string }
  ) => {
    animations.forEach(({ element, animation, delay = 0 }) => {
      addKeyframe(sequenceId, element, animation, startTime + delay, options)
    })
  }

  // 预设序列
  const presetSequences = {
    // 列表项依次出现
    listEnter: (elements: HTMLElement[], animation = 'fadeInUp') => {
      const seq = createSequence('listEnter', { autoplay: true })
      staggerAnimations(seq.id, elements, animation, 0, { duration: 400 })
      return seq
    },

    // 页面加载
    pageEnter: (elements: HTMLElement[]) => {
      const seq = createSequence('pageEnter', { autoplay: true })
      const animations = [
        { element: elements[0], animation: 'fadeIn', delay: 0 },
        { element: elements[1] || elements[0], animation: 'fadeInUp', delay: 100 },
        { element: elements[2] || elements[0], animation: 'fadeInUp', delay: 200 }
      ]
      parallelAnimations(seq.id, animations, 0, { duration: 500 })
      return seq
    },

    // 成功反馈
    successFeedback: (elements: HTMLElement[]) => {
      const seq = createSequence('successFeedback')
      elements.forEach((el, i) => {
        addKeyframe(seq.id, el, 'scaleIn', i * 100, { duration: 200 })
      })
      addKeyframe(seq.id, elements[0], 'pulse', 500)
      return seq
    },

    // 错误反馈
    errorFeedback: (element: HTMLElement) => {
      const seq = createSequence('errorFeedback')
      addKeyframe(seq.id, element, 'shake', 0, { duration: 400 })
      addKeyframe(seq.id, element, 'fadeIn', 200, { duration: 200 })
      return seq
    }
  }

  // 统计
  const stats = computed(() => ({
    totalSequences: sequences.value.length,
    activeSequence: activeSequence.value,
    currentTime: currentTime.value,
    isPlaying: isPlaying.value,
    totalKeyframes: sequences.value.reduce((sum, s) => sum + s.keyframes.length, 0)
  }))

  // 清理
  const cleanup = () => {
    stopSequence()
    sequences.value = []
  }

  onUnmounted(() => {
    cleanup()
  })

  return {
    config,
    sequences,
    activeSequence,
    currentTime,
    isPlaying,
    animationStates,
    stats,
    createSequence,
    addKeyframe,
    playSequence,
    pauseSequence,
    resumeSequence,
    stopSequence,
    staggerAnimations,
    parallelAnimations,
    presetSequences,
    cleanup
  }
}

export default useAnimationTimeline
