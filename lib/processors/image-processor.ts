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
  removeBackground?: boolean
  filters?: {
    brightness?: number
    contrast?: number
    saturation?: number
    blur?: number
    sepia?: boolean
    grayscale?: boolean
    invert?: boolean
  }
}

export class ImageProcessor {
  static async processImage(file: File, options: ImageProcessingOptions): Promise<Blob> {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas not supported")

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        let { width: targetWidth, height: targetHeight } = options
        const { naturalWidth: originalWidth, naturalHeight: originalHeight } = img

        // Handle flip operations
        if (options.flipDirection) {
          canvas.width = targetWidth || originalWidth
          canvas.height = targetHeight || originalHeight
          
          ctx.save()
          
          if (options.flipDirection === "horizontal" || options.flipDirection === "both") {
            ctx.scale(-1, 1)
            ctx.translate(-canvas.width, 0)
          }
          
          if (options.flipDirection === "vertical" || options.flipDirection === "both") {
            ctx.scale(1, -1)
            ctx.translate(0, -canvas.height)
          }
          
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          ctx.restore()
        } else {
          // Regular processing
          canvas.width = targetWidth || originalWidth
          canvas.height = targetHeight || originalHeight
          
          if (options.backgroundColor && options.outputFormat !== "png") {
            ctx.fillStyle = options.backgroundColor
            ctx.fillRect(0, 0, canvas.width, canvas.height)
          }
          
          // Apply filters
          if (options.filters) {
            const filters = []
            const { brightness, contrast, saturation, blur, sepia, grayscale, invert } = options.filters
            
            if (brightness !== undefined) filters.push(`brightness(${brightness}%)`)
            if (contrast !== undefined) filters.push(`contrast(${contrast}%)`)
            if (saturation !== undefined) filters.push(`saturate(${saturation}%)`)
            if (blur !== undefined) filters.push(`blur(${blur}px)`)
            if (sepia) filters.push("sepia(100%)")
            if (grayscale) filters.push("grayscale(100%)")
            if (invert) filters.push("invert(100%)")
            
            ctx.filter = filters.join(" ")
          }
          
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        }

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
        const threshold = options.sensitivity || 30
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
        const { brightness, contrast, saturation, blur, sepia, grayscale, invert } = options.filters!

        if (brightness !== undefined) filters.push(`brightness(${brightness}%)`)
        if (contrast !== undefined) filters.push(`contrast(${contrast}%)`)
        if (saturation !== undefined) filters.push(`saturate(${saturation}%)`)
        if (blur !== undefined) filters.push(`blur(${blur}px)`)
        if (sepia) filters.push("sepia(100%)")
        if (grayscale) filters.push("grayscale(100%)")
        if (invert) filters.push("invert(100%)")

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
        
        // Ensure crop area is within bounds
        const cropX = Math.max(0, Math.min((x / 100) * img.naturalWidth, img.naturalWidth))
        const cropY = Math.max(0, Math.min((y / 100) * img.naturalHeight, img.naturalHeight))
        const cropWidth = Math.max(1, Math.min((width / 100) * img.naturalWidth, img.naturalWidth - cropX))
        const cropHeight = Math.max(1, Math.min((height / 100) * img.naturalHeight, img.naturalHeight - cropY))

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