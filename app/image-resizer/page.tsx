"use client"

import { SimpleImageToolLayout } from "@/components/simple-image-tool-layout"
import { Maximize } from "lucide-react"
import { ImageProcessor } from "@/lib/processors/image-processor"

const resizeOptions = [
  {
    key: "width",
    label: "Width (px)",
    type: "input" as const,
    defaultValue: 800,
    min: 1,
    max: 10000,
  },
  {
    key: "height",
    label: "Height (px)",
    type: "input" as const,
    defaultValue: 600,
    min: 1,
    max: 10000,
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

const resizePresets = [
  { name: "Instagram Post", values: { width: 1080, height: 1080 } },
  { name: "YouTube Thumbnail", values: { width: 1280, height: 720 } },
  { name: "Facebook Cover", values: { width: 1200, height: 630 } },
  { name: "Twitter Header", values: { width: 1500, height: 500 } },
  { name: "LinkedIn Post", values: { width: 1200, height: 627 } },
  { name: "50% Scale", values: { width: 0, height: 0 } }, // Will be calculated
]

async function resizeImages(files: any[], options: any) {
  try {
    const processedFiles = await Promise.all(
      files.map(async (file) => {
        const processedBlob = await ImageProcessor.resizeImage(file.originalFile || file.file, {
          width: options.width,
          height: options.height,
          maintainAspectRatio: true,
          outputFormat: "jpeg",
          quality: options.quality
        })

        const processedUrl = URL.createObjectURL(processedBlob)
        
        const baseName = file.name.split(".")[0]
        const newName = `${baseName}_resized.jpg`

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
      error: error instanceof Error ? error.message : "Failed to resize images",
    }
  }
}

export default function ImageResizerPage() {
  return (
    <SimpleImageToolLayout
      title="Resize IMAGE"
      description="Define your dimensions, by percent or pixel, and resize your JPG, PNG, SVG, and GIF images."
      icon={Maximize}
      toolType="resize"
      processFunction={resizeImages}
      options={resizeOptions}
      maxFiles={20}
      presets={resizePresets}
    />
  )
}