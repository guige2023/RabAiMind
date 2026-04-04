/**
 * Image compression composable
 * Compresses images to max 1MB before upload
 */

export interface CompressOptions {
  maxSizeMB?: number    // default 1MB
  maxWidthOrHeight?: number  // default 1920
  useWebWorker?: boolean
}

const DEFAULT_MAX_SIZE_MB = 1
const DEFAULT_MAX_DIMENSION = 1920

export function useImageCompressor() {
  /**
   * Compress an image file to max 1MB
   * Returns a Promise<File> with the compressed image
   */
  const compressImage = (
    file: File,
    options: CompressOptions = {}
  ): Promise<File> => {
    const maxSizeMB = options.maxSizeMB ?? DEFAULT_MAX_SIZE_MB
    const maxDimension = options.maxWidthOrHeight ?? DEFAULT_MAX_DIMENSION

    return new Promise((resolve, reject) => {
      // If file is already under max size and is a reasonable format, skip compression
      const sizeMB = file.size / (1024 * 1024)
      if (sizeMB < 0.8) {
        resolve(file)
        return
      }

      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          // Calculate new dimensions
          let { width, height } = img
          if (width > maxDimension || height > maxDimension) {
            const ratio = Math.min(maxDimension / width, maxDimension / height)
            width = Math.round(width * ratio)
            height = Math.round(height * ratio)
          }

          // Try multiple quality levels to get under max size
          tryCompress(file, img, width, height, maxSizeMB, 0.9, resolve, reject)
        }
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = e.target?.result as string
      }
      reader.onerror = () => reject(new Error('Failed to read file'))
      reader.readAsDataURL(file)
    })
  }

  return { compressImage }
}

function tryCompress(
  originalFile: File,
  img: HTMLImageElement,
  targetWidth: number,
  targetHeight: number,
  maxSizeMB: number,
  quality: number,
  resolve: (f: File) => void,
  reject: (e: Error) => void
) {
  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) {
    reject(new Error('Canvas context not available'))
    return
  }

  // Use better quality rendering
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight)

  // Determine output type
  const isJPEG = originalFile.type === 'image/jpeg' || originalFile.type === 'image/jpg'
  const isPNG = originalFile.type === 'image/png'
  const outputType = isPNG ? 'image/png' : 'image/jpeg'
  const outputExt = isPNG ? 'png' : 'jpg'

  // Get blob and check size
  const getBlob = (q: number): Blob => {
    const dataUrl = canvas.toDataURL(outputType, q)
    // Remove the data:image/...;base64, prefix
    const base64 = dataUrl.split(',')[1]
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return new Blob([bytes], { type: outputType })
  }

  let blob = getBlob(quality)
  let currentQuality = quality

  // Reduce quality iteratively until under max size
  while (blob.size > maxSizeMB * 1024 * 1024 && currentQuality > 0.1) {
    currentQuality -= 0.1
    blob = getBlob(currentQuality)
  }

  // If still too large, try reducing dimensions
  if (blob.size > maxSizeMB * 1024 * 1024) {
    const ratio = Math.sqrt((maxSizeMB * 1024 * 1024) / blob.size) * 0.9
    const newWidth = Math.round(targetWidth * ratio)
    const newHeight = Math.round(targetHeight * ratio)
    canvas.width = newWidth
    canvas.height = newHeight
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(img, 0, 0, newWidth, newHeight)
    blob = getBlob(currentQuality)
  }

  // Create file from blob
  const compressedFile = new File(
    [blob],
    originalFile.name.replace(/\.[^.]+$/, `.compressed.${outputExt}`),
    { type: outputType }
  )

  resolve(compressedFile)
}
