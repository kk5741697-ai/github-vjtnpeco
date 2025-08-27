"use client"

import { EnhancedImageToolLayout } from "@/components/enhanced-image-tool-layout"
import { Crop } from "lucide-react"
import { ImageProcessor } from "@/lib/processors/image-processor"

const cropOptions = [
  {
    key: "aspectRatio",
    label: "Aspect Ratio",
    type: "select" as const,
    defaultValue: "free",
    options: [
      { value: "free", label: "Free" },
      { value: "1:1", label: "Square (1:1)" },
      { value: "4:3", label: "Standard (4:3)" },
      { value: "16:9", label: "Widescreen (16:9)" },
      { value: "3:2", label: "Photo (3:2)" },
      { value: "9:16", label: "Mobile (9:16)" },
    ],
  },
]

const cropPresets = [
  { name: "Instagram Post", values: { aspectRatio: "1:1" } },
  { name: "YouTube Thumbnail", values: { aspectRatio: "16:9" } },
  { name: "Facebook Cover", values: { aspectRatio: "16:9" } },
  { name: "Twitter Header", values: { aspectRatio: "3:1" } },
]

async function cropImages(files: any[], options: any) {
  try {
    const processedFiles = await Promise.all(
      files.map(async (file) => {
        const cropArea = file.cropArea || { x: 10, y: 10, width: 80, height: 80 }
        
        const processedBlob = await ImageProcessor.cropImage(
          file.originalFile || file.file,
          cropArea,
          { outputFormat: "png", quality: 95 }
        )

        const processedUrl = URL.createObjectURL(processedBlob)
        
        const baseName = file.name.split(".")[0]
        const newName = `${baseName}_cropped.png`

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
      error: error instanceof Error ? error.message : "Failed to crop images",
    }
  }
}

export default function ImageCropperPage() {
  return (
    <EnhancedImageToolLayout
      title="Crop IMAGE"
      description="Crop JPG, PNG, or GIFs with ease. Choose pixels to define your rectangle or use our visual editor."
      icon={Crop}
      toolType="crop"
      processFunction={cropImages}
      options={cropOptions}
      maxFiles={1}
      presets={cropPresets}
    />
  )
}