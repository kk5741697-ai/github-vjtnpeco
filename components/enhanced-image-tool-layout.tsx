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
import { Separator } from "@/components/ui/separator"
import { EnhancedAdBanner } from "@/components/ads/enhanced-ad-banner"
import { 
  Upload, 
  Download, 
  Trash2, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Eye,
  Plus,
  Minus,
  ImageIcon,
  CheckCircle,
  X,
  Menu,
  ArrowLeft,
  Grid,
  List,
  Settings,
  Maximize2,
  ChevronDown,
  ChevronUp,
  Move,
  Undo2,
  Redo2,
  Target,
  MousePointer,
  Hand,
  Layers,
  AlertTriangle,
  Info,
  Lightbulb,
  FlipHorizontal,
  FlipVertical,
  Crop,
  Square,
  Circle,
  MoreHorizontal
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
  filters?: any
  history?: any[]
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
  description?: string
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
  const [viewMode, setViewMode] = useState<"grid" | "comparison" | "single">("grid")
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [cropMode, setCropMode] = useState(false)
  const [cropSelection, setCropSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [undoStack, setUndoStack] = useState<any[]>([])
  const [redoStack, setRedoStack] = useState<any[]>([])
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [presets] = useState([
    { name: "Instagram Post", width: 1080, height: 1080 },
    { name: "Instagram Story", width: 1080, height: 1920 },
    { name: "YouTube Thumbnail", width: 1280, height: 720 },
    { name: "LinkedIn Profile", width: 400, height: 400 },
    { name: "Facebook Cover", width: 1200, height: 630 },
    { name: "Twitter Header", width: 1500, height: 500 }
  ])
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize options with defaults
  useEffect(() => {
    const defaultOptions: Record<string, any> = {}
    options.forEach(option => {
      defaultOptions[option.key] = option.defaultValue
    })
    setToolOptions(defaultOptions)
  }, [options])

  // Auto-save to localStorage
  useEffect(() => {
    if (files.length > 0) {
      const saveData = {
        files: files.map(f => ({ ...f, file: null, originalFile: null })), // Don't save File objects
        toolOptions,
        timestamp: Date.now()
      }
      localStorage.setItem(`${toolType}-autosave`, JSON.stringify(saveData))
    }
  }, [files, toolOptions, toolType])

  // Load auto-save on mount
  useEffect(() => {
    const saved = localStorage.getItem(`${toolType}-autosave`)
    if (saved) {
      try {
        const data = JSON.parse(saved)
        // Only restore if recent (within 24 hours)
        if (Date.now() - data.timestamp < 24 * 60 * 60 * 1000) {
          setToolOptions(data.toolOptions || {})
        }
      } catch (error) {
        console.warn("Failed to restore auto-save:", error)
      }
    }
  }, [toolType])

  const handleFileUpload = async (uploadedFiles: FileList | null) => {
    if (!uploadedFiles) return

    // Check single file restriction
    if (singleFileOnly && (files.length > 0 || uploadedFiles.length > 1)) {
      toast({
        title: "Single file only",
        description: `${title} only supports one image at a time for precision editing.`,
        variant: "destructive"
      })
      return
    }

    const newFiles: ImageFile[] = []
    
    for (let i = 0; i < uploadedFiles.length && i < maxFiles; i++) {
      const file = uploadedFiles[i]
      if (!supportedFormats.includes(file.type)) {
        toast({
          title: "Unsupported format",
          description: `${file.name} format is not supported`,
          variant: "destructive"
        })
        continue
      }

      // Check file size
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 50MB limit. Upgrade to Pro for larger files.`,
          variant: "destructive"
        })
        continue
      }

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
          history: []
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

    setFiles(prev => [...prev, ...newFiles])
    
    if (newFiles.length > 0) {
      setSelectedFileId(newFiles[0].id)
      if (singleFileOnly) {
        setViewMode("single")
      }
    }

    saveState()
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

  const saveState = () => {
    const state = {
      files: files.map(f => ({ ...f })),
      toolOptions: { ...toolOptions },
      selectedFileId,
      timestamp: Date.now()
    }
    setUndoStack(prev => [...prev.slice(-19), state])
    setRedoStack([])
  }

  const handleUndo = () => {
    if (undoStack.length === 0) return
    
    const currentState = {
      files: files.map(f => ({ ...f })),
      toolOptions: { ...toolOptions },
      selectedFileId,
      timestamp: Date.now()
    }
    
    const previousState = undoStack[undoStack.length - 1]
    setRedoStack(prev => [...prev, currentState])
    setUndoStack(prev => prev.slice(0, -1))
    
    setFiles(previousState.files)
    setToolOptions(previousState.toolOptions)
    setSelectedFileId(previousState.selectedFileId)
  }

  const handleRedo = () => {
    if (redoStack.length === 0) return
    
    const currentState = {
      files: files.map(f => ({ ...f })),
      toolOptions: { ...toolOptions },
      selectedFileId,
      timestamp: Date.now()
    }
    
    const nextState = redoStack[redoStack.length - 1]
    setUndoStack(prev => [...prev, currentState])
    setRedoStack(prev => prev.slice(0, -1))
    
    setFiles(nextState.files)
    setToolOptions(nextState.toolOptions)
    setSelectedFileId(nextState.selectedFileId)
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
    if (selectedFileId === fileId) {
      const remainingFiles = files.filter(f => f.id !== fileId)
      setSelectedFileId(remainingFiles.length > 0 ? remainingFiles[0].id : null)
    }
    saveState()
  }

  const applyPreset = (preset: { width: number; height: number }) => {
    setToolOptions(prev => ({
      ...prev,
      width: preset.width,
      height: preset.height
    }))
    saveState()
  }

  const resetTool = () => {
    const defaultOptions: Record<string, any> = {}
    options.forEach(option => {
      defaultOptions[option.key] = option.defaultValue
    })
    setToolOptions(defaultOptions)
    setCropSelection(null)
    setCropMode(false)
    setZoom(100)
    saveState()
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
    
    if (cropSelection && selectedFileId) {
      setFiles(prev => prev.map(file => 
        file.id === selectedFileId 
          ? { ...file, cropArea: cropSelection }
          : file
      ))
      
      const currentFile = files.find(f => f.id === selectedFileId)
      if (currentFile && cropSelection) {
        setToolOptions(prev => ({
          ...prev,
          cropX: Math.round((cropSelection.x / 100) * currentFile.dimensions.width),
          cropY: Math.round((cropSelection.y / 100) * currentFile.dimensions.height),
          cropWidth: Math.round((cropSelection.width / 100) * currentFile.dimensions.width),
          cropHeight: Math.round((cropSelection.height / 100) * currentFile.dimensions.height)
        }))
      }
      
      saveState()
    }
  }

  const rotateImage = (fileId: string, degrees: number) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, rotation: (file.rotation || 0) + degrees }
        : file
    ))
    saveState()
  }

  const flipImage = (fileId: string, direction: "horizontal" | "vertical") => {
    setFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { 
            ...file, 
            filters: { 
              ...file.filters, 
              [direction === "horizontal" ? "flipX" : "flipY"]: !(file.filters?.[direction === "horizontal" ? "flipX" : "flipY"] || false)
            }
          }
        : file
    ))
    saveState()
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

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(section)) {
        newSet.delete(section)
      } else {
        newSet.add(section)
      }
      return newSet
    })
  }

  const groupedOptions = options.reduce((acc, option) => {
    const section = option.section || "General"
    if (!acc[section]) acc[section] = []
    acc[section].push(option)
    return acc
  }, {} as Record<string, ToolOption[]>)

  const currentFile = selectedFileId ? files.find(f => f.id === selectedFileId) : files[0]

  // Initialize canvas for single view
  useEffect(() => {
    if (viewMode === "single" && currentFile && canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const img = new Image()
      img.onload = () => {
        const containerWidth = canvas.parentElement?.clientWidth || 800
        const containerHeight = canvas.parentElement?.clientHeight || 600
        
        const aspectRatio = img.naturalWidth / img.naturalHeight
        let canvasWidth = containerWidth - 100
        let canvasHeight = canvasWidth / aspectRatio
        
        if (canvasHeight > containerHeight - 100) {
          canvasHeight = containerHeight - 100
          canvasWidth = canvasHeight * aspectRatio
        }
        
        canvas.width = canvasWidth
        canvas.height = canvasHeight
        
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      }
      
      img.src = currentFile.processedPreview || currentFile.preview
    }
  }, [viewMode, currentFile, zoom])

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      {/* Left Canvas - Enhanced Image Preview */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {/* Enhanced Canvas Header */}
        <div className="bg-white border-b px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shadow-sm flex-shrink-0">
          <div className="flex items-center space-x-2 sm:space-x-4 min-w-0">
            <Link href="/">
              <Button variant="ghost" size="sm" className="hover:bg-gray-100 flex-shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
              <div className="p-1.5 sm:p-2 rounded-lg bg-blue-50 flex-shrink-0">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{title}</h1>
                <p className="text-xs sm:text-sm text-gray-500 hidden sm:block truncate">{description}</p>
              </div>
            </div>
            {singleFileOnly && files.length > 0 && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 hidden sm:inline-flex">
                Single file only
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0">
            {/* Undo/Redo */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="hidden sm:inline-flex"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="hidden sm:inline-flex"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
            
            {/* Zoom Controls */}
            <Button variant="outline" size="sm" onClick={() => setZoom(prev => Math.max(25, prev - 25))} className="hidden sm:inline-flex">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600 min-w-[50px] text-center font-mono hidden sm:inline">
              {zoom}%
            </span>
            <Button variant="outline" size="sm" onClick={() => setZoom(prev => Math.min(400, prev + 25))} className="hidden sm:inline-flex">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setZoom(100)} className="hidden sm:inline-flex">
              <Target className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
            
            {/* Tool-specific controls */}
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
            
            {/* View Mode */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <Button 
                variant={viewMode === "grid" ? "default" : "ghost"} 
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-7 px-2 sm:px-3"
              >
                <Grid className="h-3 w-3" />
              </Button>
              <Button 
                variant={viewMode === "single" ? "default" : "ghost"} 
                size="sm"
                onClick={() => setViewMode("single")}
                className="h-7 px-2 sm:px-3"
              >
                <Maximize2 className="h-3 w-3" />
              </Button>
              <Button 
                variant={viewMode === "comparison" ? "default" : "ghost"} 
                size="sm"
                onClick={() => setViewMode("comparison")}
                className="h-7 px-2 sm:px-3"
                disabled={processedFiles.length === 0}
              >
                <Eye className="h-3 w-3" />
              </Button>
            </div>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={singleFileOnly && files.length >= 1}
              className="flex-shrink-0"
            >
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Add</span>
            </Button>
          </div>
        </div>

        {/* Enhanced Canvas Content */}
        <div className="flex-1 overflow-auto">
          {files.length === 0 ? (
            <div className="h-full flex items-center justify-center p-8">
              <div 
                className="max-w-md w-full border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200 p-8 sm:p-12"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="p-4 rounded-full bg-blue-100 mb-4">
                  <Upload className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Drop images here</h3>
                <p className="text-gray-500 mb-4 text-center">
                  {singleFileOnly ? "Upload one image for precision editing" : `Upload up to ${maxFiles} images`}
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Images
                </Button>
                <p className="text-xs text-gray-400 mt-4 text-center">
                  Supports: {supportedFormats.map(f => f.split("/")[1].toUpperCase()).join(", ")} • Max 50MB each
                </p>
              </div>
            </div>
          ) : viewMode === "single" && currentFile ? (
            /* Enhanced Single Image View with Crop */
            <div className="h-full flex items-center justify-center p-6 relative">
              <div className="relative max-w-full max-h-full">
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-[calc(100vh-300px)] border border-gray-300 rounded-lg shadow-lg cursor-crosshair"
                  style={{ 
                    transform: `scale(${zoom / 100})`,
                    transformOrigin: "center center"
                  }}
                  onMouseDown={handleCropStart}
                  onMouseMove={handleCropMove}
                  onMouseUp={handleCropEnd}
                />
                
                {/* Enhanced Crop Overlay */}
                {cropMode && cropSelection && (
                  <div
                    className="absolute border-2 border-blue-500 bg-blue-500/20 pointer-events-none rounded"
                    style={{
                      left: `${cropSelection.x}%`,
                      top: `${cropSelection.y}%`,
                      width: `${cropSelection.width}%`,
                      height: `${cropSelection.height}%`
                    }}
                  >
                    {/* Crop handles */}
                    <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full border border-white"></div>
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full border border-white"></div>
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full border border-white"></div>
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full border border-white"></div>
                    
                    <div className="absolute -top-6 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      {Math.round(cropSelection.width)}% × {Math.round(cropSelection.height)}%
                    </div>
                  </div>
                )}
                
                {/* Enhanced Image Controls */}
                <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-lg p-2 shadow-lg">
                  <Button size="sm" variant="secondary" onClick={() => rotateImage(currentFile.id, -90)} title="Rotate Left">
                    <RotateCw className="h-3 w-3 transform scale-x-[-1]" />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => rotateImage(currentFile.id, 90)} title="Rotate Right">
                    <RotateCw className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => flipImage(currentFile.id, "horizontal")} title="Flip Horizontal">
                    <FlipHorizontal className="h-3 w-3" />
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => flipImage(currentFile.id, "vertical")} title="Flip Vertical">
                    <FlipVertical className="h-3 w-3" />
                  </Button>
                </div>

                {/* Crop Mode Instructions */}
                {cropMode && (
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg">
                    <p className="text-sm">Click and drag to select crop area</p>
                  </div>
                )}
              </div>
            </div>
          ) : viewMode === "comparison" && processedFiles.length > 0 ? (
            /* Enhanced Before/After Comparison */
            <div className="p-6 space-y-6 overflow-auto">
              {files.slice(0, 3).map((file, index) => {
                const processedFile = processedFiles.find(pf => pf.id === file.id)
                if (!processedFile) return null

                const compressionRatio = processedFile.processedSize && file.size 
                  ? ((file.size - processedFile.processedSize) / file.size * 100).toFixed(1)
                  : null

                return (
                  <div key={file.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="px-6 py-4 border-b bg-gray-50">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">{file.name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>{formatFileSize(file.size)}</span>
                          <span>→</span>
                          <span className="text-green-600 font-medium">
                            {formatFileSize(processedFile.processedSize || processedFile.size)}
                          </span>
                          {compressionRatio && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              -{compressionRatio}%
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center">
                            <Circle className="h-4 w-4 mr-2 text-gray-400" />
                            Original
                          </h4>
                          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200 max-h-64">
                            <img 
                              src={file.preview}
                              alt="Original"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="mt-3 text-xs text-gray-500 text-center space-y-1">
                            <div>{file.dimensions.width} × {file.dimensions.height} px</div>
                            <div>{formatFileSize(file.size)}</div>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-600 mb-3 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                            Processed
                          </h4>
                          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-green-200 max-h-64">
                            <img 
                              src={processedFile.processedPreview}
                              alt="Processed"
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div className="mt-3 text-xs text-gray-500 text-center space-y-1">
                            <div>{processedFile.dimensions?.width || file.dimensions.width} × {processedFile.dimensions?.height || file.dimensions.height} px</div>
                            <div className="text-green-600 font-medium">{formatFileSize(processedFile.processedSize || processedFile.size)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* Enhanced Grid View */
            <div className="p-6 overflow-auto">
              <DragDropContext onDragEnd={() => {}}>
                <Droppable droppableId="images" direction="horizontal">
                  {(provided) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                    >
                      {files.map((file, index) => (
                        <Draggable key={file.id} draggableId={file.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`relative group transition-all duration-200 ${
                                snapshot.isDragging ? "scale-105 shadow-xl z-50" : ""
                              } ${selectedFileId === file.id ? "ring-2 ring-blue-500" : ""}`}
                            >
                              <Card className="overflow-hidden cursor-pointer hover:shadow-lg transition-all" onClick={() => setSelectedFileId(file.id)}>
                                {/* Enhanced Image Preview */}
                                <div className="relative aspect-square bg-gray-100 max-h-48">
                                  <img 
                                    src={file.processedPreview || file.preview}
                                    alt={file.name}
                                    className="w-full h-full object-contain transition-transform duration-300"
                                    style={{ 
                                      transform: `rotate(${file.rotation || 0}deg) ${file.filters?.flipX ? 'scaleX(-1)' : ''} ${file.filters?.flipY ? 'scaleY(-1)' : ''}`,
                                    }}
                                  />

                                  {/* Processing Indicator */}
                                  {file.processed && (
                                    <div className="absolute top-2 right-2">
                                      <CheckCircle className="h-5 w-5 text-green-600 bg-white rounded-full shadow-sm" />
                                    </div>
                                  )}

                                  {/* Enhanced Quick Actions */}
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <div className="flex space-x-1 bg-white/90 rounded-lg p-2 shadow-lg">
                                      <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={(e) => {
                                        e.stopPropagation()
                                        setViewMode("single")
                                        setSelectedFileId(file.id)
                                      }}>
                                        <Eye className="h-3 w-3" />
                                      </Button>
                                      <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={(e) => {
                                        e.stopPropagation()
                                        rotateImage(file.id, 90)
                                      }}>
                                        <RotateCw className="h-3 w-3" />
                                      </Button>
                                      <Button size="sm" variant="secondary" className="h-8 w-8 p-0" onClick={(e) => {
                                        e.stopPropagation()
                                        removeFile(file.id)
                                      }}>
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* Crop Area Indicator */}
                                  {file.cropArea && (
                                    <div
                                      className="absolute border-2 border-blue-500 bg-blue-500/20 rounded"
                                      style={{
                                        left: `${file.cropArea.x}%`,
                                        top: `${file.cropArea.y}%`,
                                        width: `${file.cropArea.width}%`,
                                        height: `${file.cropArea.height}%`
                                      }}
                                    />
                                  )}
                                </div>

                                {/* Enhanced File Info */}
                                <div className="p-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-medium text-gray-900 truncate text-sm">{file.name}</h4>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100">
                                      <MoreHorizontal className="h-3 w-3" />
                                    </Button>
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
                                    {file.rotation !== 0 && (
                                      <div className="flex justify-between">
                                        <span>Rotation:</span>
                                        <span className="text-blue-600">{file.rotation}°</span>
                                      </div>
                                    )}
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

      {/* Enhanced Right Sidebar */}
      <div className="w-80 bg-white border-l shadow-lg flex flex-col overflow-hidden hidden lg:flex">
        {/* Sidebar Header */}
        <div className="px-6 py-4 border-b bg-gray-50 flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-blue-100">
              <Icon className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-600">Configure your settings</p>
            </div>
          </div>
        </div>

        {/* Enhanced Sidebar Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {/* File Management */}
            {files.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                    <Layers className="h-4 w-4 mr-2" />
                    Files ({files.length})
                  </h3>
                  <div className="flex space-x-1">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={resetTool}
                      title="Reset all settings"
                    >
                      <RotateCw className="h-3 w-3" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={singleFileOnly && files.length >= 1}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {files.map((file) => (
                    <div 
                      key={file.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all group ${
                        selectedFileId === file.id ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedFileId(file.id)}
                    >
                      <div className="w-10 h-10 rounded bg-blue-100 flex-shrink-0 overflow-hidden">
                        <img src={file.preview} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{file.dimensions.width}×{file.dimensions.height} • {formatFileSize(file.size)}</p>
                      </div>
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            setViewMode("single")
                            setSelectedFileId(file.id)
                          }}
                          title="Edit"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeFile(file.id)
                          }}
                          title="Remove"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Presets for resize tool */}
            {toolType === "resize" && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                  <Square className="h-4 w-4 mr-2" />
                  Quick Presets
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {presets.map((preset) => (
                    <Button
                      key={preset.name}
                      variant="outline"
                      size="sm"
                      onClick={() => applyPreset(preset)}
                      className="h-auto p-2 text-left justify-start"
                    >
                      <div>
                        <div className="font-medium text-xs">{preset.name}</div>
                        <div className="text-xs text-gray-500">{preset.width}×{preset.height}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Single File Warning */}
            {singleFileOnly && files.length > 1 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Multiple files detected</span>
                </div>
                <p className="text-sm text-yellow-700">
                  This tool only processes one file at a time for precision editing. Only the selected file will be processed.
                </p>
              </div>
            )}

            {/* Dynamic Tool Options */}
            {Object.entries(groupedOptions).map(([sectionName, sectionOptions]) => (
              <div key={sectionName} className="space-y-4">
                <Button 
                  variant="ghost" 
                  className="w-full justify-between p-0 h-auto hover:bg-gray-50"
                  onClick={() => toggleSection(sectionName)}
                >
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                    {sectionName === "General" && <Settings className="h-4 w-4 mr-2" />}
                    {sectionName === "Dimensions" && <Maximize2 className="h-4 w-4 mr-2" />}
                    {sectionName === "Output" && <Download className="h-4 w-4 mr-2" />}
                    {sectionName === "Position" && <Move className="h-4 w-4 mr-2" />}
                    {!["General", "Dimensions", "Output", "Position"].includes(sectionName) && <Settings className="h-4 w-4 mr-2" />}
                    {sectionName}
                  </h3>
                  {collapsedSections.has(sectionName) ? 
                    <ChevronDown className="h-4 w-4" /> : 
                    <ChevronUp className="h-4 w-4" />
                  }
                </Button>
                
                {!collapsedSections.has(sectionName) && (
                  <div className="space-y-4 ml-4">
                    {sectionOptions.map((option) => (
                      <div key={option.key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium text-gray-700">{option.label}</Label>
                          {option.description && (
                            <div className="text-xs text-gray-500 bg-gray-100 rounded-full w-4 h-4 flex items-center justify-center cursor-help" title={option.description}>
                              ?
                            </div>
                          )}
                        </div>
                        
                        {/* Enhanced Option Rendering */}
                        {option.type === "select" && (
                          <Select
                            value={toolOptions[option.key]?.toString()}
                            onValueChange={(value) => setToolOptions(prev => ({ ...prev, [option.key]: value }))}
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
                              min={option.min}
                              max={option.max}
                              step={option.step}
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                              <span>{option.min}</span>
                              <span className="font-medium bg-gray-100 px-2 py-1 rounded">
                                {toolOptions[option.key] || option.defaultValue}
                              </span>
                              <span>{option.max}</span>
                            </div>
                          </div>
                        )}

                        {option.type === "checkbox" && (
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              checked={toolOptions[option.key] || false}
                              onCheckedChange={(checked) => setToolOptions(prev => ({ ...prev, [option.key]: checked }))}
                            />
                            <span className="text-sm text-gray-700">{option.label}</span>
                          </div>
                        )}

                        {option.type === "text" && (
                          <Input
                            value={toolOptions[option.key] || ""}
                            onChange={(e) => setToolOptions(prev => ({ ...prev, [option.key]: e.target.value }))}
                            placeholder={`Enter ${option.label.toLowerCase()}`}
                            className="h-9"
                          />
                        )}

                        {option.type === "number" && (
                          <Input
                            type="number"
                            value={toolOptions[option.key] || option.defaultValue}
                            onChange={(e) => setToolOptions(prev => ({ ...prev, [option.key]: parseInt(e.target.value) || option.defaultValue }))}
                            min={option.min}
                            max={option.max}
                            className="h-9"
                          />
                        )}

                        {option.type === "color" && (
                          <div className="flex items-center space-x-2">
                            <input
                              type="color"
                              value={toolOptions[option.key] || option.defaultValue}
                              onChange={(e) => setToolOptions(prev => ({ ...prev, [option.key]: e.target.value }))}
                              className="w-12 h-9 border border-gray-300 rounded cursor-pointer"
                            />
                            <Input
                              value={toolOptions[option.key] || option.defaultValue}
                              onChange={(e) => setToolOptions(prev => ({ ...prev, [option.key]: e.target.value }))}
                              placeholder="#000000"
                              className="flex-1 h-9"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Ad Space */}
            <div className="py-4">
              <EnhancedAdBanner position="sidebar" showLabel />
            </div>
          </div>
        </div>

        {/* Enhanced Sidebar Footer */}
        <div className="p-6 border-t bg-white space-y-4 flex-shrink-0">
          {/* Process Button */}
          <Button 
            onClick={handleProcess}
            disabled={isProcessing || files.length === 0}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-base font-semibold rounded-lg shadow-sm"
            size="lg"
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Icon className="h-4 w-4 mr-2" />
                {title}
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
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base font-semibold rounded-lg shadow-sm"
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Download {processedFiles.length > 1 ? "ZIP" : "Image"}
            </Button>
          )}

          {/* Enhanced File Stats */}
          {files.length > 0 && (
            <div className="text-xs text-gray-500 space-y-2 pt-3 border-t">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-semibold text-gray-900">{files.length}</div>
                  <div>Files</div>
                </div>
                <div className="text-center p-2 bg-gray-50 rounded">
                  <div className="font-semibold text-gray-900">
                    {formatFileSize(files.reduce((sum, file) => sum + file.size, 0))}
                  </div>
                  <div>Total Size</div>
                </div>
              </div>
              
              {processedFiles.length > 0 && (
                <div className="text-center p-2 bg-green-50 rounded border border-green-200">
                  <div className="font-semibold text-green-700">
                    {formatFileSize(processedFiles.reduce((sum, file) => sum + (file.processedSize || file.size), 0))}
                  </div>
                  <div className="text-green-600">Processed</div>
                </div>
              )}
              
              {currentFile && (
                <div className="text-center p-2 bg-blue-50 rounded border border-blue-200">
                  <div className="font-semibold text-blue-700">{currentFile.name.substring(0, 15)}</div>
                  <div className="text-blue-600">Selected</div>
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