"use client"

import { EnhancedImageToolLayout } from "@/components/enhanced-image-tool-layout"
import { Scissors } from "lucide-react"
import { ImageProcessor } from "@/lib/processors/image-processor"

const backgroundRemovalOptions = [
  {
    key: "sensitivity",
    label: "Edge Sensitivity",
    type: "slider" as const,
    defaultValue: 30,
    min: 10,
    max: 100,
    step: 5,
  },
  {
    key: "smoothing",
    label: "Edge Smoothing",
    type: "slider" as const,
    defaultValue: 2,
    min: 0,
    max: 10,
    step: 1,
  },
  {
    key: "featherEdges",
    label: "Feather Edges",
    type: "checkbox" as const,
    defaultValue: true,
  },
  {
    key: "preserveDetails",
    label: "Preserve Fine Details",
    type: "checkbox" as const,
    defaultValue: true,
  },
]

async function removeBackground(files: any[], options: any) {
  try {
    const processedFiles = await Promise.all(
      files.map(async (file) => {
        const processedBlob = await ImageProcessor.removeBackground(file.file, {
          ...options,
          outputFormat: "png", // Always PNG for transparency
        })

        const processedUrl = URL.createObjectURL(processedBlob)
        
        // Always PNG for transparency
        const baseName = file.name.split(".")[0]
        const newName = `${baseName}.png`

        return {
          ...file,
          processed: true,
          processedPreview: processedUrl,
          name: newName,
          size: processedBlob.size,
          blob: processedBlob
        }
      }),
    )

    return {
      success: true,
      processedFiles,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to remove background",
    }
  }
}

export default function BackgroundRemoverPage() {
  return (
    <EnhancedImageToolLayout
      title="Background Remover"
      description="Remove backgrounds from images automatically using advanced edge detection. Perfect for product photos, portraits, and creating transparent images."
      icon={Scissors}
      toolType="background"
      processFunction={removeBackground}
      options={backgroundRemovalOptions}
      maxFiles={5}
      allowBatchProcessing={true}
    />
  )
}
