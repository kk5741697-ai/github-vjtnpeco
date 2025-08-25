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
  Copy, 
  FileText,
  Link,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Archive,
  Move,
  RotateCw,
  Crop,
  Palette,
  Plus,
  Cloud
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"

export interface ProcessedImageFile {
  id: string
  name: string
  originalFile: File
  processedBlob?: Blob
  preview?: string
  processedPreview?: string
  size: number
  processedSize?: number
  status: "pending" | "processing" | "completed" | "error"
  progress: number
  error?: string
  metadata?: {
    width: number
    height: number
    format: string
  }
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
  supportedFormats = ["image/jpeg", "image/png", "image/gif", "image/webp"],
  outputFormats = ["jpeg", "png", "webp"]
}: ImageToolLayoutProps) {
  const [files, setFiles] = useState<ProcessedImageFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const [isLoadingUrl, setIsLoadingUrl] = useState(false)
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [processingOptions, setProcessingOptions] = useState<Record<string, any>>({})
  const [cropPosition, setCropPosition] = useState({ x: 610, y: 392 })
  const [cropSize, setCropSize] = useState({ width: 4878, height: 3135 })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const additionalFileInputRef = useRef<HTMLInputElement>(null)

  // Initialize default options
  useEffect(() => {
    const defaultOptions: Record<string, any> = {}
    options.forEach(option => {
      defaultOptions[option.key] = option.defaultValue
    })
    setProcessingOptions(defaultOptions)
  }, [options])

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
      // Validate file type
      if (!supportedFormats.some(format => file.type.includes(format.replace("image/", "")))) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not supported`,
          variant: "destructive"
        })
        continue
      }

      // Validate file size
      if (file.size > maxFileSize * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds ${maxFileSize}MB limit`,
          variant: "destructive"
        })
        continue
      }

      // Generate preview and metadata
      const preview = await new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.onerror = () => resolve("")
        reader.readAsDataURL(file)
      })

      const metadata = await new Promise<{ width: number; height: number; format: string }>((resolve) => {
        const img = new Image()
        img.onload = () => {
          resolve({
            width: img.naturalWidth,
            height: img.naturalHeight,
            format: file.type.split("/")[1]
          })
        }
        img.onerror = () => resolve({ width: 0, height: 0, format: "unknown" })
        img.src = preview
      })

      const processedFile: ProcessedImageFile = {
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        name: file.name,
        originalFile: file,
        preview,
        size: file.size,
        status: "pending",
        progress: 0,
        metadata,
        cropArea: toolType === "crop" ? { x: 10, y: 10, width: 80, height: 80 } : undefined
      }

      newFiles.push(processedFile)
    }

    setFiles(prev => [...prev, ...newFiles])
    if (newFiles.length > 0 && !selectedFileId) {
      setSelectedFileId(newFiles[0].id)
    }
  }, [files, maxFiles, maxFileSize, supportedFormats, selectedFileId, toolType])

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
      const filesToProcess = files.filter(f => f.status === "pending")
      
      for (const file of filesToProcess) {
        file.status = "processing"
        file.progress = 0
        setFiles(prev => prev.map(f => f.id === file.id ? { ...file } : f))

        // Simulate progress
        for (let i = 0; i <= 100; i += 20) {
          file.progress = i
          setFiles(prev => prev.map(f => f.id === file.id ? { ...file } : f))
          await new Promise(resolve => setTimeout(resolve, 100))
        }

        try {
          const result = await processFunction([file], processingOptions)
          
          if (result.success && result.processedFiles) {
            const processedFile = result.processedFiles[0]
            file.status = "completed"
            file.progress = 100
            file.processedBlob = processedFile.blob
            file.processedPreview = processedFile.processedPreview
            file.processedSize = processedFile.size
          } else {
            file.status = "error"
            file.error = result.error || "Processing failed"
          }
        } catch (error) {
          file.status = "error"
          file.error = error instanceof Error ? error.message : "Processing failed"
        }

        setFiles(prev => prev.map(f => f.id === file.id ? { ...file } : f))
      }
    } finally {
      setIsProcessing(false)
    }
  }

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
    if (selectedFileId === fileId) {
      const remainingFiles = files.filter(f => f.id !== fileId)
      setSelectedFileId(remainingFiles.length > 0 ? remainingFiles[0].id : null)
    }
  }

  const downloadFile = (file: ProcessedImageFile) => {
    if (!file.processedBlob) return

    const url = URL.createObjectURL(file.processedBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = file.name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const downloadAllFiles = () => {
    const completedFiles = files.filter(f => f.status === "completed" && f.processedBlob)
    completedFiles.forEach((file, index) => {
      setTimeout(() => downloadFile(file), index * 500)
    })
  }

  const onDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(files)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setFiles(items)
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const selectedFile = files.find(f => f.id === selectedFileId)
  const completedFiles = files.filter(f => f.status === "completed")

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600 mb-4">{description}</p>
        </div>

        {/* File Upload Area */}
        {files.length === 0 && (
          <div className="max-w-2xl mx-auto mb-8">
            <div
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-all cursor-pointer ${
                dragActive 
                  ? "border-blue-500 bg-blue-50" 
                  : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <Cloud className="h-12 w-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Select images</h3>
              <p className="text-gray-600 mb-6">or drop images here</p>
              
              <Button 
                size="lg" 
                className="bg-blue-500 hover:bg-blue-600 text-white px-8 mb-4"
              >
                <Upload className="h-4 w-4 mr-2" />
                Select images
              </Button>

              <div className="flex justify-center">
                <Tabs defaultValue="file" className="w-full max-w-md">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="file">
                      <FileText className="h-4 w-4 mr-2" />
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

              <p className="text-xs text-gray-500 mt-6">
                Maximum {maxFiles} files • {supportedFormats.map(f => f.replace("image/", "").toUpperCase()).join(", ")} • Up to {maxFileSize}MB per file
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
        )}

        {/* Main Interface - Two Column Layout */}
        {files.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Image Editor */}
            <div className="lg:col-span-2">
              {/* Image Preview and Crop Interface */}
              {toolType === "crop" && selectedFile && (
                <Card className="mb-6">
                  <CardContent className="p-0">
                    <div className="relative bg-gray-100 overflow-hidden" style={{ minHeight: "400px" }}>
                      <img
                        src={selectedFile.preview}
                        alt="Crop preview"
                        className="w-full h-full object-contain"
                        style={{ maxHeight: "500px" }}
                      />
                      
                      {/* Crop Overlay */}
                      <div
                        className="absolute border-2 border-blue-500 bg-blue-500/20 cursor-move"
                        style={{
                          left: `${selectedFile.cropArea?.x || 10}%`,
                          top: `${selectedFile.cropArea?.y || 10}%`,
                          width: `${selectedFile.cropArea?.width || 80}%`,
                          height: `${selectedFile.cropArea?.height || 80}%`
                        }}
                      >
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <Crop className="h-6 w-6 text-white drop-shadow-lg" />
                        </div>
                        
                        {/* Resize handles */}
                        <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 border border-white cursor-nw-resize"></div>
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 border border-white cursor-ne-resize"></div>
                        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 border border-white cursor-sw-resize"></div>
                        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 border border-white cursor-se-resize"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Files List */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Images ({files.length})</CardTitle>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => additionalFileInputRef.current?.click()}
                        disabled={files.length >= maxFiles}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add More
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setFiles([])}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Clear All
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="image-files">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                          {files.map((file, index) => (
                            <Draggable key={file.id} draggableId={file.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`flex items-center gap-4 p-4 border rounded-lg transition-all bg-white ${
                                    selectedFileId === file.id 
                                      ? "border-blue-500 bg-blue-50" 
                                      : "border-gray-200 hover:border-blue-300"
                                  } ${snapshot.isDragging ? "shadow-lg" : ""}`}
                                  onClick={() => setSelectedFileId(file.id)}
                                >
                                  <div {...provided.dragHandleProps} className="cursor-move">
                                    <Move className="h-5 w-5 text-gray-400" />
                                  </div>
                                  
                                  <div className="flex-shrink-0">
                                    <div className="relative">
                                      <img
                                        src={file.processedPreview || file.preview}
                                        alt={file.name}
                                        className="w-16 h-16 object-cover rounded border"
                                      />
                                      {file.status === "completed" && (
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                          <CheckCircle className="h-3 w-3 text-white" />
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{file.name}</p>
                                    <div className="flex items-center gap-4 text-sm text-gray-500">
                                      <span>{formatFileSize(file.size)}</span>
                                      {file.metadata && (
                                        <span>{file.metadata.width} × {file.metadata.height}</span>
                                      )}
                                      <Badge variant={
                                        file.status === "completed" ? "default" :
                                        file.status === "error" ? "destructive" :
                                        file.status === "processing" ? "secondary" : "outline"
                                      }>
                                        {file.status}
                                      </Badge>
                                    </div>
                                    
                                    {file.status === "processing" && (
                                      <Progress value={file.progress} className="mt-2 h-2" />
                                    )}
                                    
                                    {file.error && (
                                      <p className="text-sm text-red-600 mt-1">{file.error}</p>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {file.status === "completed" && (
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          downloadFile(file)
                                        }}
                                      >
                                        <Download className="h-4 w-4" />
                                      </Button>
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        removeFile(file.id)
                                      }}
                                      className="text-gray-400 hover:text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </CardContent>
              </Card>

              {/* Download Results */}
              {completedFiles.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Download Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-3">
                      <Button
                        onClick={downloadAllFiles}
                        className="bg-blue-500 hover:bg-blue-600 text-white"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download All ({completedFiles.length})
                      </Button>
                      <Button variant="outline">
                        <Archive className="h-4 w-4 mr-2" />
                        Download ZIP
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column - Fixed Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8 space-y-6">
                {/* Crop Options for Crop Tool */}
                {toolType === "crop" && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Crop options</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Width (px)</Label>
                        <Input
                          type="number"
                          value={cropSize.width}
                          onChange={(e) => setCropSize(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Height (px)</Label>
                        <Input
                          type="number"
                          value={cropSize.height}
                          onChange={(e) => setCropSize(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Position X (px)</Label>
                        <Input
                          type="number"
                          value={cropPosition.x}
                          onChange={(e) => setCropPosition(prev => ({ ...prev, x: parseInt(e.target.value) || 0 }))}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Position Y (px)</Label>
                        <Input
                          type="number"
                          value={cropPosition.y}
                          onChange={(e) => setCropPosition(prev => ({ ...prev, y: parseInt(e.target.value) || 0 }))}
                          className="mt-1"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Tool Options */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="h-5 w-5" />
                      <span>Options</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {options.map((option) => (
                      <div key={option.key}>
                        <Label htmlFor={option.key} className="text-sm font-medium">
                          {option.label}
                        </Label>
                        
                        {option.type === "select" && (
                          <select
                            id={option.key}
                            value={processingOptions[option.key] || option.defaultValue}
                            onChange={(e) => setProcessingOptions(prev => ({ ...prev, [option.key]: e.target.value }))}
                            className="w-full p-2 border border-gray-300 rounded-md bg-white mt-1"
                          >
                            {option.selectOptions?.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        )}
                        
                        {option.type === "slider" && (
                          <div className="mt-2">
                            <Slider
                              value={[processingOptions[option.key] || option.defaultValue]}
                              onValueChange={(value) => setProcessingOptions(prev => ({ ...prev, [option.key]: value[0] }))}
                              min={option.min || 0}
                              max={option.max || 100}
                              step={option.step || 1}
                            />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>{option.min || 0}</span>
                              <span className="font-medium">{processingOptions[option.key] || option.defaultValue}</span>
                              <span>{option.max || 100}</span>
                            </div>
                          </div>
                        )}
                        
                        {option.type === "checkbox" && (
                          <div className="flex items-center space-x-2 mt-2">
                            <Checkbox
                              id={option.key}
                              checked={processingOptions[option.key] || option.defaultValue}
                              onCheckedChange={(checked) => setProcessingOptions(prev => ({ ...prev, [option.key]: checked }))}
                            />
                          </div>
                        )}
                        
                        {option.type === "color" && (
                          <div className="flex items-center space-x-2 mt-2">
                            <input
                              type="color"
                              value={processingOptions[option.key] || option.defaultValue}
                              onChange={(e) => setProcessingOptions(prev => ({ ...prev, [option.key]: e.target.value }))}
                              className="w-12 h-8 border border-gray-300 rounded"
                            />
                            <Input
                              value={processingOptions[option.key] || option.defaultValue}
                              onChange={(e) => setProcessingOptions(prev => ({ ...prev, [option.key]: e.target.value }))}
                              placeholder="#ffffff"
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
                            className="mt-2"
                            min={option.min}
                            max={option.max}
                            step={option.step}
                          />
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Process Button */}
                <Button
                  onClick={handleProcess}
                  disabled={isProcessing || files.length === 0}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      {toolType.charAt(0).toUpperCase() + toolType.slice(1)} IMAGE
                    </>
                  )}
                </Button>

                {/* Ad Space */}
                <div className="bg-gray-100 border border-gray-200 rounded-lg p-6 text-center">
                  <div className="text-sm text-gray-500 mb-2">Advertisement</div>
                  <div className="bg-white border border-gray-300 rounded p-4 min-h-[250px] flex items-center justify-center">
                    <span className="text-gray-400">300x250 Ad Space</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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

      <Footer />
    </div>
  )
}