// Real QR/Barcode processing utilities using qrcode.js and jsQR for client-side processing
import QRCode from "qrcode"
import jsQR from "jsqr"

export interface QRCodeOptions {
  width?: number
  height?: number
  margin?: number
  color?: {
    dark?: string
    light?: string
  }
  errorCorrectionLevel?: "L" | "M" | "Q" | "H"
  type?: "image/png" | "image/jpeg" | "image/webp"
  quality?: number
  maskPattern?: number
  version?: number
  logo?: {
    src: string
    width?: number
    height?: number
    x?: number
    y?: number
  }
}

export interface BarcodeOptions {
  format: "CODE128" | "EAN13" | "EAN8" | "UPC" | "CODE39" | "ITF14" | "MSI" | "pharmacode"
  width?: number
  height?: number
  displayValue?: boolean
  fontSize?: number
  textAlign?: "left" | "center" | "right"
  textPosition?: "bottom" | "top"
  textMargin?: number
  fontOptions?: string
  font?: string
  background?: string
  lineColor?: string
  margin?: number
  marginTop?: number
  marginBottom?: number
  marginLeft?: number
  marginRight?: number
}

export class QRProcessor {
  static async generateQRCode(text: string, options: QRCodeOptions = {}): Promise<string> {
    try {
      const qrOptions = {
        width: options.width || 300,
        margin: options.margin || 4,
        color: {
          dark: options.color?.dark || "#000000",
          light: options.color?.light || "#FFFFFF",
        },
        errorCorrectionLevel: options.errorCorrectionLevel || "M",
        type: options.type || "image/png",
        quality: options.quality || 0.92,
        maskPattern: options.maskPattern,
        version: options.version,
      }

      // Generate base QR code
      const qrDataURL = await QRCode.toDataURL(text, qrOptions)

      // Add logo if provided
      if (options.logo?.src) {
        return await this.addLogoToQR(qrDataURL, options.logo, options.width || 300)
      }

      return qrDataURL
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  static async generateQRCodeSVG(text: string, options: QRCodeOptions = {}): Promise<string> {
    try {
      const qrOptions = {
        width: options.width || 300,
        margin: options.margin || 4,
        color: {
          dark: options.color?.dark || "#000000",
          light: options.color?.light || "#FFFFFF",
        },
        errorCorrectionLevel: options.errorCorrectionLevel || "M",
        maskPattern: options.maskPattern,
        version: options.version,
      }

      return await QRCode.toString(text, { ...qrOptions, type: "svg" })
    } catch (error) {
      throw new Error(`Failed to generate QR SVG: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  private static async addLogoToQR(
    qrDataURL: string,
    logo: NonNullable<QRCodeOptions["logo"]>,
    qrSize: number,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Canvas not supported"))
        return
      }

      canvas.width = qrSize
      canvas.height = qrSize

      const qrImage = new Image()
      qrImage.onload = () => {
        // Draw QR code
        ctx.drawImage(qrImage, 0, 0, qrSize, qrSize)

        const logoImage = new Image()
        logoImage.crossOrigin = "anonymous"
        logoImage.onload = () => {
          // Calculate logo size and position
          const logoSize = logo.width || qrSize * 0.2
          const logoX = logo.x !== undefined ? logo.x : (qrSize - logoSize) / 2
          const logoY = logo.y !== undefined ? logo.y : (qrSize - logoSize) / 2

          // Draw white background for logo
          const padding = 8
          ctx.fillStyle = "#FFFFFF"
          ctx.fillRect(logoX - padding, logoY - padding, logoSize + padding * 2, logoSize + padding * 2)

          // Draw logo
          ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize)

          resolve(canvas.toDataURL("image/png"))
        }
        logoImage.onerror = () => reject(new Error("Failed to load logo"))
        logoImage.src = logo.src
      }
      qrImage.onerror = () => reject(new Error("Failed to load QR code"))
      qrImage.src = qrDataURL
    })
  }

  static async scanQRCode(imageFile: File): Promise<{ data: string; location?: any }> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Canvas not supported"))
        return
      }

      const img = new Image()
      img.onload = () => {
        canvas.width = img.width
        canvas.height = img.height
        ctx.drawImage(img, 0, 0)

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const code = jsQR(imageData.data, imageData.width, imageData.height)

        if (code) {
          resolve({
            data: code.data,
            location: code.location,
          })
        } else {
          reject(new Error("No QR code found in image"))
        }
      }
      img.onerror = () => reject(new Error("Failed to load image"))
      img.src = URL.createObjectURL(imageFile)
    })
  }

  static generateWiFiQR(
    ssid: string,
    password: string,
    security: "WPA" | "WEP" | "nopass" = "WPA",
    hidden = false,
  ): string {
    return `WIFI:T:${security};S:${ssid};P:${password};H:${hidden ? "true" : "false"};;`
  }

  static generateVCardQR(contact: {
    firstName?: string
    lastName?: string
    organization?: string
    phone?: string
    email?: string
    url?: string
    address?: string
  }): string {
    const vcard = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      contact.firstName || contact.lastName ? `FN:${contact.firstName || ""} ${contact.lastName || ""}`.trim() : "",
      contact.organization ? `ORG:${contact.organization}` : "",
      contact.phone ? `TEL:${contact.phone}` : "",
      contact.email ? `EMAIL:${contact.email}` : "",
      contact.url ? `URL:${contact.url}` : "",
      contact.address ? `ADR:;;${contact.address};;;;` : "",
      "END:VCARD",
    ]
      .filter((line) => line !== "")
      .join("\n")

    return vcard
  }

  static generateEventQR(event: {
    title: string
    location?: string
    startDate: string
    endDate?: string
    description?: string
  }): string {
    const vevent = [
      "BEGIN:VEVENT",
      `SUMMARY:${event.title}`,
      event.location ? `LOCATION:${event.location}` : "",
      `DTSTART:${event.startDate.replace(/[-:]/g, "").replace("T", "")}00Z`,
      event.endDate ? `DTEND:${event.endDate.replace(/[-:]/g, "").replace("T", "")}00Z` : "",
      event.description ? `DESCRIPTION:${event.description}` : "",
      "END:VEVENT",
    ]
      .filter((line) => line !== "")
      .join("\n")

    return vevent
  }

  static async generateBulkQRCodes(
    data: Array<{ content: string; filename?: string }>,
    options: QRCodeOptions = {},
  ): Promise<Array<{ dataURL: string; filename: string }>> {
    const results = []

    for (let i = 0; i < data.length; i++) {
      const item = data[i]
      try {
        const qrDataURL = await this.generateQRCode(item.content, options)
        results.push({
          dataURL: qrDataURL,
          filename: item.filename || `qr-code-${i + 1}.png`,
        })
      } catch (error) {
        console.error(`Failed to generate QR code for item ${i + 1}:`, error)
        // Continue with other items even if one fails
      }
    }

    return results
  }
}

export class BarcodeProcessor {
  static async generateBarcode(text: string, options: BarcodeOptions): Promise<string> {
    // Note: This is a simplified barcode generator
    // In a real implementation, you'd use a library like JsBarcode
    return new Promise((resolve, reject) => {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("Canvas not supported"))
        return
      }

      const width = options.width || 200
      const height = options.height || 100
      canvas.width = width
      canvas.height = height

      // Fill background
      ctx.fillStyle = options.background || "#FFFFFF"
      ctx.fillRect(0, 0, width, height)

      // Draw barcode bars (simplified pattern)
      ctx.fillStyle = options.lineColor || "#000000"
      const barWidth = width / text.length

      for (let i = 0; i < text.length; i++) {
        const charCode = text.charCodeAt(i)
        const barHeight = height * 0.7 * (0.5 + (charCode % 50) / 100)
        const x = i * barWidth
        const y = (height - barHeight) / 2

        if (i % 2 === 0) {
          // Alternate bars
          ctx.fillRect(x, y, barWidth * 0.8, barHeight)
        }
      }

      // Add text if requested
      if (options.displayValue !== false) {
        ctx.fillStyle = options.lineColor || "#000000"
        ctx.font = `${options.fontSize || 14}px ${options.font || "Arial"}`
        ctx.textAlign = (options.textAlign as CanvasTextAlign) || "center"

        const textY = options.textPosition === "top" ? 20 : height - 10
        ctx.fillText(text, width / 2, textY)
      }

      resolve(canvas.toDataURL("image/png"))
    })
  }

  static validateBarcodeData(data: string, format: BarcodeOptions["format"]): { valid: boolean; error?: string } {
    switch (format) {
      case "EAN13":
        if (!/^\d{13}$/.test(data)) {
          return { valid: false, error: "EAN13 must be exactly 13 digits" }
        }
        break
      case "EAN8":
        if (!/^\d{8}$/.test(data)) {
          return { valid: false, error: "EAN8 must be exactly 8 digits" }
        }
        break
      case "UPC":
        if (!/^\d{12}$/.test(data)) {
          return { valid: false, error: "UPC must be exactly 12 digits" }
        }
        break
      case "CODE39":
        if (!/^[A-Z0-9\-. $/+%]+$/.test(data)) {
          return { valid: false, error: "CODE39 can only contain A-Z, 0-9, and special characters (-.$/+%)" }
        }
        break
      case "CODE128":
        // CODE128 can contain any ASCII character
        break
      default:
        break
    }

    return { valid: true }
  }
}
