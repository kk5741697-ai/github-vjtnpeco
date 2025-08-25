"use client"

import { ImageToolLayout } from "@/components/image-tool-layout"
import { Scissors } from "lucide-react"
import { ImageProcessor } from "@/lib/image-processor"

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

        return {
          ...file,
          processed: true,
          processedPreview: processedUrl,
          size: processedBlob.size,
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
    <ImageToolLayout
      title="Background Remover"
      description="Remove backgrounds from images automatically using advanced edge detection. Perfect for product photos, portraits, and creating transparent images."
      icon={Scissors}
      toolType="background"
      processFunction={removeBackground}
      options={backgroundRemovalOptions}
      maxFiles={5}
      allowBatchProcessing={true}
      supportedFormats={["image/jpeg", "image/png", "image/webp"]}
      outputFormats={["png"]}
    />
  )
}
