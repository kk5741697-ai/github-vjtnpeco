"use client"

import { PDFToolLayout } from "@/components/pdf-tool-layout"
import { Scissors } from "lucide-react"
import { PDFProcessor } from "@/lib/pdf-processor"
import JSZip from "jszip"

const splitOptions = [
  {
    key: "splitMode",
    label: "Split Mode",
    type: "select" as const,
    defaultValue: "range",
    selectOptions: [
      { value: "range", label: "Page Range" },
      { value: "pages", label: "Individual Pages" },
      { value: "size", label: "Equal Parts" },
    ],
  },
  {
    key: "equalParts",
    label: "Number of Parts",
    type: "number" as const,
    defaultValue: 2,
    min: 2,
    max: 10,
  },
  {
    key: "maxSizeKB",
    label: "Maximum Size (KB)",
    type: "number" as const,
    defaultValue: 38,
    min: 1,
    max: 10000,
  },
  {
    key: "allowCompression",
    label: "Allow Compression",
    type: "checkbox" as const,
    defaultValue: true,
  },
]

async function splitPDF(files: any[], options: any) {
  try {
    if (files.length !== 1) {
      return {
        success: false,
        error: "Please select exactly one PDF file to split",
      }
    }

    const file = files[0]
    const ranges = options.pageRanges || [{ from: 1, to: 5 }]

    const splitResults = await PDFProcessor.splitPDF(file.originalFile, ranges)

    // Create ZIP with split PDFs
    const zip = new JSZip()
    splitResults.forEach((pdfBytes, index) => {
      const range = ranges[index]
      const filename = `${file.name.replace(".pdf", "")}_pages_${range.from}-${range.to}.pdf`
      zip.file(filename, pdfBytes)
    })

    const zipBlob = await zip.generateAsync({ type: "blob" })
    const downloadUrl = URL.createObjectURL(zipBlob)

    return {
      success: true,
      downloadUrl,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to split PDF",
    }
  }
}

export default function PDFSplitterPage() {
  return (
    <PDFToolLayout
      title="Split PDF"
      description="Split large PDF files into smaller documents by page ranges, file size, bookmarks, or equal parts. Extract specific pages or sections easily."
      icon={Scissors}
      toolType="split"
      processFunction={splitPDF}
      options={splitOptions}
      maxFiles={1}
      allowPageSelection={true}
    />
  )
}