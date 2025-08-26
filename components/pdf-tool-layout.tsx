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
import { AdBanner } from "@/components/ads/ad-banner"
import { 
  Upload, 
  Download, 
  Trash2, 
  RotateCw, 
  Move, 
  ZoomIn, 
  ZoomOut, 
  Eye,
  Plus,
  Minus,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  Menu,
  ArrowLeft
} from "lucide-react"
import { useFileUpload } from "@/hooks/use-file-upload"
import { useDownloadManager } from "@/hooks/use-download-manager"
import { PDFProcessor } from "@/lib/processors/pdf-processor"
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
  const [splitMode, setSplitMode] = useState<"pages" | "range" | "size">("pages")
  const [pageRanges, setPageRanges] = useState([{ from: 1, to: 1 }])
  const [extractMode, setExtractMode] = useState<"all" | "selected">("selected")
  const [zoom, setZoom] = useState(100)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
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

    const newFiles: PDFFile[] = []
    
    for (let i = 0; i < uploadedFiles.length && i < maxFiles; i++) {
      const file = uploadedFiles[i]
      if (file.type !== "application/pdf") continue

      try {
        const pdfInfo = await PDFProcessor.getPDFInfo(file)
        
        const pdfFile: PDFFile = {
          id: `${file.name}-${Date.now()}-${i}`,
          file,
          originalFile: file,
          name: file.name,
          size: file.size,
          pageCount: pdfInfo.pageCount,
          pages: pdfInfo.pages.map(page => ({
            ...page,
            selected: toolType === "split" ? false : true
          }))
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
    
    // Auto-set page ranges for split tool
    if (toolType === "split" && newFiles.length > 0) {
      const firstFile = newFiles[0]
      setPageRanges([{ from: 1, to: firstFile.pageCount }])
    }
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

    // Update file pages
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
        return {
          ...file,
          pages: file.pages.map(page => ({ ...page, selected: true }))
        }
      }
      return file
    }))
  }

  const deselectAllPages = (fileId: string) => {
    setFiles(prev => prev.map(file => {
      if (file.id === fileId) {
        return {
          ...file,
          pages: file.pages.map(page => ({ ...page, selected: false }))
        }
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
      // Prepare options with page ranges for split tool
      const processOptions = {
        ...toolOptions,
        pageRanges: toolType === "split" ? pageRanges : undefined,
        extractMode,
        splitMode
      }

      const result = await processFunction(files, processOptions)
      
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

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      {/* Left Canvas - PDF Preview */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Canvas Header */}
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
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setZoom(prev => Math.max(25, prev - 25))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-gray-600 min-w-[60px] text-center">{zoom}%</span>
            <Button variant="outline" size="sm" onClick={() => setZoom(prev => Math.min(200, prev + 25))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            >
              <Eye className="h-4 w-4" />
            </Button>
            {allowBatchProcessing && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add More
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
        <div className="flex-1 overflow-auto">
          {files.length === 0 ? (
            <div className="h-full flex flex-col">
              {/* Ad Banner */}
              <div className="p-4">
                <AdBanner position="header" showLabel />
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
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col">
              {/* Ad Banner */}
              <div className="p-4 border-b">
                <AdBanner position="inline" showLabel />
              </div>

              <div className="flex-1 p-6">
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
                                  {file.pageCount} pages • {(file.size / 1024 / 1024).toFixed(1)} MB
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
                              <div className="grid gap-4 auto-fit-[minmax(120px,1fr)]">
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
                                          snapshot.isDragging ? "scale-105 shadow-lg" : ""
                                        }`}
                                      >
                                        <div 
                                          className={`relative border-2 rounded-lg overflow-hidden transition-all ${
                                            page.selected 
                                              ? "border-red-500 bg-red-50" 
                                              : "border-gray-200 hover:border-gray-300"
                                          }`}
                                          onClick={() => allowPageSelection && togglePageSelection(file.id, page.pageNumber)}
                                        >
                                          {/* Page Thumbnail */}
                                          <div className="aspect-[3/4] bg-white">
                                            <img 
                                              src={page.thumbnail}
                                              alt={`Page ${page.pageNumber}`}
                                              className="w-full h-full object-contain"
                                            />
                                          </div>

                                          {/* Page Number */}
                                          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2">
                                            <Badge variant="secondary" className="text-xs">
                                              {page.pageNumber}
                                            </Badge>
                                          </div>

                                          {/* Selection Indicator */}
                                          {allowPageSelection && (
                                            <div className="absolute top-2 right-2">
                                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                                                page.selected 
                                                  ? "bg-red-500 border-red-500" 
                                                  : "bg-white border-gray-300"
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

      {/* Right Sidebar */}
      <div className={`${sidebarOpen ? "w-80" : "w-0"} lg:w-80 bg-white border-l shadow-lg flex flex-col fixed lg:relative right-0 top-0 h-screen transition-all duration-300 z-50 lg:z-auto`}>
        {/* Sidebar Header */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon className="h-5 w-5 text-red-600" />
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
          {/* Split Mode Selection (for split tool) */}
          {toolType === "split" && (
            <div className="space-y-4">
              <div>
                <Label className="text-base font-medium mb-3 block">Split Mode</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={splitMode === "range" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSplitMode("range")}
                    className="flex flex-col items-center p-3 h-auto"
                  >
                    <div className="w-6 h-6 mb-1 flex items-center justify-center">
                      📄
                    </div>
                    <span className="text-xs">Range</span>
                  </Button>
                  <Button
                    variant={splitMode === "pages" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSplitMode("pages")}
                    className="flex flex-col items-center p-3 h-auto bg-red-500 text-white hover:bg-red-600"
                  >
                    <div className="w-6 h-6 mb-1 flex items-center justify-center">
                      📑
                    </div>
                    <span className="text-xs">Pages</span>
                  </Button>
                  <Button
                    variant={splitMode === "size" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSplitMode("size")}
                    className="flex flex-col items-center p-3 h-auto"
                  >
                    <div className="w-6 h-6 mb-1 flex items-center justify-center">
                      📊
                    </div>
                    <span className="text-xs">Size</span>
                  </Button>
                </div>
              </div>

              {/* Extract Mode */}
              <div>
                <Label className="text-base font-medium mb-3 block">Extract mode:</Label>
                <div className="flex gap-2">
                  <Button
                    variant={extractMode === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setExtractMode("all")}
                    className={extractMode === "all" ? "bg-red-500 text-white hover:bg-red-600" : ""}
                  >
                    Extract all pages
                  </Button>
                  <Button
                    variant={extractMode === "selected" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setExtractMode("selected")}
                  >
                    Select pages
                  </Button>
                </div>
              </div>

              {/* Selection Info */}
              {extractMode === "selected" && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    Selected pages will be converted into separate PDF files. 
                    {selectedPages.size} PDF will be created.
                  </p>
                </div>
              )}
            </div>
          )}

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

          {/* Ad Space */}
          <div className="py-4">
            <AdBanner position="sidebar" showLabel />
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-6 border-t bg-gray-50 space-y-3">
          {/* Process Button */}
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
                {title} <span className="ml-2">→</span>
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
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base font-semibold"
              size="lg"
            >
              <Download className="h-4 w-4 mr-2" />
              Download {files.length > 1 ? "ZIP" : "PDF"}
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
                <span>Total pages:</span>
                <span>{files.reduce((sum, file) => sum + file.pageCount, 0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total size:</span>
                <span>{(files.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024).toFixed(1)} MB</span>
              </div>
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
        accept=".pdf"
        multiple={maxFiles > 1}
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
      />
    </div>
  )
}