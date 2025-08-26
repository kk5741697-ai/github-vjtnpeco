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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { 
  Upload, 
  Download, 
  Trash2, 
  RotateCw, 
  ZoomIn, 
  ZoomOut, 
  Eye,
  Crop,
  Maximize,
  RefreshCw,
  X,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  Plus,
  Grid,
  Maximize2,
  FlipHorizontal,
  FlipVertical,
  Move,
  Square,
  Circle,
  Undo2,
  Redo2,
  Settings,
  Palette,
  Layers,
  MousePointer,
  Hand,
  Target
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
  transforms?: any[]
}

interface ToolOption {
  key: string
  label: string
  type: "text" | "number" | "select" | "checkbox" | "slider" | "color" | "file"
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
  toolType: "resize" | "compress" | "convert" | "crop" | "rotate" | "watermark" | "background" | "filter"
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
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "single" | "comparison">("grid")
  const [cropMode, setCropMode] = useState(false)
  const [cropSelection, setCropSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [undoStack, setUndoStack] = useState<any[]>([])
  const [redoStack, setRedoStack] = useState<any[]>([])
  const [panPosition, setPanPosition] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const [tool, setTool] = useState<"select" | "crop" | "pan">("select")
  const [aspectRatio, setAspectRatio] = useState<string>("free")
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize options with defaults
  useEffect(() => {
    const defaultOptions: Record<string, any> = {}
    options.forEach(option => {
      defaultOptions[option.key] = option.defaultValue
    })
    setToolOptions(prev => ({ ...prev, ...defaultOptions }))
  }, [options])

  // Auto-detect output format from URL
  useEffect(() => {
    const path = window.location.pathname
    if (path.includes("to-jpg") || path.includes("to-jpeg")) {
      setToolOptions(prev => ({ ...prev, outputFormat: "jpeg" }))
    } else if (path.includes("to-png")) {
      setToolOptions(prev => ({ ...prev, outputFormat: "png" }))
    } else if (path.includes("to-webp")) {
      setToolOptions(prev => ({ ...prev, outputFormat: "webp" }))
    }
  }, [])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case "z":
            e.preventDefault()
            if (e.shiftKey) {
              handleRedo()
            } else {
              handleUndo()
            }
            break
          case "=":
          case "+":
            e.preventDefault()
            setZoom(prev => Math.min(400, prev + 25))
            break
          case "-":
            e.preventDefault()
            setZoom(prev => Math.max(25, prev - 25))
            break
          case "0":
            e.preventDefault()
            setZoom(100)
            setPanPosition({ x: 0, y: 0 })
            break
        }
      } else {
        switch (e.key) {
          case "Delete":
          case "Backspace":
            if (selectedFile) {
              e.preventDefault()
              removeFile(selectedFile)
            }
            break
          case "c":
            if (!e.ctrlKey && !e.metaKey) {
              setTool("crop")
              setCropMode(true)
            }
            break
          case "v":
            if (!e.ctrlKey && !e.metaKey) {
              setTool("select")
              setCropMode(false)
            }
            break
          case "h":
            if (!e.ctrlKey && !e.metaKey) {
              setTool("pan")
            }
            break
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [selectedFile, undoStack, redoStack])

  const handleFileUpload = async (uploadedFiles: FileList | null) => {
    if (!uploadedFiles) return

    // Check single file restriction
    if (singleFileOnly && (files.length > 0 || uploadedFiles.length > 1)) {
      toast({
        title: "Single file only",
        description: `${title} only supports one file at a time. Please remove existing files first.`,
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
          description: `${file.name} is not supported. Supported formats: ${supportedFormats.map(f => f.split("/")[1].toUpperCase()).join(", ")}`,
          variant: "destructive"
        })
        continue
      }

      // Check file size (100MB limit for free users)
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 100MB limit. Upgrade to Pro for larger files.`,
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
          transforms: []
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
    
    // Auto-select first file and switch to single view for single-file tools
    if (newFiles.length > 0) {
      setSelectedFile(newFiles[0].id)
      if (singleFileOnly || toolType === "crop" || toolType === "background") {
        setViewMode("single")
      }
    }

    // Save state for undo
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
    saveState()
  }

  const saveState = () => {
    const state = {
      files: files.map(f => ({ ...f })),
      toolOptions: { ...toolOptions },
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
      timestamp: Date.now()
    }
    
    const previousState = undoStack[undoStack.length - 1]
    setRedoStack(prev => [...prev, currentState])
    setUndoStack(prev => prev.slice(0, -1))
    
    setFiles(previousState.files)
    setToolOptions(previousState.toolOptions)
  }

  const handleRedo = () => {
    if (redoStack.length === 0) return
    
    const currentState = {
      files: files.map(f => ({ ...f })),
      toolOptions: { ...toolOptions },
      timestamp: Date.now()
    }
    
    const nextState = redoStack[redoStack.length - 1]
    setUndoStack(prev => [...prev, currentState])
    setRedoStack(prev => prev.slice(0, -1))
    
    setFiles(nextState.files)
    setToolOptions(nextState.toolOptions)
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

  const currentFile = selectedFile ? files.find(f => f.id === selectedFile) : files[0]

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      {/* Left Canvas - Enhanced Preview */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {/* Enhanced Canvas Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between flex-shrink-0 shadow-sm">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-blue-50">
                <Icon className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                <p className="text-sm text-gray-500">{description}</p>
              </div>
            </div>
            {singleFileOnly && files.length > 0 && (
              <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                Single file only
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Undo/Redo */}
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleUndo}
              disabled={undoStack.length === 0}
              className="hover:bg-gray-100"
            >
              <Undo2 className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRedo}
              disabled={redoStack.length === 0}
              className="hover:bg-gray-100"
            >
              <Redo2 className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6" />
            
            {/* Zoom Controls */}
            <Button variant="outline" size="sm" onClick={() => setZoom(prev => Math.max(25, prev - 25))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600 min-w-[60px] text-center font-mono">{zoom}%</span>
            <Button variant="outline" size="sm" onClick={() => setZoom(prev => Math.min(400, prev + 25))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setZoom(100); setPanPosition({ x: 0, y: 0 }) }}>
              <Maximize2 className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6" />
            
            {/* Tool Selection */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <Button 
                variant={tool === "select" ? "default" : "ghost"} 
                size="sm"
                onClick={() => setTool("select")}
                className="h-8 px-3"
              >
                <MousePointer className="h-3 w-3" />
              </Button>
              {(toolType === "crop" || toolType === "background") && (
                <Button 
                  variant={tool === "crop" ? "default" : "ghost"} 
                  size="sm"
                  onClick={() => { setTool("crop"); setCropMode(true) }}
                  className="h-8 px-3"
                >
                  <Crop className="h-3 w-3" />
                </Button>
              )}
              <Button 
                variant={tool === "pan" ? "default" : "ghost"} 
                size="sm"
                onClick={() => setTool("pan")}
                className="h-8 px-3"
              >
                <Hand className="h-3 w-3" />
              </Button>
            </div>
            
            <Separator orientation="vertical" className="h-6" />
            
            {/* View Mode */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <Button 
                variant={viewMode === "single" ? "default" : "ghost"} 
                size="sm"
                onClick={() => setViewMode("single")}
                className="h-8 px-3"
              >
                <Square className="h-3 w-3" />
              </Button>
              <Button 
                variant={viewMode === "grid" ? "default" : "ghost"} 
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-8 px-3"
              >
                <Grid className="h-3 w-3" />
              </Button>
              {processedFiles.length > 0 && (
                <Button 
                  variant={viewMode === "comparison" ? "default" : "ghost"} 
                  size="sm"
                  onClick={() => setViewMode("comparison")}
                  className="h-8 px-3"
                >
                  <Eye className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Canvas Content */}
        <div className="flex-1 overflow-hidden relative">
          {files.length === 0 ? (
            <div className="h-full flex items-center justify-center p-8">
              <div 
                className="max-w-md w-full border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200 p-12"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="p-4 rounded-full bg-blue-100 mb-4">
                  <Upload className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Drop images here</h3>
                <p className="text-gray-500 mb-4 text-center">
                  {singleFileOnly ? "Upload one image file" : `Upload up to ${maxFiles} images`}
                </p>
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Images
                </Button>
                <p className="text-xs text-gray-400 mt-4 text-center">
                  Supports: {supportedFormats.map(f => f.split("/")[1].toUpperCase()).join(", ")} • Max 100MB each
                </p>
              </div>
            </div>
          ) : viewMode === "single" && currentFile ? (
            /* Enhanced Single Image View */
            <div className="h-full flex items-center justify-center p-6 relative bg-gray-50">
              <div 
                ref={containerRef}
                className="relative max-w-full max-h-full bg-white rounded-lg shadow-lg overflow-hidden"
                style={{ 
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: "center center"
                }}
              >
                <div className="relative">
                  <img 
                    src={currentFile.processedPreview || currentFile.preview}
                    alt={currentFile.name}
                    className="max-w-full max-h-[calc(100vh-200px)] object-contain cursor-crosshair"
                    style={{ 
                      transform: `translate(${panPosition.x}px, ${panPosition.y}px) rotate(${currentFile.rotation || 0}deg)`,
                      transition: tool === "pan" ? "none" : "transform 0.3s ease"
                    }}
                    draggable={false}
                  />
                  
                  {/* Crop Overlay */}
                  {cropMode && cropSelection && (
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Darkened areas */}
                      <div className="absolute inset-0 bg-black bg-opacity-40" />
                      
                      {/* Crop area */}
                      <div
                        className="absolute border-2 border-blue-500 bg-transparent"
                        style={{
                          left: `${cropSelection.x}%`,
                          top: `${cropSelection.y}%`,
                          width: `${cropSelection.width}%`,
                          height: `${cropSelection.height}%`,
                          boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.4)"
                        }}
                      >
                        {/* Grid lines */}
                        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                          {Array.from({ length: 9 }).map((_, i) => (
                            <div key={i} className="border border-white border-opacity-30" />
                          ))}
                        </div>
                        
                        {/* Crop info */}
                        <div className="absolute -top-8 left-0 bg-blue-600 text-white text-xs px-2 py-1 rounded font-mono">
                          {Math.round(cropSelection.width)}% × {Math.round(cropSelection.height)}%
                        </div>
                        
                        {/* Resize handles */}
                        <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full cursor-nw-resize" />
                        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full cursor-ne-resize" />
                        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full cursor-sw-resize" />
                        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full cursor-se-resize" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Canvas Tools Overlay */}
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                <div className="bg-white rounded-lg shadow-lg border p-2 flex items-center space-x-2">
                  <Button size="sm" variant="outline" onClick={() => setZoom(prev => Math.max(25, prev - 25))}>
                    <ZoomOut className="h-3 w-3" />
                  </Button>
                  <span className="text-sm font-mono min-w-[50px] text-center">{zoom}%</span>
                  <Button size="sm" variant="outline" onClick={() => setZoom(prev => Math.min(400, prev + 25))}>
                    <ZoomIn className="h-3 w-3" />
                  </Button>
                  <Separator orientation="vertical" className="h-4" />
                  <Button size="sm" variant="outline" onClick={() => setZoom(100)}>
                    <Target className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ) : viewMode === "comparison" && processedFiles.length > 0 ? (
            /* Enhanced Before/After Comparison */
            <div className="p-6 space-y-6 overflow-auto bg-gray-50">
              {files.slice(0, 3).map((file) => {
                const processedFile = processedFiles.find(pf => pf.id === file.id)
                if (!processedFile) return null

                const compressionRatio = ((file.size - (processedFile.processedSize || processedFile.size)) / file.size * 100)

                return (
                  <div key={file.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">{file.name}</h3>
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="text-gray-500">
                            {formatFileSize(file.size)}
                          </div>
                          <div className="text-gray-400">→</div>
                          <div className="text-green-600 font-medium">
                            {formatFileSize(processedFile.processedSize || processedFile.size)}
                          </div>
                          {compressionRatio > 0 && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700">
                              -{compressionRatio.toFixed(1)}%
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-600">Original</h4>
                            <div className="text-xs text-gray-500">
                              {file.dimensions.width} × {file.dimensions.height}
                            </div>
                          </div>
                          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border">
                            <img 
                              src={file.preview}
                              alt="Original"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-medium text-gray-600">Processed</h4>
                            <div className="text-xs text-gray-500">
                              {processedFile.dimensions?.width || file.dimensions.width} × {processedFile.dimensions?.height || file.dimensions.height}
                            </div>
                          </div>
                          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border">
                            <img 
                              src={processedFile.processedPreview}
                              alt="Processed"
                              className="w-full h-full object-contain"
                            />
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
            <div className="p-6 overflow-auto bg-gray-50">
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
                              } ${selectedFile === file.id ? "ring-2 ring-blue-500" : ""}`}
                            >
                              <Card 
                                className="overflow-hidden cursor-pointer hover:shadow-lg transition-all duration-200 border-2 hover:border-blue-200" 
                                onClick={() => setSelectedFile(file.id)}
                              >
                                {/* Enhanced Image Preview */}
                                <div className="relative aspect-square bg-gray-100">
                                  <img 
                                    src={file.processedPreview || file.preview}
                                    alt={file.name}
                                    className="w-full h-full object-contain"
                                    style={{ 
                                      transform: `rotate(${file.rotation || 0}deg)`,
                                      transition: "transform 0.3s ease"
                                    }}
                                  />

                                  {/* Processing Status */}
                                  {file.processed && (
                                    <div className="absolute top-2 left-2">
                                      <div className="bg-green-500 text-white rounded-full p-1">
                                        <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      </div>
                                    </div>
                                  )}

                                  {/* Enhanced Hover Actions */}
                                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <div className="flex flex-col space-y-1">
                                      <Button 
                                        size="sm" 
                                        variant="secondary" 
                                        className="h-7 w-7 p-0 bg-white/90 hover:bg-white shadow-sm" 
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          removeFile(file.id)
                                        }}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                      <Button 
                                        size="sm" 
                                        variant="secondary" 
                                        className="h-7 w-7 p-0 bg-white/90 hover:bg-white shadow-sm" 
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setViewMode("single")
                                          setSelectedFile(file.id)
                                        }}
                                      >
                                        <Maximize className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  </div>

                                  {/* File Size Badge */}
                                  <div className="absolute bottom-2 left-2">
                                    <Badge variant="secondary" className="text-xs bg-white/90">
                                      {formatFileSize(file.size)}
                                    </Badge>
                                  </div>
                                </div>

                                {/* Enhanced File Info */}
                                <div className="p-3 bg-white">
                                  <div className="flex items-center justify-between mb-1">
                                    <h4 className="font-medium text-gray-900 truncate text-sm">{file.name}</h4>
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    {file.dimensions.width} × {file.dimensions.height}
                                    {file.processedSize && file.processedSize !== file.size && (
                                      <span className="text-green-600 ml-2">
                                        → {formatFileSize(file.processedSize)}
                                      </span>
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
      <div className="w-80 bg-white border-l shadow-lg flex flex-col overflow-hidden">
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
                  <h3 className="text-sm font-semibold text-gray-900">Files ({files.length})</h3>
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
                
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {files.map((file) => (
                    <div 
                      key={file.id}
                      className={`flex items-center space-x-3 p-2 rounded-lg border cursor-pointer transition-all ${
                        selectedFile === file.id ? "bg-blue-50 border-blue-200" : "hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedFile(file.id)}
                    >
                      <div className="w-8 h-8 rounded bg-gray-100 flex-shrink-0 overflow-hidden">
                        <img src={file.preview} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeFile(file.id)
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dynamic Tool Options */}
            {Object.entries(groupedOptions).map(([sectionName, sectionOptions]) => (
              <Collapsible 
                key={sectionName}
                open={!collapsedSections.has(sectionName)}
                onOpenChange={() => toggleSection(sectionName)}
              >
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                    <h3 className="text-sm font-semibold text-gray-900">{sectionName}</h3>
                    {collapsedSections.has(sectionName) ? 
                      <ChevronDown className="h-4 w-4" /> : 
                      <ChevronUp className="h-4 w-4" />
                    }
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="space-y-4 mt-4">
                  {sectionOptions.map((option) => (
                    <div key={option.key} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-gray-700">{option.label}</Label>
                        {option.description && (
                          <div className="text-xs text-gray-500" title={option.description}>
                            ?
                          </div>
                        )}
                      </div>
                      
                      {option.type === "select" && (
                        <Select
                          value={toolOptions[option.key]?.toString()}
                          onValueChange={(value) => {
                            setToolOptions(prev => ({ ...prev, [option.key]: value }))
                            saveState()
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
                            onValueChange={([value]) => {
                              setToolOptions(prev => ({ ...prev, [option.key]: value }))
                            }}
                            onValueCommit={() => saveState()}
                            min={option.min}
                            max={option.max}
                            step={option.step}
                            className="w-full"
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
                            onCheckedChange={(checked) => {
                              setToolOptions(prev => ({ ...prev, [option.key]: checked }))
                              saveState()
                            }}
                          />
                          <span className="text-sm text-gray-700">{option.label}</span>
                        </div>
                      )}

                      {option.type === "text" && (
                        <Input
                          value={toolOptions[option.key] || ""}
                          onChange={(e) => setToolOptions(prev => ({ ...prev, [option.key]: e.target.value }))}
                          onBlur={saveState}
                          placeholder={`Enter ${option.label.toLowerCase()}`}
                          className="h-9"
                        />
                      )}

                      {option.type === "number" && (
                        <Input
                          type="number"
                          value={toolOptions[option.key] || option.defaultValue}
                          onChange={(e) => setToolOptions(prev => ({ ...prev, [option.key]: parseInt(e.target.value) || option.defaultValue }))}
                          onBlur={saveState}
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
                            onChange={(e) => {
                              setToolOptions(prev => ({ ...prev, [option.key]: e.target.value }))
                              saveState()
                            }}
                            className="w-10 h-9 border border-gray-300 rounded cursor-pointer"
                          />
                          <Input
                            value={toolOptions[option.key] || option.defaultValue}
                            onChange={(e) => setToolOptions(prev => ({ ...prev, [option.key]: e.target.value }))}
                            onBlur={saveState}
                            placeholder="#000000"
                            className="flex-1 h-9"
                          />
                        </div>
                      )}

                      {option.type === "file" && (
                        <div className="space-y-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full h-9"
                            onClick={() => {
                              const input = document.createElement("input")
                              input.type = "file"
                              input.accept = "image/*"
                              input.onchange = (e) => {
                                const file = (e.target as HTMLInputElement).files?.[0]
                                if (file) {
                                  const reader = new FileReader()
                                  reader.onload = (e) => {
                                    setToolOptions(prev => ({ ...prev, [option.key]: e.target?.result }))
                                    saveState()
                                  }
                                  reader.readAsDataURL(file)
                                }
                              }
                              input.click()
                            }}
                          >
                            <Upload className="h-3 w-3 mr-2" />
                            Upload {option.label}
                          </Button>
                          {toolOptions[option.key] && (
                            <div className="text-xs text-green-600">✓ Image uploaded</div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            ))}
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
                  <div className="text-green-600">Processed Size</div>
                </div>
              )}
            </div>
          )}

          {/* Keyboard Shortcuts Help */}
          <details className="text-xs text-gray-500">
            <summary className="cursor-pointer hover:text-gray-700">Keyboard Shortcuts</summary>
            <div className="mt-2 space-y-1 pl-2">
              <div>Ctrl+Z: Undo</div>
              <div>Ctrl+Shift+Z: Redo</div>
              <div>Ctrl++: Zoom In</div>
              <div>Ctrl+-: Zoom Out</div>
              <div>Ctrl+0: Reset View</div>
              <div>Del: Delete Selected</div>
              <div>C: Crop Tool</div>
              <div>V: Select Tool</div>
              <div>H: Pan Tool</div>
            </div>
          </details>
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