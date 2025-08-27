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
    defaultValue: "pages",
    selectOptions: [
      { value: "pages", label: "Extract Selected Pages" },
      { value: "range", label: "Split by Page Range" },
      { value: "size", label: "Split into Equal Parts" },
    ],
  },
  {
    key: "equalParts",
    label: "Number of Parts",
    type: "slider" as const,
    defaultValue: 2,
    min: 2,
    max: 10,
    step: 1,
    condition: (options) => options.splitMode === "size",
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
    
    // Handle different split modes
    let ranges: Array<{ from: number; to: number }> = []
    
    if (options.splitMode === "pages") {
      // Split into individual pages based on selected pages
      const selectedPages = file.pages.filter((p: any) => p.selected).map((p: any) => p.pageNumber)
      ranges = selectedPages.map((pageNum: number) => ({ from: pageNum, to: pageNum }))
    } else if (options.splitMode === "range") {
      ranges = options.pageRanges || [{ from: 1, to: file.pageCount }]
    } else if (options.splitMode === "size") {
      const parts = options.equalParts || 2
      const pagesPerPart = Math.ceil(file.pageCount / parts)
      ranges = Array.from({ length: parts }, (_, i) => ({
        from: i * pagesPerPart + 1,
        to: Math.min((i + 1) * pagesPerPart, file.pageCount)
      }))
    }

    if (ranges.length === 0) {
      return {
        success: false,
        error: "No pages selected for splitting",
      }
    }

    const splitResults = await PDFProcessor.splitPDF(file.originalFile || file.file, ranges)

    // Create ZIP with split PDFs
    const zip = new JSZip()
    splitResults.forEach((pdfBytes, index) => {
      const range = ranges[index]
      const filename = range.from === range.to 
        ? `${file.name.replace(".pdf", "")}_page_${range.from}.pdf`
        : `${file.name.replace(".pdf", "")}_pages_${range.from}-${range.to}.pdf`
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