// Real image processing utilities using Canvas API for client-side processing
export interface ImageProcessingOptions {
  quality?: number
  width?: number
  height?: number
  maintainAspectRatio?: boolean
  outputFormat?: "jpeg" | "png" | "webp" | "gif"
  backgroundColor?: string
  watermarkText?: string
  watermarkOpacity?: number
  rotation?: number
  cropArea?: { x: number; y: number; width: number; height: number }
  compressionLevel?: "low" | "medium" | "high" | "maximum"
  removeBackground?: boolean
  filters?: {
    brightness?: number
    contrast?: number
    saturation?: number
    blur?: number
    sepia?: boolean
    grayscale?: boolean
  }
}

export class ImageProcessor {
  static async resizeImage(file: File, options: ImageProcessingOptions): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Canvas not supported"))
        return
      }

      const img = new Image()
      img.onload = () => {
        let { width: targetWidth, height: targetHeight } = options
        const { naturalWidth: originalWidth, naturalHeight: originalHeight } = img

        // Calculate dimensions based on resize mode
        if (options.maintainAspectRatio && targetWidth && targetHeight) {
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

        canvas.width = targetWidth || originalWidth
        canvas.height = targetHeight || originalHeight

        // Apply background color if needed
        if (options.backgroundColor && options.outputFormat !== "png") {
          ctx.fillStyle = options.backgroundColor
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        const quality = (options.quality || 90) / 100
        const mimeType = `image/${options.outputFormat || "png"}`

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

  static async compressImage(file: File, options: ImageProcessingOptions): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Canvas not supported"))
        return
      }

      const img = new Image()
      img.onload = () => {
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight

        // Apply compression level adjustments
        let quality = options.quality || 80
        switch (options.compressionLevel) {
          case "low":
            quality = Math.max(quality, 85)
            break
          case "medium":
            quality = Math.min(Math.max(quality, 60), 85)
            break
          case "high":
            quality = Math.min(Math.max(quality, 40), 70)
            break
          case "maximum":
            quality = Math.min(quality, 50)
            break
        }

        ctx.drawImage(img, 0, 0)

        const mimeType = `image/${options.outputFormat || "jpeg"}`
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error("Failed to create blob"))
            }
          },
          mimeType,
          quality / 100,
        )
      }

      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = URL.createObjectURL(file)
    })
  }

  static async cropImage(file: File, options: ImageProcessingOptions): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx || !options.cropArea) {
        reject(new Error("Canvas not supported or crop area not specified"))
        return
      }

      const img = new Image()
      img.onload = () => {
        const { x, y, width, height } = options.cropArea!
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

  static async rotateImage(file: File, options: ImageProcessingOptions): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Canvas not supported"))
        return
      }

      const img = new Image()
      img.onload = () => {
        const angle = (options.rotation || 0) * (Math.PI / 180)
        const { naturalWidth: width, naturalHeight: height } = img

        // Calculate new canvas dimensions after rotation
        const cos = Math.abs(Math.cos(angle))
        const sin = Math.abs(Math.sin(angle))
        const newWidth = width * cos + height * sin
        const newHeight = width * sin + height * cos

        canvas.width = newWidth
        canvas.height = newHeight

        // Fill background if specified
        if (options.backgroundColor) {
          ctx.fillStyle = options.backgroundColor
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }

        // Move to center and rotate
        ctx.translate(newWidth / 2, newHeight / 2)
        ctx.rotate(angle)
        ctx.drawImage(img, -width / 2, -height / 2)

        const quality = (options.quality || 95) / 100
        const mimeType = `image/${options.outputFormat || "png"}`

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

  static async addWatermark(file: File, options: ImageProcessingOptions): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx || !options.watermarkText) {
        reject(new Error("Canvas not supported or watermark text not specified"))
        return
      }

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

        ctx.fillText(options.watermarkText, canvas.width / 2, canvas.height / 2)

        const quality = (options.quality || 90) / 100
        const mimeType = `image/${options.outputFormat || "png"}`

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

  static async removeBackground(file: File, options: ImageProcessingOptions): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Canvas not supported"))
        return
      }

      const img = new Image()
      img.onload = () => {
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight

        ctx.drawImage(img, 0, 0)

        // Simple background removal (edge detection + color similarity)
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        // Sample corner pixels to determine background color
        const corners = [
          [0, 0], // top-left
          [canvas.width - 1, 0], // top-right
          [0, canvas.height - 1], // bottom-left
          [canvas.width - 1, canvas.height - 1], // bottom-right
        ]

        const bgColors = corners.map(([x, y]) => {
          const index = (y * canvas.width + x) * 4
          return [data[index], data[index + 1], data[index + 2]]
        })

        // Use most common corner color as background
        const bgColor = bgColors[0] // Simplified - use top-left corner

        // Remove similar colors (simple threshold-based removal)
        const threshold = 30
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]

          const colorDistance = Math.sqrt(
            Math.pow(r - bgColor[0], 2) + Math.pow(g - bgColor[1], 2) + Math.pow(b - bgColor[2], 2),
          )

          if (colorDistance < threshold) {
            data[i + 3] = 0 // Make transparent
          }
        }

        ctx.putImageData(imageData, 0, 0)

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error("Failed to create blob"))
          }
        }, "image/png") // Always use PNG for transparency
      }

      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = URL.createObjectURL(file)
    })
  }

  static async convertFormat(file: File, options: ImageProcessingOptions): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Canvas not supported"))
        return
      }

      const img = new Image()
      img.onload = () => {
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight

        // Add background color for formats that don't support transparency
        if (options.backgroundColor && options.outputFormat !== "png") {
          ctx.fillStyle = options.backgroundColor
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }

        ctx.drawImage(img, 0, 0)

        const quality = (options.quality || 90) / 100
        const mimeType = `image/${options.outputFormat || "png"}`

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

  static async applyFilters(file: File, options: ImageProcessingOptions): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx || !options.filters) {
        reject(new Error("Canvas not supported or no filters specified"))
        return
      }

      const img = new Image()
      img.onload = () => {
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight

        // Apply CSS filters
        const filters = []
        const { brightness, contrast, saturation, blur, sepia, grayscale } = options.filters

        if (brightness !== undefined) filters.push(`brightness(${brightness}%)`)
        if (contrast !== undefined) filters.push(`contrast(${contrast}%)`)
        if (saturation !== undefined) filters.push(`saturate(${saturation}%)`)
        if (blur !== undefined) filters.push(`blur(${blur}px)`)
        if (sepia) filters.push("sepia(100%)")
        if (grayscale) filters.push("grayscale(100%)")

        ctx.filter = filters.join(" ")
        ctx.drawImage(img, 0, 0)

        const quality = (options.quality || 90) / 100
        const mimeType = `image/${options.outputFormat || "png"}`

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
}
