"use client"

import { PDFToolLayout } from "@/components/pdf-tool-layout"
import { Lock } from "lucide-react"
import { PDFProcessor } from "@/lib/pdf-processor"
import JSZip from "jszip"

const protectOptions = [
  {
    key: "userPassword",
    label: "User Password",
    type: "text" as const,
    defaultValue: "",
  },
  {
    key: "ownerPassword",
    label: "Owner Password",
    type: "text" as const,
    defaultValue: "",
  },
  {
    key: "allowPrinting",
    label: "Allow Printing",
    type: "checkbox" as const,
    defaultValue: true,
  },
  {
    key: "allowCopying",
    label: "Allow Copying",
    type: "checkbox" as const,
    defaultValue: false,
  },
  {
    key: "allowModifying",
    label: "Allow Modifying",
    type: "checkbox" as const,
    defaultValue: false,
  },
  {
    key: "allowAnnotations",
    label: "Allow Annotations",
    type: "checkbox" as const,
    defaultValue: true,
  },
  {
    key: "encryptionLevel",
    label: "Encryption Level",
    type: "select" as const,
    defaultValue: "128",
    selectOptions: [
      { value: "40", label: "40-bit RC4 (Compatible)" },
      { value: "128", label: "128-bit RC4 (Standard)" },
      { value: "256", label: "256-bit AES (High Security)" },
    ],
  },
]

async function protectPDF(files: any[], options: any) {
  try {
    if (files.length === 0) {
      return {
        success: false,
        error: "Please select at least one PDF file to protect",
      }
    }

    if (!options.userPassword && !options.ownerPassword) {
      return {
        success: false,
        error: "Please provide at least one password (user or owner)",
      }
    }

    const password = options.userPassword || options.ownerPassword
    const permissions = []

    if (options.allowPrinting) permissions.push("print")
    if (options.allowCopying) permissions.push("copy")
    if (options.allowModifying) permissions.push("modify")
    if (options.allowAnnotations) permissions.push("annotate")

    if (files.length === 1) {
      // Single file protection
      const protectedBytes = await PDFProcessor.addPasswordProtection(files[0].file, password, permissions)
      const blob = new Blob([protectedBytes], { type: "application/pdf" })
      const downloadUrl = URL.createObjectURL(blob)

      return {
        success: true,
        downloadUrl,
      }
    } else {
      // Multiple files - create ZIP
      const zip = new JSZip()

      for (const file of files) {
        const protectedBytes = await PDFProcessor.addPasswordProtection(file.file, password, permissions)
        const filename = `protected_${file.name}`
        zip.file(filename, protectedBytes)
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
      error: error instanceof Error ? error.message : "Failed to protect PDF",
    }
  }
}

export default function PDFPasswordProtectorPage() {
  return (
    <PDFToolLayout
      title="PDF Password Protector"
      description="Add password protection and security restrictions to your PDF files. Control printing, copying, and editing permissions with strong encryption."
      icon={Lock}
      toolType="protect"
      processFunction={protectPDF}
      options={protectOptions}
      maxFiles={5}
    />
  )
}
