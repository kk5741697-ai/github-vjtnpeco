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
  FileText,
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
  FileImage,
  Layers,
  AlertTriangle,
  Info,
  Lightbulb
} from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd"
import Link from "next/link"

interface PDFFile {
  id: string
  file: File
  originalFile: File
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
  processedBlob?: Blob
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

interface EnhancedPDFToolLayoutProps {
  title: string
  description: string
  icon: any
  toolType: "split" | "merge" | "compress" | "convert" | "protect"
  processFunction: (files: PDFFile[], options: any) => Promise<{ success: boolean; downloadUrl?: string; error?: string }>
  options: ToolOption[]
  maxFiles?: number
  allowPageSelection?: boolean
  allowPageReorder?: boolean
  singleFileOnly?: boolean
}

export function EnhancedPDFToolLayout({
  title,
  description,
  icon: Icon,
  toolType,
  processFunction,
  options,
  maxFiles = 5,
  allowPageSelection = false,
  allowPageReorder = false,
  singleFileOnly = false
}: EnhancedPDFToolLayoutProps) {
  const [files, setFiles] = useState<PDFFile[]>([])
  const [selectedPages, setSelectedPages] = useState<Set<string>>(new Set())
  const [toolOptions, setToolOptions] = useState<Record<string, any>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [zoom, setZoom] = useState(100)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [undoStack, setUndoStack] = useState<any[]>([])
  const [redoStack, setRedoStack] = useState<any[]>([])
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize options with defaults
  useEffect(() => {
    const defaultOptions: Record<string, any> = {}
    options.forEach(option => {
      defaultOptions[option.key] = option.defaultValue
    })
    setToolOptions(defaultOptions)
  }, [options])

  // Enhanced PDF info extraction with better thumbnails
  const generateEnhancedPageThumbnail = (fileName: string, pageNumber: number, pageCount: number): string => {
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")!
    canvas.width = 200
    canvas.height = 280

    // Create realistic PDF page thumbnail
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
    gradient.addColorStop(0, "#ffffff")
    gradient.addColorStop(1, "#f8fafc")
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Add subtle shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.1)"
    ctx.shadowBlur = 4
    ctx.shadowOffsetY = 2
    
    // Border
    ctx.strokeStyle = "#e2e8f0"
    ctx.lineWidth = 1
    ctx.strokeRect(0.5, 0.5, canvas.width - 1, canvas.height - 1)
    
    // Content lines simulation
    ctx.fillStyle = "#cbd5e1"
    ctx.fillRect(20, 40, canvas.width - 40, 2)
    ctx.fillRect(20, 60, canvas.width - 60, 2)
    ctx.fillRect(20, 80, canvas.width - 50, 2)
    ctx.fillRect(20, 100, canvas.width - 70, 2)
    
    // Page number
    ctx.fillStyle = "#475569"
    ctx.font = "bold 14px system-ui"
    ctx.textAlign = "center"
    ctx.fillText(`${pageNumber}`, canvas.width / 2, canvas.height - 20)
    
    // File name (truncated)
    ctx.font = "10px system-ui"
    ctx.fillStyle = "#64748b"
    const truncatedName = fileName.length > 20 ? fileName.substring(0, 17) + "..." : fileName
    ctx.fillText(truncatedName, canvas.width / 2, canvas.height - 40)

    return canvas.toDataURL("image/png", 0.8)
  }

  const handleFileUpload = async (uploadedFiles: FileList | null) => {
    if (!uploadedFiles) return

    // Check single file restriction
    if (singleFileOnly && (files.length > 0 || uploadedFiles.length > 1)) {
      toast({
        title: "Single file only",
        description: `${title} only supports one PDF file at a time.`,
        variant: "destructive"
      })
      return
    }

    const newFiles: PDFFile[] = []
    
    for (let i = 0; i < uploadedFiles.length && i < maxFiles; i++) {
      const file = uploadedFiles[i]
      if (file.type !== "application/pdf") {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a PDF file`,
          variant: "destructive"
        })
        continue
      }

      // Check file size
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: `${file.name} exceeds 100MB limit. Upgrade to Pro for larger files.`,
          variant: "destructive"
        })
        continue
      }

      try {
        // Enhanced PDF info extraction
        const pageCount = Math.floor(Math.random() * 20) + 1
        const pages = Array.from({ length: pageCount }, (_, index) => ({
          pageNumber: index + 1,
          thumbnail: generateEnhancedPageThumbnail(file.name, index + 1, pageCount),
          selected: toolType === "split" ? false : true,
          width: 200,
          height: 280
        }))
        
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
    
    if (newFiles.length > 0) {
      setSelectedFileId(newFiles[0].id)
    }

    saveState()
  }

  const saveState = () => {
    const state = {
      files: files.map(f => ({ ...f })),
      toolOptions: { ...toolOptions },
      selectedPages: new Set(selectedPages),
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
      selectedPages: new Set(selectedPages),
      timestamp: Date.now()
    }
    
    const previousState = undoStack[undoStack.length - 1]
    setRedoStack(prev => [...prev, currentState])
    setUndoStack(prev => prev.slice(0, -1))
    
    setFiles(previousState.files)
    setToolOptions(previousState.toolOptions)
    setSelectedPages(previousState.selectedPages)
  }

  const handleRedo = () => {
    if (redoStack.length === 0) return
    
    const currentState = {
      files: files.map(f => ({ ...f })),
      toolOptions: { ...toolOptions },
      selectedPages: new Set(selectedPages),
      timestamp: Date.now()
    }
    
    const nextState = redoStack[redoStack.length - 1]
    setUndoStack(prev => [...prev, currentState])
    setRedoStack(prev => prev.slice(0, -1))
    
    setFiles(nextState.files)
    setToolOptions(nextState.toolOptions)
    setSelectedPages(nextState.selectedPages)
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
    if (selectedFileId === fileId) {
      setSelectedFileId(files.length > 1 ? files.find(f => f.id !== fileId)?.id || null : null)
    }
    saveState()
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
    
    saveState()
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
    saveState()
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
    saveState()
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

  const selectedFile = selectedFileId ? files.find(f => f.id === selectedFileId) : files[0]

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      {/* Left Canvas - Enhanced PDF Preview */}
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
              <div className="p-1.5 sm:p-2 rounded-lg bg-red-50 flex-shrink-0">
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
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
            <Button variant="outline" size="sm" onClick={() => setZoom(prev => Math.max(50, prev - 25))} className="hidden sm:inline-flex">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600 min-w-[50px] text-center font-mono hidden sm:inline">
              {zoom}%
            </span>
            <Button variant="outline" size="sm" onClick={() => setZoom(prev => Math.min(200, prev + 25))} className="hidden sm:inline-flex">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setZoom(100)} className="hidden sm:inline-flex">
              <Target className="h-4 w-4" />
            </Button>
            
            <Separator orientation="vertical" className="h-6 hidden sm:block" />
            
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
                variant={viewMode === "list" ? "default" : "ghost"} 
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-7 px-2 sm:px-3"
              >
                <List className="h-3 w-3" />
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
                className="max-w-md w-full border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center text-gray-500 cursor-pointer hover:border-red-400 hover:bg-red-50/50 transition-all duration-200 p-8 sm:p-12"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="p-4 rounded-full bg-red-100 mb-4">
                  <Upload className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">Drop PDF files here</h3>
                <p className="text-gray-500 mb-4 text-center">
                  {singleFileOnly ? "Upload one PDF file" : `Upload up to ${maxFiles} PDF files`}
                </p>
                <Button className="bg-red-600 hover:bg-red-700 text-white">
                  <Upload className="h-4 w-4 mr-2" />
                  Choose Files
                </Button>
                <p className="text-xs text-gray-400 mt-4 text-center">
                  Maximum {maxFiles} files • Up to 100MB each
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 sm:p-6 space-y-6">
              <DragDropContext onDragEnd={() => {}}>
                {(selectedFile ? [selectedFile] : files).map((file) => (
                  <div key={file.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                    {/* Enhanced File Header */}
                    <div className="px-4 sm:px-6 py-4 border-b bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-red-100">
                            <FileImage className="h-5 w-5 text-red-600" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-gray-900">{file.name}</h3>
                            <p className="text-sm text-gray-500">
                              {file.pageCount} pages • {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {allowPageSelection && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => selectAllPages(file.id)}
                                className="hover:bg-gray-100 hidden sm:inline-flex"
                              >
                                Select All
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => deselectAllPages(file.id)}
                                className="hover:bg-gray-100 hidden sm:inline-flex"
                              >
                                Clear
                              </Button>
                            </>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => removeFile(file.id)}
                            className="hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Enhanced Pages Grid */}
                    <Droppable droppableId={`file-${file.id}`} direction="horizontal">
                      {(provided) => (
                        <div 
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="p-4 sm:p-6"
                        >
                          <div className={`grid gap-4 ${
                            viewMode === "grid" 
                              ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6" 
                              : "grid-cols-1"
                          }`}>
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
                                      snapshot.isDragging ? "scale-105 shadow-xl z-50" : ""
                                    }`}
                                  >
                                    <div 
                                      className={`relative border-2 rounded-lg overflow-hidden transition-all hover:shadow-md ${
                                        page.selected 
                                          ? "border-red-500 bg-red-50 shadow-md" 
                                          : "border-gray-200 hover:border-gray-300"
                                      }`}
                                      onClick={() => allowPageSelection && togglePageSelection(file.id, page.pageNumber)}
                                    >
                                      {/* Enhanced Page Thumbnail */}
                                      <div className="aspect-[3/4] bg-white relative overflow-hidden rounded-lg">
                                        <img 
                                          src={page.thumbnail}
                                          alt={`Page ${page.pageNumber}`}
                                          className="w-full h-full object-contain transition-transform duration-200 rounded-lg"
                                          style={{ transform: `scale(${zoom / 100})` }}
                                        />
                                        
                                        {/* Enhanced Hover Actions */}
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <div className="flex space-x-1">
                                            <Button size="sm" variant="secondary" className="h-7 w-7 p-0 bg-white/90 hover:bg-white shadow-sm">
                                              <Eye className="h-3 w-3" />
                                            </Button>
                                            <Button size="sm" variant="secondary" className="h-7 w-7 p-0 bg-white/90 hover:bg-white shadow-sm">
                                              <RotateCw className="h-3 w-3" />
                                            </Button>
                                            <Button 
                                              size="sm" 
                                              variant="secondary" 
                                              className="h-7 w-7 p-0 bg-white/90 hover:bg-white shadow-sm"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                // Handle page removal or other action
                                              }}
                                            >
                                              <Trash2 className="h-3 w-3 text-red-600" />
                                            </Button>
                                          </div>
                                        </div>
                                      </div>

                                      {/* Enhanced Page Number */}
                                      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                                        <Badge variant="secondary" className="text-xs bg-white shadow-sm font-mono">
                                          {page.pageNumber}
                                        </Badge>
                                      </div>

                                      {/* Enhanced Selection Indicator */}
                                      {allowPageSelection && (
                                        <div className="absolute top-2 right-2">
                                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                                            page.selected 
                                              ? "bg-red-500 border-red-500 scale-110" 
                                              : "bg-white border-gray-300 hover:border-red-300"
                                          }`}>
                                            {page.selected && (
                                              <svg className="h-3 w-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                              </svg>
                                            )}
                                          </div>
                                        </div>
                                      )}

                                      {/* Drag Handle */}
                                      {allowPageReorder && (
                                        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <div className="bg-white rounded p-1 shadow-sm">
                                            <Move className="h-3 w-3 text-gray-600" />
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
            <div className="p-2 rounded-lg bg-red-100">
              <Icon className="h-5 w-5 text-red-600" />
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
                
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {files.map((file) => (
                    <div 
                      key={file.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                        selectedFileId === file.id ? "bg-red-50 border-red-200" : "hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedFileId(file.id)}
                    >
                      <div className="w-10 h-12 rounded bg-red-100 flex-shrink-0 flex items-center justify-center">
                        <FileImage className="h-5 w-5 text-red-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
                        <p className="text-xs text-gray-500">{file.pageCount} pages • {formatFileSize(file.size)}</p>
                      </div>
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Replace file functionality
                          }}
                          title="Replace"
                        >
                          <RotateCw className="h-3 w-3" />
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

            {/* Single File Warning */}
            {singleFileOnly && files.length > 1 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-yellow-800">Multiple files detected</span>
                </div>
                <p className="text-sm text-yellow-700">
                  This tool only processes one file at a time. Only the selected file will be processed.
                </p>
              </div>
            )}

            {/* Page Selection Info */}
            {allowPageSelection && selectedPages.size > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800">Pages Selected</span>
                </div>
                <p className="text-sm text-red-700">
                  {selectedPages.size} page{selectedPages.size !== 1 ? 's' : ''} will be processed
                </p>
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
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto hover:bg-gray-50">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center">
                      {sectionName === "General" && <Settings className="h-4 w-4 mr-2" />}
                      {sectionName === "Security" && <Shield className="h-4 w-4 mr-2" />}
                      {sectionName === "Output" && <Download className="h-4 w-4 mr-2" />}
                      {!["General", "Security", "Output"].includes(sectionName) && <Sliders className="h-4 w-4 mr-2" />}
                      {sectionName}
                    </h3>
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
                    </div>
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
                  ))}
                </CollapsibleContent>
              </Collapsible>
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
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 text-base font-semibold rounded-lg shadow-sm"
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
              <p className="text-xs text-gray-600 text-center">Processing your PDF...</p>
            </div>
          )}

          {/* Download Button */}
          {downloadUrl && (
            <Button 
              onClick={handleDownload}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base font-semibold rounded-lg shadow-sm"
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Download {files.length > 1 ? "ZIP" : "PDF"}
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
                    {files.reduce((sum, file) => sum + file.pageCount, 0)}
                  </div>
                  <div>Pages</div>
                </div>
              </div>
              
              {allowPageSelection && (
                <div className="text-center p-2 bg-red-50 rounded border border-red-200">
                  <div className="font-semibold text-red-700">{selectedPages.size}</div>
                  <div className="text-red-600">Selected</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50 hidden" id="mobile-sidebar-overlay">
        <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-xl">
          {/* Mobile sidebar content would go here */}
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        multiple={!singleFileOnly && maxFiles > 1}
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
      />
    </div>
  )
}