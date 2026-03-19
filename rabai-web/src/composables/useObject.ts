// useObject.ts - 对象工具模块
export function useObject() {
  const clone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj))

  const merge = <T extends object>(target: T, ...sources: Partial<T>[]): T => {
    sources.forEach(source => Object.keys(source).forEach(key => {
      (target as any)[key] = source[key as keyof T]
    }))
    return target
  }

  const pick = <T, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> => {
    const result = {} as Pick<T, K>
    keys.forEach(key => { if (key in obj) result[key] = obj[key] })
    return result
  }

  const omit = <T, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> => {
    const result = { ...obj }
    keys.forEach(key => delete result[key])
    return result
  }

  const isEmpty = (obj: object): boolean => Object.keys(obj).length === 0

  const isEqual = (a: any, b: any): boolean => JSON.stringify(a) === JSON.stringify(b)

  const mapValues = <T extends object, U>(obj: T, fn: (value: T[keyof T], key: keyof T) => U): Record<keyof T, U> => {
    const result = {} as Record<keyof T, U>
    Object.keys(obj).forEach(key => { result[key] = fn(obj[key], key) })
    return result
  }

  return { clone, merge, pick, omit, isEmpty, isEqual, mapValues }
}

export default useObject
