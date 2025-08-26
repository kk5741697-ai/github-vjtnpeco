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
  Move
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
  cropArea?: { x: number; y: number; width: number; height: number }
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

interface ImageToolLayoutProps {
  title: string
  description: string
  icon: any
  toolType: "resize" | "compress" | "convert" | "crop" | "rotate" | "watermark" | "background"
  processFunction: (files: ImageFile[], options: any) => Promise<{ success: boolean; processedFiles?: ImageFile[]; error?: string }>
  options: ToolOption[]
  maxFiles?: number
  singleFileOnly?: boolean
  allowBatchProcessing?: boolean
  supportedFormats?: string[]
  outputFormats?: string[]
  presets?: Array<{ name: string; values: any }>
}

export function ImageToolLayout({
  title,
  description,
  icon: Icon,
  toolType,
  processFunction,
  options,
  maxFiles = 20,
  singleFileOnly = false,
  allowBatchProcessing = true,
  supportedFormats = ["image/jpeg", "image/png", "image/webp", "image/gif"],
  outputFormats = ["jpeg", "png", "webp"],
  presets = []
}: ImageToolLayoutProps) {
  const [files, setFiles] = useState<ImageFile[]>([])
  const [toolOptions, setToolOptions] = useState<Record<string, any>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedFiles, setProcessedFiles] = useState<ImageFile[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [cropSelection, setCropSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [isResizing, setIsResizing] = useState(false)
  const [resizeHandle, setResizeHandle] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [history, setHistory] = useState<Array<{ files: ImageFile[]; options: any }>>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize options with defaults
  useEffect(() => {
    const defaultOptions: Record<string, any> = {}
    options.forEach(option => {
      defaultOptions[option.key] = option.defaultValue
    })
    setToolOptions(defaultOptions)
  }, [options])

  const handleFileUpload = async (uploadedFiles: FileList | null) => {
    if (!uploadedFiles) return

    if (singleFileOnly && files.length > 0) {
      setFiles([])
      setProcessedFiles([])
    }

    const newFiles: ImageFile[] = []
    const maxFilesToProcess = singleFileOnly ? 1 : Math.min(uploadedFiles.length, maxFiles)
    
    for (let i = 0; i < maxFilesToProcess; i++) {
      const file = uploadedFiles[i]
      if (!supportedFormats.includes(file.type)) continue

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
    
    if (newFiles.length > 0) {
      setSelectedFile(newFiles[0].id)
      setZoom(1)
      setPan({ x: 0, y: 0 })
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

  const undo = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1]
      setFiles(prevState.files)
      setToolOptions(prevState.options)
      setHistoryIndex(prev => prev - 1)
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1]
      setFiles(nextState.files)
      setToolOptions(nextState.options)
      setHistoryIndex(prev => prev + 1)
    }
  }

  const resetTool = () => {
    setFiles([])
    setProcessedFiles([])
    setSelectedFile(null)
    setCropSelection(null)
    setHistory([])
    setHistoryIndex(-1)
    setZoom(1)
    setPan({ x: 0, y: 0 })
    
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
  const getImageCoordinates = (e: React.MouseEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    const rect = img.getBoundingClientRect()
    const scaleX = img.naturalWidth / rect.width
    const scaleY = img.naturalHeight / rect.height
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
      percentX: ((e.clientX - rect.left) / rect.width) * 100,
      percentY: ((e.clientY - rect.top) / rect.height) * 100
    }
  }

  const handleCropStart = (e: React.MouseEvent<HTMLImageElement>) => {
    if (toolType !== "crop") return
    
    const coords = getImageCoordinates(e)
    setDragStart({ x: coords.percentX, y: coords.percentY })
    setIsDragging(true)
    setCropSelection({ x: coords.percentX, y: coords.percentY, width: 0, height: 0 })
  }

  const handleCropMove = (e: React.MouseEvent<HTMLImageElement>) => {
    if (toolType !== "crop" || !isDragging || !dragStart) return
    
    const coords = getImageCoordinates(e)
    const newSelection = {
      x: Math.min(dragStart.x, coords.percentX),
      y: Math.min(dragStart.y, coords.percentY),
      width: Math.abs(coords.percentX - dragStart.x),
      height: Math.abs(coords.percentY - dragStart.y)
    }

    // Apply aspect ratio constraint if set
    if (toolOptions.aspectRatio && toolOptions.aspectRatio !== "free") {
      const [widthRatio, heightRatio] = toolOptions.aspectRatio.split(":").map(Number)
      const aspectRatio = widthRatio / heightRatio
      
      if (newSelection.width / newSelection.height > aspectRatio) {
        newSelection.width = newSelection.height * aspectRatio
      } else {
        newSelection.height = newSelection.width / aspectRatio
      }
    }
    
    setCropSelection(newSelection)
  }

  const handleCropEnd = () => {
    setIsDragging(false)
    setDragStart(null)
    
    if (cropSelection && selectedFile) {
      setFiles(prev => prev.map(file => 
        file.id === selectedFile 
          ? { ...file, cropArea: cropSelection }
          : file
      ))
      saveToHistory()
    }
  }

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
      const result = await processFunction(files, toolOptions)
      
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

  const applyPreset = (preset: any) => {
    setToolOptions(prev => ({ ...prev, ...preset.values }))
    
    // For crop presets, apply aspect ratio immediately
    if (toolType === "crop" && preset.values.aspectRatio && cropSelection) {
      const [widthRatio, heightRatio] = preset.values.aspectRatio.split(":").map(Number)
      const aspectRatio = widthRatio / heightRatio
      
      const newSelection = { ...cropSelection }
      if (newSelection.width / newSelection.height > aspectRatio) {
        newSelection.width = newSelection.height * aspectRatio
      } else {
        newSelection.height = newSelection.width / aspectRatio
      }
      
      setCropSelection(newSelection)
    }
    
    saveToHistory()
  }

  const currentFile = selectedFile ? files.find(f => f.id === selectedFile) : files[0]

  // Group options by section
  const groupedOptions = options.reduce((acc, option) => {
    const section = option.section || "Settings"
    if (!acc[section]) acc[section] = []
    acc[section].push(option)
    return acc
  }, {} as Record<string, ToolOption[]>)

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      {/* Left Canvas - Responsive Image Preview */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <div className="bg-white border-b px-4 sm:px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center space-x-2 min-w-0">
              <Icon className="h-5 w-5 text-blue-600 flex-shrink-0" />
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{title}</h1>
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex">{files.length} files</Badge>
            {currentFile && (
              <Badge variant="outline" className="hidden md:inline-flex">
                {currentFile.dimensions.width} × {currentFile.dimensions.height}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2 flex-shrink-0">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={undo}
              disabled={historyIndex <= 0}
              className="hidden sm:inline-flex"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
              className="hidden sm:inline-flex"
            >
              <Redo className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetTool}
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Canvas Content */}
        <div className="flex-1 overflow-hidden relative">
          {files.length === 0 ? (
            <div className="h-full flex flex-col">
              <div className="p-4 flex-shrink-0">
                <EnhancedAdBanner position="header" showLabel />
              </div>
              
              <div className="flex-1 flex items-center justify-center p-4 sm:p-6">
                <div 
                  className="max-w-md w-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-gray-400 transition-colors p-8 sm:p-12"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-12 sm:h-16 w-12 sm:w-16 mb-4 text-gray-400" />
                  <h3 className="text-lg sm:text-xl font-medium mb-2">Drop images here</h3>
                  <p className="text-gray-400 mb-4 text-center">or click to browse</p>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Images
                  </Button>
                  <p className="text-xs text-gray-400 mt-4 text-center">
                    Supports: {supportedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}
                  </p>
                  {singleFileOnly && (
                    <p className="text-xs text-blue-600 mt-2 font-medium text-center">
                      Single file mode for precision editing
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b flex-shrink-0">
                <EnhancedAdBanner position="inline" showLabel />
              </div>

              {/* Image Preview Container with Proper Viewport Handling */}
              <div 
                ref={containerRef}
                className="flex-1 overflow-auto bg-gray-100 relative"
                style={{ height: "calc(100vh - 200px)" }}
              >
                <div className="min-h-full flex items-center justify-center p-4">
                  {currentFile && (
                    <div className="relative">
                      {/* Zoom Controls */}
                      <div className="absolute top-4 left-4 z-10 flex space-x-2 bg-white rounded-lg shadow-lg p-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setZoom(prev => Math.max(0.1, prev - 0.1))}
                        >
                          <ZoomOut className="h-3 w-3" />
                        </Button>
                        <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                          {Math.round(zoom * 100)}%
                        </span>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setZoom(prev => Math.min(3, prev + 0.1))}
                        >
                          <ZoomIn className="h-3 w-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}
                        >
                          <Move className="h-3 w-3" />
                        </Button>
                      </div>

                      <div 
                        className="relative inline-block"
                        style={{ 
                          transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
                          transformOrigin: "center center",
                          maxWidth: "calc(100vw - 400px)",
                          maxHeight: "calc(100vh - 300px)"
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
                            maxHeight: "100%"
                          }}
                          onMouseDown={handleCropStart}
                          onMouseMove={handleCropMove}
                          onMouseUp={handleCropEnd}
                          onMouseLeave={handleCropEnd}
                          draggable={false}
                        />
                        
                        {/* Enhanced Crop Overlay */}
                        {toolType === "crop" && cropSelection && (
                          <div
                            className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none"
                            style={{
                              left: `${cropSelection.x}%`,
                              top: `${cropSelection.y}%`,
                              width: `${cropSelection.width}%`,
                              height: `${cropSelection.height}%`
                            }}
                          >
                            {/* Crop Handles */}
                            <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white cursor-nw-resize"></div>
                            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white cursor-ne-resize"></div>
                            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white cursor-sw-resize"></div>
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white cursor-se-resize"></div>
                            
                            {/* Crop Info */}
                            <div className="absolute -top-8 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                              {Math.round(cropSelection.width)}% × {Math.round(cropSelection.height)}%
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
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
          {presets.length > 0 && (
            <div className="space-y-3">
              <Label className="text-sm font-medium">Quick Presets</Label>
              <div className="grid grid-cols-2 gap-2">
                {presets.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset(preset)}
                    className="text-xs"
                  >
                    {preset.name}
                  </Button>
                ))}
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
                      <SelectTrigger>
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
                        className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                      />
                      <Input
                        value={toolOptions[option.key] || option.defaultValue}
                        onChange={(e) => {
                          setToolOptions(prev => ({ ...prev, [option.key]: e.target.value }))
                        }}
                        onBlur={saveToHistory}
                        className="flex-1"
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
                {title} →
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
        accept={supportedFormats.join(",")}
        multiple={!singleFileOnly && maxFiles > 1}
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
      />
    </div>
  )
}