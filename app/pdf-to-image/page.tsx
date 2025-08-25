"use client"

import { PDFToolLayout } from "@/components/pdf-tool-layout"
import { ImageIcon } from "lucide-react"
import { PDFProcessor } from "@/lib/pdf-processor"
import JSZip from "jszip"

const convertOptions = [
  {
    key: "outputFormat",
    label: "Output Format",
    type: "select" as const,
    defaultValue: "jpg",
    selectOptions: [
      { value: "jpg", label: "JPEG" },
      { value: "png", label: "PNG" },
      { value: "webp", label: "WebP" },
      { value: "tiff", label: "TIFF" },
    ],
  },
  {
    key: "resolution",
    label: "Resolution (DPI)",
    type: "select" as const,
    defaultValue: "150",
    selectOptions: [
      { value: "72", label: "72 DPI (Web)" },
      { value: "150", label: "150 DPI (Standard)" },
      { value: "300", label: "300 DPI (Print)" },
      { value: "600", label: "600 DPI (High Quality)" },
    ],
  },
  {
    key: "imageQuality",
    label: "Image Quality",
    type: "slider" as const,
    defaultValue: 90,
    min: 10,
    max: 100,
    step: 5,
  },
  {
    key: "colorMode",
    label: "Color Mode",
    type: "select" as const,
    defaultValue: "color",
    selectOptions: [
      { value: "color", label: "Full Color" },
      { value: "grayscale", label: "Grayscale" },
      { value: "monochrome", label: "Black & White" },
    ],
  },
]

async function convertPDFToImage(files: any[], options: any) {
  try {
    if (files.length === 0) {
      return {
        success: false,
        error: "Please select at least one PDF file to convert",
      }
    }

    const conversionOptions = {
      outputFormat: options.outputFormat,
      dpi: Number.parseInt(options.resolution),
      quality: options.imageQuality,
      colorMode: options.colorMode,
    }

    const zip = new JSZip()

    for (const file of files) {
      const images = await PDFProcessor.pdfToImages(file.file, conversionOptions)

      images.forEach((imageBlob, pageIndex) => {
        const filename = `${file.name.replace(".pdf", "")}_page_${pageIndex + 1}.${options.outputFormat}`
        zip.file(filename, imageBlob)
      })
    }

    const zipBlob = await zip.generateAsync({ type: "blob" })
    const downloadUrl = URL.createObjectURL(zipBlob)

    return {
      success: true,
      downloadUrl,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to convert PDF to images",
    }
  }
}

export default function PDFToImagePage() {
  return (
    <PDFToolLayout
      title="PDF to Image Converter"
      description="Convert PDF pages to high-quality images in multiple formats. Choose resolution, quality, and color mode for perfect results."
      icon={ImageIcon}
      toolType="convert"
      processFunction={convertPDFToImage}
      options={convertOptions}
      maxFiles={3}
      allowPageSelection={true}
    />
  )
}
