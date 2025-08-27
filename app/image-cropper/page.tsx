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
    selectOptions: [
      { value: "free", label: "Free" },
      { value: "1:1", label: "Square (1:1)" },
      { value: "4:3", label: "Standard (4:3)" },
      { value: "16:9", label: "Widescreen (16:9)" },
      { value: "3:2", label: "Photo (3:2)" },
      { value: "2:3", label: "Portrait (2:3)" },
      { value: "9:16", label: "Mobile (9:16)" },
    ],
    section: "Crop Settings",
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

const cropPresets = [
  { name: "Instagram Post", values: { aspectRatio: "1:1" } },
  { name: "YouTube Thumbnail", values: { aspectRatio: "16:9" } },
  { name: "Facebook Cover", values: { aspectRatio: "16:9" } },
  { name: "Twitter Header", values: { aspectRatio: "3:1" } },
  { name: "LinkedIn Post", values: { aspectRatio: "4:3" } },
  { name: "Mobile Story", values: { aspectRatio: "9:16" } },
]

async function cropImages(files: any[], options: any) {
  try {
    const processedFiles = await Promise.all(
      files.map(async (file) => {
        // Use crop area from file if available
        const cropArea = file.cropArea || { x: 20, y: 20, width: 60, height: 60 }
        
        const processedBlob = await ImageProcessor.cropImage(
          file.originalFile || file.file,
          cropArea,
          {
            outputFormat: options.outputFormat,
            quality: options.quality
          }
        )

        const processedUrl = URL.createObjectURL(processedBlob)
        
        const outputFormat = options.outputFormat || "png"
        const baseName = file.name.split(".")[0]
        const newName = `${baseName}_cropped.${outputFormat}`

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
      description="Crop images with precision controls and aspect ratio presets. Perfect for social media and professional use."
      icon={Crop}
      toolType="crop"
      processFunction={cropImages}
      options={cropOptions}
      maxFiles={1}
      singleFileOnly={true}
      allowBatchProcessing={false}
      presets={cropPresets}
    />
  )
}