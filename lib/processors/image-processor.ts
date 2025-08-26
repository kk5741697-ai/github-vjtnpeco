import imageCompression from "browser-image-compression"

export interface ImageProcessingOptions {
  quality?: number
  width?: number
  height?: number
  maintainAspectRatio?: boolean
  outputFormat?: "jpeg" | "png" | "webp"
  backgroundColor?: string
  watermarkText?: string
  watermarkOpacity?: number
  rotation?: number
  cropArea?: { x: number; y: number; width: number; height: number }
  compressionLevel?: "low" | "medium" | "high" | "maximum"
  filters?: {
    brightness?: number
    contrast?: number
    saturation?: number
  }
}

export class ImageProcessor {

  static async resizeImage(file: File, options: ImageProcessingOptions): Promise<Blob> {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas not supported")

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = async () => {
        try {
          let { width: targetWidth, height: targetHeight } = options
          const { naturalWidth: originalWidth, naturalHeight: originalHeight } = img

          // Calculate target dimensions
          if (options.maintainAspectRatio !== false && targetWidth && targetHeight) {
            const aspectRatio = originalWidth / originalHeight
            if (targetWidth / targetHeight > aspectRatio) {
              targetWidth = targetHeight * aspectRatio
            } else {
              targetHeight = targetWidth / aspectRatio
            }
          } else if (targetWidth && !targetHeight) {
            targetHeight = (targetWidth / originalWidth) * originalHeight
          } else if (targetHeight && !targetWidth) {
            targetWidth = (targetHeight / originalHeight) * originalWidth
          }

          canvas.width = targetWidth!
          canvas.height = targetHeight!

          // Apply background color if needed
          if (options.backgroundColor && options.outputFormat !== "png") {
            ctx.fillStyle = options.backgroundColor
            ctx.fillRect(0, 0, canvas.width, canvas.height)
          }

          // Draw the image
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

          // Convert to blob with proper format
          const quality = (options.quality || 90) / 100
          const mimeType = `image/${options.outputFormat || "jpeg"}`

          canvas.toBlob((blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error("Failed to create blob"))
            }
          }, mimeType, quality)

        } catch (error) {
          reject(error)
        }
      }

      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = URL.createObjectURL(file)
    })
  }

  static async compressImage(file: File, options: ImageProcessingOptions): Promise<Blob> {
    const compressionOptions = {
      maxSizeMB: this.getMaxSizeMB(options.compressionLevel),
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      initialQuality: (options.quality || 80) / 100,
      fileType: "image/jpeg" as any
    }

    try {
      return await imageCompression(file, compressionOptions)
    } catch (error) {
      // Fallback to canvas compression
      return this.resizeImage(file, options)
    }
  }

  static async cropImage(file: File, cropArea: { x: number; y: number; width: number; height: number }, options: ImageProcessingOptions = {}): Promise<Blob> {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas not supported")

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const { x, y, width, height } = cropArea
        const cropX = (x / 100) * img.naturalWidth
        const cropY = (y / 100) * img.naturalHeight
        const cropWidth = (width / 100) * img.naturalWidth
        const cropHeight = (height / 100) * img.naturalHeight

        canvas.width = cropWidth
        canvas.height = cropHeight

        if (options.backgroundColor) {
          ctx.fillStyle = options.backgroundColor
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }

        ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight)

        const quality = (options.quality || 95) / 100
        const mimeType = `image/${options.outputFormat || "png"}`

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error("Failed to create blob"))
          }
        }, mimeType, quality)
      }

      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = URL.createObjectURL(file)
    })
  }

  static async addWatermark(file: File, watermarkText: string, options: ImageProcessingOptions = {}): Promise<Blob> {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx || !watermarkText) throw new Error("Canvas not supported or watermark text not specified")

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight

        ctx.drawImage(img, 0, 0)

        // Add watermark
        const fontSize = Math.min(canvas.width, canvas.height) * 0.05
        ctx.font = `${fontSize}px Arial`
        ctx.fillStyle = `rgba(255, 255, 255, ${options.watermarkOpacity || 0.5})`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"

        // Add text shadow for better visibility
        ctx.shadowColor = "rgba(0, 0, 0, 0.5)"
        ctx.shadowBlur = 4
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 2

        ctx.fillText(watermarkText, canvas.width / 2, canvas.height / 2)

        const quality = (options.quality || 90) / 100
        const mimeType = `image/${options.outputFormat || "png"}`

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error("Failed to create blob"))
          }
        }, mimeType, quality)
      }

      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = URL.createObjectURL(file)
    })
  }

  static async convertFormat(file: File, outputFormat: "jpeg" | "png" | "webp", options: ImageProcessingOptions = {}): Promise<Blob> {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas not supported")

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight

        // Add background color for formats that don't support transparency
        if (options.backgroundColor && outputFormat !== "png") {
          ctx.fillStyle = options.backgroundColor
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }

        ctx.drawImage(img, 0, 0)

        const quality = (options.quality || 90) / 100
        const mimeType = `image/${outputFormat}`

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error("Failed to create blob"))
            }
          },
          mimeType,
          quality,
        )
      }

      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = URL.createObjectURL(file)
    })
  }

  private static getMaxSizeMB(level?: string): number {
    switch (level) {
      case "low": return 5
      case "medium": return 2
      case "high": return 1
      case "maximum": return 0.5
      default: return 2
    }
  }
}