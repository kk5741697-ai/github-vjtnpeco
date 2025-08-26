"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  X,
  ArrowLeft,
  CheckCircle,
  Undo,
  Redo,
  RefreshCw
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"

interface ImageFile {
  id: string
  file: File
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

interface SimpleToolOption {
  key: string
  label: string
  type: "select" | "slider" | "input"
  defaultValue: any
  min?: number
  max?: number
  step?: number
  options?: Array<{ value: string; label: string }>
}

interface SimpleImageToolLayoutProps {
  title: string
  description: string
  icon: any
  toolType: "resize" | "compress" | "convert" | "crop" | "rotate" | "watermark"
  processFunction: (files: ImageFile[], options: any) => Promise<{ success: boolean; processedFiles?: ImageFile[]; error?: string }>
  options: SimpleToolOption[]
  maxFiles?: number
  singleFileOnly?: boolean
  presets?: Array<{ name: string; values: any }>
}

export function SimpleImageToolLayout({
  title,
  description,
  icon: Icon,
  toolType,
  processFunction,
  options,
  maxFiles = 20,
  singleFileOnly = false,
  presets = []
}: SimpleImageToolLayoutProps) {
  const [files, setFiles] = useState<ImageFile[]>([])
  const [toolOptions, setToolOptions] = useState<Record<string, any>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedFiles, setProcessedFiles] = useState<ImageFile[]>([])
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [cropSelection, setCropSelection] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [history, setHistory] = useState<Array<{ files: ImageFile[]; options: any }>>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

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
      if (!file.type.startsWith("image/")) continue

      try {
        const preview = await createImagePreview(file)
        const dimensions = await getImageDimensions(file)
        
        const imageFile: ImageFile = {
          id: `${file.name}-${Date.now()}-${i}`,
          file,
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

  // Crop functionality for crop tool
  const handleCropStart = (e: React.MouseEvent<HTMLImageElement>) => {
    if (toolType !== "crop") return
    
    const img = e.currentTarget
    const rect = img.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    
    setDragStart({ x, y })
    setIsDragging(true)
    setCropSelection({ x, y, width: 0, height: 0 })
  }

  const handleCropMove = (e: React.MouseEvent<HTMLImageElement>) => {
    if (toolType !== "crop" || !isDragging || !dragStart) return
    
    const img = e.currentTarget
    const rect = img.getBoundingClientRect()
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

  const currentFile = selectedFile ? files.find(f => f.id === selectedFile) : files[0]

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      {/* Left Canvas - Image Preview */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
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
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Canvas Content */}
        <div className="flex-1 overflow-hidden">
          {files.length === 0 ? (
            <div className="h-full flex flex-col">
              <div className="p-4">
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
                    Supports: JPG, PNG, WebP, GIF
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
              <div className="p-4 border-b">
                <EnhancedAdBanner position="inline" showLabel />
              </div>

              <div className="flex-1 flex items-center justify-center p-6 relative">
                {currentFile && (
                  <div className="relative max-w-full max-h-full">
                    <div 
                      className="relative inline-block max-w-[calc(100vw-400px)] max-h-[calc(100vh-200px)]"
                      style={{ 
                        maxWidth: "calc(100vw - 400px)",
                        maxHeight: "calc(100vh - 200px)"
                      }}
                    >
                      <img
                        ref={imageRef}
                        src={currentFile.processedPreview || currentFile.preview}
                        alt={currentFile.name}
                        className="w-full h-full object-contain border border-gray-300 rounded-lg shadow-lg"
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
                      
                      {/* Crop Overlay */}
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
                          <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                          
                          <div className="absolute -top-8 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded">
                            {Math.round(cropSelection.width)}% × {Math.round(cropSelection.height)}%
                          </div>
                        </div>
                      )}
                      
                      {/* Quick Actions Overlay */}
                      <div className="absolute top-4 right-4 flex space-x-2 opacity-0 hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="secondary" onClick={() => {}}>
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => {}}>
                          <RotateCw className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => {}}>
                          <FlipHorizontal className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="secondary" onClick={() => {}}>
                          <FlipVertical className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Simplified */}
      <div className="w-80 bg-white border-l shadow-lg flex flex-col">
        {/* Sidebar Header */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center space-x-2">
            <Icon className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Presets */}
          {presets.length > 0 && (
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
                    className="text-xs"
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Essential Options Only */}
          {options.map((option) => (
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
                    {option.options?.map((opt) => (
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
            </div>
          ))}

          {/* Ad Space */}
          <div className="py-4">
            <EnhancedAdBanner position="sidebar" showLabel />
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-6 border-t bg-gray-50 space-y-3">
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
        accept="image/*"
        multiple={!singleFileOnly && maxFiles > 1}
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
      />
    </div>
  )
}