"use client"

import { EnhancedImageToolLayout } from "@/components/enhanced-image-tool-layout"
import { Archive } from "lucide-react"
import { ImageProcessor } from "@/lib/processors/image-processor"

const compressOptions = [
  {
    key: "compressionLevel",
    label: "Compression Level",
    type: "select" as const,
    defaultValue: "medium",
    options: [
      { value: "low", label: "Low (High Quality)" },
      { value: "medium", label: "Medium (Balanced)" },
      { value: "high", label: "High (Small Size)" },
      { value: "maximum", label: "Maximum (Smallest)" },
    ],
  },
  {
    key: "quality",
    label: "Quality",
    type: "slider" as const,
    defaultValue: 80,
    min: 10,
    max: 100,
    step: 5,
  },
]

async function compressImages(files: any[], options: any) {
  try {
    const processedFiles = await Promise.all(
      files.map(async (file) => {
        const processedBlob = await ImageProcessor.compressImage(file.originalFile || file.file, {
          quality: options.quality,
          compressionLevel: options.compressionLevel,
          outputFormat: "jpeg"
        })

        const processedUrl = URL.createObjectURL(processedBlob)
        
        const baseName = file.name.split(".")[0]
        const newName = `${baseName}_compressed.jpg`

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
      error: error instanceof Error ? error.message : "Failed to compress images",
    }
  }
}

export default function ImageCompressorPage() {
  return (
    <EnhancedImageToolLayout
      title="Compress IMAGE"
      description="Compress JPG, PNG, SVG, and GIFs while saving space and maintaining quality."
      icon={Archive}
      toolType="compress"
      processFunction={compressImages}
      options={compressOptions}
      maxFiles={20}
    />
  )
}