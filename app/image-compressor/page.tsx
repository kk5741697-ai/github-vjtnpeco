"use client"

import { ImageToolLayout } from "@/components/image-tool-layout"
import { Archive } from "lucide-react"
import { ImageProcessor } from "@/lib/processors/image-processor"

const compressOptions = [
  {
    key: "quality",
    label: "Quality",
    type: "slider" as const,
    defaultValue: 80,
    min: 10,
    max: 100,
    step: 5,
  },
  {
    key: "compressionLevel",
    label: "Compression Level",
    type: "select" as const,
    defaultValue: "medium",
    selectOptions: [
      { value: "low", label: "Low (High Quality)" },
      { value: "medium", label: "Medium (Balanced)" },
      { value: "high", label: "High (Small Size)" },
      { value: "maximum", label: "Maximum (Smallest)" },
    ],
  },
  {
    key: "outputFormat",
    label: "Output Format",
    type: "select" as const,
    defaultValue: "jpeg",
    selectOptions: [
      { value: "jpeg", label: "JPEG" },
      { value: "webp", label: "WebP" },
      { value: "png", label: "PNG" },
    ],
  },
  {
    key: "removeMetadata",
    label: "Remove Metadata",
    type: "checkbox" as const,
    defaultValue: true,
  },
]

async function compressImages(files: any[], options: any) {
  try {
    const processedFiles = await Promise.all(
      files.map(async (file) => {
        const processedBlob = await ImageProcessor.compressImage(file.originalFile || file.file, {
          quality: options.quality,
          compressionLevel: options.compressionLevel,
          outputFormat: options.outputFormat
        })

        const processedUrl = URL.createObjectURL(processedBlob)
        
        // Update file name with correct extension
        const outputFormat = options.outputFormat || "jpeg"
        const baseName = file.name.split(".")[0]
        const newName = `${baseName}.${outputFormat}`

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
    <ImageToolLayout
      title="Compress IMAGE"
      description="Compress JPG, PNG, SVG, and GIFs while saving space and maintaining quality."
      icon={Archive}
      toolType="compress"
      processFunction={compressImages}
      options={compressOptions}
      maxFiles={20}
      allowBatchProcessing={true}
    />
  )
}