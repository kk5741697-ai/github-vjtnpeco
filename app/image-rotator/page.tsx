"use client"

import { EnhancedImageToolLayout } from "@/components/enhanced-image-tool-layout"
import { RotateCw } from "lucide-react"
import { ImageProcessor } from "@/lib/processors/image-processor"

const rotateOptions = [
  {
    key: "rotation",
    label: "Rotation Angle",
    type: "select" as const,
    defaultValue: "90",
    selectOptions: [
      { value: "90", label: "90° Clockwise" },
      { value: "180", label: "180° (Flip)" },
      { value: "270", label: "270° Clockwise (90° Counter)" },
      { value: "-90", label: "90° Counter-clockwise" },
    ],
  },
  {
    key: "customAngle",
    label: "Custom Angle (degrees)",
    type: "slider" as const,
    defaultValue: 0,
    min: -180,
    max: 180,
    step: 1,
  },
  {
    key: "backgroundColor",
    label: "Background Color",
    type: "color" as const,
    defaultValue: "#ffffff",
  },
  {
    key: "outputFormat",
    label: "Output Format",
    type: "select" as const,
    defaultValue: "png",
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
    defaultValue: 95,
    min: 10,
    max: 100,
    step: 5,
  },
]

async function rotateImages(files: any[], options: any) {
  try {
    const processedFiles = await Promise.all(
      files.map(async (file) => {
        const angle = options.customAngle !== 0 ? options.customAngle : Number.parseInt(options.rotation)
        
        const processedBlob = await ImageProcessor.processImage(
          file.originalFile || file.file,
          {
            rotation: angle,
            backgroundColor: options.backgroundColor,
            outputFormat: options.outputFormat,
            quality: options.quality
          }
        )

        const processedUrl = URL.createObjectURL(processedBlob)
        
        const outputFormat = options.outputFormat || "png"
        const baseName = file.name.split(".")[0]
        const newName = `${baseName}_rotated.${outputFormat}`

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
      error: error instanceof Error ? error.message : "Failed to rotate images",
    }
  }
}

export default function ImageRotatorPage() {
  return (
    <EnhancedImageToolLayout
      title="Image Rotator"
      description="Rotate images by 90°, 180°, 270°, or any custom angle. Perfect for fixing orientation and creating artistic effects."
      icon={RotateCw}
      toolType="rotate"
      processFunction={rotateImages}
      options={rotateOptions}
      maxFiles={10}
      allowBatchProcessing={true}
    />
  )
}