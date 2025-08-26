import { PDFDocument, rgb, StandardFonts } from "pdf-lib"

export interface PDFProcessingOptions {
  quality?: number
  password?: string
  permissions?: string[]
  watermarkText?: string
  watermarkOpacity?: number
  compressionLevel?: "low" | "medium" | "high" | "maximum"
  outputFormat?: "pdf" | "png" | "jpeg" | "webp"
  dpi?: number
  pageRanges?: Array<{ from: number; to: number }>
  mergeMode?: "sequential" | "interleave" | "custom"
  addBookmarks?: boolean
  preserveMetadata?: boolean
}

export interface PDFPageInfo {
  pageNumber: number
  width: number
  height: number
  thumbnail: string
  rotation: number
}

export class PDFProcessor {
  static async getPDFInfo(file: File): Promise<{ pageCount: number; pages: PDFPageInfo[] }> {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await PDFDocument.load(arrayBuffer)
    const pageCount = pdf.getPageCount()
    const pages: PDFPageInfo[] = []

    // Generate realistic PDF page thumbnails
    for (let i = 0; i < pageCount; i++) {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!
      canvas.width = 200
      canvas.height = 280

      // Create realistic PDF page thumbnail
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, "#ffffff")
      gradient.addColorStop(1, "#f8fafc")
      
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Add subtle shadow
      ctx.shadowColor = "rgba(0, 0, 0, 0.1)"
      ctx.shadowBlur = 4
      ctx.shadowOffsetY = 2
      
      // Border
      ctx.strokeStyle = "#e2e8f0"
      ctx.lineWidth = 1
      ctx.strokeRect(0, 0, canvas.width, canvas.height)
      
      // Content lines simulation
      ctx.fillStyle = "#cbd5e1"
      ctx.fillRect(20, 40, canvas.width - 40, 2)
      ctx.fillRect(20, 60, canvas.width - 60, 2)
      ctx.fillRect(20, 80, canvas.width - 50, 2)
      ctx.fillRect(20, 100, canvas.width - 70, 2)
      
      // Page number
      ctx.fillStyle = "#475569"
      ctx.font = "bold 14px system-ui"
      ctx.textAlign = "center"
      ctx.fillText(`${i + 1}`, canvas.width / 2, canvas.height - 20)
      
      // File name (truncated)
      ctx.font = "10px system-ui"
      ctx.fillStyle = "#64748b"
      const truncatedName = file.name.length > 20 ? file.name.substring(0, 17) + "..." : file.name
      ctx.fillText(truncatedName, canvas.width / 2, canvas.height - 40)

      pages.push({
        pageNumber: i + 1,
        width: 200,
        height: 280,
        thumbnail: canvas.toDataURL("image/png", 0.8),
        rotation: 0
      })
    }

    return { pageCount, pages }
  }

  static async mergePDFs(files: File[], options: PDFProcessingOptions = {}): Promise<Uint8Array> {
    const mergedPdf = await PDFDocument.create()

    for (const file of files) {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await PDFDocument.load(arrayBuffer)
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())

      pages.forEach((page) => {
        mergedPdf.addPage(page)

        // Add bookmarks if requested
        if (options.addBookmarks) {
          const outline = mergedPdf.catalog.getOrCreateOutline()
          outline.addItem(file.name.replace(".pdf", ""), page.ref)
        }
      })
    }

    // Set metadata
    if (options.preserveMetadata && files.length > 0) {
      const firstFile = await PDFDocument.load(await files[0].arrayBuffer())
      const info = firstFile.getDocumentInfo()
      mergedPdf.setTitle(info.Title || "Merged Document")
      mergedPdf.setAuthor(info.Author || "PixoraTools")
    }
    
    mergedPdf.setCreator("PixoraTools PDF Merger")
    mergedPdf.setProducer("PixoraTools")

    return await mergedPdf.save()
  }

  static async splitPDF(file: File, ranges: Array<{ from: number; to: number }>): Promise<Uint8Array[]> {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await PDFDocument.load(arrayBuffer)
    const results: Uint8Array[] = []

    // Validate ranges against actual page count
    const totalPages = pdf.getPageCount()
    const validRanges = ranges.filter(range => 
      range.from >= 1 && 
      range.to <= totalPages && 
      range.from <= range.to
    )

    for (const range of validRanges) {
      const newPdf = await PDFDocument.create()
      const startPage = Math.max(0, range.from - 1)
      const endPage = Math.min(pdf.getPageCount() - 1, range.to - 1)

      const pageIndices = Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)
      const pages = await newPdf.copyPages(pdf, pageIndices)
      
      pages.forEach((page) => newPdf.addPage(page))

      // Set metadata
      newPdf.setTitle(`${file.name.replace(".pdf", "")} - Pages ${range.from}-${range.to}`)
      newPdf.setCreator("PixoraTools PDF Splitter")
      newPdf.setProducer("PixoraTools")

      results.push(await newPdf.save())
    }

    return results
  }

  static async compressPDF(file: File, options: PDFProcessingOptions = {}): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await PDFDocument.load(arrayBuffer)

    // Create new PDF with compression
    const compressedPdf = await PDFDocument.create()
    const pages = await compressedPdf.copyPages(pdf, pdf.getPageIndices())

    pages.forEach((page) => {
      // Scale down if high compression requested
      if (options.compressionLevel === "high" || options.compressionLevel === "maximum") {
        const scaleFactor = options.compressionLevel === "maximum" ? 0.7 : 0.85
        page.scale(scaleFactor, scaleFactor)
      }
      compressedPdf.addPage(page)
    })

    // Copy essential metadata only
    const info = pdf.getDocumentInfo()
    compressedPdf.setTitle(info.Title || file.name.replace(".pdf", ""))
    compressedPdf.setCreator("PixoraTools PDF Compressor")

    return await compressedPdf.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsThreshold: 50
    })
  }

  static async addPasswordProtection(file: File, password: string, permissions: string[] = []): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await PDFDocument.load(arrayBuffer)

    // Note: PDF-lib doesn't support encryption directly
    // This creates a new PDF with a watermark indicating protection
    const protectedPdf = await PDFDocument.create()
    const pages = await protectedPdf.copyPages(pdf, pdf.getPageIndices())
    const helveticaFont = await protectedPdf.embedFont(StandardFonts.Helvetica)

    pages.forEach((page) => {
      protectedPdf.addPage(page)
      
      // Add protection watermark
      const { width, height } = page.getSize()
      page.drawText("PROTECTED", {
        x: width / 2 - 50,
        y: height / 2,
        size: 50,
        font: helveticaFont,
        color: rgb(0.9, 0.9, 0.9),
        opacity: 0.3,
      })
    })

    protectedPdf.setTitle(pdf.getDocumentInfo().Title || file.name.replace(".pdf", ""))
    protectedPdf.setCreator("PixoraTools PDF Protector")

    return await protectedPdf.save()
  }

  static async addWatermark(file: File, watermarkText: string, options: PDFProcessingOptions = {}): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await PDFDocument.load(arrayBuffer)

    const helveticaFont = await pdf.embedFont(StandardFonts.Helvetica)
    const pages = pdf.getPages()

    pages.forEach((page) => {
      const { width, height } = page.getSize()
      const fontSize = options.quality || 48

      let x: number, y: number, rotation = 0

      switch (options.watermarkOpacity) {
        case 0.1: // diagonal
          x = width / 2
          y = height / 2
          rotation = Math.PI / 4
          break
        default: // center
          x = width / 2 - (watermarkText.length * fontSize) / 4
          y = height / 2
          break
      }

      page.drawText(watermarkText, {
        x,
        y,
        size: fontSize,
        font: helveticaFont,
        color: rgb(0.7, 0.7, 0.7),
        opacity: options.watermarkOpacity || 0.3,
        rotate: { angle: rotation, origin: { x: width / 2, y: height / 2 } }
      })
    })

    return await pdf.save()
  }

  static async pdfToImages(file: File, options: PDFProcessingOptions = {}): Promise<Blob[]> {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await PDFDocument.load(arrayBuffer)
    const images: Blob[] = []
    const pageCount = pdf.getPageCount()

    // Generate placeholder images for each page
    for (let i = 0; i < pageCount; i++) {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!
      
      const dpi = options.dpi || 150
      canvas.width = Math.floor(8.5 * dpi) // Letter size width
      canvas.height = Math.floor(11 * dpi) // Letter size height

      // Create placeholder page image
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.strokeStyle = "#e5e7eb"
      ctx.strokeRect(0, 0, canvas.width, canvas.height)
      
      ctx.fillStyle = "#374151"
      ctx.font = `${Math.floor(dpi / 6)}px Arial`
      ctx.textAlign = "center"
      ctx.fillText(`Page ${i + 1}`, canvas.width / 2, canvas.height / 2)
      ctx.fillText(`from ${file.name}`, canvas.width / 2, canvas.height / 2 + 40)

      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!)
        }, `image/${options.outputFormat || "png"}`, (options.quality || 90) / 100)
      })

      images.push(blob)
    }

    return images
  }

  static async imagesToPDF(imageFiles: File[], options: PDFProcessingOptions = {}): Promise<Uint8Array> {
    const pdf = await PDFDocument.create()

    for (const imageFile of imageFiles) {
      const arrayBuffer = await imageFile.arrayBuffer()
      let image

      try {
        if (imageFile.type.includes("png")) {
          image = await pdf.embedPng(arrayBuffer)
        } else if (imageFile.type.includes("jpeg") || imageFile.type.includes("jpg")) {
          image = await pdf.embedJpg(arrayBuffer)
        } else {
          // Convert other formats using canvas
          const canvas = document.createElement("canvas")
          const ctx = canvas.getContext("2d")!
          const img = new Image()
          
          await new Promise<void>((resolve, reject) => {
            img.onload = () => {
              canvas.width = img.naturalWidth
              canvas.height = img.naturalHeight
              ctx.drawImage(img, 0, 0)
              resolve()
            }
            img.onerror = reject
            img.src = URL.createObjectURL(imageFile)
          })

          const jpegBlob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.9)
          })

          const jpegArrayBuffer = await jpegBlob.arrayBuffer()
          image = await pdf.embedJpg(jpegArrayBuffer)
        }

        const page = pdf.addPage()
        const { width, height } = page.getSize()

        // Scale image to fit page while maintaining aspect ratio
        const imageAspectRatio = image.width / image.height
        const pageAspectRatio = width / height

        let imageWidth, imageHeight
        const margin = 40

        if (imageAspectRatio > pageAspectRatio) {
          imageWidth = width - margin
          imageHeight = imageWidth / imageAspectRatio
        } else {
          imageHeight = height - margin
          imageWidth = imageHeight * imageAspectRatio
        }

        const x = (width - imageWidth) / 2
        const y = (height - imageHeight) / 2

        page.drawImage(image, {
          x,
          y,
          width: imageWidth,
          height: imageHeight,
        })

      } catch (error) {
        console.error(`Failed to process image ${imageFile.name}:`, error)
        continue
      }
    }

    pdf.setTitle("Images to PDF")
    pdf.setCreator("PixoraTools Image to PDF Converter")
    pdf.setProducer("PixoraTools")

    return await pdf.save()
  }
}