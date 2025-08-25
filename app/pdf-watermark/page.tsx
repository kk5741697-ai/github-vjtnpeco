"use client"

import { PDFToolLayout } from "@/components/pdf-tool-layout"
import { Droplets } from "lucide-react"
import { PDFProcessor } from "@/lib/pdf-processor"
import JSZip from "jszip"

const watermarkOptions = [
  {
    key: "watermarkText",
    label: "Watermark Text",
    type: "text" as const,
    defaultValue: "CONFIDENTIAL",
  },
  {
    key: "opacity",
    label: "Opacity",
    type: "slider" as const,
    defaultValue: 30,
    min: 10,
    max: 100,
    step: 5,
  },
  {
    key: "fontSize",
    label: "Font Size",
    type: "slider" as const,
    defaultValue: 48,
    min: 12,
    max: 120,
    step: 4,
  },
  {
    key: "position",
    label: "Position",
    type: "select" as const,
    defaultValue: "center",
    selectOptions: [
      { value: "center", label: "Center" },
      { value: "diagonal", label: "Diagonal" },
      { value: "top-left", label: "Top Left" },
      { value: "top-right", label: "Top Right" },
      { value: "bottom-left", label: "Bottom Left" },
      { value: "bottom-right", label: "Bottom Right" },
    ],
  },
  {
    key: "color",
    label: "Text Color",
    type: "select" as const,
    defaultValue: "gray",
    selectOptions: [
      { value: "gray", label: "Gray" },
      { value: "red", label: "Red" },
      { value: "blue", label: "Blue" },
      { value: "black", label: "Black" },
    ],
  },
]

async function addWatermarkToPDF(files: any[], options: any) {
  try {
    if (files.length === 0) {
      return {
        success: false,
        error: "Please select at least one PDF file to watermark",
      }
    }

    if (!options.watermarkText || options.watermarkText.trim() === "") {
      return {
        success: false,
        error: "Please provide watermark text",
      }
    }

    const watermarkOptions = {
      watermarkOpacity: options.opacity / 100,
      fontSize: options.fontSize,
      position: options.position,
      color: options.color,
    }

    if (files.length === 1) {
      // Single file watermarking
      const watermarkedBytes = await PDFProcessor.addWatermark(files[0].file, options.watermarkText, watermarkOptions)
      const blob = new Blob([watermarkedBytes], { type: "application/pdf" })
      const downloadUrl = URL.createObjectURL(blob)

      return {
        success: true,
        downloadUrl,
      }
    } else {
      // Multiple files - create ZIP
      const zip = new JSZip()

      for (const file of files) {
        const watermarkedBytes = await PDFProcessor.addWatermark(file.file, options.watermarkText, watermarkOptions)
        const filename = `watermarked_${file.name}`
        zip.file(filename, watermarkedBytes)
      }

      const zipBlob = await zip.generateAsync({ type: "blob" })
      const downloadUrl = URL.createObjectURL(zipBlob)

      return {
        success: true,
        downloadUrl,
      }
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add watermark to PDF",
    }
  }
}

export default function PDFWatermarkPage() {
  return (
    <PDFToolLayout
      title="PDF Watermark"
      description="Add text watermarks to your PDF documents. Customize opacity, position, size, and color to protect your documents or add branding."
      icon={Droplets}
      toolType="protect"
      processFunction={addWatermarkToPDF}
      options={watermarkOptions}
      maxFiles={10}
    />
  )
}
