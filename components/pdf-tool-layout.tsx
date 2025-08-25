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
  Scissors,
  Plus,
  X,
  Cloud
} from "lucide-react"
import { PDFProcessor } from "@/lib/processors/pdf-processor"
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
  const [urlInput, setUrlInput] = useState("")
  const [isLoadingUrl, setIsLoadingUrl] = useState(false)
  const [processingOptions, setProcessingOptions] = useState<Record<string, any>>({})
  const [splitMode, setSplitMode] = useState("range")
  const [pageRanges, setPageRanges] = useState([{ from: 1, to: 5 }])
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

  const loadPDFPages = async (file: File): Promise<Array<{ pageNumber: number; thumbnail: string; selected: boolean; width: number; height: number }>> => {
    try {
      const { pages: pdfPages } = await PDFProcessor.getPDFInfo(file)
      return pdfPages.map(page => ({
        pageNumber: page.pageNumber,
        thumbnail: page.thumbnail,
        selected: page.pageNumber <= 5, // Default select first 5 pages
        width: page.width,
        height: page.height
      }))
    } catch (error) {
      console.error("Failed to load PDF pages:", error)
      // Fallback to placeholder pages
      const pageCount = 7 // Default fallback
      const pages = []
      
      for (let i = 1; i <= pageCount; i++) {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")!
        canvas.width = 120
        canvas.height = 160
        
        ctx.fillStyle = "#ffffff"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        ctx.strokeStyle = "#e5e7eb"
        ctx.lineWidth = 1
        ctx.strokeRect(0, 0, canvas.width, canvas.height)
        
        ctx.fillStyle = "#6b7280"
        ctx.font = "8px Arial"
        for (let line = 0; line < 15; line++) {
          const y = 20 + line * 8
          const width = Math.random() * 80 + 20
          ctx.fillRect(10, y, width, 2)
        }
        
        ctx.fillStyle = "#374151"
        ctx.font = "10px Arial"
        ctx.textAlign = "center"
        ctx.fillText(`${i}`, canvas.width / 2, canvas.height - 10)
        
        pages.push({
          pageNumber: i,
          thumbnail: canvas.toDataURL("image/png"),
          selected: i <= 5,
          width: 595,
          height: 842
        })
      }
      
      return pages
    }
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
      if (file.type !== "application/pdf") {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a PDF file`,
          variant: "destructive"
        })
        continue
      }

      if (file.size > maxFileSize * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds ${maxFileSize}MB limit`,
          variant: "destructive"
        })
        continue
      }

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
        selectedPages: pages.filter(p => p.selected).map(p => p.pageNumber)
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
    
    try {
      let finalOptions = { ...processingOptions }
      
      if (toolType === "split" && files.length > 0) {
        if (splitMode === "pages") {
          const selectedPages = files[0].selectedPages || []
          if (selectedPages.length === 0) {
            throw new Error("Please select at least one page to split")
          }
          
          // Convert selected pages to ranges
          const ranges = selectedPages.map(page => ({ from: page, to: page }))
          finalOptions.pageRanges = ranges
        } else if (splitMode === "range") {
          finalOptions.pageRanges = pageRanges
        } else if (splitMode === "size") {
          // Calculate ranges based on file size
          const totalPages = files[0].pageCount || 1
          const equalParts = finalOptions.equalParts || 2
          const pagesPerPart = Math.ceil(totalPages / equalParts)
          const ranges = []
          
          for (let i = 0; i < equalParts; i++) {
            const from = i * pagesPerPart + 1
            const to = Math.min((i + 1) * pagesPerPart, totalPages)
            if (from <= totalPages) {
              ranges.push({ from, to })
            }
          }
          
          finalOptions.pageRanges = ranges
        }
      }

      const result = await processFunction(files, finalOptions)
      
      if (result.success && result.downloadUrl) {
        const link = document.createElement("a")
        link.href = result.downloadUrl
        link.download = `${toolType}-result.${toolType === "convert" ? "zip" : "pdf"}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        setFiles(prev => prev.map(f => ({ ...f, status: "completed" as const, progress: 100 })))
        
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

  const addPageRange = () => {
    setPageRanges(prev => [...prev, { from: 1, to: 1 }])
  }

  const updatePageRange = (index: number, field: 'from' | 'to', value: number) => {
    setPageRanges(prev => prev.map((range, i) => 
      i === index ? { ...range, [field]: value } : range
    ))
    
    // Update processing options to reflect the change
    setProcessingOptions(prev => ({ ...prev, pageRanges: pageRanges }))
  }

  const removePageRange = (index: number) => {
    setPageRanges(prev => prev.filter((_, i) => i !== index))
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Ad Banner */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-2">
          <div className="bg-blue-50 border border-blue-200 rounded p-4 text-center">
            <span className="text-sm text-blue-600">Advertisement</span>
          </div>
        </div>
      </div>
      
      <div className="container mx-auto px-4 py-8">
        {/* File Upload Area */}
        {files.length === 0 && (
          <div className="max-w-4xl mx-auto mb-8">
            <div
              className={`border-2 border-dashed rounded-lg p-16 text-center transition-all cursor-pointer ${
                dragActive 
                  ? "border-red-500 bg-red-50" 
                  : "border-gray-300 hover:border-red-400 hover:bg-gray-50"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-20 h-20 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
                <Icon className="h-10 w-10 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">{description}</p>
              
              <Button 
                size="lg" 
                className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 text-lg mb-6"
              >
                Select PDF files
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

              <p className="text-sm text-gray-500 mt-6">
                or drop PDF files here
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
          </div>
        )}

        {/* Main Interface - iLovePDF Style Layout */}
        {files.length > 0 && (
          <div className="flex gap-6">
            {/* Left Column - Main Content */}
            <div className="flex-1">
              {/* Files List */}
              <div className="bg-white rounded-lg border border-gray-200 mb-6">
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">PDF Files ({files.length})</h3>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => additionalFileInputRef.current?.click()}
                      disabled={files.length >= maxFiles}
                      className="text-blue-600 border-blue-600"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add More
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setFiles([])}
                      className="text-red-600 border-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All
                    </Button>
                  </div>
                </div>
                
                <div className="p-4">
                  {allowPageReorder ? (
                    <DragDropContext onDragEnd={onDragEnd}>
                      <Droppable droppableId="pdf-files">
                        {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                            {files.map((file, index) => (
                              <Draggable key={file.id} draggableId={file.id} index={index}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`flex items-center gap-4 p-4 border rounded-lg bg-white transition-all ${
                                      snapshot.isDragging ? "shadow-lg" : "shadow-sm border-gray-200"
                                    }`}
                                  >
                                    <div {...provided.dragHandleProps} className="cursor-move">
                                      <GripVertical className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                                      <FileText className="h-5 w-5 text-red-600" />
                                    </div>
                                    <div className="flex-1">
                                      <h4 className="font-medium text-gray-900">{file.name}</h4>
                                      <p className="text-sm text-gray-500">
                                        {file.pageCount} pages • {formatFileSize(file.size)}
                                      </p>
                                      {file.status === "processing" && (
                                        <Progress value={file.progress} className="mt-2 h-2" />
                                      )}
                                    </div>
                                    <div className="text-lg font-bold text-gray-400">{index + 1}</div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => removeFile(file.id)}
                                      className="text-gray-400 hover:text-red-600"
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
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
                    <div className="space-y-3">
                      {files.map((file, index) => (
                        <div key={file.id} className="flex items-center gap-4 p-4 border rounded-lg bg-white border-gray-200">
                          <div className="w-8 h-8 bg-red-100 rounded flex items-center justify-center">
                            <FileText className="h-5 w-5 text-red-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{file.name}</h4>
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
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Page Selection for Split Tool */}
              {toolType === "split" && files.length > 0 && files[0].pages && (
                <div className="bg-white rounded-lg border border-gray-200 mb-6">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Page Selection</h3>
                        <p className="text-sm text-gray-600">Select pages to extract from the PDF</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => selectAllPages(files[0].id)}
                          className="text-blue-600 border-blue-600"
                        >
                          Select All
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deselectAllPages(files[0].id)}
                          className="text-gray-600 border-gray-300"
                        >
                          Deselect All
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h4 className="font-medium text-gray-900 mb-4">Pages</h4>
                    <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-3 max-h-96 overflow-y-auto">
                      {files[0].pages.map((page) => (
                        <div
                          key={page.pageNumber}
                          className={`relative cursor-pointer border-2 rounded overflow-hidden transition-all ${
                            page.selected
                              ? "border-red-500 bg-red-50 shadow-md"
                              : "border-gray-200 hover:border-red-300"
                          }`}
                          onClick={() => togglePageSelection(files[0].id, page.pageNumber)}
                        >
                          <div className="aspect-[3/4] bg-white">
                            <img
                              src={page.thumbnail}
                              alt={`Page ${page.pageNumber}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white text-xs p-1 text-center">
                            {page.pageNumber}
                          </div>
                          {page.selected && (
                            <div className="absolute top-1 right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                              <CheckCircle className="h-3 w-3 text-white" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Page Ranges for Split Tool */}
              {toolType === "split" && splitMode === "range" && files.length > 0 && (
                <div className="bg-white rounded-lg border border-gray-200">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Range Preview</h3>
                    <p className="text-sm text-gray-600">
                      Showing pages {pageRanges[0]?.from || 1} to {pageRanges[0]?.to || 7} of {files[0].pageCount || 7}
                    </p>
                  </div>
                  
                  <div className="p-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                      <div className="flex items-center justify-center gap-4">
                        <div className="w-16 h-20 bg-white border border-gray-300 rounded shadow-sm flex items-center justify-center">
                          <span className="text-xs text-gray-500">{pageRanges[0]?.from || 1}</span>
                        </div>
                        <div className="text-gray-400">...</div>
                        <div className="w-16 h-20 bg-white border border-gray-300 rounded shadow-sm flex items-center justify-center">
                          <span className="text-xs text-gray-500">{pageRanges[0]?.to || 7}</span>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-4">Range 1</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Right Sidebar - Fixed Position (iLovePDF Style) */}
            <div className="w-80 flex-shrink-0">
              <div className="lg:sticky lg:top-8 space-y-6 lg:max-h-[calc(100vh-4rem)] lg:overflow-y-auto">
                {/* Split Mode Options for Split Tool */}
                {toolType === "split" && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-6">Split</h3>
                    
                    {/* Split Mode Tabs */}
                    <div className="mb-6">
                      <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                        <button
                          onClick={() => setSplitMode("range")}
                          className={`flex-1 p-3 text-center transition-colors ${
                            splitMode === "range" 
                              ? "bg-red-500 text-white" 
                              : "bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            <Scissors className="h-5 w-5 mb-1" />
                            <span className="text-xs">Range</span>
                          </div>
                        </button>
                        <button
                          onClick={() => setSplitMode("pages")}
                          className={`flex-1 p-3 text-center transition-colors border-l border-gray-200 ${
                            splitMode === "pages" 
                              ? "bg-red-500 text-white" 
                              : "bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            <FileText className="h-5 w-5 mb-1" />
                            <span className="text-xs">Pages</span>
                          </div>
                        </button>
                        <button
                          onClick={() => setSplitMode("size")}
                          className={`flex-1 p-3 text-center transition-colors border-l border-gray-200 ${
                            splitMode === "size" 
                              ? "bg-red-500 text-white" 
                              : "bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          <div className="flex flex-col items-center">
                            <Archive className="h-5 w-5 mb-1" />
                            <span className="text-xs">Size</span>
                          </div>
                        </button>
                      </div>
                    </div>

                    {/* Extract Mode Toggle for Pages */}
                    {splitMode === "pages" && (
                      <div className="mb-6">
                        <Label className="text-sm font-medium text-gray-700 mb-3 block">Extract mode:</Label>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 bg-red-50 border-red-200 text-red-600"
                          >
                            Extract all pages
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                          >
                            Select pages
                          </Button>
                        </div>
                        
                        {files.length > 0 && files[0].selectedPages && (
                          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                              Selected pages will be converted into separate PDF files. {files[0].selectedPages.length} PDF will be created.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                    {splitMode === "range" && (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">Range mode:</Label>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1 bg-red-50 border-red-200 text-red-600"
                            >
                              Custom ranges
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                            >
                              Fixed ranges
                            </Button>
                          </div>
                        </div>
                        
                        {/* Range Input */}
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Range 1</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">from page</span>
                            <Input
                              type="number"
                              value={pageRanges[0]?.from || 1}
                              onChange={(e) => updatePageRange(0, 'from', parseInt(e.target.value) || 1)}
                              className="w-16 text-center"
                              min={1}
                              max={files[0]?.pageCount || 100}
                            />
                            <span className="text-sm text-gray-600">to</span>
                            <Input
                              type="number"
                              value={pageRanges[0]?.to || 7}
                              onChange={(e) => updatePageRange(0, 'to', parseInt(e.target.value) || 7)}
                              className="w-16 text-center"
                              min={1}
                              max={files[0]?.pageCount || 100}
                            />
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={addPageRange}
                            className="w-full text-red-600 border-red-600"
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Range
                          </Button>
                        </div>
                      </div>
                    )}

                    {splitMode === "size" && (
                      <div className="space-y-4">
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-3 block">Original file size: {files[0] ? (files[0].size / 1024).toFixed(2) : '0'} KB</Label>
                          <Label className="text-sm font-medium text-gray-700 mb-3 block">Total pages: {files[0]?.pageCount || 0}</Label>
                        </div>
                        
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-2 block">Maximum size per file:</Label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={processingOptions.maxSizeKB || 38}
                              onChange={(e) => setProcessingOptions(prev => ({ ...prev, maxSizeKB: parseInt(e.target.value) || 38 }))}
                              className="w-20 text-center"
                              min={1}
                            />
                            <span className="text-sm text-gray-600">KB</span>
                            <span className="text-sm text-gray-600">MB</span>
                          </div>
                        </div>
                        
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <p className="text-sm text-blue-800">
                            This PDF will be split into files no larger than {processingOptions.maxSizeKB || 38} KB each.
                          </p>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="allow-compression"
                            checked={processingOptions.allowCompression || true}
                            onCheckedChange={(checked) => setProcessingOptions(prev => ({ ...prev, allowCompression: checked }))}
                          />
                          <Label htmlFor="allow-compression" className="text-sm text-gray-700">
                            Allow compression
                          </Label>
                        </div>
                      </div>
                    )}

                    {/* Merge Option */}
                    <div className="flex items-center space-x-2 mt-6">
                      <Checkbox
                        id="merge-ranges"
                        checked={processingOptions.mergeRanges || false}
                        onCheckedChange={(checked) => setProcessingOptions(prev => ({ ...prev, mergeRanges: checked }))}
                      />
                      <Label htmlFor="merge-ranges" className="text-sm text-gray-700">
                        Merge all ranges in one PDF file.
                      </Label>
                    </div>
                  </div>
                )}

                {/* Tool Options */}
                {options.length > 0 && toolType !== "split" && (
                  <div className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Settings className="h-5 w-5 text-gray-600" />
                      <h3 className="font-semibold text-gray-900">Options</h3>
                    </div>
                    
                    <div className="space-y-4">
                      {options.map((option) => (
                        <div key={option.key}>
                          <Label htmlFor={option.key} className="text-sm font-medium text-gray-700 mb-2 block">
                            {option.label}
                          </Label>
                          
                          {option.type === "select" && (
                            <select
                              id={option.key}
                              value={processingOptions[option.key] || option.defaultValue}
                              onChange={(e) => setProcessingOptions(prev => ({ ...prev, [option.key]: e.target.value }))}
                              className="w-full p-2 border border-gray-300 rounded-md bg-white"
                            >
                              {option.selectOptions?.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          )}
                          
                          {option.type === "slider" && (
                            <div>
                              <Slider
                                value={[processingOptions[option.key] || option.defaultValue]}
                                onValueChange={(value) => setProcessingOptions(prev => ({ ...prev, [option.key]: value[0] }))}
                                min={option.min || 0}
                                max={option.max || 100}
                                step={option.step || 1}
                                className="mb-2"
                              />
                              <div className="flex justify-between text-xs text-gray-500">
                                <span>{option.min || 0}</span>
                                <span className="font-medium">{processingOptions[option.key] || option.defaultValue}</span>
                                <span>{option.max || 100}</span>
                              </div>
                            </div>
                          )}
                          
                          {option.type === "checkbox" && (
                            <div className="flex items-center space-x-2">
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
                              min={option.min}
                              max={option.max}
                              step={option.step}
                              className="w-full"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Process Panel */}
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  <h3 className="font-semibold text-gray-900 mb-2">Process Files</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Ready to process {files.length} PDF file{files.length !== 1 ? "s" : ""}
                  </p>
                  
                  <Button
                    onClick={handleProcess}
                    disabled={isProcessing || files.length === 0}
                    className="w-full bg-red-500 hover:bg-red-600 text-white py-3"
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
                        {toolType === "split" ? "Split PDF" : "Start Processing"}
                      </>
                    )}
                  </Button>
                </div>

                {/* Ad Space */}
                <div className="bg-gray-100 border border-gray-200 rounded-lg p-4 text-center">
                  <div className="text-xs text-gray-500 mb-2">Advertisement</div>
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
          accept="application/pdf"
          multiple={toolType !== "split"}
          onChange={handleAdditionalFileInput}
          className="hidden"
        />
      </div>

      <Footer />
    </div>
  )
}