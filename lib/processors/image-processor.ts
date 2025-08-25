import { compress } from "browser-image-compression"
import Pica from "pica"

export interface ImageProcessingOptions {
  quality?: number
  width?: number
  height?: number
  maintainAspectRatio?: boolean
  outputFormat?: "jpeg" | "png" | "webp"
  backgroundColor?: string
  watermarkText?: string
  watermarkOpacity?: number
  watermarkPosition?: "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right"
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
  private static pica = new Pica()

  static async processImage(file: File, options: ImageProcessingOptions): Promise<Blob> {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas not supported")

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = async () => {
        try {
          let { width: targetWidth, height: targetHeight } = options
          const { naturalWidth: originalWidth, naturalHeight: originalHeight } = img

          // Apply crop first if specified
          let sourceX = 0, sourceY = 0, sourceWidth = originalWidth, sourceHeight = originalHeight
          
          if (options.cropArea) {
            sourceX = (options.cropArea.x / 100) * originalWidth
            sourceY = (options.cropArea.y / 100) * originalHeight
            sourceWidth = (options.cropArea.width / 100) * originalWidth
            sourceHeight = (options.cropArea.height / 100) * originalHeight
          }

          // Calculate target dimensions
          if (!targetWidth && !targetHeight) {
            targetWidth = sourceWidth
            targetHeight = sourceHeight
          } else if (options.maintainAspectRatio && targetWidth && targetHeight) {
            const aspectRatio = sourceWidth / sourceHeight
            if (targetWidth / targetHeight > aspectRatio) {
              targetWidth = targetHeight * aspectRatio
            } else {
              targetHeight = targetWidth / aspectRatio
            }
          } else if (targetWidth && !targetHeight) {
            targetHeight = (targetWidth / sourceWidth) * sourceHeight
          } else if (targetHeight && !targetWidth) {
            targetWidth = (targetHeight / sourceHeight) * sourceWidth
          }

          canvas.width = targetWidth!
          canvas.height = targetHeight!

          // Apply background color if needed
          if (options.backgroundColor && options.outputFormat !== "png") {
            ctx.fillStyle = options.backgroundColor
            ctx.fillRect(0, 0, canvas.width, canvas.height)
          }

          // Apply rotation if specified
          if (options.rotation) {
            const centerX = canvas.width / 2
            const centerY = canvas.height / 2
            ctx.translate(centerX, centerY)
            ctx.rotate((options.rotation * Math.PI) / 180)
            ctx.translate(-centerX, -centerY)
          }

          // Apply filters
          if (options.filters) {
            const filters = []
            const { brightness, contrast, saturation, blur, sepia, grayscale } = options.filters

            if (brightness !== undefined) filters.push(`brightness(${brightness}%)`)
            if (contrast !== undefined) filters.push(`contrast(${contrast}%)`)
            if (saturation !== undefined) filters.push(`saturate(${saturation}%)`)
            if (blur !== undefined) filters.push(`blur(${blur}px)`)
            if (sepia) filters.push("sepia(100%)")
            if (grayscale) filters.push("grayscale(100%)")

            ctx.filter = filters.join(" ")
          }

          // Draw the image
          ctx.drawImage(
            img,
            sourceX, sourceY, sourceWidth, sourceHeight,
            0, 0, canvas.width, canvas.height
          )

          // Add watermark if specified
          if (options.watermarkText) {
            await this.addWatermarkToCanvas(ctx, canvas, options.watermarkText, options)
          }

          // Convert to blob
          const quality = (options.quality || 90) / 100
          const mimeType = `image/${options.outputFormat || "png"}`

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
      maxWidthOrHeight: options.width || options.height || 1920,
      useWebWorker: true,
      quality: (options.quality || 80) / 100,
      fileType: `image/${options.outputFormat || "jpeg"}` as any
    }

    try {
      return await compress(file, compressionOptions)
    } catch (error) {
      // Fallback to canvas compression
      return this.processImage(file, options)
    }
  }

  static async resizeImage(file: File, options: ImageProcessingOptions): Promise<Blob> {
    if (!options.width && !options.height) {
      throw new Error("Width or height must be specified for resize")
    }

    // Use Pica for high-quality resizing
    const canvas = document.createElement("canvas")
    const img = document.createElement("img")

    return new Promise((resolve, reject) => {
      img.onload = async () => {
        try {
          let { width: targetWidth, height: targetHeight } = options
          const { naturalWidth: originalWidth, naturalHeight: originalHeight } = img

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

          canvas.width = targetWidth!
          canvas.height = targetHeight!

          // Use Pica for high-quality resize
          const resizedCanvas = await this.pica.resize(img, canvas, {
            quality: 3,
            alpha: true,
            unsharpAmount: 80,
            unsharpRadius: 0.6,
            unsharpThreshold: 2
          })

          const quality = (options.quality || 90) / 100
          const mimeType = `image/${options.outputFormat || "png"}`

          resizedCanvas.toBlob((blob) => {
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

  static async cropImage(file: File, cropArea: { x: number; y: number; width: number; height: number }, options: ImageProcessingOptions = {}): Promise<Blob> {
    return this.processImage(file, { ...options, cropArea })
  }

  static async rotateImage(file: File, rotation: number, options: ImageProcessingOptions = {}): Promise<Blob> {
    return this.processImage(file, { ...options, rotation })
  }

  static async addWatermark(file: File, watermarkText: string, options: ImageProcessingOptions = {}): Promise<Blob> {
    return this.processImage(file, { ...options, watermarkText })
  }

  static async convertFormat(file: File, outputFormat: "jpeg" | "png" | "webp", options: ImageProcessingOptions = {}): Promise<Blob> {
    return this.processImage(file, { ...options, outputFormat })
  }

  static async removeBackground(file: File, options: ImageProcessingOptions = {}): Promise<Blob> {
    // Simple background removal using edge detection
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Canvas not supported")

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        ctx.drawImage(img, 0, 0)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData.data

        // Sample corner pixels for background color detection
        const corners = [
          this.getPixelColor(data, 0, 0, canvas.width),
          this.getPixelColor(data, canvas.width - 1, 0, canvas.width),
          this.getPixelColor(data, 0, canvas.height - 1, canvas.width),
          this.getPixelColor(data, canvas.width - 1, canvas.height - 1, canvas.width)
        ]

        // Use most common corner color as background
        const bgColor = corners[0]
        const threshold = 40

        // Remove similar colors
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]

          const colorDistance = Math.sqrt(
            Math.pow(r - bgColor[0], 2) + 
            Math.pow(g - bgColor[1], 2) + 
            Math.pow(b - bgColor[2], 2)
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
        }, "image/png") // Always PNG for transparency
      }

      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = URL.createObjectURL(file)
    })
  }

  private static getPixelColor(data: Uint8ClampedArray, x: number, y: number, width: number): [number, number, number] {
    const index = (y * width + x) * 4
    return [data[index], data[index + 1], data[index + 2]]
  }

  private static async addWatermarkToCanvas(
    ctx: CanvasRenderingContext2D, 
    canvas: HTMLCanvasElement, 
    text: string, 
    options: ImageProcessingOptions
  ): Promise<void> {
    const fontSize = Math.min(canvas.width, canvas.height) * 0.05
    ctx.font = `${fontSize}px Arial`
    ctx.fillStyle = `rgba(255, 255, 255, ${options.watermarkOpacity || 0.5})`
    ctx.strokeStyle = `rgba(0, 0, 0, ${(options.watermarkOpacity || 0.5) * 0.5})`
    ctx.lineWidth = 1

    let x: number, y: number
    
    switch (options.watermarkPosition) {
      case "top-left":
        ctx.textAlign = "left"
        ctx.textBaseline = "top"
        x = 20
        y = 20
        break
      case "top-right":
        ctx.textAlign = "right"
        ctx.textBaseline = "top"
        x = canvas.width - 20
        y = 20
        break
      case "bottom-left":
        ctx.textAlign = "left"
        ctx.textBaseline = "bottom"
        x = 20
        y = canvas.height - 20
        break
      case "bottom-right":
        ctx.textAlign = "right"
        ctx.textBaseline = "bottom"
        x = canvas.width - 20
        y = canvas.height - 20
        break
      default: // center
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        x = canvas.width / 2
        y = canvas.height / 2
        break
    }

    // Add shadow for better visibility
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)"
    ctx.shadowBlur = 4
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2

    ctx.strokeText(text, x, y)
    ctx.fillText(text, x, y)
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