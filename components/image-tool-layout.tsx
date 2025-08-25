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
  Palette
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
  const [currentStep, setCurrentStep] = useState(1)
  const [urlInput, setUrlInput] = useState("")
  const [isLoadingUrl, setIsLoadingUrl] = useState(false)
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [processingOptions, setProcessingOptions] = useState<Record<string, any>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize default options
  useEffect(() => {
    const defaultOptions: Record<string, any> = {}
    options.forEach(option => {
      defaultOptions[option.key] = option.defaultValue
    })
    setProcessingOptions(defaultOptions)
  }, [options])

  useEffect(() => {
    if (files.length > 0) setCurrentStep(2)
    if (files.some(f => f.status === "completed")) setCurrentStep(4)
  }, [files])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFileSelection(droppedFiles)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
  }, [])

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

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
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
    setCurrentStep(3)
    
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
            file.processedPreview = processedFile.preview
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

      setCurrentStep(4)
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

  const onDragEnd = (result: any) => {
    if (!result.destination) return

    const items = Array.from(files)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    setFiles(items)
  }

  const updateCropArea = (fileId: string, cropArea: { x: number; y: number; width: number; height: number }) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, cropArea } : f
    ))
  }

  const selectedFile = files.find(f => f.id === selectedFileId)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const steps = [
    { number: 1, title: "Add Files", active: currentStep >= 1 },
    { number: 2, title: "Configure", active: currentStep >= 2 },
    { number: 3, title: "Process", active: currentStep >= 3 },
    { number: 4, title: "Download", active: currentStep >= 4 }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Icon className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">{description}</p>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-center space-x-4 mb-8">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                step.active 
                  ? "bg-blue-500 text-white" 
                  : "bg-gray-200 text-gray-500"
              }`}>
                {step.number}
              </div>
              <span className={`ml-2 text-sm font-medium ${
                step.active ? "text-gray-900" : "text-gray-500"
              }`}>
                {step.title}
              </span>
              {index < steps.length - 1 && (
                <div className={`w-8 h-0.5 mx-4 ${
                  step.active ? "bg-blue-500" : "bg-gray-200"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* File Upload Area */}
        {files.length === 0 && (
          <Card className="mb-8">
            <CardContent className="p-8">
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-all ${
                  dragActive 
                    ? "border-blue-500 bg-blue-50" 
                    : "border-gray-300 hover:border-blue-400 hover:bg-gray-50"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Select images</h3>
                <p className="text-gray-600 mb-6">or drop images here</p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button 
                    size="lg" 
                    className="bg-blue-500 hover:bg-blue-600 text-white px-8"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Images
                  </Button>

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
            </CardContent>
          </Card>
        )}

        {/* Main Interface */}
        {files.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Files Panel */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Images ({files.length})</CardTitle>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={files.length >= maxFiles}
                      >
                        <Upload className="h-4 w-4 mr-2" />
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
                                  className={`flex items-center gap-4 p-4 border rounded-lg transition-all ${
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
            </div>

            {/* Configuration Panel */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tool Options */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Configure</span>
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

              {/* Visual Crop Interface for Crop Tool */}
              {toolType === "crop" && selectedFile && selectedFile.preview && (
                <Card>
                  <CardHeader>
                    <CardTitle>Crop Area</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Image Selection */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Select Image to Crop</Label>
                        <div className="grid grid-cols-3 gap-2">
                          {files.map((file) => (
                            <button
                              key={file.id}
                              onClick={() => setSelectedFileId(file.id)}
                              className={`relative border-2 rounded-lg overflow-hidden aspect-square ${
                                selectedFileId === file.id
                                  ? "border-blue-500 bg-blue-50"
                                  : "border-gray-200 hover:border-blue-300"
                              }`}
                            >
                              <img
                                src={file.preview}
                                alt={file.name}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white text-xs p-1 truncate">
                                {file.name}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Crop Preview */}
                      <div className="relative bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: "16/10", minHeight: "300px" }}>
                        <img
                          src={selectedFile.preview}
                          alt="Crop preview"
                          className="w-full h-full object-contain"
                        />
                        
                        {/* Crop Overlay */}
                        <div
                          className="absolute border-2 border-blue-500 bg-blue-500/20"
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
                        </div>
                      </div>

                      {/* Aspect Ratio Presets */}
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Aspect Ratio</Label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { label: "Free", ratio: null },
                            { label: "1:1", ratio: 1 },
                            { label: "4:3", ratio: 4/3 },
                            { label: "16:9", ratio: 16/9 }
                          ].map((preset) => (
                            <Button
                              key={preset.label}
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (selectedFile && preset.ratio) {
                                  const newCropArea = {
                                    x: 10,
                                    y: 10,
                                    width: 80,
                                    height: 80 / preset.ratio
                                  }
                                  updateCropArea(selectedFile.id, newCropArea)
                                }
                              }}
                            >
                              {preset.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Process Button */}
              <Card>
                <CardHeader>
                  <CardTitle>Process Images</CardTitle>
                  <CardDescription>
                    Ready to process {files.length} image{files.length !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
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
                        Start Processing
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Hidden file input for additional uploads */}
        <input
          ref={fileInputRef}
          type="file"
          accept={supportedFormats.join(",")}
          multiple={allowBatchProcessing}
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      <Footer />
    </div>
  )
}