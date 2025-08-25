"use client"

import { useState, useCallback } from "react"
import type { DownloadFile } from "@/components/download-manager"

interface UseDownloadManagerOptions {
  onDownload?: (files: DownloadFile[]) => Promise<void>
  onError?: (error: string) => void
}

export function useDownloadManager({ onDownload, onError }: UseDownloadManagerOptions = {}) {
  const [downloadQueue, setDownloadQueue] = useState<DownloadFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const addToQueue = useCallback((file: DownloadFile | DownloadFile[]) => {
    const filesToAdd = Array.isArray(file) ? file : [file]
    setDownloadQueue((prev) => [...prev, ...filesToAdd])
  }, [])

  const removeFromQueue = useCallback((fileId: string) => {
    setDownloadQueue((prev) => prev.filter((f) => f.id !== fileId))
  }, [])

  const clearQueue = useCallback(() => {
    setDownloadQueue([])
  }, [])

  const createDownloadFile = useCallback(
    (name: string, blob: Blob, format: string, options: { quality?: number; type?: string } = {}): DownloadFile => {
      return {
        id: `${name}-${Date.now()}-${Math.random()}`,
        name,
        blob,
        type: options.type || blob.type,
        size: blob.size,
        format,
        quality: options.quality,
        created: new Date(),
      }
    },
    [],
  )

  const downloadBlob = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const downloadCanvas = useCallback(
    (canvas: HTMLCanvasElement, filename: string, format = "png", quality = 0.9) => {
      return new Promise<DownloadFile>((resolve, reject) => {
        const mimeType = `image/${format}`
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const downloadFile = createDownloadFile(filename, blob, format, {
                quality: Math.round(quality * 100),
                type: mimeType,
              })
              resolve(downloadFile)
            } else {
              reject(new Error("Failed to create blob from canvas"))
            }
          },
          mimeType,
          quality,
        )
      })
    },
    [createDownloadFile],
  )

  const downloadText = useCallback(
    (text: string, filename: string, mimeType = "text/plain") => {
      const blob = new Blob([text], { type: mimeType })
      const downloadFile = createDownloadFile(filename, blob, filename.split(".").pop() || "txt", {
        type: mimeType,
      })
      return downloadFile
    },
    [createDownloadFile],
  )

  const downloadJSON = useCallback(
    (data: any, filename: string) => {
      const jsonString = JSON.stringify(data, null, 2)
      return downloadText(jsonString, filename, "application/json")
    },
    [downloadText],
  )

  const downloadSVG = useCallback(
    (svgElement: SVGElement | string, filename: string) => {
      const svgString = typeof svgElement === "string" ? svgElement : new XMLSerializer().serializeToString(svgElement)
      const blob = new Blob([svgString], { type: "image/svg+xml" })
      const downloadFile = createDownloadFile(filename, blob, "svg", { type: "image/svg+xml" })
      return downloadFile
    },
    [createDownloadFile],
  )

  const createZipArchive = useCallback(
    async (files: DownloadFile[], zipName: string): Promise<DownloadFile> => {
      // In a real implementation, you would use JSZip library
      // For now, we'll simulate by combining all files
      const combinedSize = files.reduce((sum, file) => sum + file.size, 0)
      const zipBlob = new Blob(
        files.map((f) => f.blob),
        { type: "application/zip" },
      )

      return createDownloadFile(zipName, zipBlob, "zip", { type: "application/zip" })
    },
    [createDownloadFile],
  )

  const processQueue = useCallback(async () => {
    if (downloadQueue.length === 0 || isProcessing) return

    setIsProcessing(true)

    try {
      if (onDownload) {
        await onDownload(downloadQueue)
      } else {
        // Default behavior: download all files
        downloadQueue.forEach((file, index) => {
          setTimeout(() => {
            downloadBlob(file.blob, file.name)
          }, index * 500) // Stagger downloads
        })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Download failed"
      onError?.(errorMessage)
    } finally {
      setIsProcessing(false)
    }
  }, [downloadQueue, isProcessing, onDownload, onError, downloadBlob])

  return {
    downloadQueue,
    isProcessing,
    addToQueue,
    removeFromQueue,
    clearQueue,
    createDownloadFile,
    downloadBlob,
    downloadCanvas,
    downloadText,
    downloadJSON,
    downloadSVG,
    createZipArchive,
    processQueue,
  }
}
