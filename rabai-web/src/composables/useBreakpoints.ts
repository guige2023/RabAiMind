// useBreakpoints.ts - 响应式断点模块
import { ref, computed } from 'vue'
import { useMediaQuery } from './useMediaQuery'

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl'

export const breakpoints = {
  xs: '(min-width: 0px)',
  sm: '(min-width: 640px)',
  md: '(min-width: 768px)',
  lg: '(min-width: 1024px)',
  xl: '(min-width: 1280px)',
  '2xl': '(min-width: 1536px)',
  '3xl': '(min-width: 1920px)'
}

export const breakpointValues: Record<Breakpoint, number> = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  '3xl': 1920
}

export function useBreakpoints() {
  const xs = useMediaQuery(breakpoints.xs)
  const sm = useMediaQuery(breakpoints.sm)
  const md = useMediaQuery(breakpoints.md)
  const lg = useMediaQuery(breakpoints.lg)
  const xl = useMediaQuery(breakpoints.xl)
  const xxl = useMediaQuery(breakpoints['2xl'])
  const xxxl = useMediaQuery(breakpoints['3xl'])

  const greaterThan = (breakpoint: Breakpoint) => {
    const value = breakpointValues[breakpoint]
    return computed(() => window.innerWidth > value)
  }

  const smallerThan = (breakpoint: Breakpoint) => {
    const value = breakpointValues[breakpoint]
    return computed(() => window.innerWidth < value)
  }

  const current = computed<Breakpoint>(() => {
    if (xxxl.value) return '3xl'
    if (xxl.value) return '2xl'
    if (xl.value) return 'xl'
    if (lg.value) return 'lg'
    if (md.value) return 'md'
    if (sm.value) return 'sm'
    return 'xs'
  })

  return { xs, sm, md, lg, xl, xxl, xxxl, greaterThan, smallerThan, current }
}

export default useBreakpoints
