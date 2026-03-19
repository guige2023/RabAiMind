// useMath.ts - 数学工具模块
export function useMath() {
  const random = (min = 0, max = 100): number => Math.floor(Math.random() * (max - min + 1)) + min

  const clamp = (value: number, min: number, max: number): number =>
    Math.min(Math.max(value, min), max)

  const round = (value: number, decimals = 0): number => {
    const factor = Math.pow(10, decimals)
    return Math.round(value * factor) / factor
  }

  const sum = (arr: number[]): number => arr.reduce((a, b) => a + b, 0)

  const avg = (arr: number[]): number => arr.length ? sum(arr) / arr.length : 0

  const median = (arr: number[]): number => {
    const sorted = [...arr].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
  }

  const percent = (value: number, total: number): number => total ? (value / total) * 100 : 0

  const range = (start: number, end: number, step = 1): number[] => {
    const result: number[] = []
    for (let i = start; i < end; i += step) result.push(i)
    return result
  }

  const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a

  const lcm = (a: number, b: number): number => (a * b) / gcd(a, b)

  return { random, clamp, round, sum, avg, median, percent, range, gcd, lcm }
}

export default useMath
