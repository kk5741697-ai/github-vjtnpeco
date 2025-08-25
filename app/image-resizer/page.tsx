"use client"

import { ImageToolLayout } from "@/components/image-tool-layout"
import { Maximize } from "lucide-react"
import { ImageProcessor } from "@/lib/image-processor"

const resizeOptions = [
  {
    key: "width",
    label: "Width (px)",
    type: "number" as const,
    defaultValue: 800,
    min: 1,
    max: 10000,
  },
  {
    key: "height",
    label: "Height (px)",
    type: "number" as const,
    defaultValue: 600,
    min: 1,
    max: 10000,
  },
  {
    key: "maintainAspectRatio",
    label: "Maintain Aspect Ratio",
    type: "checkbox" as const,
    defaultValue: true,
  },
  {
    key: "outputFormat",
    label: "Output Format",
    type: "select" as const,
    defaultValue: "jpeg",
    selectOptions: [
      { value: "jpeg", label: "JPEG" },
      { value: "png", label: "PNG" },
      { value: "webp", label: "WebP" },
    ],
  },
  {
    key: "quality",
    label: "Quality",
    type: "slider" as const,
    defaultValue: 90,
    min: 10,
    max: 100,
    step: 5,
  },
]

async function resizeImages(files: any[], options: any) {
  try {
    const processedFiles = await Promise.all(
      files.map(async (file) => {
        const processedBlob = await ImageProcessor.resizeImage(file.originalFile, {
          width: options.width,
          height: options.height,
          maintainAspectRatio: options.maintainAspectRatio,
          outputFormat: options.outputFormat,
          quality: options.quality
        })

        const processedUrl = URL.createObjectURL(processedBlob)

        return {
          ...file,
          processed: true,
          processedPreview: processedUrl,
          size: processedBlob.size,
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
      error: error instanceof Error ? error.message : "Failed to resize images",
    }
  }
}

export default function ImageResizerPage() {
  return (
    <ImageToolLayout
      title="Resize IMAGE"
      description="Define your dimensions, by percent or pixel, and resize your JPG, PNG, SVG, and GIF images."
      icon={Maximize}
      toolType="resize"
      processFunction={resizeImages}
      options={resizeOptions}
      maxFiles={20}
      allowBatchProcessing={true}
    />
  )
}