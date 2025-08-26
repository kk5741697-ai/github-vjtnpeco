"use client"

import { EnhancedImageToolLayout } from "@/components/enhanced-image-tool-layout"
import { Zap } from "lucide-react"
import { ImageProcessor } from "@/lib/processors/image-processor"

const upscaleOptions = [
  {
    key: "scaleFactor",
    label: "Scale Factor",
    type: "select" as const,
    defaultValue: "2x",
    selectOptions: [
      { value: "1.5x", label: "1.5x (150%)" },
      { value: "2x", label: "2x (200%)" },
      { value: "3x", label: "3x (300%)" },
      { value: "4x", label: "4x (400%)" },
    ],
    section: "Upscaling",
  },
  {
    key: "algorithm",
    label: "Upscaling Algorithm",
    type: "select" as const,
    defaultValue: "lanczos",
    selectOptions: [
      { value: "lanczos", label: "Lanczos (Best Quality)" },
      { value: "bicubic", label: "Bicubic (Balanced)" },
      { value: "bilinear", label: "Bilinear (Fast)" },
    ],
    section: "Upscaling",
  },
  {
    key: "enhanceDetails",
    label: "Enhance Details",
    type: "checkbox" as const,
    defaultValue: true,
    section: "Enhancement",
  },
  {
    key: "reduceNoise",
    label: "Reduce Noise",
    type: "checkbox" as const,
    defaultValue: true,
    section: "Enhancement",
  },
  {
    key: "sharpen",
    label: "Sharpen",
    type: "slider" as const,
    defaultValue: 0,
    min: 0,
    max: 100,
    step: 5,
    section: "Enhancement",
  },
  {
    key: "outputFormat",
    label: "Output Format",
    type: "select" as const,
    defaultValue: "png",
    selectOptions: [
      { value: "png", label: "PNG" },
      { value: "jpeg", label: "JPEG" },
      { value: "webp", label: "WebP" },
    ],
    section: "Output",
  },
  {
    key: "quality",
    label: "Quality",
    type: "slider" as const,
    defaultValue: 95,
    min: 10,
    max: 100,
    step: 5,
    section: "Output",
  },
]

async function upscaleImages(files: any[], options: any) {
  try {
    const processedFiles = await Promise.all(
      files.map(async (file) => {
        const scaleFactor = parseFloat(options.scaleFactor.replace('x', ''))
        const newWidth = Math.round(file.dimensions.width * scaleFactor)
        const newHeight = Math.round(file.dimensions.height * scaleFactor)

        const processedBlob = await ImageProcessor.processImage(
          file.originalFile || file.file,
          {
            width: newWidth,
            height: newHeight,
            maintainAspectRatio: true,
            outputFormat: options.outputFormat,
            quality: options.quality,
            filters: {
              brightness: options.enhanceDetails ? 105 : 100,
              contrast: options.enhanceDetails ? 105 : 100,
            }
          }
        )

        const processedUrl = URL.createObjectURL(processedBlob)
        
        const outputFormat = options.outputFormat || "png"
        const baseName = file.name.split(".")[0]
        const newName = `${baseName}_${options.scaleFactor}.${outputFormat}`

        return {
          ...file,
          processed: true,
          processedPreview: processedUrl,
          name: newName,
          processedSize: processedBlob.size,
          blob: processedBlob,
          dimensions: { width: newWidth, height: newHeight }
        }
      })
    )

    return {
      success: true,
      processedFiles,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to upscale images",
    }
  }
}

export default function ImageUpscalerPage() {
  return (
    <EnhancedImageToolLayout
      title="Upscale IMAGE"
      description="Enlarge images with AI-enhanced quality. Increase resolution while preserving details and reducing artifacts."
      icon={Zap}
      toolType="resize"
      processFunction={upscaleImages}
      options={upscaleOptions}
      maxFiles={10}
      allowBatchProcessing={true}
    />
  )
}