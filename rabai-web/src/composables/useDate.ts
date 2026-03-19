// useDate.ts - 日期格式化模块
import { ref } from 'vue'

export function useDate() {
  const format = (date: Date | string | number, formatStr = 'YYYY-MM-DD HH:mm:ss'): string => {
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''

    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    const hours = String(d.getHours()).padStart(2, '0')
    const minutes = String(d.getMinutes()).padStart(2, '0')
    const seconds = String(d.getSeconds()).padStart(2, '0')

    return formatStr
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds)
  }

  const relative = (date: Date | string | number): string => {
    const d = new Date(date)
    const now = Date.now()
    const diff = now - d.getTime()

    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) return '刚刚'
    if (minutes < 60) return `${minutes}分钟前`
    if (hours < 24) return `${hours}小时前`
    if (days < 7) return `${days}天前`
    return format(date)
  }

  const timestamp = (date?: Date | string | number) => {
    return new Date(date || Date.now()).getTime()
  }

  const add = (date: Date, amount: number, unit: 'day' | 'month' | 'year' | 'hour' | 'minute' | 'second'): Date => {
    const d = new Date(date)
    switch (unit) {
      case 'day': d.setDate(d.getDate() + amount); break
      case 'month': d.setMonth(d.getMonth() + amount); break
      case 'year': d.setFullYear(d.getFullYear() + amount); break
      case 'hour': d.setHours(d.getHours() + amount); break
      case 'minute': d.setMinutes(d.getMinutes() + amount); break
      case 'second': d.setSeconds(d.getSeconds() + amount); break
    }
    return d
  }

  return { format, relative, timestamp, add }
}

export default useDate
