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
  FileText,
  Link,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Archive,
  Move,
  GripVertical,
  Eye,
  RotateCw,
  Scissors
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"

export interface ProcessedPDFFile {
  id: string
  name: string
  originalFile: File
  processedBlob?: Blob
  preview?: string
  size: number
  processedSize?: number
  status: "pending" | "processing" | "completed" | "error"
  progress: number
  error?: string
  pageCount?: number
  pages?: Array<{
    pageNumber: number
    thumbnail: string
    selected: boolean
    width: number
    height: number
  }>
  selectedPages?: number[]
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

interface PDFToolLayoutProps {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  toolType: "merge" | "split" | "compress" | "convert" | "protect" | "watermark"
  processFunction: (files: any[], options: any) => Promise<{ success: boolean; downloadUrl?: string; error?: string }>
  options: ToolOption[]
  maxFiles?: number
  maxFileSize?: number
  allowPageSelection?: boolean
  allowPageReorder?: boolean
}

export function PDFToolLayout({
  title,
  description,
  icon: Icon,
  toolType,
  processFunction,
  options,
  maxFiles = 10,
  maxFileSize = 100,
  allowPageSelection = false,
  allowPageReorder = true
}: PDFToolLayoutProps) {
  const [files, setFiles] = useState<ProcessedPDFFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [urlInput, setUrlInput] = useState("")
  const [isLoadingUrl, setIsLoadingUrl] = useState(false)
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

  const loadPDFPages = async (file: File): Promise<Array<{ pageNumber: number; thumbnail: string; selected: boolean; width: number; height: number }>> => {
    // Simulate PDF page loading
    const pageCount = Math.floor(Math.random() * 10) + 1
    const pages = []
    
    for (let i = 1; i <= pageCount; i++) {
      pages.push({
        pageNumber: i,
        thumbnail: `data:image/svg+xml;base64,${btoa(`
          <svg width="100" height="140" xmlns="http://www.w3.org/2000/svg">
            <rect width="100" height="140" fill="#f8f9fa" stroke="#dee2e6"/>
            <text x="50" y="70" text-anchor="middle" font-family="Arial" font-size="12" fill="#6c757d">Page ${i}</text>
          </svg>
        `)}`,
        selected: true,
        width: 595,
        height: 842
      })
    }
    
    return pages
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

    const newFiles: ProcessedPDFFile[] = []

    for (const file of selectedFiles) {
      // Validate file type
      if (file.type !== "application/pdf") {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a PDF file`,
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

      // Load PDF pages
      const pages = await loadPDFPages(file)

      const processedFile: ProcessedPDFFile = {
        id: `${file.name}-${Date.now()}-${Math.random()}`,
        name: file.name,
        originalFile: file,
        size: file.size,
        status: "pending",
        progress: 0,
        pageCount: pages.length,
        pages,
        selectedPages: pages.map(p => p.pageNumber)
      }

      newFiles.push(processedFile)
    }

    setFiles(prev => [...prev, ...newFiles])
  }, [files, maxFiles, maxFileSize])

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

  const handleUrlLoad = useCallback(async () => {
    if (!urlInput.trim()) return

    setIsLoadingUrl(true)
    try {
      const response = await fetch(urlInput)
      if (!response.ok) throw new Error("Failed to fetch file")

      const blob = await response.blob()
      const filename = urlInput.split("/").pop() || "downloaded-file.pdf"
      const file = new File([blob], filename, { type: "application/pdf" })

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
      const result = await processFunction(files, processingOptions)
      
      if (result.success && result.downloadUrl) {
        // Create download
        const link = document.createElement("a")
        link.href = result.downloadUrl
        link.download = `${toolType}-result.${toolType === "convert" ? "zip" : "pdf"}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // Update file status
        setFiles(prev => prev.map(f => ({ ...f, status: "completed" as const, progress: 100 })))
        setCurrentStep(4)
        
        toast({
          title: "Processing complete",
          description: "Your files have been processed successfully"
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

  const togglePageSelection = (fileId: string, pageNumber: number) => {
    setFiles(prev => prev.map(file => {
      if (file.id === fileId && file.pages) {
        const updatedPages = file.pages.map(page => 
          page.pageNumber === pageNumber 
            ? { ...page, selected: !page.selected }
            : page
        )
        const selectedPages = updatedPages.filter(p => p.selected).map(p => p.pageNumber)
        
        return {
          ...file,
          pages: updatedPages,
          selectedPages
        }
      }
      return file
    }))
  }

  const selectAllPages = (fileId: string) => {
    setFiles(prev => prev.map(file => {
      if (file.id === fileId && file.pages) {
        const updatedPages = file.pages.map(page => ({ ...page, selected: true }))
        const selectedPages = updatedPages.map(p => p.pageNumber)
        
        return {
          ...file,
          pages: updatedPages,
          selectedPages
        }
      }
      return file
    }))
  }

  const deselectAllPages = (fileId: string) => {
    setFiles(prev => prev.map(file => {
      if (file.id === fileId && file.pages) {
        const updatedPages = file.pages.map(page => ({ ...page, selected: false }))
        
        return {
          ...file,
          pages: updatedPages,
          selectedPages: []
        }
      }
      return file
    }))
  }

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
            <div className="p-3 rounded-lg bg-red-500/10">
              <Icon className="h-8 w-8 text-red-600" />
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
                  ? "bg-red-500 text-white" 
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
                  step.active ? "bg-red-500" : "bg-gray-200"
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
                    ? "border-red-500 bg-red-50" 
                    : "border-gray-300 hover:border-red-400 hover:bg-gray-50"
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Select PDF files</h3>
                <p className="text-gray-600 mb-6">or drop PDF files here</p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Button 
                    size="lg" 
                    className="bg-red-500 hover:bg-red-600 text-white px-8"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Choose PDF Files
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
                          placeholder="Enter PDF URL..."
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
                  Maximum {maxFiles} files • PDF only • Up to {maxFileSize}MB per file
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                multiple={toolType !== "split"}
                onChange={handleFileInput}
                className="hidden"
              />
            </CardContent>
          </Card>
        )}

        {/* Main Interface */}
        {files.length > 0 && (
          <div className="space-y-6">
            {/* Files Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>PDF Files ({files.length})</CardTitle>
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
                {allowPageReorder ? (
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="pdf-files">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                          {files.map((file, index) => (
                            <Draggable key={file.id} draggableId={file.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`border rounded-lg p-4 bg-white transition-all ${
                                    snapshot.isDragging ? "shadow-lg" : "shadow-sm"
                                  }`}
                                >
                                  <div className="flex items-center space-x-4">
                                    <div {...provided.dragHandleProps} className="cursor-move">
                                      <GripVertical className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <FileText className="h-8 w-8 text-red-500" />
                                    <div className="flex-1">
                                      <h4 className="font-medium">{file.name}</h4>
                                      <p className="text-sm text-gray-500">
                                        {file.pageCount} pages • {formatFileSize(file.size)}
                                      </p>
                                      {file.status === "processing" && (
                                        <Progress value={file.progress} className="mt-2 h-2" />
                                      )}
                                    </div>
                                    <Badge variant="outline">{index + 1}</Badge>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeFile(file.id)}
                                      className="text-gray-400 hover:text-red-600"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  
                                  {/* Page Thumbnails */}
                                  {file.pages && (
                                    <div className="mt-4">
                                      <div className="flex items-center justify-between mb-2">
                                        <Label className="text-sm font-medium">Pages</Label>
                                        {allowPageSelection && (
                                          <div className="flex gap-2">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => selectAllPages(file.id)}
                                            >
                                              Select All
                                            </Button>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() => deselectAllPages(file.id)}
                                            >
                                              Deselect All
                                            </Button>
                                          </div>
                                        )}
                                      </div>
                                      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                                        {file.pages.slice(0, 12).map((page) => (
                                          <div
                                            key={page.pageNumber}
                                            className={`relative cursor-pointer border-2 rounded overflow-hidden ${
                                              allowPageSelection && page.selected
                                                ? "border-red-500 bg-red-50"
                                                : "border-gray-200 hover:border-red-300"
                                            }`}
                                            onClick={() => allowPageSelection && togglePageSelection(file.id, page.pageNumber)}
                                          >
                                            <div className="aspect-[3/4] bg-gray-100">
                                              <img
                                                src={page.thumbnail}
                                                alt={`Page ${page.pageNumber}`}
                                                className="w-full h-full object-cover"
                                              />
                                            </div>
                                            <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white text-xs p-1 text-center">
                                              {page.pageNumber}
                                            </div>
                                            {allowPageSelection && page.selected && (
                                              <div className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                                <CheckCircle className="h-3 w-3 text-white" />
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                        {file.pages.length > 12 && (
                                          <div className="aspect-[3/4] bg-gray-100 rounded border flex items-center justify-center">
                                            <span className="text-xs text-gray-500">
                                              +{file.pages.length - 12}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                ) : (
                  <div className="space-y-4">
                    {files.map((file, index) => (
                      <div key={file.id} className="border rounded-lg p-4 bg-white">
                        <div className="flex items-center space-x-4">
                          <FileText className="h-8 w-8 text-red-500" />
                          <div className="flex-1">
                            <h4 className="font-medium">{file.name}</h4>
                            <p className="text-sm text-gray-500">
                              {file.pageCount} pages • {formatFileSize(file.size)}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(file.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Configuration Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

              {/* Process Panel */}
              <Card>
                <CardHeader>
                  <CardTitle>Process Files</CardTitle>
                  <CardDescription>
                    Ready to process {files.length} PDF file{files.length !== 1 ? "s" : ""}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleProcess}
                    disabled={isProcessing || files.length === 0}
                    className="w-full bg-red-500 hover:bg-red-600 text-white"
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
          accept="application/pdf"
          multiple={toolType !== "split"}
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      <Footer />
    </div>
  )
}