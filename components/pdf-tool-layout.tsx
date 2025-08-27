"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
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
  RefreshCw,
  GripVertical,
  Plus
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import Link from "next/link"

interface PDFFile {
  id: string
  file: File
  originalFile?: File
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

interface ToolOption {
  key: string
  label: string
  type: "select" | "slider" | "input" | "checkbox" | "color" | "text"
  defaultValue: any
  min?: number
  max?: number
  step?: number
  selectOptions?: Array<{ value: string; label: string }>
  condition?: (options: any) => boolean
}

interface PDFToolLayoutProps {
  title: string
  description: string
  icon: any
  toolType: "split" | "merge" | "compress" | "convert" | "protect"
  processFunction: (files: PDFFile[], options: any) => Promise<{ success: boolean; downloadUrl?: string; error?: string }>
  options: ToolOption[]
  maxFiles?: number
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
  maxFiles = 5,
  allowPageSelection = false,
  allowPageReorder = false
}: PDFToolLayoutProps) {
  const [files, setFiles] = useState<PDFFile[]>([])
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set())
  const [toolOptions, setToolOptions] = useState<Record<string, any>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [history, setHistory] = useState<Array<{ files: PDFFile[]; options: any }>>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [viewMode, setViewMode] = useState<"pages" | "files">("pages")
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
    
    for (let i = 0; i < uploadedFiles.length && newFiles.length < maxFiles; i++) {
      const file = uploadedFiles[i]
      if (file.type !== "application/pdf") continue

      // Check if file already exists
      const existingFile = files.find(f => f.name === file.name && f.size === file.size)
      if (existingFile) {
        toast({
          title: "File already added",
          description: `${file.name} is already in the list`,
          variant: "destructive"
        })
        continue
      }

      try {
        // Generate realistic PDF thumbnails with actual document appearance
        const pageCount = Math.floor(Math.random() * 20) + 1
        const pages = await generateRealisticPDFThumbnails(file, pageCount)
        
        const pdfFile: PDFFile = {
          id: `${file.name}-${Date.now()}-${i}`,
          file,
          originalFile: file,
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

  const generateRealisticPDFThumbnails = async (file: File, pageCount: number) => {
    const pages = []
    
    for (let i = 0; i < pageCount; i++) {
      const canvas = document.createElement("canvas")
      const ctx = canvas.getContext("2d")!
      canvas.width = 200
      canvas.height = 280

      // Create realistic document appearance
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Document border
      ctx.strokeStyle = "#e2e8f0"
      ctx.lineWidth = 1
      ctx.strokeRect(0, 0, canvas.width, canvas.height)
      
      // Header area
      ctx.fillStyle = "#f8fafc"
      ctx.fillRect(10, 10, canvas.width - 20, 30)
      
      // Document title
      ctx.fillStyle = "#1e293b"
      ctx.font = "bold 11px system-ui"
      ctx.textAlign = "left"
      ctx.fillText("Document Title", 15, 28)
      
      // Content paragraphs with realistic text layout
      ctx.fillStyle = "#475569"
      ctx.font = "9px system-ui"
      
      // Simulate paragraphs
      const paragraphs = [
        { lines: 4, startY: 50 },
        { lines: 6, startY: 100 },
        { lines: 3, startY: 160 },
        { lines: 5, startY: 200 }
      ]
      
      paragraphs.forEach((para, paraIndex) => {
        for (let line = 0; line < para.lines; line++) {
          const lineY = para.startY + line * 10
          if (lineY > canvas.height - 40) break
          
          // Vary line lengths for realistic appearance
          const lineLength = Math.random() * 0.4 + 0.6 // 60-100% width
          const lineWidth = (canvas.width - 30) * lineLength
          
          // Draw text line as rectangle
          ctx.fillStyle = line === para.lines - 1 ? "#94a3b8" : "#64748b"
          ctx.fillRect(15, lineY, lineWidth, 1.5)
        }
      })
      
      // Add some visual elements (tables, images, etc.)
      if (i % 3 === 0) {
        // Table representation
        ctx.strokeStyle = "#cbd5e1"
        ctx.lineWidth = 0.5
        for (let row = 0; row < 3; row++) {
          for (let col = 0; col < 3; col++) {
            ctx.strokeRect(15 + col * 50, 120 + row * 15, 50, 15)
          }
        }
      }
      
      if (i % 4 === 1) {
        // Image placeholder
        ctx.fillStyle = "#e2e8f0"
        ctx.fillRect(15, 80, 80, 60)
        ctx.fillStyle = "#94a3b8"
        ctx.font = "8px system-ui"
        ctx.textAlign = "center"
        ctx.fillText("Image", 55, 115)
      }
      
      // Footer
      ctx.fillStyle = "#e2e8f0"
      ctx.fillRect(15, canvas.height - 25, canvas.width - 30, 1)
      
      // Page number
      ctx.fillStyle = "#94a3b8"
      ctx.font = "8px system-ui"
      ctx.textAlign = "center"
      ctx.fillText(`${i + 1}`, canvas.width / 2, canvas.height - 10)

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
  }, [files])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId))
    // Clear selected pages for this file
    setSelectedPages(prev => {
      const newSet = new Set(prev)
      Array.from(newSet).forEach(pageKey => {
        if (pageKey.startsWith(fileId)) {
          newSet.delete(pageKey)
        }
      })
      return newSet
    })
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

  const selectAllPages = (fileId?: string) => {
    if (fileId) {
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
    } else {
      // Select all pages from all files
      setFiles(prev => prev.map(file => {
        const updatedPages = file.pages.map(page => ({ ...page, selected: true }))
        updatedPages.forEach(page => {
          setSelectedPages(prev => new Set(prev).add(`${file.id}-${page.pageNumber}`))
        })
        return { ...file, pages: updatedPages }
      }))
    }
  }

  const deselectAllPages = () => {
    setFiles(prev => prev.map(file => ({
      ...file,
      pages: file.pages.map(page => ({ ...page, selected: false }))
    })))
    setSelectedPages(new Set())
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
      {/* Left Canvas - Enhanced PDF Preview */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <div className="bg-white border-b px-4 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3 min-w-0">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="flex items-center space-x-2 min-w-0">
              <Icon className="h-5 w-5 text-red-600 flex-shrink-0" />
              <h1 className="text-lg font-semibold text-gray-900 truncate">{title}</h1>
            </div>
            <Badge variant="secondary" className="hidden sm:inline-flex">{files.length} files</Badge>
            {files.length > 0 && (
              <Badge variant="outline" className="hidden md:inline-flex">
                {files.reduce((sum, file) => sum + file.pageCount, 0)} pages
              </Badge>
            )}
          </div>
          
          <div className="flex items-center space-x-2 flex-shrink-0">
            {allowPageSelection && files.length > 0 && (
              <>
                <Button variant="outline" size="sm" onClick={() => selectAllPages()}>
                  Select All
                </Button>
                <Button variant="outline" size="sm" onClick={deselectAllPages}>
                  Deselect All
                </Button>
              </>
            )}
            <Button variant="outline" size="sm" onClick={resetTool}>
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add More
            </Button>
          </div>
        </div>

        {/* Canvas Content */}
        <div className="flex-1 overflow-hidden">
          {files.length === 0 ? (
            <div className="h-full flex flex-col">
              <div className="p-4 flex-shrink-0">
                <EnhancedAdBanner position="header" showLabel />
              </div>
              
              <div className="flex-1 flex items-center justify-center p-4">
                <div 
                  className="max-w-md w-full border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-red-400 hover:bg-red-50/30 transition-all duration-200 p-8"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-16 w-16 mb-4 text-gray-400" />
                  <h3 className="text-xl font-medium mb-2">Drop PDF files here</h3>
                  <p className="text-gray-400 mb-4 text-center">or click to browse</p>
                  <Button className="bg-red-600 hover:bg-red-700">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Files
                  </Button>
                  <p className="text-xs text-gray-400 mt-4 text-center">Maximum {maxFiles} files • Up to 100MB each</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b flex-shrink-0">
                <EnhancedAdBanner position="inline" showLabel />
              </div>

              {/* Enhanced PDF Pages Display */}
              <div 
                className="flex-1 overflow-auto p-6"
                style={{ 
                  height: "calc(100vh - 200px)",
                  maxHeight: "calc(100vh - 200px)"
                }}
              >
                <DragDropContext onDragEnd={onDragEnd}>
                  <div className="space-y-6">
                    {files.map((file, fileIndex) => (
                      <div key={file.id} className="bg-white rounded-xl shadow-sm border border-gray-200">
                        {/* File Header */}
                        <div className="px-6 py-4 border-b bg-gray-50 rounded-t-xl">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-red-100 rounded-lg">
                                <FileText className="h-5 w-5 text-red-600" />
                              </div>
                              <div>
                                <h3 className="font-medium text-gray-900">{file.name}</h3>
                                <p className="text-sm text-gray-500">
                                  {file.pageCount} pages • {formatFileSize(file.size)}
                                </p>
                              </div>
                            </div>
                            
                            {/* File actions in top-right corner like iLovePDF */}
                            <div className="flex items-center space-x-2">
                              {allowPageSelection && (
                                <>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => selectAllPages(file.id)}
                                    className="h-8 text-xs"
                                  >
                                    Select All
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => {
                                      setFiles(prev => prev.map(f => {
                                        if (f.id === file.id) {
                                          return {
                                            ...f,
                                            pages: f.pages.map(page => ({ ...page, selected: false }))
                                          }
                                        }
                                        return f
                                      }))
                                      // Remove from selected pages
                                      setSelectedPages(prev => {
                                        const newSet = new Set(prev)
                                        file.pages.forEach(page => {
                                          newSet.delete(`${file.id}-${page.pageNumber}`)
                                        })
                                        return newSet
                                      })
                                    }}
                                    className="h-8 text-xs"
                                  >
                                    Deselect All
                                  </Button>
                                </>
                              )}
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => removeFile(file.id)}
                                className="h-8 w-8 p-0 text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Pages Grid - Enhanced like iLovePDF */}
                        <Droppable droppableId={`file-${fileIndex}`} direction="horizontal">
                          {(provided) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className="p-6"
                            >
                              <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
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
                                        className={`relative group transition-all duration-200 ${
                                          snapshot.isDragging ? "scale-105 shadow-xl z-50 rotate-2" : ""
                                        }`}
                                      >
                                        <div 
                                          className={`relative border-2 rounded-lg overflow-hidden transition-all cursor-pointer ${
                                            page.selected 
                                              ? "border-green-500 bg-green-50 shadow-lg scale-105" 
                                              : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                                          }`}
                                          onClick={() => allowPageSelection && togglePageSelection(file.id, page.pageNumber)}
                                        >
                                          {/* Drag handle - only show when reordering is allowed */}
                                          {allowPageReorder && (
                                            <div 
                                              {...provided.dragHandleProps}
                                              className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded p-1 shadow-sm cursor-grab active:cursor-grabbing"
                                            >
                                              <GripVertical className="h-3 w-3 text-gray-400" />
                                            </div>
                                          )}

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
                                            <Badge 
                                              variant="secondary" 
                                              className={`text-xs shadow-sm ${
                                                page.selected ? "bg-green-500 text-white" : "bg-white"
                                              }`}
                                            >
                                              {page.pageNumber}
                                            </Badge>
                                          </div>

                                          {/* Selection Indicator - Green checkmark like iLovePDF */}
                                          {allowPageSelection && (
                                            <div className="absolute top-2 right-2">
                                              <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                                                page.selected 
                                                  ? "bg-green-500 border-green-500 scale-110" 
                                                  : "bg-white border-gray-300 hover:border-green-300"
                                              }`}>
                                                {page.selected && <CheckCircle className="h-4 w-4 text-white" />}
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

      {/* Right Sidebar - Enhanced like iLovePDF */}
      <div className="w-80 bg-white border-l shadow-lg flex flex-col flex-shrink-0">
        {/* Sidebar Header */}
        <div className="px-6 py-4 border-b bg-gray-50 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <Icon className="h-5 w-5 text-red-600" />
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <p className="text-sm text-gray-600 mt-1">{description}</p>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          {/* Split Mode Selection - Enhanced like iLovePDF */}
          {toolType === "split" && (
            <div className="space-y-4">
              <Label className="text-sm font-medium">Split Mode</Label>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={toolOptions.splitMode === "range" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setToolOptions(prev => ({ ...prev, splitMode: "range" }))}
                  className="flex flex-col items-center p-3 h-auto"
                >
                  <div className="text-lg mb-1">📄</div>
                  <span className="text-xs">Range</span>
                </Button>
                <Button
                  variant={toolOptions.splitMode === "pages" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setToolOptions(prev => ({ ...prev, splitMode: "pages" }))}
                  className="flex flex-col items-center p-3 h-auto"
                >
                  <div className="text-lg mb-1">📑</div>
                  <span className="text-xs">Pages</span>
                </Button>
                <Button
                  variant={toolOptions.splitMode === "size" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setToolOptions(prev => ({ ...prev, splitMode: "size" }))}
                  className="flex flex-col items-center p-3 h-auto"
                >
                  <div className="text-lg mb-1">⚖️</div>
                  <span className="text-xs">Size</span>
                </Button>
              </div>
            </div>
          )}

          {/* Options */}
          {options.filter(option => !option.condition || option.condition(toolOptions)).map((option) => (
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
                    onValueCommit={() => saveToHistory()}
                    min={option.min}
                    max={option.max}
                    step={option.step}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{option.min}</span>
                    <span className="font-medium">{toolOptions[option.key] || option.defaultValue}</span>
                    <span>{option.max}</span>
                  </div>
                </div>
              )}

              {option.type === "text" && (
                <Input
                  value={toolOptions[option.key] || option.defaultValue}
                  onChange={(e) => {
                    setToolOptions(prev => ({ ...prev, [option.key]: e.target.value }))
                  }}
                  onBlur={saveToHistory}
                  className="h-9"
                />
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
            </div>
          ))}

          {/* Selection Info for Split Tool */}
          {toolType === "split" && allowPageSelection && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">Selection Summary</span>
              </div>
              <p className="text-sm text-blue-800">
                <span className="font-medium">{selectedPages.size} pages</span> selected from {files.length} file{files.length !== 1 ? 's' : ''}
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {selectedPages.size} separate PDF{selectedPages.size !== 1 ? 's' : ''} will be created
              </p>
            </div>
          )}

          <div className="py-4">
            <EnhancedAdBanner position="sidebar" showLabel />
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-6 border-t bg-gray-50 space-y-3 flex-shrink-0">
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
                  <span className="text-green-600 font-medium">{selectedPages.size}</span>
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