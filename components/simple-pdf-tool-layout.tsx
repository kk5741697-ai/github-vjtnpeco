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
  FileText,
  CheckCircle,
  X,
  ArrowLeft,
  Undo,
  Redo,
  RefreshCw
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import Link from "next/link"

interface PDFFile {
  id: string
  file: File
  name: string
  size: number
  pageCount: number
  pages: Array<{
    pageNumber: number
    thumbnail: string
    selected: boolean
    width: number
    height: number
  }>
  processed?: boolean
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

interface SimplePDFToolLayoutProps {
  title: string
  description: string
  icon: any
  toolType: "split" | "merge" | "compress" | "convert" | "protect"
  processFunction: (files: PDFFile[], options: any) => Promise<{ success: boolean; downloadUrl?: string; error?: string }>
  options: SimpleToolOption[]
  maxFiles?: number
  allowPageSelection?: boolean
  allowPageReorder?: boolean
}

export function SimplePDFToolLayout({
  title,
  description,
  icon: Icon,
  toolType,
  processFunction,
  options,
  maxFiles = 5,
  allowPageSelection = false,
  allowPageReorder = false
}: SimplePDFToolLayoutProps) {
  const [files, setFiles] = useState<PDFFile[]>([])
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set())
  const [toolOptions, setToolOptions] = useState<Record<string, any>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [history, setHistory] = useState<Array<{ files: PDFFile[]; options: any }>>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const defaultOptions: Record<string, any> = {}
    options.forEach(option => {
      defaultOptions[option.key] = option.defaultValue
    })
    setToolOptions(defaultOptions)
  }, [options])

  const handleFileUpload = async (uploadedFiles: FileList | null) => {
    if (!uploadedFiles) return

    const newFiles: PDFFile[] = []
    
    for (let i = 0; i < uploadedFiles.length && i < maxFiles; i++) {
      const file = uploadedFiles[i]
      if (file.type !== "application/pdf") continue

      try {
        // Generate realistic PDF thumbnails
        const pageCount = Math.floor(Math.random() * 20) + 1
        const pages = await this.generatePDFThumbnails(file, pageCount)
        
        const pdfFile: PDFFile = {
          id: `${file.name}-${Date.now()}-${i}`,
          file,
          name: file.name,
          size: file.size,
          pageCount,
          pages
        }

        newFiles.push(pdfFile)
      } catch (error) {
        toast({
          title: "Error loading PDF",
          description: `Failed to load ${file.name}`,
          variant: "destructive"
        })
      }
    }

    setFiles(prev => [...prev, ...newFiles])
    saveToHistory()
  }

  const generatePDFThumbnails = async (file: File, pageCount: number) => {
    const pages = []
    
    for (let i = 0; i < pageCount; i++) {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!
      canvas.width = 200
      canvas.height = 280

      // Create realistic PDF page thumbnail
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      ctx.strokeStyle = "#e2e8f0"
      ctx.lineWidth = 1
      ctx.strokeRect(0, 0, canvas.width, canvas.height)
      
      // Document header
      ctx.fillStyle = "#1f2937"
      ctx.font = "bold 12px system-ui"
      ctx.textAlign = "left"
      ctx.fillText("Document Title", 15, 25)
      
      // Content lines
      ctx.fillStyle = "#374151"
      ctx.font = "10px system-ui"
      const lines = [
        "Lorem ipsum dolor sit amet, consectetur",
        "adipiscing elit. Sed do eiusmod tempor",
        "incididunt ut labore et dolore magna",
        "aliqua. Ut enim ad minim veniam,",
        "quis nostrud exercitation ullamco",
        "laboris nisi ut aliquip ex ea commodo"
      ]
      
      lines.forEach((line, lineIndex) => {
        if (lineIndex < 6) {
          ctx.fillText(line.substring(0, 28), 15, 45 + lineIndex * 12)
        }
      })
      
      // Page elements
      ctx.fillStyle = "#e5e7eb"
      ctx.fillRect(15, 150, canvas.width - 30, 1)
      ctx.fillRect(15, 170, canvas.width - 50, 1)
      
      // Page number
      ctx.fillStyle = "#9ca3af"
      ctx.font = "8px system-ui"
      ctx.textAlign = "center"
      ctx.fillText(`Page ${i + 1} of ${pageCount}`, canvas.width / 2, canvas.height - 15)

      pages.push({
        pageNumber: i + 1,
        thumbnail: canvas.toDataURL("image/png", 0.8),
        selected: toolType === "split" ? false : true,
        width: 200,
        height: 280
      })
    }

    return pages
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
    setDownloadUrl(null)
    setSelectedPages(new Set())
    setHistory([])
    setHistoryIndex(-1)
    
    const defaultOptions: Record<string, any> = {}
    options.forEach(option => {
      defaultOptions[option.key] = option.defaultValue
    })
    setToolOptions(defaultOptions)
  }

  const togglePageSelection = (fileId: string, pageNumber: number) => {
    const pageKey = `${fileId}-${pageNumber}`
    setSelectedPages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(pageKey)) {
        newSet.delete(pageKey)
      } else {
        newSet.add(pageKey)
      }
      return newSet
    })

    setFiles(prev => prev.map(file => {
      if (file.id === fileId) {
        return {
          ...file,
          pages: file.pages.map(page => 
            page.pageNumber === pageNumber 
              ? { ...page, selected: !page.selected }
              : page
          )
        }
      }
      return file
    }))
  }

  const selectAllPages = (fileId: string) => {
    setFiles(prev => prev.map(file => {
      if (file.id === fileId) {
        const updatedPages = file.pages.map(page => ({ ...page, selected: true }))
        updatedPages.forEach(page => {
          setSelectedPages(prev => new Set(prev).add(`${fileId}-${page.pageNumber}`))
        })
        return { ...file, pages: updatedPages }
      }
      return file
    }))
  }

  const deselectAllPages = (fileId: string) => {
    setFiles(prev => prev.map(file => {
      if (file.id === fileId) {
        const updatedPages = file.pages.map(page => ({ ...page, selected: false }))
        updatedPages.forEach(page => {
          setSelectedPages(prev => {
            const newSet = new Set(prev)
            newSet.delete(`${fileId}-${page.pageNumber}`)
            return newSet
          })
        })
        return { ...file, pages: updatedPages }
      }
      return file
    }))
  }

  const handleProcess = async () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please upload at least one PDF file",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    setDownloadUrl(null)

    try {
      const result = await processFunction(files, toolOptions)
      
      if (result.success && result.downloadUrl) {
        setDownloadUrl(result.downloadUrl)
        toast({
          title: "Processing complete",
          description: "Your file is ready for download"
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
    if (downloadUrl) {
      const link = document.createElement("a")
      link.href = downloadUrl
      link.download = files.length === 1 
        ? `${toolType}_${files[0].name}` 
        : `${toolType}_files.zip`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    }
  }

  const onDragEnd = (result: any) => {
    if (!result.destination || !allowPageReorder) return

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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      {/* Left Canvas - PDF Preview */}
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
              <Icon className="h-5 w-5 text-red-600" />
              <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
            </div>
            <Badge variant="secondary">{files.length} files</Badge>
            {files.length > 0 && (
              <Badge variant="outline">
                {files.reduce((sum, file) => sum + file.pageCount, 0)} pages
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
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              Add More
            </Button>
          </div>
        </div>

        {/* Canvas Content */}
        <div className="flex-1 overflow-auto">
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
                  <h3 className="text-xl font-medium mb-2">Drop PDF files here</h3>
                  <p className="text-gray-400 mb-4">or click to browse</p>
                  <Button>
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Files
                  </Button>
                  <p className="text-xs text-gray-400 mt-4">Maximum {maxFiles} files • Up to 100MB each</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b">
                <EnhancedAdBanner position="inline" showLabel />
              </div>

              <div className="flex-1 p-6 overflow-auto">
                <DragDropContext onDragEnd={onDragEnd}>
                  <div className="space-y-8">
                    {files.map((file, fileIndex) => (
                      <div key={file.id} className="bg-white rounded-lg shadow-sm border">
                        {/* File Header */}
                        <div className="px-6 py-4 border-b bg-gray-50 rounded-t-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <FileText className="h-5 w-5 text-red-600" />
                              <div>
                                <h3 className="font-medium text-gray-900">{file.name}</h3>
                                <p className="text-sm text-gray-500">
                                  {file.pageCount} pages • {formatFileSize(file.size)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {allowPageSelection && (
                                <>
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
                                </>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => removeFile(file.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Pages Grid */}
                        <Droppable droppableId={`file-${fileIndex}`} direction="horizontal">
                          {(provided) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="p-6"
                            >
                              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                                {file.pages.map((page, pageIndex) => (
                                  <Draggable 
                                    key={`${file.id}-${page.pageNumber}`}
                                    draggableId={`${file.id}-${page.pageNumber}`}
                                    index={pageIndex}
                                    isDragDisabled={!allowPageReorder}
                                  >
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={`relative group cursor-pointer transition-all duration-200 ${
                                          snapshot.isDragging ? "scale-105 shadow-lg z-50" : ""
                                        }`}
                                      >
                                        <div 
                                          className={`relative border-2 rounded-lg overflow-hidden transition-all ${
                                            page.selected 
                                              ? "border-red-500 bg-red-50 shadow-md" 
                                              : "border-gray-200 hover:border-gray-300 hover:shadow-sm"
                                          }`}
                                          onClick={() => allowPageSelection && togglePageSelection(file.id, page.pageNumber)}
                                        >
                                          {/* Page Thumbnail */}
                                          <div className="aspect-[3/4] bg-white relative overflow-hidden">
                                            <img 
                                              src={page.thumbnail}
                                              alt={`Page ${page.pageNumber}`}
                                              className="w-full h-full object-contain"
                                            />
                                          </div>

                                          {/* Page Number */}
                                          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                                            <Badge variant="secondary" className="text-xs bg-white shadow-sm">
                                              {page.pageNumber}
                                            </Badge>
                                          </div>

                                          {/* Selection Indicator */}
                                          {allowPageSelection && (
                                            <div className="absolute top-2 right-2">
                                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                                page.selected 
                                                  ? "bg-red-500 border-red-500 scale-110" 
                                                  : "bg-white border-gray-300 hover:border-red-300"
                                              }`}>
                                                {page.selected && <CheckCircle className="h-3 w-3 text-white" />}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                              </div>
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    ))}
                  </div>
                </DragDropContext>
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
            <Icon className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
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

          {/* Selection Info for Split Tool */}
          {toolType === "split" && allowPageSelection && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                Selected pages will be extracted into separate PDF files. 
                <span className="font-medium"> {selectedPages.size} PDF{selectedPages.size !== 1 ? 's' : ''}</span> will be created.
              </p>
            </div>
          )}

          <div className="py-4">
            <EnhancedAdBanner position="sidebar" showLabel />
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-6 border-t bg-gray-50 space-y-3">
          <Button 
            onClick={handleProcess}
            disabled={isProcessing || files.length === 0}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 text-base font-semibold"
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
              <p className="text-xs text-gray-600 text-center">Processing your PDF...</p>
            </div>
          )}

          {downloadUrl && (
            <Button 
              onClick={handleDownload}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base font-semibold"
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Download {files.length > 1 ? "ZIP" : "PDF"}
            </Button>
          )}

          {files.length > 0 && (
            <div className="text-xs text-gray-500 space-y-1 pt-2 border-t">
              <div className="flex justify-between">
                <span>Total files:</span>
                <span>{files.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total pages:</span>
                <span>{files.reduce((sum, file) => sum + file.pageCount, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total size:</span>
                <span>{formatFileSize(files.reduce((sum, file) => sum + file.size, 0))}</span>
              </div>
              {allowPageSelection && (
                <div className="flex justify-between">
                  <span>Selected pages:</span>
                  <span className="text-red-600 font-medium">{selectedPages.size}</span>
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
        accept=".pdf"
        multiple={maxFiles > 1}
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
      />
    </div>
  )
}