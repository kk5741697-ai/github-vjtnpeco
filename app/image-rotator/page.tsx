"use client"

import { ImageToolLayout } from "@/components/image-tool-layout"
import { RotateCw } from "lucide-react"

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
  // Simulate image rotation process
  return new Promise<{ success: boolean; processedFiles?: any[]; error?: string }>((resolve) => {
    setTimeout(() => {
      if (files.length === 0) {
        resolve({
          success: false,
          error: "No files to process",
        })
        return
      }

      // Simulate successful rotation
      const angle = options.customAngle !== 0 ? options.customAngle : Number.parseInt(options.rotation)
      const processedFiles = files.map((file) => {
        // For 90° and 270° rotations, swap width and height
        const shouldSwapDimensions = Math.abs(angle) === 90 || Math.abs(angle) === 270
        const newDimensions = shouldSwapDimensions
          ? { width: file.dimensions.height, height: file.dimensions.width }
          : file.dimensions

        return {
          ...file,
          processed: true,
          processedPreview: file.preview,
          dimensions: newDimensions,
        }
      })

      resolve({
        success: true,
        processedFiles,
      })
    }, 1500)
  })
}

export default function ImageRotatorPage() {
  return (
    <ImageToolLayout
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
