// useDownload.ts - 下载模块
import { ref } from 'vue'

export function useDownload() {
  const isDownloading = ref(false)
  const progress = ref(0)

  const downloadBlob = async (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadUrl = async (url: string, filename: string) => {
    isDownloading.value = true
    progress.value = 0
    try {
      const response = await fetch(url)
      if (!response.ok) throw new Error('Download failed')
      const blob = await response.blob()
      await downloadBlob(blob, filename)
    } finally {
      isDownloading.value = false
      progress.value = 100
    }
  }

  const downloadText = (content: string, filename: string, type = 'text/plain') => {
    const blob = new Blob([content], { type })
    downloadBlob(blob, filename)
  }

  const downloadJson = (data: any, filename: string) => {
    downloadText(JSON.stringify(data, null, 2), filename, 'application/json')
  }

  return { isDownloading, progress, downloadBlob, downloadUrl, downloadText, downloadJson }
}

export default useDownload
