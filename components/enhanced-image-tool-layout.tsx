"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { EnhancedAdBanner } from "@/components/ads/enhanced-ad-banner"
import { 
  Upload, 
  Download, 
  Trash2, 
  X,
  ArrowLeft,
  CheckCircle,
  Undo,
  Redo,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Move,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Maximize2,
  Minimize2
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"

interface ImageFile {
  id: string
  file: File
  originalFile?: File
  name: string
  size: number
  preview: string
  dimensions: { width: number; height: number }
  processed?: boolean
  processedPreview?: string
  processedSize?: number
  blob?: Blob
}

interface ToolOption {
  key: string
  label: string
  type: "select" | "slider" | "input" | "checkbox" | "color" | "text"
  defaultValue: any
  min?: number
  max?: number
  step?: number
  selectOptions?: Array<{ value: string; label: string }>
  section?: string
}

interface EnhancedImageToolLayoutProps {
  title: string
  description: string
  icon: any
  toolType: "resize" | "compress" | "convert" | "crop" | "rotate" | "watermark" | "background"
  processFunction: (files: ImageFile[], options: any) => Promise<{ success: boolean; processedFiles?: ImageFile[]; error?: string }>
  options: ToolOption[]
  maxFiles?: number
  singleFileOnly?: boolean
  allowBatchProcessing?: boolean
  presets?: Array<{ name: string; values: any }>
}

export function EnhancedImageToolLayout({
  title,
  description,
  icon: Icon,
  toolType,
  processFunction,
  options,
  maxFiles = 20,
  singleFileOnly = false,
  allowBatchProcessing = true,
  presets = []
}: EnhancedImageToolLayoutProps) {
  const [files, setFiles] = useState<ImageFile[]>([])
  const [toolOptions, setToolOptions] = useState<Record<string, any>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedFiles, setProcessedFiles] = useState<ImageFile[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [cropArea, setCropArea] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isResizing, setIsResizing] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [history, setHistory] = useState<Array<{ files: ImageFile[]; options: any }>>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Initialize options with defaults
  useEffect(() => {
    const defaultOptions: Record<string, any> = {}
    options.forEach(option => {
      defaultOptions[option.key] = option.defaultValue
    })
    setToolOptions(defaultOptions)
  }, [options])

  // Initialize crop area when image loads
  useEffect(() => {
    if (toolType === "crop" && files.length > 0 && !cropArea) {
      const currentFile = files.find(f => f.id === selectedFile) || files[0]
      if (currentFile) {
        // Set initial crop area to center 60% of image
        setCropArea({
          x: 20,
          y: 20,
          width: 60,
          height: 60
        })
      }
    }
  }, [files, selectedFile, toolType, cropArea])

  const handleFileUpload = async (uploadedFiles: FileList | null) => {
    if (!uploadedFiles) return

    // Check for single file restriction
    if (singleFileOnly && uploadedFiles.length > 1) {
      toast({
        title: "Single file only",
        description: "This tool only supports one file at a time for precision editing",
        variant: "destructive"
      })
      return
    }

    if (singleFileOnly && files.length > 0) {
      setFiles([])
      setProcessedFiles([])
      setCropArea(null)
    }

    const newFiles: ImageFile[] = []
    const maxFilesToProcess = singleFileOnly ? 1 : Math.min(uploadedFiles.length, maxFiles)
    
    for (let i = 0; i < maxFilesToProcess; i++) {
      const file = uploadedFiles[i]
      if (!file.type.startsWith("image/")) continue

      try {
        const preview = await createImagePreview(file)
        const dimensions = await getImageDimensions(file)
        
        const imageFile: ImageFile = {
          id: `${file.name}-${Date.now()}-${i}`,
          file,
          originalFile: file,
          name: file.name,
          size: file.size,
          preview,
          dimensions
        }

        newFiles.push(imageFile)
      } catch (error) {
        toast({
          title: "Error loading image",
          description: `Failed to load ${file.name}`,
          variant: "destructive"
        })
      }
    }

    setFiles(prev => singleFileOnly ? newFiles : [...prev, ...newFiles])
    
    if (newFiles.length > 0 && !selectedFile) {
      setSelectedFile(newFiles[0].id)
    }

    saveToHistory()
  }

  const createImagePreview = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    handleFileUpload(e.dataTransfer.files)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
    setProcessedFiles(prev => prev.filter(f => f.id !== fileId))
    if (selectedFile === fileId) {
      const remainingFiles = files.filter(f => f.id !== fileId)
      setSelectedFile(remainingFiles.length > 0 ? remainingFiles[0].id : null)
    }
    setCropArea(null)
    saveToHistory()
  }

  const saveToHistory = () => {
    const newHistoryEntry = { files: [...files], options: { ...toolOptions } }
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1)
      newHistory.push(newHistoryEntry)
      return newHistory.slice(-10)
    })
    setHistoryIndex(prev => Math.min(prev + 1, 9))
  }

  const resetTool = () => {
    setFiles([])
    setProcessedFiles([])
    setSelectedFile(null)
    setHistory([])
    setHistoryIndex(-1)
    setZoom(1)
    setPan({ x: 0, y: 0 })
    setCropArea(null)
    
    const defaultOptions: Record<string, any> = {}
    options.forEach(option => {
      defaultOptions[option.key] = option.defaultValue
    })
    setToolOptions(defaultOptions)
    
    toast({
      title: "Tool reset",
      description: "All files and settings have been reset"
    })
  }

  // Enhanced crop functionality
  const handleCropMouseDown = (e: React.MouseEvent, action: "drag" | "resize", handle?: string) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!imageRef.current || !canvasRef.current) return

    const imageRect = imageRef.current.getBoundingClientRect()
    const canvasRect = canvasRef.current.getBoundingClientRect()
    
    const relativeX = ((e.clientX - imageRect.left) / imageRect.width) * 100
    const relativeY = ((e.clientY - imageRect.top) / imageRect.height) * 100

    setDragStart({ x: relativeX, y: relativeY })

    if (action === "drag") {
      setIsDragging(true)
    } else if (action === "resize") {
      setIsResizing(true)
      setResizeHandle(handle || "")
    }
  }

  const handleCropMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging && !isResizing) return
    if (!imageRef.current || !dragStart || !cropArea) return

    const imageRect = imageRef.current.getBoundingClientRect()
    const relativeX = ((e.clientX - imageRect.left) / imageRect.width) * 100
    const relativeY = ((e.clientY - imageRect.top) / imageRect.height) * 100

    if (isDragging) {
      const deltaX = relativeX - dragStart.x
      const deltaY = relativeY - dragStart.y

      setCropArea(prev => {
        if (!prev) return null
        return {
          ...prev,
          x: Math.max(0, Math.min(100 - prev.width, prev.x + deltaX)),
          y: Math.max(0, Math.min(100 - prev.height, prev.y + deltaY))
        }
      })

      setDragStart({ x: relativeX, y: relativeY })
    } else if (isResizing && resizeHandle) {
      const deltaX = relativeX - dragStart.x
      const deltaY = relativeY - dragStart.y

      setCropArea(prev => {
        if (!prev) return null
        let newArea = { ...prev }

        switch (resizeHandle) {
          case "se":
            newArea.width = Math.max(5, Math.min(100 - prev.x, prev.width + deltaX))
            newArea.height = Math.max(5, Math.min(100 - prev.y, prev.height + deltaY))
            break
          case "sw":
            newArea.x = Math.max(0, Math.min(prev.x + prev.width - 5, prev.x + deltaX))
            newArea.width = prev.width - (newArea.x - prev.x)
            newArea.height = Math.max(5, Math.min(100 - prev.y, prev.height + deltaY))
            break
          case "ne":
            newArea.width = Math.max(5, Math.min(100 - prev.x, prev.width + deltaX))
            newArea.y = Math.max(0, Math.min(prev.y + prev.height - 5, prev.y + deltaY))
            newArea.height = prev.height - (newArea.y - prev.y)
            break
          case "nw":
            newArea.x = Math.max(0, Math.min(prev.x + prev.width - 5, prev.x + deltaX))
            newArea.y = Math.max(0, Math.min(prev.y + prev.height - 5, prev.y + deltaY))
            newArea.width = prev.width - (newArea.x - prev.x)
            newArea.height = prev.height - (newArea.y - prev.y)
            break
        }

        return newArea
      })

      setDragStart({ x: relativeX, y: relativeY })
    }
  }, [isDragging, isResizing, dragStart, cropArea, resizeHandle])

  const handleCropMouseUp = useCallback(() => {
    setIsDragging(false)
    setIsResizing(false)
    setResizeHandle(null)
    setDragStart(null)
  }, [])

  // Global mouse event listeners for crop
  useEffect(() => {
    if (toolType === "crop" && (isDragging || isResizing)) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        handleCropMouseMove(e as any)
      }
      const handleGlobalMouseUp = () => {
        handleCropMouseUp()
      }

      document.addEventListener("mousemove", handleGlobalMouseMove)
      document.addEventListener("mouseup", handleGlobalMouseUp)

      return () => {
        document.removeEventListener("mousemove", handleGlobalMouseMove)
        document.removeEventListener("mouseup", handleGlobalMouseUp)
      }
    }
  }, [toolType, isDragging, isResizing, handleCropMouseMove, handleCropMouseUp])

  const handleProcess = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload at least one image file",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    setProcessedFiles([])

    try {
      // Add crop area to files if cropping
      const filesToProcess = toolType === "crop" && cropArea 
        ? files.map(file => ({ ...file, cropArea }))
        : files

      const result = await processFunction(filesToProcess, toolOptions)
      
      if (result.success && result.processedFiles) {
        setProcessedFiles(result.processedFiles)
        toast({
          title: "Processing complete",
          description: `${result.processedFiles.length} images processed successfully`
        })
      } else {
        toast({
          title: "Processing failed",
          description: result.error || "An error occurred",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Processing failed",
        description: error instanceof Error ? error.message : "An error occurred",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (processedFiles.length === 1) {
      const file = processedFiles[0]
      if (file.blob) {
        const url = URL.createObjectURL(file.blob)
        const link = document.createElement("a")
        link.href = url
        link.download = file.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }
    } else if (processedFiles.length > 1) {
      import("jszip").then(({ default: JSZip }) => {
        const zip = new JSZip()
        
        processedFiles.forEach(file => {
          if (file.blob) {
            zip.file(file.name, file.blob)
          }
        })

        zip.generateAsync({ type: "blob" }).then(zipBlob => {
          const url = URL.createObjectURL(zipBlob)
          const link = document.createElement("a")
          link.href = url
          link.download = `${toolType}_images.zip`
          document.body.appendChild(link)
          link.click()
          document.body.removeChild(link)
          URL.revokeObjectURL(url)
        })
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  const currentFile = selectedFile ? files.find(f => f.id === selectedFile) : files[0]

  // Group options by section
  const groupedOptions = options.reduce((acc, option) => {
    const section = option.section || "Settings"
    if (!acc[section]) acc[section] = []
    acc[section].push(option)
    return acc
  }, {} as Record<string, ToolOption[]>)

  const fitToScreen = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      {/* Left Canvas - Enhanced Responsive Preview */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center space-x-2 min-w-0">
              <Icon className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <h1 className="text-lg font-semibold text-gray-900 truncate">{title}</h1>
            </div>
            {singleFileOnly && (
              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                Single File Mode
              </Badge>
            )}
          </div>
          
          {/* Canvas Controls - Only show when needed */}
          {currentFile && (
            <div className="flex items-center space-x-2 flex-shrink-0">
              {toolType === "crop" && (
                <>
                  <Button variant="outline" size="sm" onClick={() => setZoom(prev => Math.max(0.25, prev - 0.25))}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-gray-600 min-w-[60px] text-center">
                    {Math.round(zoom * 100)}%
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setZoom(prev => Math.min(4, prev + 0.25))}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={fitToScreen}>
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={resetTool}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>

        {/* Canvas Content */}
        <div className="flex-1 overflow-hidden relative">
          {files.length === 0 ? (
            <div className="h-full flex flex-col">
              <div className="p-4 flex-shrink-0">
                <EnhancedAdBanner position="header" showLabel />
              </div>
              
              <div className="flex-1 flex items-center justify-center p-4">
                <div 
                  className="max-w-md w-full border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all duration-200 p-8"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-16 w-16 mb-4 text-gray-400" />
                  <h3 className="text-xl font-medium mb-2">Drop images here</h3>
                  <p className="text-gray-400 mb-4 text-center">or click to browse</p>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Images
                  </Button>
                  <p className="text-xs text-gray-400 mt-4 text-center">
                    Supports: JPG, PNG, WebP, GIF • Max {maxFiles} files
                  </p>
                  {singleFileOnly && (
                    <div className="mt-3 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      Single file only for precision editing
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Ad Banner */}
              <div className="p-4 border-b flex-shrink-0">
                <EnhancedAdBanner position="inline" showLabel />
              </div>

              {/* Main Preview Area */}
              <div className="flex-1 flex overflow-hidden">
                {/* File Thumbnails - Only for multi-file tools */}
                {!singleFileOnly && files.length > 1 && (
                  <div className="w-48 border-r bg-white flex-shrink-0 overflow-y-auto">
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Files ({files.length})</h3>
                      <div className="space-y-2">
                        {files.map((file) => (
                          <div
                            key={file.id}
                            className={`relative group cursor-pointer rounded-lg border-2 transition-all ${
                              selectedFile === file.id 
                                ? "border-blue-500 bg-blue-50" 
                                : "border-gray-200 hover:border-gray-300"
                            }`}
                            onClick={() => setSelectedFile(file.id)}
                          >
                            <div className="aspect-square p-2">
                              <img 
                                src={file.processedPreview || file.preview}
                                alt={file.name}
                                className="w-full h-full object-cover rounded"
                              />
                            </div>
                            
                            {/* File actions in top-right corner like iLoveIMG */}
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="destructive"
                                size="sm"
                                className="h-6 w-6 p-0 rounded-full"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeFile(file.id)
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>

                            <div className="px-2 pb-2">
                              <p className="text-xs text-gray-600 truncate">{file.name}</p>
                              <p className="text-xs text-gray-400">{formatFileSize(file.size)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Image Preview Container - Responsive with proper viewport handling */}
                <div 
                  ref={canvasRef}
                  className="flex-1 overflow-auto bg-gray-100 relative"
                  style={{ 
                    height: "calc(100vh - 180px)",
                    maxHeight: "calc(100vh - 180px)"
                  }}
                >
                  <div className="min-h-full flex items-center justify-center p-4">
                    {currentFile && (
                      <div className="relative max-w-full max-h-full">
                        <div 
                          className="relative inline-block"
                          style={{ 
                            transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                            transformOrigin: "center center",
                            maxWidth: "calc(100vw - 400px)",
                            maxHeight: "calc(100vh - 250px)"
                          }}
                        >
                          <img
                            ref={imageRef}
                            src={currentFile.processedPreview || currentFile.preview}
                            alt={currentFile.name}
                            className="max-w-full max-h-full object-contain border border-gray-300 rounded-lg shadow-lg"
                            style={{ 
                              cursor: toolType === "crop" ? "crosshair" : "default",
                              maxWidth: "100%",
                              maxHeight: "calc(80vh - 100px)"
                            }}
                            draggable={false}
                          />
                          
                          {/* Enhanced Crop Overlay */}
                          {toolType === "crop" && cropArea && (
                            <div className="absolute inset-0 pointer-events-none">
                              {/* Dark overlay */}
                              <div 
                                className="absolute inset-0 bg-black bg-opacity-50"
                                style={{
                                  clipPath: `polygon(0% 0%, 0% 100%, ${cropArea.x}% 100%, ${cropArea.x}% ${cropArea.y}%, ${cropArea.x + cropArea.width}% ${cropArea.y}%, ${cropArea.x + cropArea.width}% ${cropArea.y + cropArea.height}%, ${cropArea.x}% ${cropArea.y + cropArea.height}%, ${cropArea.x}% 100%, 100% 100%, 100% 0%)`
                                }}
                              />
                              
                              {/* Crop selection area */}
                              <div
                                className="absolute border-2 border-blue-500 bg-transparent pointer-events-auto cursor-move"
                                style={{
                                  left: `${cropArea.x}%`,
                                  top: `${cropArea.y}%`,
                                  width: `${cropArea.width}%`,
                                  height: `${cropArea.height}%`
                                }}
                                onMouseDown={(e) => handleCropMouseDown(e, "drag")}
                              >
                                {/* Resize handles */}
                                <div 
                                  className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white cursor-nw-resize pointer-events-auto"
                                  onMouseDown={(e) => handleCropMouseDown(e, "resize", "nw")}
                                />
                                <div 
                                  className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white cursor-ne-resize pointer-events-auto"
                                  onMouseDown={(e) => handleCropMouseDown(e, "resize", "ne")}
                                />
                                <div 
                                  className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white cursor-sw-resize pointer-events-auto"
                                  onMouseDown={(e) => handleCropMouseDown(e, "resize", "sw")}
                                />
                                <div 
                                  className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white cursor-se-resize pointer-events-auto"
                                  onMouseDown={(e) => handleCropMouseDown(e, "resize", "se")}
                                />
                                
                                {/* Crop info */}
                                <div className="absolute -top-8 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                  {Math.round(cropArea.width)}% × {Math.round(cropArea.height)}%
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Enhanced */}
      <div className="w-80 bg-white border-l shadow-lg flex flex-col flex-shrink-0">
        {/* Sidebar Header */}
        <div className="px-6 py-4 border-b bg-gray-50 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Icon className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Quick Presets */}
          {presets && presets.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Quick Presets</Label>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setToolOptions(prev => ({ ...prev, ...preset.values }))
                      saveToHistory()
                    }}
                    className="text-xs h-8"
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Crop-specific controls */}
          {toolType === "crop" && cropArea && (
            <div className="space-y-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <Label className="text-sm font-medium text-blue-900">Crop Area</Label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-gray-600">X Position</Label>
                  <Input
                    type="number"
                    value={Math.round(cropArea.x)}
                    onChange={(e) => setCropArea(prev => prev ? { ...prev, x: Number(e.target.value) } : null)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Y Position</Label>
                  <Input
                    type="number"
                    value={Math.round(cropArea.y)}
                    onChange={(e) => setCropArea(prev => prev ? { ...prev, y: Number(e.target.value) } : null)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Width</Label>
                  <Input
                    type="number"
                    value={Math.round(cropArea.width)}
                    onChange={(e) => setCropArea(prev => prev ? { ...prev, width: Number(e.target.value) } : null)}
                    className="h-8 text-sm"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Height</Label>
                  <Input
                    type="number"
                    value={Math.round(cropArea.height)}
                    onChange={(e) => setCropArea(prev => prev ? { ...prev, height: Number(e.target.value) } : null)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Options by Section */}
          {Object.entries(groupedOptions).map(([section, sectionOptions]) => (
            <div key={section} className="space-y-4">
              {section !== "Settings" && (
                <h3 className="text-sm font-medium text-gray-900 border-b pb-2">{section}</h3>
              )}
              
              {sectionOptions.map((option) => (
                <div key={option.key} className="space-y-2">
                  <Label className="text-sm font-medium">{option.label}</Label>
                  
                  {option.type === "select" && (
                    <Select
                      value={toolOptions[option.key]?.toString()}
                      onValueChange={(value) => {
                        setToolOptions(prev => ({ ...prev, [option.key]: value }))
                        saveToHistory()
                      }}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {option.selectOptions?.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}

                  {option.type === "slider" && (
                    <div className="space-y-2">
                      <Slider
                        value={[toolOptions[option.key] || option.defaultValue]}
                        onValueChange={([value]) => setToolOptions(prev => ({ ...prev, [option.key]: value }))}
                        onValueCommit={() => saveToHistory()}
                        min={option.min}
                        max={option.max}
                        step={option.step}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{option.min}</span>
                        <span className="font-medium">{toolOptions[option.key] || option.defaultValue}</span>
                        <span>{option.max}</span>
                      </div>
                    </div>
                  )}

                  {option.type === "input" && (
                    <Input
                      type="number"
                      value={toolOptions[option.key] || option.defaultValue}
                      onChange={(e) => {
                        setToolOptions(prev => ({ ...prev, [option.key]: parseInt(e.target.value) || option.defaultValue }))
                      }}
                      onBlur={saveToHistory}
                      min={option.min}
                      max={option.max}
                      className="h-9"
                    />
                  )}

                  {option.type === "checkbox" && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={toolOptions[option.key] || false}
                        onCheckedChange={(checked) => {
                          setToolOptions(prev => ({ ...prev, [option.key]: checked }))
                          saveToHistory()
                        }}
                      />
                      <span className="text-sm">{option.label}</span>
                    </div>
                  )}

                  {option.type === "color" && (
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={toolOptions[option.key] || option.defaultValue}
                        onChange={(e) => {
                          setToolOptions(prev => ({ ...prev, [option.key]: e.target.value }))
                          saveToHistory()
                        }}
                        className="w-12 h-9 border border-gray-300 rounded cursor-pointer"
                      />
                      <Input
                        value={toolOptions[option.key] || option.defaultValue}
                        onChange={(e) => {
                          setToolOptions(prev => ({ ...prev, [option.key]: e.target.value }))
                        }}
                        onBlur={saveToHistory}
                        className="flex-1 h-9"
                      />
                    </div>
                  )}

                  {option.type === "text" && (
                    <Input
                      value={toolOptions[option.key] || option.defaultValue}
                      onChange={(e) => {
                        setToolOptions(prev => ({ ...prev, [option.key]: e.target.value }))
                      }}
                      onBlur={saveToHistory}
                      className="h-9"
                    />
                  )}
                </div>
              ))}
            </div>
          ))}

          {/* Ad Space */}
          <div className="py-4">
            <EnhancedAdBanner position="sidebar" showLabel />
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-6 border-t bg-gray-50 space-y-3 flex-shrink-0">
          <Button 
            onClick={handleProcess}
            disabled={isProcessing || files.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-semibold"
            size="lg"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                {title.replace("IMAGE", "").trim()} →
              </>
            )}
          </Button>

          {isProcessing && (
            <div className="space-y-2">
              <Progress value={66} className="h-2" />
              <p className="text-xs text-gray-600 text-center">Processing your images...</p>
            </div>
          )}

          {processedFiles.length > 0 && (
            <Button 
              onClick={handleDownload}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base font-semibold"
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Download {processedFiles.length > 1 ? "ZIP" : "Image"}
            </Button>
          )}

          {files.length > 0 && (
            <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
              <div className="flex justify-between">
                <span>Total files:</span>
                <span>{files.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total size:</span>
                <span>{formatFileSize(files.reduce((sum, file) => sum + file.size, 0))}</span>
              </div>
              {processedFiles.length > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Processed size:</span>
                  <span>{formatFileSize(processedFiles.reduce((sum, file) => sum + (file.processedSize || file.size), 0))}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple={!singleFileOnly && maxFiles > 1}
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
      />
    </div>
  )
}