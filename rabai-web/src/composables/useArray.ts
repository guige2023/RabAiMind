// useArray.ts - 数组工具模块
export function useArray() {
  const unique = <T>(arr: T[]): T[] => [...new Set(arr)]

  const chunk = <T>(arr: T[], size: number): T[][] => {
    const result: T[][] = []
    for (let i = 0; i < arr.length; i += size) result.push(arr.slice(i, i + size))
    return result
  }

  const flatten = <T>(arr: any[]): T[] => arr.reduce((a, b) => a.concat(Array.isArray(b) ? flatten(b) : b), [])

  const groupBy = <T>(arr: T[], key: keyof T): Record<string, T[]> => {
    return arr.reduce((result, item) => {
      const group = String(item[key])
      ;(result[group] = result[group] || []).push(item)
      return result
    }, {} as Record<string, T[]>)
  }

  const sortBy = <T>(arr: T[], key: keyof T): T[] => [...arr].sort((a, b) => (a[key] > b[key] ? 1 : -1))

  const shuffle = <T>(arr: T[]): T[] => [...arr].sort(() => Math.random() - 0.5)

  const sample = <T>(arr: T[]): T | undefined => arr[Math.floor(Math.random() * arr.length)]

  const difference = <T>(arr1: T[], arr2: T[]): T[] => arr1.filter(x => !arr2.includes(x))

  const intersection = <T>(arr1: T[], arr2: T[]): T[] => arr1.filter(x => arr2.includes(x))

  const union = <T>(arr1: T[], arr2: T[]): T[] => unique([...arr1, ...arr2])

  return { unique, chunk, flatten, groupBy, sortBy, shuffle, sample, difference, intersection, union }
}

export default useArray
