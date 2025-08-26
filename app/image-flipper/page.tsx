"use client"

import { EnhancedImageToolLayout } from "@/components/enhanced-image-tool-layout"
import { FlipHorizontal } from "lucide-react"
import { ImageProcessor } from "@/lib/processors/image-processor"

const flipOptions = [
  {
    key: "flipDirection",
    label: "Flip Direction",
    type: "select" as const,
    defaultValue: "horizontal",
    selectOptions: [
      { value: "horizontal", label: "Horizontal (Left ↔ Right)" },
      { value: "vertical", label: "Vertical (Top ↔ Bottom)" },
      { value: "both", label: "Both Directions" },
    ],
    section: "Flip Settings",
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

async function flipImages(files: any[], options: any) {
  try {
    const processedFiles = await Promise.all(
      files.map(async (file) => {
        const processedBlob = await ImageProcessor.processImage(
          file.originalFile || file.file,
          {
            flipDirection: options.flipDirection,
            outputFormat: options.outputFormat,
            quality: options.quality
          }
        )

        const processedUrl = URL.createObjectURL(processedBlob)
        
        const outputFormat = options.outputFormat || "png"
        const baseName = file.name.split(".")[0]
        const newName = `${baseName}_flipped.${outputFormat}`

        return {
          ...file,
          processed: true,
          processedPreview: processedUrl,
          name: newName,
          processedSize: processedBlob.size,
          blob: processedBlob
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
      error: error instanceof Error ? error.message : "Failed to flip images",
    }
  }
}

export default function ImageFlipperPage() {
  return (
    <EnhancedImageToolLayout
      title="Flip IMAGE"
      description="Flip images horizontally, vertically, or both directions with batch processing support."
      icon={FlipHorizontal}
      toolType="rotate"
      processFunction={flipImages}
      options={flipOptions}
      maxFiles={20}
      allowBatchProcessing={true}
    />
  )
}