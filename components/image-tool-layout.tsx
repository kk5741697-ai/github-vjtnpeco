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
import { 
  Upload, 
  Download, 
  Trash2, 
  RotateCw, 
  Move, 
  ZoomIn, 
  ZoomOut, 
  Eye,
  Crop,
  Maximize,
  Archive,
  RefreshCw,
  ImageIcon,
  X,
  Menu,
  CheckCircle
} from "lucide-react"
import { useFileUpload } from "@/hooks/use-file-upload"
import { ImageProcessor } from "@/lib/processors/image-processor"
import { toast } from "@/hooks/use-toast"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"

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
  icon: any
  toolType: "resize" | "compress" | "convert" | "crop" | "rotate" | "watermark" | "background"
  processFunction: (files: ImageFile[], options: any) => Promise<{ success: boolean; processedFiles?: ImageFile[]; error?: string }>
  options: ToolOption[]
  maxFiles?: number
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
  allowBatchProcessing = true,
  supportedFormats = ["image/jpeg", "image/png", "image/webp", "image/gif"],
  outputFormats = ["jpeg", "png", "webp"]
}: ImageToolLayoutProps) {
  const [files, setFiles] = useState<ImageFile[]>([])
  const [toolOptions, setToolOptions] = useState<Record<string, any>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [processedFiles, setProcessedFiles] = useState<ImageFile[]>([])
  const [zoom, setZoom] = useState(100)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [cropMode, setCropMode] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Auto-set output format based on URL
  useEffect(() => {
    const path = window.location.pathname
    if (path.includes("convert-to-jpg") || path.includes("convert-to-jpeg")) {
      setToolOptions(prev => ({ ...prev, outputFormat: "jpeg" }))
    } else if (path.includes("convert-to-png")) {
      setToolOptions(prev => ({ ...prev, outputFormat: "png" }))
    } else if (path.includes("convert-to-webp")) {
      setToolOptions(prev => ({ ...prev, outputFormat: "webp" }))
    } else if (path.includes("convert-to-bmp")) {
      setToolOptions(prev => ({ ...prev, outputFormat: "bmp" }))
    }
  }, [])

  // Initialize options with defaults
  useEffect(() => {
    const defaultOptions: Record<string, any> = {}
    options.forEach(option => {
      defaultOptions[option.key] = option.defaultValue
    })
    setToolOptions(prev => ({ ...prev, ...defaultOptions }))
  }, [options])

  const handleFileUpload = async (uploadedFiles: FileList | null) => {
    if (!uploadedFiles) return

    const newFiles: ImageFile[] = []
    
    for (let i = 0; i < uploadedFiles.length && i < maxFiles; i++) {
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

    setFiles(prev => [...prev, ...newFiles])
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
  }

  const handleCropStart = (fileId: string) => {
    setSelectedFile(fileId)
    setCropMode(true)
  }

  const handleCropArea = (fileId: string, cropArea: { x: number; y: number; width: number; height: number }) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId ? { ...file, cropArea } : file
    ))
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
      // Single file download
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
      // Multiple files - create ZIP
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

  const onDragEnd = (result: any) => {
    if (!result.destination || !allowBatchProcessing) return

    const sourceIndex = result.source.index
    const destIndex = result.destination.index

    if (sourceIndex === destIndex) return

    setFiles(prev => {
      const newFiles = [...prev]
      const [removed] = newFiles.splice(sourceIndex, 1)
      newFiles.splice(destIndex, 0, removed)
      return newFiles
    })
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      {/* Left Canvas - Image Preview */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Canvas Header */}
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            <Badge variant="secondary">{files.length} files</Badge>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setZoom(prev => Math.max(25, prev - 25))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600 min-w-[60px] text-center">{zoom}%</span>
            <Button variant="outline" size="sm" onClick={() => setZoom(prev => Math.min(200, prev + 25))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            {toolType === "crop" && (
              <Button 
                variant={cropMode ? "default" : "outline"} 
                size="sm"
                onClick={() => setCropMode(!cropMode)}
              >
                <Crop className="h-4 w-4" />
              </Button>
            )}
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
        <div className="flex-1 overflow-auto p-6">
          {files.length === 0 ? (
            <div 
              className="h-full border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-gray-400 transition-colors"
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
              <input
                ref={fileInputRef}
                type="file"
                accept={supportedFormats.join(",")}
                multiple={maxFiles > 1}
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
            </div>
          ) : (
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="images" direction="horizontal">
                {(provided) => (
                  <div 
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-6"
                  >
                    {/* Before/After Comparison */}
                    {processedFiles.length > 0 && (
                      <div className="bg-white rounded-lg shadow-sm border p-6">
                        <h3 className="text-lg font-medium mb-4">Before & After</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h4 className="text-sm font-medium text-gray-600 mb-2">Original</h4>
                            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                              <img 
                                src={files[0]?.preview}
                                alt="Original"
                                className="w-full h-full object-contain"
                                style={{ transform: `scale(${zoom / 100})` }}
                              />
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              {files[0]?.dimensions.width} × {files[0]?.dimensions.height} • {formatFileSize(files[0]?.size || 0)}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-600 mb-2">Processed</h4>
                            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                              <img 
                                src={processedFiles[0]?.processedPreview}
                                alt="Processed"
                                className="w-full h-full object-contain"
                                style={{ transform: `scale(${zoom / 100})` }}
                              />
                            </div>
                            <div className="mt-2 text-xs text-gray-500">
                              {processedFiles[0]?.dimensions.width} × {processedFiles[0]?.dimensions.height} • {formatFileSize(processedFiles[0]?.processedSize || processedFiles[0]?.size || 0)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Images Grid */}
                    <div 
                      className="grid gap-4"
                      style={{ 
                        gridTemplateColumns: `repeat(auto-fit, minmax(${200 * (zoom / 100)}px, 1fr))` 
                      }}
                    >
                      {files.map((file, index) => (
                        <Draggable key={file.id} draggableId={file.id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className={`relative group transition-all duration-200 ${
                                snapshot.isDragging ? "scale-105 shadow-lg" : ""
                              }`}
                            >
                              <Card className="overflow-hidden">
                                {/* Image Preview */}
                                <div className="relative aspect-video bg-gray-100">
                                  <img 
                                    src={file.processedPreview || file.preview}
                                    alt={file.name}
                                    className="w-full h-full object-contain cursor-pointer"
                                    style={{ transform: `scale(${zoom / 100})` }}
                                    onClick={() => toolType === "crop" && handleCropStart(file.id)}
                                  />

                                  {/* Crop Overlay */}
                                  {toolType === "crop" && cropMode && selectedFile === file.id && (
                                    <CropOverlay
                                      imageFile={file}
                                      onCropChange={(cropArea) => handleCropArea(file.id, cropArea)}
                                    />
                                  )}

                                  {/* Processing Indicator */}
                                  {file.processed && (
                                    <div className="absolute top-2 right-2">
                                      <CheckCircle className="h-5 w-5 text-green-600 bg-white rounded-full" />
                                    </div>
                                  )}

                                  {/* Hover Actions */}
                                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <div className="flex space-x-2">
                                      <Button size="sm" variant="secondary">
                                        <Eye className="h-4 w-4" />
                                      </Button>
                                      <Button size="sm" variant="secondary">
                                        <RotateCw className="h-4 w-4" />
                                      </Button>
                                      {toolType === "crop" && (
                                        <Button 
                                          size="sm" 
                                          variant="secondary"
                                          onClick={() => handleCropStart(file.id)}
                                        >
                                          <Crop className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* File Info */}
                                <div className="p-4">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-gray-900 truncate">{file.name}</h4>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      onClick={() => removeFile(file.id)}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <div className="text-xs text-gray-500 space-y-1">
                                    <div className="flex justify-between">
                                      <span>Dimensions:</span>
                                      <span>{file.dimensions.width} × {file.dimensions.height}</span>
                                    </div>
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
                                  </div>
                                </div>
                              </Card>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    </div>
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          )}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className={`${sidebarOpen ? "w-80" : "w-0"} lg:w-80 bg-white border-l shadow-lg flex flex-col fixed lg:relative right-0 top-0 h-screen transition-all duration-300 z-50 lg:z-auto`}>
        {/* Sidebar Header */}
        <div className="px-6 py-4 border-b bg-gray-50">
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
          {/* Tool Options */}
          {options.map((option) => (
            <div key={option.key} className="space-y-2">
              <Label className="text-sm font-medium">{option.label}</Label>
              
              {option.type === "select" && (
                <Select
                  value={toolOptions[option.key]?.toString()}
                  onValueChange={(value) => setToolOptions(prev => ({ ...prev, [option.key]: value }))}
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
                    min={option.min}
                    max={option.max}
                    step={option.step}
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{option.min}</span>
                    <span>{toolOptions[option.key] || option.defaultValue}</span>
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
                  <span className="text-sm">{option.label}</span>
                </div>
              )}

              {option.type === "text" && (
                <Input
                  value={toolOptions[option.key] || ""}
                  onChange={(e) => setToolOptions(prev => ({ ...prev, [option.key]: e.target.value }))}
                  placeholder={`Enter ${option.label.toLowerCase()}`}
                />
              )}

              {option.type === "number" && (
                <Input
                  type="number"
                  value={toolOptions[option.key] || option.defaultValue}
                  onChange={(e) => setToolOptions(prev => ({ ...prev, [option.key]: parseInt(e.target.value) || option.defaultValue }))}
                  min={option.min}
                  max={option.max}
                />
              )}

              {option.type === "color" && (
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={toolOptions[option.key] || option.defaultValue}
                    onChange={(e) => setToolOptions(prev => ({ ...prev, [option.key]: e.target.value }))}
                    className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
                  />
                  <Input
                    value={toolOptions[option.key] || option.defaultValue}
                    onChange={(e) => setToolOptions(prev => ({ ...prev, [option.key]: e.target.value }))}
                    placeholder="#000000"
                    className="flex-1"
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Sidebar Footer */}
        <div className="p-6 border-t bg-gray-50 space-y-3">
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
            <div className="text-xs text-gray-500 space-y-1">
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
        multiple={maxFiles > 1}
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
      />
    </div>
  )
}

// Crop Overlay Component
function CropOverlay({ 
  imageFile, 
  onCropChange 
}: { 
  imageFile: ImageFile
  onCropChange: (cropArea: { x: number; y: number; width: number; height: number }) => void 
}) {
  const [cropArea, setCropArea] = useState({ x: 10, y: 10, width: 80, height: 80 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    const rect = e.currentTarget.getBoundingClientRect()
    setDragStart({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100
    })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return

    const rect = e.currentTarget.getBoundingClientRect()
    const currentX = ((e.clientX - rect.left) / rect.width) * 100
    const currentY = ((e.clientY - rect.top) / rect.height) * 100

    const newCropArea = {
      x: Math.min(dragStart.x, currentX),
      y: Math.min(dragStart.y, currentY),
      width: Math.abs(currentX - dragStart.x),
      height: Math.abs(currentY - dragStart.y)
    }

    setCropArea(newCropArea)
    onCropChange(newCropArea)
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  return (
    <div 
      className="absolute inset-0 cursor-crosshair"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      {/* Crop Selection */}
      <div 
        className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20"
        style={{
          left: `${cropArea.x}%`,
          top: `${cropArea.y}%`,
          width: `${cropArea.width}%`,
          height: `${cropArea.height}%`
        }}
      >
        {/* Resize Handles */}
        <div className="absolute -top-1 -left-1 w-2 h-2 bg-blue-500 rounded-full cursor-nw-resize"></div>
        <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full cursor-ne-resize"></div>
        <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-blue-500 rounded-full cursor-sw-resize"></div>
        <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full cursor-se-resize"></div>
      </div>
    </div>
  )
}