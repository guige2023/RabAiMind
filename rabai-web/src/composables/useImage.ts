// useImage.ts - 图片处理模块
import { ref } from 'vue'

export interface ImageInfo {
  width: number
  height: number
  src: string
}

export function useImage() {
  const loadImage = (src: string): Promise<ImageInfo> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.width, height: img.height, src })
      }
      img.onerror = reject
      img.src = src
    })
  }

  const preload = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  const createThumbnail = (file: File, maxWidth = 200, maxHeight = 200): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!

        let { width, height } = img
        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  const compress = (file: File, quality = 0.8, maxWidth = 1920): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')!

        let { width, height } = img
        if (width > maxWidth) {
          height *= maxWidth / width
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height
        ctx.drawImage(img, 0, 0, width, height)
        canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Compression failed')), 'image/jpeg', quality)
      }
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  return { loadImage, preload, createThumbnail, compress }
}

export default useImage
