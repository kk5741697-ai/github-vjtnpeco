"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { QRProcessor } from "@/lib/qr-processor"
import { ScanLine, Upload, Copy, ExternalLink } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export default function QRScannerPage() {
  const [scannedData, setScannedData] = useState<string>("")
  const [isScanning, setIsScanning] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      })
      return
    }

    setIsScanning(true)
    try {
      const result = await QRProcessor.scanQRCode(file)
      setScannedData(result.data)
      toast({
        title: "QR Code scanned successfully!",
        description: "Data extracted from the QR code",
      })
    } catch (error) {
      toast({
        title: "Scan failed",
        description: error instanceof Error ? error.message : "Could not read QR code from image",
        variant: "destructive",
      })
    } finally {
      setIsScanning(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    handleFileUpload(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(scannedData)
    toast({
      title: "Copied to clipboard",
      description: "QR code data has been copied",
    })
  }

  const openLink = () => {
    if (scannedData.startsWith("http://") || scannedData.startsWith("https://")) {
      window.open(scannedData, "_blank")
    }
  }

  const isUrl = scannedData.startsWith("http://") || scannedData.startsWith("https://")

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-2 mb-4">
            <ScanLine className="h-8 w-8 text-accent" />
            <h1 className="text-3xl font-heading font-bold text-foreground">QR Code Scanner</h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Upload an image containing a QR code to extract its data. Supports PNG, JPEG, and WebP formats.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Upload Area */}
          <Card>
            <CardHeader>
              <CardTitle>Upload QR Code Image</CardTitle>
              <CardDescription>Drag and drop an image or click to browse</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors cursor-pointer ${
                  dragActive ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {isScanning ? "Scanning QR Code..." : "Select QR Code Image"}
                </h3>
                <p className="text-muted-foreground mb-4">
                  {isScanning ? "Please wait while we process your image" : "or drop image here"}
                </p>
                <Button disabled={isScanning}>
                  <Upload className="h-4 w-4 mr-2" />
                  {isScanning ? "Scanning..." : "Choose Image"}
                </Button>
                <p className="text-xs text-muted-foreground mt-4">Supports PNG, JPEG, WebP • Max 10MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
            </CardContent>
          </Card>

          {/* Results */}
          {scannedData && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ScanLine className="h-5 w-5" />
                  <span>Scanned Data</span>
                </CardTitle>
                <CardDescription>QR code content extracted successfully</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-muted rounded-lg">
                  <pre className="whitespace-pre-wrap break-all text-sm">{scannedData}</pre>
                </div>

                <div className="flex space-x-2">
                  <Button onClick={copyToClipboard} variant="outline">
                    <Copy className="h-4 w-4 mr-2" />
                    Copy
                  </Button>
                  {isUrl && (
                    <Button onClick={openLink} variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Link
                    </Button>
                  )}
                </div>

                {/* Data Analysis */}
                <div className="pt-4 border-t">
                  <h4 className="font-medium mb-2">Data Analysis</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Type:</span>
                      <span className="ml-2">
                        {isUrl
                          ? "URL"
                          : scannedData.startsWith("WIFI:")
                            ? "WiFi Network"
                            : scannedData.startsWith("BEGIN:VCARD")
                              ? "Contact (vCard)"
                              : scannedData.startsWith("BEGIN:VEVENT")
                                ? "Calendar Event"
                                : scannedData.startsWith("mailto:")
                                  ? "Email"
                                  : scannedData.startsWith("tel:")
                                    ? "Phone Number"
                                    : scannedData.startsWith("sms:")
                                      ? "SMS"
                                      : "Text"}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Length:</span>
                      <span className="ml-2">{scannedData.length} characters</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Footer />
    </div>
  )
}
