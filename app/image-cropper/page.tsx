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
      { value: "9:16", label: "Mobile (9:16)" },
    ],
    section: "Crop Settings",
  },
  {
    key: "cropX",
    label: "Position X (px)",
    type: "number" as const,
    defaultValue: 0,
    min: 0,
    section: "Position",
  },
  {
    key: "cropY",
    label: "Position Y (px)",
    type: "number" as const,
    defaultValue: 0,
    min: 0,
    section: "Position",
  },
  {
    key: "cropWidth",
    label: "Width (px)",
    type: "number" as const,
    defaultValue: 400,
    min: 1,
    section: "Position",
  },
  {
    key: "cropHeight",
    label: "Height (px)",
    type: "number" as const,
    defaultValue: 300,
    min: 1,
    section: "Position",
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
  {
    key: "backgroundColor",
    label: "Background Color",
    type: "color" as const,
    defaultValue: "#ffffff",
    section: "Output",
  },
]

async function cropImages(files: any[], options: any) {
  try {
    const processedFiles = await Promise.all(
      files.map(async (file) => {
        const cropArea = file.cropArea || { 
          x: (options.cropX / file.dimensions.width) * 100, 
          y: (options.cropY / file.dimensions.height) * 100, 
          width: (options.cropWidth / file.dimensions.width) * 100, 
          height: (options.cropHeight / file.dimensions.height) * 100 
        }
        
        const processedBlob = await ImageProcessor.processImage(
          file.originalFile || file.file,
          {
            cropArea,
            outputFormat: options.outputFormat,
            quality: options.quality,
            backgroundColor: options.backgroundColor
          }
        )

        const processedUrl = URL.createObjectURL(processedBlob)
        
        // Update file name with correct extension
        const outputFormat = options.outputFormat || "png"
        const baseName = file.name.split(".")[0]
        const newName = `${baseName}.${outputFormat}`

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
      maxFiles={10}
      allowBatchProcessing={true}
      singleFileOnly={true}
    />
  )
}