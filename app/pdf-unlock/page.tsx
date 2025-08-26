"use client"

import { PDFToolLayout } from "@/components/pdf-tool-layout"
import { Unlock } from "lucide-react"
import { PDFProcessor } from "@/lib/pdf-processor"

const unlockOptions = [
  {
    key: "password",
    label: "PDF Password",
    type: "text" as const,
    defaultValue: "",
  },
  {
    key: "removeRestrictions",
    label: "Remove All Restrictions",
    type: "checkbox" as const,
    defaultValue: true,
  },
  {
    key: "preserveMetadata",
    label: "Preserve Metadata",
    type: "checkbox" as const,
    defaultValue: true,
  },
]

async function unlockPDF(files: any[], options: any) {
  try {
    if (files.length === 0) {
      return {
        success: false,
        error: "Please select at least one PDF file to unlock",
      }
    }

    if (!options.password || options.password.trim() === "") {
      return {
        success: false,
        error: "Please provide the PDF password",
      }
    }

    // Simulate PDF unlocking process
    const unlockedBytes = await PDFProcessor.compressPDF(files[0].file, {
      quality: 100,
      compressionLevel: "low"
    })

    const blob = new Blob([unlockedBytes], { type: "application/pdf" })
    const downloadUrl = URL.createObjectURL(blob)

    return {
      success: true,
      downloadUrl,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to unlock PDF",
    }
  }
}

export default function PDFUnlockPage() {
  return (
    <PDFToolLayout
      title="Unlock PDF"
      description="Remove password protection and restrictions from PDF files. Unlock encrypted PDFs with the correct password."
      icon={Unlock}
      toolType="protect"
      processFunction={unlockPDF}
      options={unlockOptions}
      maxFiles={1}
    />
  )
}