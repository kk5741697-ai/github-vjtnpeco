"use client"

import { PDFToolLayout } from "@/components/pdf-tool-layout"
import { ArrowUpDown } from "lucide-react"
import { PDFProcessor } from "@/lib/processors/pdf-processor"

const organizeOptions = [
  {
    key: "sortBy",
    label: "Sort Pages By",
    type: "select" as const,
    defaultValue: "custom",
    selectOptions: [
      { value: "custom", label: "Custom Order (Drag & Drop)" },
      { value: "reverse", label: "Reverse Order" },
      { value: "odd", label: "Odd Pages First" },
      { value: "even", label: "Even Pages First" },
    ],
  },
  {
    key: "removeBlankPages",
    label: "Remove Blank Pages",
    type: "checkbox" as const,
    defaultValue: false,
  },
  {
    key: "addPageNumbers",
    label: "Add Page Numbers",
    type: "checkbox" as const,
    defaultValue: false,
  },
  {
    key: "pageNumberPosition",
    label: "Page Number Position",
    type: "select" as const,
    defaultValue: "bottom-center",
    selectOptions: [
      { value: "top-left", label: "Top Left" },
      { value: "top-center", label: "Top Center" },
      { value: "top-right", label: "Top Right" },
      { value: "bottom-left", label: "Bottom Left" },
      { value: "bottom-center", label: "Bottom Center" },
      { value: "bottom-right", label: "Bottom Right" },
    ],
    condition: (options) => options.addPageNumbers,
  },
]

async function organizePDF(files: any[], options: any) {
  try {
    if (files.length !== 1) {
      return {
        success: false,
        error: "Please select exactly one PDF file to organize",
      }
    }

    const file = files[0]
    
    // Create page ranges based on sort option
    let pageOrder: number[] = []
    
    switch (options.sortBy) {
      case "reverse":
        pageOrder = Array.from({ length: file.pageCount }, (_, i) => file.pageCount - i)
        break
      case "odd":
        const oddPages = Array.from({ length: Math.ceil(file.pageCount / 2) }, (_, i) => i * 2 + 1)
        const evenPages = Array.from({ length: Math.floor(file.pageCount / 2) }, (_, i) => (i + 1) * 2)
        pageOrder = [...oddPages, ...evenPages]
        break
      case "even":
        const evenFirst = Array.from({ length: Math.floor(file.pageCount / 2) }, (_, i) => (i + 1) * 2)
        const oddAfter = Array.from({ length: Math.ceil(file.pageCount / 2) }, (_, i) => i * 2 + 1)
        pageOrder = [...evenFirst, ...oddAfter]
        break
      default: // custom
        pageOrder = file.pages.map((p: any) => p.pageNumber)
        break
    }

    const ranges = pageOrder.map(pageNum => ({ from: pageNum, to: pageNum }))
    const organizedResults = await PDFProcessor.splitPDF(file.originalFile || file.file, ranges)

    // Merge back into single PDF
    const tempFiles = organizedResults.map((bytes, index) => {
      return new File([bytes], `temp-${index}.pdf`, { type: "application/pdf" })
    })

    const finalBytes = await PDFProcessor.mergePDFs(tempFiles, {
      addBookmarks: false,
      preserveMetadata: options.preserveMetadata
    })

    const blob = new Blob([finalBytes], { type: "application/pdf" })
    const downloadUrl = URL.createObjectURL(blob)

    return {
      success: true,
      downloadUrl,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to organize PDF",
    }
  }
}

export default function PDFOrganizerPage() {
  return (
    <PDFToolLayout
      title="Organize PDF"
      description="Reorder, sort, and organize PDF pages. Remove blank pages, add page numbers, and customize page arrangement."
      icon={ArrowUpDown}
      toolType="split"
      processFunction={organizePDF}
      options={organizeOptions}
      maxFiles={1}
      allowPageSelection={true}
      allowPageReorder={true}
    />
  )
}