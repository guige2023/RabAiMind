// Animation Advanced - 动画高级效果
import { ref, computed } from 'vue'

export type ComplexAnimationType =
  | 'particle' | 'wave' | 'cascade' | 'stagger' | 'morph'
  | 'path' | 'spring' | 'physics' | 'scroll-trigger' | 'parallax'

export interface ParticleConfig {
  count: number
  speed: number
  size: number
  color: string
  shape: 'circle' | 'square' | 'star'
  gravity: number
  opacity: number
}

export interface AnimationChain {
  id: string
  name: string
  animations: { type: string; duration: number; delay: number }[]
}

export function useAnimationAdvanced() {
  // 动画链
  const chains = ref<AnimationChain[]>([])

  // 粒子配置
  const particleConfig = ref<ParticleConfig>({
    count: 50,
    speed: 2,
    size: 4,
    color: '#3b82f6',
    shape: 'circle',
    gravity: 0.1,
    opacity: 0.6
  })

  // 创建粒子效果
  const createParticles = (container: HTMLElement, config?: Partial<ParticleConfig>) => {
    const cfg = { ...particleConfig.value, ...config }
    container.innerHTML = ''

    for (let i = 0; i < cfg.count; i++) {
      const particle = document.createElement('div')
      const size = Math.random() * cfg.size + 2
      const x = Math.random() * container.clientWidth
      const y = Math.random() * container.clientHeight

      particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: ${cfg.color};
        border-radius: ${cfg.shape === 'circle' ? '50%' : '0'};
        left: ${x}px;
        top: ${y}px;
        opacity: ${cfg.opacity};
        pointer-events: none;
      `

      // 粒子动画
      const animate = () => {
        const currentY = parseFloat(particle.style.top)
        const newY = currentY + cfg.speed + Math.random() * 2
        const newX = parseFloat(particle.style.left) + (Math.random() - 0.5) * 2

        if (newY > container.clientHeight) {
          particle.style.top = '-10px'
          particle.style.left = Math.random() * container.clientWidth + 'px'
        } else {
          particle.style.top = newY + 'px'
          particle.style.left = newX + 'px'
        }

        requestAnimationFrame(animate)
      }

      container.appendChild(particle)
      requestAnimationFrame(animate)
    }
  }

  // 波浪动画
  const createWave = (container: HTMLElement, waveCount = 3) => {
    container.innerHTML = ''

    for (let i = 0; i < waveCount; i++) {
      const wave = document.createElement('div')
      wave.style.cssText = `
        position: absolute;
        width: 200%;
        height: 100px;
        background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.3), transparent);
        left: -50%;
        bottom: ${i * 30}px;
        border-radius: 50%;
        animation: wave${i} ${3 + i}s ease-in-out infinite;
      `

      // 注入关键帧
      const style = document.createElement('style')
      style.textContent = `
        @keyframes wave${i} {
          0%, 100% { transform: translateX(-25%) scaleY(1); }
          50% { transform: translateX(0%) scaleY(0.8); }
        }
      `
      document.head.appendChild(style)

      container.appendChild(wave)
    }
  }

  // 级联动画
  const createCascade = (
    elements: HTMLElement[],
    options: { direction: 'up' | 'down' | 'left' | 'right'; stagger: number; duration: number }
  ) => {
    const { direction, stagger, duration } = options

    elements.forEach((el, index) => {
      el.style.opacity = '0'
      el.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`

      setTimeout(() => {
        const transforms: Record<string, string> = {
          up: 'translateY(30px)',
          down: 'translateY(-30px)',
          left: 'translateX(30px)',
          right: 'translateX(-30px)'
        }

        el.style.opacity = '1'
        el.style.transform = transforms[direction]
      }, index * stagger)
    })
  }

  // 交错动画
  const createStagger = (
    container: HTMLElement,
    itemCount: number,
    options: { animation: string; stagger: number; duration: number }
  ) => {
    const { animation, stagger, duration } = options

    for (let i = 0; i < itemCount; i++) {
      const item = document.createElement('div')
      item.style.cssText = `
        opacity: 0;
        animation: ${animation} ${duration}ms ease forwards;
        animation-delay: ${i * stagger}ms;
      `
      container.appendChild(item)
    }
  }

  // 路径动画
  const createPathAnimation = (element: HTMLElement, path: { x: number; y: number }[]) => {
    let currentIndex = 0

    const animate = () => {
      if (currentIndex >= path.length) {
        currentIndex = 0
      }

      const point = path[currentIndex]
      element.style.transform = `translate(${point.x}px, ${point.y}px)`
      currentIndex++

      setTimeout(animate, 100)
    }

    animate()
  }

  // 弹簧动画
  const createSpringAnimation = (
    element: HTMLElement,
    target: { x: number; y: number },
    stiffness = 100,
    damping = 10
  ) => {
    let velocity = { x: 0, y: 0 }
    let position = { x: 0, y: 0 }

    const animate = () => {
      const forceX = (target.x - position.x) * stiffness
      const forceY = (target.y - position.y) * stiffness

      velocity.x += forceX * 0.01
      velocity.y += forceY * 0.01

      velocity.x *= 1 - damping * 0.01
      velocity.y *= 1 - damping * 0.01

      position.x += velocity.x
      position.y += velocity.y

      element.style.transform = `translate(${position.x}px, ${position.y}px)`

      requestAnimationFrame(animate)
    }

    animate()
  }

  // 滚动触发动画
  const createScrollTrigger = (
    elements: HTMLElement[],
    options: { animation: string; threshold?: number; rootMargin?: string }
  ) => {
    const threshold = options.threshold || 0.1
    const rootMargin = options.rootMargin || '0px'

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add(options.animation)
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold, rootMargin }
    )

    elements.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }

  // 视差效果
  const createParallax = (
    container: HTMLElement,
    layers: { element: HTMLElement; speed: number }[]
  ) => {
    const handleScroll = () => {
      const scrollY = window.scrollY

      layers.forEach(({ element, speed }) => {
        const offset = scrollY * speed
        element.style.transform = `translateY(${offset}px)`
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => window.removeEventListener('scroll', handleScroll)
  }

  // 创建动画链
  const createChain = (name: string, animations: AnimationChain['animations']): AnimationChain => {
    const chain: AnimationChain = {
      id: `chain_${Date.now()}`,
      name,
      animations
    }
    chains.value.push(chain)
    return chain
  }

  // 播放动画链
  const playChain = async (chainId: string, element: HTMLElement) => {
    const chain = chains.value.find((c) => c.id === chainId)
    if (!chain) return

    for (const anim of chain.animations) {
      await new Promise((resolve) => setTimeout(resolve, anim.duration + anim.delay))
    }
  }

  // 预设复杂动画
  const complexPresets = {
    // 雨滴效果
    rain: () => particleConfig.value = { ...particleConfig.value, count: 100, speed: 5, gravity: 0.2, color: '#60a5fa' },

    // 雪花效果
    snow: () => particleConfig.value = { ...particleConfig.value, count: 80, speed: 1, gravity: 0.05, color: '#ffffff', opacity: 0.8 },

    // 星星效果
    stars: () => particleConfig.value = { ...particleConfig.value, count: 50, speed: 0.5, gravity: 0, color: '#fbbf24', shape: 'star' },

    // 气泡效果
    bubbles: () => particleConfig.value = { ...particleConfig.value, count: 30, speed: -2, gravity: -0.1, color: '#60a5fa', opacity: 0.4, shape: 'circle' }
  }

  // 统计
  const stats = computed(() => ({
    chainsCount: chains.value.length,
    particleConfig: { ...particleConfig.value }
  }))

  return {
    chains,
    particleConfig,
    stats,
    createParticles,
    createWave,
    createCascade,
    createStagger,
    createPathAnimation,
    createSpringAnimation,
    createScrollTrigger,
    createParallax,
    createChain,
    playChain,
    complexPresets
  }
}

export default useAnimationAdvanced
