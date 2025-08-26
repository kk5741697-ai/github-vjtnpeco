"use client"

import { EnhancedImageToolLayout } from "@/components/enhanced-image-tool-layout"
import { Palette } from "lucide-react"
import { ImageProcessor } from "@/lib/processors/image-processor"

const filterOptions = [
  {
    key: "brightness",
    label: "Brightness",
    type: "slider" as const,
    defaultValue: 100,
    min: 0,
    max: 200,
    step: 5,
    section: "Basic Adjustments",
  },
  {
    key: "contrast",
    label: "Contrast",
    type: "slider" as const,
    defaultValue: 100,
    min: 0,
    max: 200,
    step: 5,
    section: "Basic Adjustments",
  },
  {
    key: "saturation",
    label: "Saturation",
    type: "slider" as const,
    defaultValue: 100,
    min: 0,
    max: 200,
    step: 5,
    section: "Basic Adjustments",
  },
  {
    key: "hue",
    label: "Hue Shift",
    type: "slider" as const,
    defaultValue: 0,
    min: -180,
    max: 180,
    step: 5,
    section: "Color Adjustments",
  },
  {
    key: "blur",
    label: "Blur",
    type: "slider" as const,
    defaultValue: 0,
    min: 0,
    max: 20,
    step: 1,
    section: "Effects",
  },
  {
    key: "sepia",
    label: "Sepia Effect",
    type: "checkbox" as const,
    defaultValue: false,
    section: "Effects",
  },
  {
    key: "grayscale",
    label: "Grayscale",
    type: "checkbox" as const,
    defaultValue: false,
    section: "Effects",
  },
  {
    key: "invert",
    label: "Invert Colors",
    type: "checkbox" as const,
    defaultValue: false,
    section: "Effects",
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

async function applyFilters(files: any[], options: any) {
  try {
    const processedFiles = await Promise.all(
      files.map(async (file) => {
        const processedBlob = await ImageProcessor.applyFilters(
          file.originalFile || file.file,
          {
            filters: {
              brightness: options.brightness,
              contrast: options.contrast,
              saturation: options.saturation,
              blur: options.blur,
              sepia: options.sepia,
              grayscale: options.grayscale,
              invert: options.invert
            },
            outputFormat: options.outputFormat,
            quality: options.quality
          }
        )

        const processedUrl = URL.createObjectURL(processedBlob)
        
        const outputFormat = options.outputFormat || "png"
        const baseName = file.name.split(".")[0]
        const newName = `${baseName}_filtered.${outputFormat}`

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
      error: error instanceof Error ? error.message : "Failed to apply filters",
    }
  }
}

export default function ImageFiltersPage() {
  return (
    <EnhancedImageToolLayout
      title="Image Filters"
      description="Apply professional filters and adjustments to your images. Adjust brightness, contrast, saturation, and add artistic effects."
      icon={Palette}
      toolType="convert"
      processFunction={applyFilters}
      options={filterOptions}
      maxFiles={15}
      allowBatchProcessing={true}
    />
  )
}