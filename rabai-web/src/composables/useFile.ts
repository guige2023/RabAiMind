// useFile.ts - 文件处理模块
import { ref } from 'vue'

export function useFile() {
  const readAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsText(file)
    })
  }

  const readAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const readAsArrayBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as ArrayBuffer)
      reader.onerror = reject
      reader.readAsArrayBuffer(file)
    })
  }

  const getExtension = (filename: string): string => {
    return filename.slice(filename.lastIndexOf('.') + 1).toLowerCase()
  }

  const getSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`
  }

  const isImage = (file: File): boolean => file.type.startsWith('image/')

  const isPDF = (file: File): boolean => file.type === 'application/pdf'

  const isVideo = (file: File): boolean => file.type.startsWith('video/')

  const download = (content: string | Blob, filename: string) => {
    const blob = content instanceof Blob ? content : new Blob([content])
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  return { readAsText, readAsDataURL, readAsArrayBuffer, getExtension, getSize, isImage, isPDF, isVideo, download }
}

export default useFile
