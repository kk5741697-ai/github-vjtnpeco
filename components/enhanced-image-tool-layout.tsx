"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Progress } from "@/components/ui/progress"
import { EnhancedAdBanner } from "@/components/ads/enhanced-ad-banner"
import { 
  Upload, 
  Download, 
  Trash2, 
  RotateCw, 
  Move, 
  ZoomIn, 
  ZoomOut, 
  Crop,
  Maximize,
  Archive,
  RefreshCw,
  ImageIcon,
  X,
  Menu,
  CheckCircle,
  ArrowLeft,
  Plus,
  Grid,
  List,
  Maximize2,
  FlipHorizontal,
  FlipVertical,
  Undo,
  Redo,
  RotateCcw,
  Save,
  Settings
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import Link from "next/link"

interface ImageFile {
  id: string
  file: File
  originalFile: File
  name: string
  size: number
  preview: string
  dimensions: { width: number; height: number }
  processed?: boolean
  processedPreview?: string
  processedSize?: number
  blob?: Blob
  cropArea?: { x: number; y: number; width: number; height: number }
  rotation?: number
  history?: Array<{ preview: string; options: any }>
  historyIndex?: number
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
  condition?: (options: any) => boolean
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
  allowBatchProcessing?: boolean
  supportedFormats?: string[]
  outputFormats?: string[]
  singleFileOnly?: boolean
}

export function EnhancedImageToolLayout({
  title,
  description,
  icon: Icon,
  toolType,
  processFunction,
  options,
  maxFiles = 20,
  allowBatchProcessing = true,
  supportedFormats = ["image/jpeg", "image/png", "image/webp", "image/gif"],
  outputFormats = ["jpeg", "png", "webp"],
  singleFileOnly = false
}: EnhancedImageToolLayoutProps) {
  const [files, setFiles] = useState<ImageFile[]>([])
  const [toolOptions, setToolOptions] = useState<Record<string, any>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedFiles, setProcessedFiles] = useState<ImageFile[]>([])
  const [zoom, setZoom] = useState(100)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [cropMode, setCropMode] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "comparison" | "single">("single")
  const [cropSelection, setCropSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [history, setHistory] = useState<Array<{ files: ImageFile[]; options: any }>>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Auto-save functionality with quota management
  useEffect(() => {
    if (files.length > 0) {
      try {
        // Check available storage
        const testKey = 'storage-test'
        const testValue = 'test'
        localStorage.setItem(testKey, testValue)
        localStorage.removeItem(testKey)

        // Only save essential data to prevent quota issues
        const saveData = {
          files: files.slice(0, 3).map(f => ({ // Limit to 3 files
            id: f.id,
            name: f.name,
            size: f.size,
            dimensions: f.dimensions,
            cropArea: f.cropArea,
            rotation: f.rotation
          })),
          options: toolOptions,
          timestamp: Date.now()
        }
        
        const dataString = JSON.stringify(saveData)
        if (dataString.length < 500000) { // 500KB limit
          localStorage.setItem(`${toolType}-autosave`, dataString)
        }
      } catch (error) {
        // Storage quota exceeded - clear old data
        try {
          Object.keys(localStorage).forEach(key => {
            if (key.includes('-autosave') && key !== `${toolType}-autosave`) {
              localStorage.removeItem(key)
            }
          })
        } catch {
          // If still failing, just continue without autosave
        }
      }
    }
  }, [files, toolOptions, toolType])

  // Initialize options with defaults
  useEffect(() => {
    const defaultOptions: Record<string, any> = {}
    options.forEach(option => {
      defaultOptions[option.key] = option.defaultValue
    })
    setToolOptions(prev => ({ ...prev, ...defaultOptions }))
  }, [options])

  // Auto-set output format based on URL
  useEffect(() => {
    const path = window.location.pathname
    if (path.includes("convert-to-jpg") || path.includes("convert-to-jpeg")) {
      setToolOptions(prev => ({ ...prev, outputFormat: "jpeg" }))
    } else if (path.includes("convert-to-png")) {
      setToolOptions(prev => ({ ...prev, outputFormat: "png" }))
    } else if (path.includes("convert-to-webp")) {
      setToolOptions(prev => ({ ...prev, outputFormat: "webp" }))
    }
  }, [])

  const handleFileUpload = async (uploadedFiles: FileList | null) => {
    if (!uploadedFiles) return

    // For single file tools, replace existing file
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
          dimensions,
          rotation: 0,
          history: [],
          historyIndex: -1
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
    
    // Auto-select first file for single view
    if (newFiles.length > 0) {
      setSelectedFile(newFiles[0].id)
      if (singleFileOnly) {
        setViewMode("single")
      }
    }

    // Save to history
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
      return newHistory.slice(-10) // Keep last 10 states
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
    
    // Reset options to defaults
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

  const handleCropStart = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cropMode) return
    
    const canvas = e.currentTarget
    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    setDragStart({ x, y })
    setIsDragging(true)
    setCropSelection({ x, y, width: 0, height: 0 })
  }

  const handleCropMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cropMode || !isDragging || !dragStart) return
    
    const canvas = e.currentTarget
    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    setCropSelection({
      x: Math.min(dragStart.x, x),
      y: Math.min(dragStart.y, y),
      width: Math.abs(x - dragStart.x),
      height: Math.abs(y - dragStart.y)
    })
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
      
      setToolOptions(prev => ({
        ...prev,
        cropX: Math.round(cropSelection.x),
        cropY: Math.round(cropSelection.y),
        cropWidth: Math.round(cropSelection.width),
        cropHeight: Math.round(cropSelection.height)
      }))
      
      saveToHistory()
    }
  }

  const rotateImage = (fileId: string, degrees: number) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, rotation: (file.rotation || 0) + degrees }
        : file
    ))
    saveToHistory()
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
        setViewMode("comparison")
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
        
        const outputFormat = toolOptions.outputFormat || "png"
        const baseName = file.name.split(".")[0]
        link.download = `${baseName}.${outputFormat}`
        
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
            const outputFormat = toolOptions.outputFormat || "png"
            const baseName = file.name.split(".")[0]
            const fileName = `${baseName}.${outputFormat}`
            zip.file(fileName, file.blob)
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

  const onDragEnd = (result: any) => {
    if (!result.destination || !allowBatchProcessing || singleFileOnly) return

    const sourceIndex = result.source.index
    const destIndex = result.destination.index

    if (sourceIndex === destIndex) return

    setFiles(prev => {
      const newFiles = [...prev]
      const [removed] = newFiles.splice(sourceIndex, 1)
      newFiles.splice(destIndex, 0, removed)
      return newFiles
    })
    saveToHistory()
  }

  const getVisibleOptions = () => {
    return options.filter(option => {
      if (option.condition) {
        return option.condition(toolOptions)
      }
      return true
    })
  }

  const groupedOptions = getVisibleOptions().reduce((groups, option) => {
    const section = option.section || "General"
    if (!groups[section]) groups[section] = []
    groups[section].push(option)
    return groups
  }, {} as Record<string, typeof options>)

  const currentFile = selectedFile ? files.find(f => f.id === selectedFile) : files[0]

  // Canvas image rendering
  useEffect(() => {
    if (!currentFile || !canvasRef.current || viewMode !== "single") return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      const containerWidth = canvas.parentElement?.clientWidth || 800
      const containerHeight = canvas.parentElement?.clientHeight || 600
      
      const aspectRatio = img.naturalWidth / img.naturalHeight
      let canvasWidth = Math.min(containerWidth - 40, img.naturalWidth)
      let canvasHeight = canvasWidth / aspectRatio
      
      if (canvasHeight > containerHeight - 40) {
        canvasHeight = containerHeight - 40
        canvasWidth = canvasHeight * aspectRatio
      }
      
      canvas.width = canvasWidth
      canvas.height = canvasHeight
      
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Apply rotation if any
      if (currentFile.rotation) {
        ctx.save()
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate((currentFile.rotation * Math.PI) / 180)
        ctx.drawImage(img, -canvasWidth / 2, -canvasHeight / 2, canvasWidth, canvasHeight)
        ctx.restore()
      } else {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
    }
    
    img.src = currentFile.processedPreview || currentFile.preview
  }, [currentFile, viewMode, zoom])

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      {/* Left Canvas - Image Preview */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Canvas Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Icon className="h-5 w-5 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            </div>
            <Badge variant="secondary">{files.length} files</Badge>
            {currentFile && (
              <Badge variant="outline">
                {currentFile.dimensions.width} × {currentFile.dimensions.height}
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {/* History Controls */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={undo}
              disabled={historyIndex <= 0}
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
            >
              <Redo className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetTool}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
            
            {/* Zoom Controls */}
            {viewMode === "single" && (
              <>
                <Button variant="outline" size="sm" onClick={() => setZoom(prev => Math.max(25, prev - 25))}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600 min-w-[60px] text-center">{zoom}%</span>
                <Button variant="outline" size="sm" onClick={() => setZoom(prev => Math.min(400, prev + 25))}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </>
            )}
            
            {/* Crop Mode Toggle */}
            {toolType === "crop" && (
              <Button 
                variant={cropMode ? "default" : "outline"} 
                size="sm"
                onClick={() => setCropMode(!cropMode)}
                className={cropMode ? "bg-blue-600 text-white" : ""}
              >
                <Crop className="h-4 w-4" />
              </Button>
            )}
            
            {/* View Mode Toggle */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setViewMode(prev => {
                if (prev === "grid") return "single"
                if (prev === "single") return "comparison"
                return "grid"
              })}
            >
              {viewMode === "grid" ? <Grid className="h-4 w-4" /> : 
               viewMode === "single" ? <Maximize2 className="h-4 w-4" /> : 
               <List className="h-4 w-4" />}
            </Button>
            
            {/* Add More Files */}
            {!singleFileOnly && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add More
              </Button>
            )}
            
            {/* Mobile Sidebar Toggle */}
            <Button 
              variant="outline" 
              size="sm" 
              className="lg:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Canvas Content */}
        <div className="flex-1 overflow-hidden">
          {files.length === 0 ? (
            <div className="h-full flex flex-col">
              {/* Ad Banner */}
              <div className="p-4 flex-shrink-0">
                <EnhancedAdBanner position="header" showLabel />
              </div>
              
              <div className="flex-1 flex items-center justify-center p-6">
                <div 
                  className="max-w-md w-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-gray-400 transition-colors p-12"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-16 w-16 mb-4 text-gray-400" />
                  <h3 className="text-xl font-medium mb-2">Drop images here</h3>
                  <p className="text-gray-400 mb-4">or click to browse</p>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Images
                  </Button>
                  <p className="text-xs text-gray-400 mt-4">
                    Supports: {supportedFormats.map(f => f.split("/")[1].toUpperCase()).join(", ")}
                  </p>
                  {singleFileOnly && (
                    <p className="text-xs text-blue-600 mt-2 font-medium">
                      Single file mode for precision editing
                    </p>
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

              <div className="flex-1 overflow-auto">
                {viewMode === "single" && currentFile ? (
                  /* Single Image View with Advanced Controls */
                  <div className="h-full flex items-center justify-center p-6 relative">
                    <div className="relative max-w-full max-h-full group">
                      <canvas
                        ref={canvasRef}
                        className="max-w-full max-h-[calc(100vh-300px)] border border-gray-300 rounded-lg shadow-lg"
                        style={{ 
                          transform: `scale(${zoom / 100})`,
                          transformOrigin: "center center",
                          cursor: cropMode ? "crosshair" : "default"
                        }}
                        onMouseDown={handleCropStart}
                        onMouseMove={handleCropMove}
                        onMouseUp={handleCropEnd}
                      />
                      
                      {/* Crop Overlay */}
                      {cropMode && cropSelection && (
                        <div
                          className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 pointer-events-none rounded"
                          style={{
                            left: `${cropSelection.x}%`,
                            top: `${cropSelection.y}%`,
                            width: `${cropSelection.width}%`,
                            height: `${cropSelection.height}%`
                          }}
                        >
                          {/* Crop Handles */}
                          <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full border border-white"></div>
                          <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full border border-white"></div>
                          <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full border border-white"></div>
                          <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full border border-white"></div>
                          
                          <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                            {Math.round(cropSelection.width)}% × {Math.round(cropSelection.height)}%
                          </div>
                        </div>
                      )}
                      
                      {/* Image Controls Overlay */}
                      <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="secondary" onClick={() => rotateImage(currentFile.id, -90)}>
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => rotateImage(currentFile.id, 90)}>
                          <RotateCw className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="secondary">
                          <FlipHorizontal className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="secondary">
                          <FlipVertical className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : viewMode === "comparison" && processedFiles.length > 0 ? (
                  /* Before/After Comparison */
                  <div className="p-6 space-y-6 overflow-auto">
                    {files.slice(0, 3).map((file, index) => {
                      const processedFile = processedFiles.find(pf => pf.id === file.id)
                      if (!processedFile) return null

                      const compressionRatio = processedFile.processedSize 
                        ? ((file.size - processedFile.processedSize) / file.size * 100).toFixed(1)
                        : "0"

                      return (
                        <div key={file.id} className="bg-white rounded-lg shadow-sm border p-6">
                          <h3 className="text-lg font-medium mb-4 flex items-center justify-between">
                            <span>Before & After - {file.name}</span>
                            <div className="flex items-center space-x-4 text-sm">
                              <div className="text-gray-500">
                                {formatFileSize(file.size)} → 
                                <span className="text-green-600 ml-1">
                                  {formatFileSize(processedFile.processedSize || processedFile.size)}
                                </span>
                              </div>
                              <Badge variant="outline" className="text-green-600">
                                -{compressionRatio}%
                              </Badge>
                            </div>
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                              <h4 className="text-sm font-medium text-gray-600 mb-2">Original</h4>
                              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border max-h-64">
                                <img 
                                  src={file.preview}
                                  alt="Original"
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <div className="mt-2 text-xs text-gray-500 text-center">
                                {file.dimensions.width} × {file.dimensions.height}
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-600 mb-2">Processed</h4>
                              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border max-h-64">
                                <img 
                                  src={processedFile.processedPreview}
                                  alt="Processed"
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <div className="mt-2 text-xs text-gray-500 text-center">
                                {processedFile.dimensions?.width || file.dimensions.width} × {processedFile.dimensions?.height || file.dimensions.height}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  /* Grid View */
                  <div className="p-6 overflow-auto">
                    <DragDropContext onDragEnd={onDragEnd}>
                      <Droppable droppableId="images" direction="horizontal">
                        {(provided) => (
                          <div 
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                          >
                            {files.map((file, index) => (
                              <Draggable key={file.id} draggableId={file.id} index={index} isDragDisabled={singleFileOnly}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    {...provided.dragHandleProps}
                                    className={`relative group transition-all duration-200 ${
                                      snapshot.isDragging ? "scale-105 shadow-lg z-50" : ""
                                    } ${selectedFile === file.id ? "ring-2 ring-blue-500" : ""}`}
                                  >
                                    <Card className="overflow-hidden cursor-pointer" onClick={() => setSelectedFile(file.id)}>
                                      {/* Image Preview */}
                                      <div className="relative aspect-square bg-gray-100 max-h-48">
                                        <img 
                                          src={file.processedPreview || file.preview}
                                          alt={file.name}
                                          className="w-full h-full object-contain transition-transform duration-300"
                                          style={{ 
                                            transform: `rotate(${file.rotation || 0}deg)`
                                          }}
                                        />

                                        {/* Processing Indicator */}
                                        {file.processed && (
                                          <div className="absolute top-2 left-2">
                                            <CheckCircle className="h-5 w-5 text-green-600 bg-white rounded-full" />
                                          </div>
                                        )}

                                        {/* Quick Actions - Top Right on Hover */}
                                        <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button 
                                            size="sm" 
                                            variant="secondary" 
                                            className="h-6 w-6 p-0 bg-white/90 hover:bg-white shadow-sm" 
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              setViewMode("single")
                                              setSelectedFile(file.id)
                                            }}
                                          >
                                            <Maximize2 className="h-3 w-3" />
                                          </Button>
                                          <Button 
                                            size="sm" 
                                            variant="secondary" 
                                            className="h-6 w-6 p-0 bg-white/90 hover:bg-white shadow-sm" 
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              rotateImage(file.id, 90)
                                            }}
                                          >
                                            <RotateCw className="h-3 w-3" />
                                          </Button>
                                          <Button 
                                            size="sm" 
                                            variant="secondary" 
                                            className="h-6 w-6 p-0 bg-white/90 hover:bg-white shadow-sm" 
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              removeFile(file.id)
                                            }}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>

                                        {/* Crop Area Indicator */}
                                        {file.cropArea && (
                                          <div
                                            className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20"
                                            style={{
                                              left: `${file.cropArea.x}%`,
                                              top: `${file.cropArea.y}%`,
                                              width: `${file.cropArea.width}%`,
                                              height: `${file.cropArea.height}%`
                                            }}
                                          />
                                        )}
                                      </div>

                                      {/* File Info */}
                                      <div className="p-3">
                                        <div className="flex items-center justify-between mb-1">
                                          <h4 className="font-medium text-gray-900 truncate text-sm">{file.name}</h4>
                                        </div>
                                        <div className="text-xs text-gray-500 space-y-1">
                                          <div className="flex justify-between">
                                            <span>Size:</span>
                                            <span>
                                              {formatFileSize(file.size)}
                                              {file.processedSize && file.processedSize !== file.size && (
                                                <span className="text-green-600 ml-1">
                                                  → {formatFileSize(file.processedSize)}
                                                </span>
                                              )}
                                            </span>
                                          </div>
                                          <div className="flex justify-between">
                                            <span>Dimensions:</span>
                                            <span>{file.dimensions.width} × {file.dimensions.height}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </Card>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </DragDropContext>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className={`${sidebarOpen ? "w-80" : "w-0"} lg:w-80 bg-white border-l shadow-lg flex flex-col fixed lg:relative right-0 top-0 h-screen transition-all duration-300 z-50 lg:z-auto overflow-hidden`}>
        {/* Sidebar Header */}
        <div className="px-6 py-4 border-b bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon className="h-5 w-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Tool Options by Section */}
          {Object.entries(groupedOptions).map(([sectionName, sectionOptions]) => (
            <div key={sectionName} className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide border-b pb-2">
                {sectionName}
              </h3>
              
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
                        onValueChange={([value]) => {
                          setToolOptions(prev => ({ ...prev, [option.key]: value }))
                        }}
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

                  {option.type === "text" && (
                    <Input
                      value={toolOptions[option.key] || ""}
                      onChange={(e) => setToolOptions(prev => ({ ...prev, [option.key]: e.target.value }))}
                      onBlur={saveToHistory}
                      placeholder={`Enter ${option.label.toLowerCase()}`}
                    />
                  )}

                  {option.type === "number" && (
                    <Input
                      type="number"
                      value={toolOptions[option.key] || option.defaultValue}
                      onChange={(e) => setToolOptions(prev => ({ ...prev, [option.key]: parseInt(e.target.value) || option.defaultValue }))}
                      onBlur={saveToHistory}
                      min={option.min}
                      max={option.max}
                    />
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
                        onChange={(e) => setToolOptions(prev => ({ ...prev, [option.key]: e.target.value }))}
                        onBlur={saveToHistory}
                        placeholder="#000000"
                        className="flex-1"
                      />
                    </div>
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
          {/* Process Button */}
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
                {title} <span className="ml-2">→</span>
              </>
            )}
          </Button>

          {/* Progress Bar */}
          {isProcessing && (
            <div className="space-y-2">
              <Progress value={66} className="h-2" />
              <p className="text-xs text-gray-600 text-center">Processing your images...</p>
            </div>
          )}

          {/* Download Button */}
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

          {/* File Info */}
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
              {currentFile && (
                <div className="flex justify-between">
                  <span>Selected:</span>
                  <span className="text-blue-600">{currentFile.name.substring(0, 15)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 lg:hidden z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

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