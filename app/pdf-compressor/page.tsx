"use client"

import { PDFToolLayout } from "@/components/pdf-tool-layout"
import { Archive } from "lucide-react"
import { PDFProcessor } from "@/lib/pdf-processor"
import JSZip from "jszip"

const compressOptions = [
  {
    key: "compressionLevel",
    label: "Compression Level",
    type: "select" as const,
    defaultValue: "medium",
    selectOptions: [
      { value: "low", label: "Low Compression (High Quality)" },
      { value: "medium", label: "Medium Compression (Balanced)" },
      { value: "high", label: "High Compression (Small Size)" },
      { value: "extreme", label: "Extreme Compression (Smallest)" },
    ],
  },
]

async function compressPDF(files: any[], options: any) {
  try {
    if (files.length === 0) {
      return {
        success: false,
        error: "Please select at least one PDF file to compress",
      }
    }

    const compressionOptions = {
      quality: 80,
      compressionLevel: options.compressionLevel,
      optimizeImages: true,
      removeMetadata: false,
      compressFonts: true,
    }

    if (files.length === 1) {
      // Single file compression
      const compressedBytes = await PDFProcessor.compressPDF(files[0].file, compressionOptions)
      const blob = new Blob([compressedBytes], { type: "application/pdf" })
      const downloadUrl = URL.createObjectURL(blob)

      return {
        success: true,
        downloadUrl,
      }
    } else {
      // Multiple files - create ZIP
      const zip = new JSZip()

      for (const file of files) {
        const compressedBytes = await PDFProcessor.compressPDF(file.file, compressionOptions)
        const filename = `compressed_${file.name}`
        zip.file(filename, compressedBytes)
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
      error: error instanceof Error ? error.message : "Failed to compress PDF",
    }
  }
}

export default function PDFCompressorPage() {
  return (
    <PDFToolLayout
      title="PDF Compressor"
      description="Reduce PDF file size while maintaining quality. Optimize images, compress fonts, and remove unnecessary metadata to create smaller files."
      icon={Archive}
      toolType="compress"
      processFunction={compressPDF}
      options={compressOptions}
      maxFiles={5}
    />
  )
}
