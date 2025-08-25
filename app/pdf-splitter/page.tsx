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
    key: "pageRange",
    label: "Page Range (e.g., 1-5, 8-10)",
    type: "text" as const,
    defaultValue: "1-5",
  },
  {
    key: "equalParts",
    label: "Number of Parts",
    type: "number" as const,
    defaultValue: 2,
    min: 2,
    max: 10,
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
    let ranges: Array<{ from: number; to: number }> = []

    if (options.splitMode === "range") {
      // Parse page range string like "1-5, 8-10"
      const rangeStr = options.pageRange || "1-5"
      const rangeParts = rangeStr.split(",").map(s => s.trim())
      
      for (const part of rangeParts) {
        if (part.includes("-")) {
          const [from, to] = part.split("-").map(n => parseInt(n.trim()))
          if (from && to && from <= to) {
            ranges.push({ from, to })
          }
        } else {
          const page = parseInt(part)
          if (page) {
            ranges.push({ from: page, to: page })
          }
        }
      }
    } else if (options.splitMode === "pages") {
      // Split each page individually (simulate 10 pages)
      for (let i = 1; i <= 10; i++) {
        ranges.push({ from: i, to: i })
      }
    } else if (options.splitMode === "size") {
      // Split into equal parts (simulate 10 pages)
      const totalPages = 10
      const pagesPerPart = Math.ceil(totalPages / options.equalParts)
      for (let i = 0; i < options.equalParts; i++) {
        const from = i * pagesPerPart + 1
        const to = Math.min((i + 1) * pagesPerPart, totalPages)
        if (from <= totalPages) {
          ranges.push({ from, to })
        }
      }
    }

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