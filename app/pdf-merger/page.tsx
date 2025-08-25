"use client"

import { PDFToolLayout } from "@/components/pdf-tool-layout"
import { FileType } from "lucide-react"
import { PDFProcessor } from "@/lib/pdf-processor"
import JSZip from "jszip"

const mergeOptions = [
  {
    key: "addBookmarks",
    label: "Add Bookmarks",
    type: "checkbox" as const,
    defaultValue: true,
  },
  {
    key: "preserveMetadata",
    label: "Preserve Metadata",
    type: "checkbox" as const,
    defaultValue: true,
  },
  {
    key: "mergeMode",
    label: "Merge Mode",
    type: "select" as const,
    defaultValue: "sequential",
    selectOptions: [
      { value: "sequential", label: "Sequential Order" },
      { value: "interleave", label: "Interleave Pages" },
      { value: "custom", label: "Custom Order" },
    ],
  },
]

async function mergePDFs(files: any[], options: any) {
  try {
    if (files.length < 2) {
      return {
        success: false,
        error: "At least 2 PDF files are required for merging",
      }
    }

    const fileObjects = files.map((f: any) => f.originalFile)
    const mergedPdfBytes = await PDFProcessor.mergePDFs(fileObjects, {
      addBookmarks: options.addBookmarks,
      preserveMetadata: options.preserveMetadata
    })

    const mergedBlob = new Blob([mergedPdfBytes], { type: "application/pdf" })
    const downloadUrl = URL.createObjectURL(mergedBlob)

    return {
      success: true,
      downloadUrl,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to merge PDFs",
    }
  }
}

export default function PDFMergerPage() {
  return (
    <PDFToolLayout
      title="Merge PDF"
      description="Combine multiple PDF files into one document with custom page ordering and bookmark preservation. Perfect for merging reports, presentations, and documents."
      icon={FileType}
      toolType="merge"
      processFunction={mergePDFs}
      options={mergeOptions}
      maxFiles={10}
      allowPageReorder={true}
    />
  )
}