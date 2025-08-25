"use client"

import { ImageToolLayout } from "@/components/image-tool-layout"
import { Crop } from "lucide-react"
import { ImageProcessor } from "@/lib/image-processor"

const cropOptions = [
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
  },
  {
    key: "quality",
    label: "Quality",
    type: "slider" as const,
    defaultValue: 95,
    min: 10,
    max: 100,
    step: 5,
  },
  {
    key: "backgroundColor",
    label: "Background Color",
    type: "color" as const,
    defaultValue: "#ffffff",
  },
]

async function cropImages(files: any[], options: any) {
  try {
    const processedFiles = await Promise.all(
      files.map(async (file) => {
        const cropArea = file.cropArea || { x: 10, y: 10, width: 80, height: 80 }
        
        const processedBlob = await ImageProcessor.cropImage(
          file.originalFile || file.file,
          {
            cropArea,
            outputFormat: options.outputFormat,
            quality: options.quality,
            backgroundColor: options.backgroundColor
          }
        )

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
      error: error instanceof Error ? error.message : "Failed to crop images",
    }
  }
}

export default function ImageCropperPage() {
  return (
    <ImageToolLayout
      title="Crop IMAGE"
      description="Crop JPG, PNG, or GIFs with ease. Choose pixels to define your rectangle or use our visual editor."
      icon={Crop}
      toolType="crop"
      processFunction={cropImages}
      options={cropOptions}
      maxFiles={10}
      allowBatchProcessing={true}
    />
  )
}