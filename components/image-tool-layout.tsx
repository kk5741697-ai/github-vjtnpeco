"use client"

import React, { useState, useRef, useCallback, useEffect } from "react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { 
  Upload, 
  Download, 
  Settings, 
  Play, 
  Trash2, 
  ImageIcon,
  Link,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Archive,
  Move,
  GripVertical,
  Eye,
  RotateCw,
  Crop,
  Plus,
  X,
  Cloud,
  Maximize,
  Palette
} from "lucide-react"
import { ImageProcessor } from "@/lib/processors/image-processor"
import { toast } from "@/hooks/use-toast"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"

export interface ProcessedImageFile {
  id: string
  name: string
  file: File
  originalFile: File
  processedBlob?: Blob
  preview: string
  processedPreview?: string
  size: number
  processedSize?: number
  status: "pending" | "processing" | "completed" | "error"
  progress: number
  error?: string
  dimensions: { width: number; height: number }
  cropArea?: { x: number; y: number; width: number; height: number }
  blob?: Blob
}

interface ToolOption {
  key: string
  label: string
  type: "text" | "number" | "select" | "checkbox" | "slider" | "color"
  defaultValue: any
  min?: number
  max?: number
  step?: number
  selectOptions?: Array<{ value: string; label: string }>
}

interface ImageToolLayoutProps {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  toolType: "resize" | "compress" | "convert" | "crop" | "rotate" | "watermark" | "background"
  processFunction: (files: any[], options: any) => Promise<{ success: boolean; processedFiles?: any[]; error?: string }>
  options: ToolOption[]
  maxFiles?: number
  maxFileSize?: number
  allowBatchProcessing?: boolean
  supportedFormats?: string[]
  outputFormats?: string[]
}

export function ImageToolLayout({
  title,
  description,
  icon: Icon,
  toolType,
  processFunction,
  options,
  maxFiles = 20,
  maxFileSize = 100,
  allowBatchProcessing = true,
  supportedFormats = ["image/jpeg", "image/png", "image/webp", "image/gif"],
  outputFormats = ["jpeg", "png", "webp"]
}: ImageToolLayoutProps) {
  const [files, setFiles] = useState<ProcessedImageFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const [isLoadingUrl, setIsLoadingUrl] = useState(false)
  const [processingOptions, setProcessingOptions] = useState<Record<string, any>>({})
  const [selectedCropArea, setSelectedCropArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [isDraggingCrop, setIsDraggingCrop] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const additionalFileInputRef = useRef<HTMLInputElement>(null)
  const cropCanvasRef = useRef<HTMLCanvasElement>(null)

  // Initialize default options
  useEffect(() => {
    const defaultOptions: Record<string, any> = {}
    options.forEach(option => {
      defaultOptions[option.key] = option.defaultValue
    })
    setProcessingOptions(defaultOptions)
  }, [options])

  const loadImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight })
      }
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  const handleFileSelection = useCallback(async (selectedFiles: File[]) => {
    if (files.length + selectedFiles.length > maxFiles) {
      toast({
        title: "Too many files",
        description: `Maximum ${maxFiles} files allowed`,
        variant: "destructive"
      })
      return
    }

    const newFiles: ProcessedImageFile[] = []

    for (const file of selectedFiles) {
      if (!supportedFormats.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported image format`,
          variant: "destructive"
        })
        continue
      }

      if (file.size > maxFileSize * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds ${maxFileSize}MB limit`,
          variant: "destructive"
        })
        continue
      }

      try {
        const dimensions = await loadImageDimensions(file)
        const preview = URL.createObjectURL(file)

        const processedFile: ProcessedImageFile = {
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          name: file.name,
          file,
          originalFile: file,
          preview,
          size: file.size,
          status: "pending",
          progress: 0,
          dimensions,
          cropArea: toolType === "crop" ? { x: 10, y: 10, width: 80, height: 80 } : undefined
        }

        newFiles.push(processedFile)
      } catch (error) {
        toast({
          title: "Error loading image",
          description: `Failed to load ${file.name}`,
          variant: "destructive"
        })
      }
    }

    setFiles(prev => [...prev, ...newFiles])
  }, [files, maxFiles, maxFileSize, supportedFormats, toolType])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFileSelection(droppedFiles)
  }, [handleFileSelection])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles) {
      handleFileSelection(Array.from(selectedFiles))
    }
    e.target.value = ""
  }, [handleFileSelection])

  const handleAdditionalFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles) {
      handleFileSelection(Array.from(selectedFiles))
    }
    e.target.value = ""
  }, [handleFileSelection])

  const handleUrlLoad = useCallback(async () => {
    if (!urlInput.trim()) return

    setIsLoadingUrl(true)
    try {
      const response = await fetch(urlInput)
      if (!response.ok) throw new Error("Failed to fetch file")

      const blob = await response.blob()
      const filename = urlInput.split("/").pop() || "downloaded-image"
      const file = new File([blob], filename, { type: blob.type })

      await handleFileSelection([file])
      setUrlInput("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load file from URL",
        variant: "destructive"
      })
    } finally {
      setIsLoadingUrl(false)
    }
  }, [urlInput, handleFileSelection])

  const handleProcess = async () => {
    setIsProcessing(true)
    
    try {
      // Update files to processing state
      setFiles(prev => prev.map(f => ({ ...f, status: "processing" as const, progress: 0 })))

      const result = await processFunction(files, processingOptions)
      
      if (result.success && result.processedFiles) {
        setFiles(prev => prev.map((file, index) => {
          const processedFile = result.processedFiles?.[index]
          if (processedFile) {
            return {
              ...file,
              status: "completed" as const,
              progress: 100,
              processedBlob: processedFile.blob,
              processedPreview: processedFile.processedPreview,
              processedSize: processedFile.size
            }
          }
          return file
        }))
        
        toast({
          title: "Processing complete",
          description: "Your images have been processed successfully"
        })
      } else {
        throw new Error(result.error || "Processing failed")
      }
    } catch (error) {
      setFiles(prev => prev.map(f => ({ 
        ...f, 
        status: "error" as const, 
        error: error instanceof Error ? error.message : "Processing failed" 
      })))
      
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  const onDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(files)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setFiles(items)
  }

  const downloadFile = (file: ProcessedImageFile) => {
    const blob = file.processedBlob || file.file
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const downloadAll = async () => {
    const processedFiles = files.filter(f => f.processedBlob)
    
    if (processedFiles.length === 0) {
      toast({
        title: "No processed files",
        description: "Please process your images first",
        variant: "destructive"
      })
      return
    }

    // For multiple files, create a ZIP
    if (processedFiles.length > 1) {
      const JSZip = (await import("jszip")).default
      const zip = new JSZip()

      processedFiles.forEach((file) => {
        if (file.processedBlob) {
          zip.file(file.name, file.processedBlob)
        }
      })

      const zipBlob = await zip.generateAsync({ type: "blob" })
      const url = URL.createObjectURL(zipBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `processed-images.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } else {
      downloadFile(processedFiles[0])
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const handleCropAreaChange = (fileId: string, cropArea: { x: number; y: number; width: number; height: number }) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, cropArea } : file
    ))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Ad Banner */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-2">
          <div className="bg-blue-50 border border-blue-200 rounded p-4 text-center">
            <span className="text-sm text-blue-600">Advertisement</span>
          </div>
        </div>
      </div>
      
      <div className="flex h-[calc(100vh-140px)]">
        {/* Left Panel - Main Canvas */}
        <div className="flex-1 p-6 overflow-auto">
          {files.length === 0 ? (
            /* Upload Area */
            <div className="h-full flex items-center justify-center">
              <div
                className={`border-2 border-dashed rounded-lg p-16 text-center transition-all cursor-pointer max-w-2xl w-full ${
                  dragActive 
                    ? toolType === "crop" ? "border-blue-500 bg-blue-50" : "border-red-500 bg-red-50"
                    : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className={`w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center ${
                  toolType === "crop" ? "bg-blue-100" : "bg-red-100"
                }`}>
                  <Icon className={`h-10 w-10 ${
                    toolType === "crop" ? "text-blue-600" : "text-red-600"
                  }`} />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto">{description}</p>
                
                <Button 
                  size="lg" 
                  className={`px-8 py-3 text-lg mb-6 ${
                    toolType === "crop" 
                      ? "bg-blue-500 hover:bg-blue-600" 
                      : "bg-red-500 hover:bg-red-600"
                  } text-white`}
                >
                  Select images
                </Button>

                <div className="flex justify-center">
                  <Tabs defaultValue="file" className="w-full max-w-md">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="file">
                        <ImageIcon className="h-4 w-4 mr-2" />
                        File
                      </TabsTrigger>
                      <TabsTrigger value="url">
                        <Link className="h-4 w-4 mr-2" />
                        URL
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="url" className="mt-4">
                      <div className="flex gap-2">
                        <Input
                          type="url"
                          placeholder="Enter image URL..."
                          value={urlInput}
                          onChange={(e) => setUrlInput(e.target.value)}
                          className="flex-1"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault()
                              handleUrlLoad()
                            }
                          }}
                        />
                        <Button 
                          onClick={handleUrlLoad}
                          disabled={!urlInput.trim() || isLoadingUrl}
                        >
                          {isLoadingUrl ? <RefreshCw className="h-4 w-4 animate-spin" /> : "Load"}
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                <p className="text-sm text-gray-500 mt-6">
                  or drop images here
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept={supportedFormats.join(",")}
                multiple={allowBatchProcessing}
                onChange={handleFileInput}
                className="hidden"
              />
            </div>
          ) : (
            /* Image Preview Area */
            <div className="h-full">
              {toolType === "crop" && files.length > 0 ? (
                /* Crop Interface - iLoveIMG Style */
                <div className="h-full bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Crop options</h3>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => additionalFileInputRef.current?.click()}
                        className="text-blue-600 border-blue-600"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add More
                      </Button>
                    </div>
                  </div>

                  {/* Crop Canvas */}
                  <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ height: "calc(100% - 100px)" }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        <img
                          src={files[0].preview}
                          alt={files[0].name}
                          className="max-w-full max-h-full object-contain"
                          style={{ maxHeight: "70vh" }}
                        />
                        
                        {/* Crop Selection Overlay */}
                        {selectedCropArea && (
                          <div
                            className="absolute border-2 border-blue-500 bg-blue-500/20"
                            style={{
                              left: `${selectedCropArea.x}%`,
                              top: `${selectedCropArea.y}%`,
                              width: `${selectedCropArea.width}%`,
                              height: `${selectedCropArea.height}%`,
                            }}
                          >
                            {/* Resize handles */}
                            <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full cursor-nw-resize"></div>
                            <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full cursor-ne-resize"></div>
                            <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full cursor-sw-resize"></div>
                            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full cursor-se-resize"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Standard Image Grid */
                <div className="bg-white rounded-lg border border-gray-200 p-6 h-full">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Images ({files.length})</h3>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => additionalFileInputRef.current?.click()}
                        disabled={files.length >= maxFiles}
                        className={`${
                          toolType === "crop" ? "text-blue-600 border-blue-600" : "text-red-600 border-red-600"
                        }`}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add More
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setFiles([])}
                        className="text-gray-600 border-gray-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear All
                      </Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 overflow-auto" style={{ maxHeight: "calc(100% - 80px)" }}>
                    {files.map((file, index) => (
                      <div key={file.id} className="relative group">
                        <div className="aspect-square bg-white border border-gray-200 rounded-lg overflow-hidden">
                          <img
                            src={file.processedPreview || file.preview}
                            alt={file.name}
                            className="w-full h-full object-cover"
                          />
                          
                          {/* Status Overlay */}
                          {file.status === "processing" && (
                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                              <RefreshCw className="h-6 w-6 text-white animate-spin" />
                            </div>
                          )}
                          
                          {file.status === "completed" && (
                            <div className="absolute top-2 right-2">
                              <CheckCircle className="h-5 w-5 text-green-500 bg-white rounded-full" />
                            </div>
                          )}
                          
                          {file.status === "error" && (
                            <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                              <AlertCircle className="h-6 w-6 text-red-500" />
                            </div>
                          )}

                          {/* Remove Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(file.id)}
                            className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white text-gray-600 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="mt-2 text-center">
                          <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {file.dimensions.width} × {file.dimensions.height} • {formatFileSize(file.size)}
                          </p>
                          {file.processedSize && (
                            <p className="text-xs text-green-600">
                              Processed: {formatFileSize(file.processedSize)}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Sidebar - Fixed Position (iLovePDF/iLoveIMG Style) */}
        <div className="w-80 bg-white border-l border-gray-200 flex-shrink-0">
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {toolType === "crop" ? "Crop options" : title.split(" ")[0]}
              </h3>
              
              {toolType === "crop" && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Width (px)</Label>
                    <Input
                      type="number"
                      value={processingOptions.width || 4878}
                      onChange={(e) => setProcessingOptions(prev => ({ ...prev, width: parseInt(e.target.value) || 4878 }))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Height (px)</Label>
                    <Input
                      type="number"
                      value={processingOptions.height || 3135}
                      onChange={(e) => setProcessingOptions(prev => ({ ...prev, height: parseInt(e.target.value) || 3135 }))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Position X (px)</Label>
                    <Input
                      type="number"
                      value={processingOptions.positionX || 610}
                      onChange={(e) => setProcessingOptions(prev => ({ ...prev, positionX: parseInt(e.target.value) || 610 }))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium text-gray-700 mb-2 block">Position Y (px)</Label>
                    <Input
                      type="number"
                      value={processingOptions.positionY || 392}
                      onChange={(e) => setProcessingOptions(prev => ({ ...prev, positionY: parseInt(e.target.value) || 392 }))}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Tool Options */}
            <div className="flex-1 p-6 overflow-auto">
              {options.length > 0 && toolType !== "crop" && (
                <div className="space-y-4">
                  {options.map((option) => (
                    <div key={option.key}>
                      <Label htmlFor={option.key} className="text-sm font-medium text-gray-700 mb-2 block">
                        {option.label}
                      </Label>
                      
                      {option.type === "select" && (
                        <select
                          id={option.key}
                          value={processingOptions[option.key] || option.defaultValue}
                          onChange={(e) => setProcessingOptions(prev => ({ ...prev, [option.key]: e.target.value }))}
                          className="w-full p-2 border border-gray-300 rounded-md bg-white"
                        >
                          {option.selectOptions?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      )}
                      
                      {option.type === "slider" && (
                        <div>
                          <Slider
                            value={[processingOptions[option.key] || option.defaultValue]}
                            onValueChange={(value) => setProcessingOptions(prev => ({ ...prev, [option.key]: value[0] }))}
                            min={option.min || 0}
                            max={option.max || 100}
                            step={option.step || 1}
                            className="mb-2"
                          />
                          <div className="flex justify-between text-xs text-gray-500">
                            <span>{option.min || 0}</span>
                            <span className="font-medium">{processingOptions[option.key] || option.defaultValue}</span>
                            <span>{option.max || 100}</span>
                          </div>
                        </div>
                      )}
                      
                      {option.type === "checkbox" && (
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={option.key}
                            checked={processingOptions[option.key] || option.defaultValue}
                            onCheckedChange={(checked) => setProcessingOptions(prev => ({ ...prev, [option.key]: checked }))}
                          />
                        </div>
                      )}
                      
                      {option.type === "color" && (
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={processingOptions[option.key] || option.defaultValue}
                            onChange={(e) => setProcessingOptions(prev => ({ ...prev, [option.key]: e.target.value }))}
                            className="w-12 h-8 border border-gray-300 rounded"
                          />
                          <Input
                            value={processingOptions[option.key] || option.defaultValue}
                            onChange={(e) => setProcessingOptions(prev => ({ ...prev, [option.key]: e.target.value }))}
                            className="flex-1"
                          />
                        </div>
                      )}
                      
                      {(option.type === "text" || option.type === "number") && (
                        <Input
                          id={option.key}
                          type={option.type}
                          value={processingOptions[option.key] || option.defaultValue}
                          onChange={(e) => setProcessingOptions(prev => ({ 
                            ...prev, 
                            [option.key]: option.type === "number" ? Number(e.target.value) : e.target.value 
                          }))}
                          min={option.min}
                          max={option.max}
                          step={option.step}
                          className="w-full"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-6 border-t border-gray-200">
              <Button
                onClick={handleProcess}
                disabled={isProcessing || files.length === 0}
                className={`w-full py-3 text-white font-semibold ${
                  toolType === "crop" 
                    ? "bg-blue-500 hover:bg-blue-600" 
                    : "bg-red-500 hover:bg-red-600"
                }`}
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Icon className="h-4 w-4 mr-2" />
                    {toolType === "crop" ? "Crop IMAGE" : `${title.split(" ")[0]} IMAGE`}
                  </>
                )}
              </Button>

              {/* Download Button */}
              {files.some(f => f.status === "completed") && (
                <Button
                  onClick={downloadAll}
                  variant="outline"
                  className="w-full mt-3"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download {files.filter(f => f.status === "completed").length > 1 ? "All (ZIP)" : "Result"}
                </Button>
              )}
            </div>

            {/* Ad Space */}
            <div className="p-4 border-t border-gray-200">
              <div className="bg-gray-100 border border-gray-300 rounded p-4 text-center min-h-[250px] flex items-center justify-center">
                <span className="text-gray-400 text-sm">300x250 Ad Space</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden file input for additional uploads */}
      <input
        ref={additionalFileInputRef}
        type="file"
        accept={supportedFormats.join(",")}
        multiple={allowBatchProcessing}
        onChange={handleAdditionalFileInput}
        className="hidden"
      />
    </div>
  )
}