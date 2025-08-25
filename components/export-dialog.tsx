"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Download, Settings, FileImage, FileText, File } from "lucide-react"

interface ExportDialogProps {
  trigger?: React.ReactNode
  title?: string
  description?: string
  supportedFormats?: string[]
  defaultFormat?: string
  onExport: (options: ExportOptions) => Promise<void>
  children?: React.ReactNode
}

interface ExportOptions {
  format: string
  quality: number
  width?: number
  height?: number
  maintainAspectRatio: boolean
  includeBackground: boolean
  customName: string
}

export function ExportDialog({
  trigger,
  title = "Export Options",
  description = "Configure your export settings",
  supportedFormats = ["png", "jpg", "svg", "pdf"],
  defaultFormat = "png",
  onExport,
  children,
}: ExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [options, setOptions] = useState<ExportOptions>({
    format: defaultFormat,
    quality: 90,
    width: 1920,
    height: 1080,
    maintainAspectRatio: true,
    includeBackground: true,
    customName: "",
  })

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await onExport(options)
      setIsOpen(false)
    } catch (error) {
      console.error("Export failed:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "png":
      case "jpg":
      case "jpeg":
      case "webp":
      case "gif":
        return FileImage
      case "svg":
        return FileImage
      case "pdf":
        return File
      default:
        return FileText
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>{title}</span>
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="format" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="format">Format</TabsTrigger>
            <TabsTrigger value="dimensions">Dimensions</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="format" className="space-y-4">
            <div>
              <Label>Export Format</Label>
              <div className="grid grid-cols-2 gap-3 mt-2">
                {supportedFormats.map((format) => {
                  const FormatIcon = getFormatIcon(format)
                  return (
                    <button
                      key={format}
                      onClick={() => setOptions((prev) => ({ ...prev, format }))}
                      className={`flex items-center space-x-3 p-3 border rounded-lg transition-colors ${
                        options.format === format
                          ? "border-accent bg-accent/10"
                          : "border-border hover:border-accent/50"
                      }`}
                    >
                      <FormatIcon className="h-5 w-5" />
                      <div className="text-left">
                        <p className="font-medium">{format.toUpperCase()}</p>
                        <p className="text-xs text-muted-foreground">
                          {format === "png" && "Lossless, supports transparency"}
                          {format === "jpg" && "Compressed, smaller file size"}
                          {format === "svg" && "Vector format, scalable"}
                          {format === "pdf" && "Document format"}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {(options.format === "jpg" || options.format === "jpeg") && (
              <div>
                <Label>Quality: {options.quality}%</Label>
                <Slider
                  value={[options.quality]}
                  onValueChange={(value) => setOptions((prev) => ({ ...prev, quality: value[0] }))}
                  max={100}
                  min={1}
                  step={1}
                  className="mt-2"
                />
              </div>
            )}
          </TabsContent>

          <TabsContent value="dimensions" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="width">Width (px)</Label>
                <Input
                  id="width"
                  type="number"
                  value={options.width || ""}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      width: Number.parseInt(e.target.value) || undefined,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="height">Height (px)</Label>
                <Input
                  id="height"
                  type="number"
                  value={options.height || ""}
                  onChange={(e) =>
                    setOptions((prev) => ({
                      ...prev,
                      height: Number.parseInt(e.target.value) || undefined,
                    }))
                  }
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="aspect-ratio"
                checked={options.maintainAspectRatio}
                onCheckedChange={(checked) =>
                  setOptions((prev) => ({ ...prev, maintainAspectRatio: checked as boolean }))
                }
              />
              <Label htmlFor="aspect-ratio">Maintain aspect ratio</Label>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOptions((prev) => ({ ...prev, width: 1920, height: 1080 }))}
              >
                1920×1080
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOptions((prev) => ({ ...prev, width: 1280, height: 720 }))}
              >
                1280×720
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setOptions((prev) => ({ ...prev, width: 800, height: 600 }))}
              >
                800×600
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div>
              <Label htmlFor="custom-name">Custom Filename</Label>
              <Input
                id="custom-name"
                value={options.customName}
                onChange={(e) => setOptions((prev) => ({ ...prev, customName: e.target.value }))}
                placeholder="my-export"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-background"
                checked={options.includeBackground}
                onCheckedChange={(checked) =>
                  setOptions((prev) => ({ ...prev, includeBackground: checked as boolean }))
                }
              />
              <Label htmlFor="include-background">Include background</Label>
            </div>

            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium mb-2">Export Preview</h4>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Format: {options.format.toUpperCase()}</p>
                {options.width && options.height && (
                  <p>
                    Dimensions: {options.width} × {options.height}px
                  </p>
                )}
                {(options.format === "jpg" || options.format === "jpeg") && <p>Quality: {options.quality}%</p>}
                <p>Filename: {options.customName || `export.${options.format}`}</p>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {children}

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? "Exporting..." : "Export"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
