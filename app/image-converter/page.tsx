"use client"

import { ImageToolLayout } from "@/components/image-tool-layout"
import { RefreshCw } from "lucide-react"

const convertOptions = [
  {
    key: "outputFormat",
    label: "Output Format",
    type: "select" as const,
    defaultValue: "png",
    selectOptions: [
      { value: "jpeg", label: "JPEG" },
      { value: "png", label: "PNG" },
      { value: "webp", label: "WebP" },
      { value: "gif", label: "GIF" },
      { value: "bmp", label: "BMP" },
      { value: "tiff", label: "TIFF" },
    ],
  },
  {
    key: "quality",
    label: "Quality (for JPEG/WebP)",
    type: "slider" as const,
    defaultValue: 90,
    min: 10,
    max: 100,
    step: 5,
  },
  {
    key: "backgroundColor",
    label: "Background Color (for transparent images)",
    type: "color" as const,
    defaultValue: "#ffffff",
  },
  {
    key: "preserveTransparency",
    label: "Preserve Transparency",
    type: "checkbox" as const,
    defaultValue: true,
  },
  {
    key: "removeMetadata",
    label: "Remove Metadata",
    type: "checkbox" as const,
    defaultValue: false,
  },
]

async function convertImages(files: any[], options: any) {
  // Simulate image conversion process
  return new Promise<{ success: boolean; processedFiles?: any[]; error?: string }>((resolve) => {
    setTimeout(() => {
      if (files.length === 0) {
        resolve({
          success: false,
          error: "No files to process",
        })
        return
      }

      // Simulate successful conversion
      const processedFiles = files.map((file) => ({
        ...file,
        processed: true,
        processedPreview: file.preview,
        name: `${file.name.split(".")[0]}.${options.outputFormat}`,
      }))

      resolve({
        success: true,
        processedFiles,
      })
    }, 1500)
  })
}

export default function ImageConverterPage() {
  return (
    <ImageToolLayout
      title="Image Converter"
      description="Convert images between different formats including JPEG, PNG, WebP, GIF, BMP, and TIFF. Preserve quality and transparency as needed."
      icon={RefreshCw}
      toolType="convert"
      processFunction={convertImages}
      options={convertOptions}
      maxFiles={15}
      allowBatchProcessing={true}
      supportedFormats={["image/jpeg", "image/png", "image/gif", "image/webp", "image/bmp", "image/tiff"]}
    />
  )
}
