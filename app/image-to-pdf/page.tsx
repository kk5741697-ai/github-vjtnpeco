"use client"

import { PDFToolLayout } from "@/components/pdf-tool-layout"
import { FileImage } from "lucide-react"
import { PDFProcessor } from "@/lib/pdf-processor"

const convertOptions = [
  {
    key: "pageSize",
    label: "Page Size",
    type: "select" as const,
    defaultValue: "a4",
    selectOptions: [
      { value: "a4", label: "A4" },
      { value: "letter", label: "Letter" },
      { value: "legal", label: "Legal" },
      { value: "a3", label: "A3" },
      { value: "custom", label: "Custom" },
    ],
  },
  {
    key: "orientation",
    label: "Orientation",
    type: "select" as const,
    defaultValue: "portrait",
    selectOptions: [
      { value: "portrait", label: "Portrait" },
      { value: "landscape", label: "Landscape" },
    ],
  },
  {
    key: "margin",
    label: "Margin (px)",
    type: "slider" as const,
    defaultValue: 20,
    min: 0,
    max: 100,
    step: 5,
  },
  {
    key: "fitToPage",
    label: "Fit Images to Page",
    type: "checkbox" as const,
    defaultValue: true,
  },
  {
    key: "maintainAspectRatio",
    label: "Maintain Aspect Ratio",
    type: "checkbox" as const,
    defaultValue: true,
  },
]

async function convertImagesToPDF(files: any[], options: any) {
  try {
    if (files.length === 0) {
      return {
        success: false,
        error: "Please select at least one image file to convert",
      }
    }

    // Extract actual File objects
    const imageFiles = files.map((f) => f.file)

    // Process image to PDF conversion using real PDF-lib
    const pdfBytes = await PDFProcessor.imagesToPDF(imageFiles)

    // Create download blob
    const blob = new Blob([pdfBytes], { type: "application/pdf" })
    const downloadUrl = URL.createObjectURL(blob)

    return {
      success: true,
      downloadUrl,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to convert images to PDF",
    }
  }
}

export default function ImageToPDFPage() {
  return (
    <PDFToolLayout
      title="Image to PDF Converter"
      description="Convert multiple images into a single PDF document with custom page layouts, margins, and sizing options."
      icon={FileImage}
      toolType="convert"
      processFunction={convertImagesToPDF}
      options={convertOptions}
      maxFiles={20}
      allowPageSelection={false}
      allowPageReorder={true}
    />
  )
}
