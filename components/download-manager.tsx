"use client"

import { useState, useRef, useCallback } from "react"
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
  Download,
  FileArchive,
  Mail,
  Cloud,
  Settings,
  Trash2,
  Copy,
  CheckCircle,
  RefreshCw,
  FileImage,
  FileText,
  File,
} from "lucide-react"
import { toast } from "@/hooks/use-toast"

export interface DownloadFile {
  id: string
  name: string
  blob: Blob
  type: string
  size: number
  format: string
  quality?: number
  created: Date
}

interface ExportOptions {
  format: string
  quality: number
  compression: boolean
  includeMetadata: boolean
  customName: string
  batchNaming: "original" | "sequential" | "timestamp" | "custom"
  zipArchive: boolean
  emailDelivery: boolean
  cloudUpload: boolean
}

interface DownloadManagerProps {
  files: DownloadFile[]
  supportedFormats?: string[]
  defaultFormat?: string
  onDownload?: (files: DownloadFile[], options: ExportOptions) => Promise<void>
  onClear?: () => void
  showHistory?: boolean
  allowBatchDownload?: boolean
  allowEmailDelivery?: boolean
  allowCloudUpload?: boolean
}

export function DownloadManager({
  files,
  supportedFormats = ["png", "jpg", "svg", "pdf", "txt", "json"],
  defaultFormat = "png",
  onDownload,
  onClear,
  showHistory = true,
  allowBatchDownload = true,
  allowEmailDelivery = false,
  allowCloudUpload = false,
}: DownloadManagerProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: defaultFormat,
    quality: 90,
    compression: true,
    includeMetadata: false,
    customName: "",
    batchNaming: "original",
    zipArchive: false,
    emailDelivery: false,
    cloudUpload: false,
  })
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [downloadHistory, setDownloadHistory] = useState<DownloadFile[]>([])
  const [emailAddress, setEmailAddress] = useState("")
  const downloadLinkRef = useRef<HTMLAnchorElement>(null)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return FileImage
    if (type.startsWith("text/") || type.includes("json") || type.includes("xml")) return FileText
    return File
  }

  const generateFileName = (file: DownloadFile, index: number): string => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const baseName = file.name.split(".")[0]

    switch (exportOptions.batchNaming) {
      case "sequential":
        return `file-${index + 1}.${exportOptions.format}`
      case "timestamp":
        return `${baseName}-${timestamp}.${exportOptions.format}`
      case "custom":
        return exportOptions.customName
          ? `${exportOptions.customName}-${index + 1}.${exportOptions.format}`
          : `${baseName}.${exportOptions.format}`
      default:
        return `${baseName}.${exportOptions.format}`
    }
  }

  const createZipArchive = async (files: DownloadFile[]): Promise<Blob> => {
    const zipData = new Uint8Array(files.reduce((total, file) => total + file.size, 0))
    let offset = 0

    for (const file of files) {
      const arrayBuffer = await file.blob.arrayBuffer()
      const fileData = new Uint8Array(arrayBuffer)
      zipData.set(fileData, offset)
      offset += fileData.length
    }

    return new Blob([zipData], { type: "application/zip" })
  }

  const downloadSingleFile = useCallback(
    (file: DownloadFile, customName?: string) => {
      const fileName = customName || generateFileName(file, 0)
      const url = URL.createObjectURL(file.blob)

      const link = document.createElement("a")
      link.href = url
      link.download = fileName
      link.style.display = "none"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      // Add to history
      setDownloadHistory((prev) => [{ ...file, name: fileName }, ...prev.slice(0, 9)])

      toast({
        title: "Download started",
        description: `${fileName} is being downloaded`,
      })
    },
    [exportOptions],
  )

  const downloadMultipleFiles = useCallback(async () => {
    const filesToDownload = selectedFiles.length > 0 ? files.filter((f) => selectedFiles.includes(f.id)) : files

    if (filesToDownload.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to download",
        variant: "destructive",
      })
      return
    }

    setIsDownloading(true)
    setDownloadProgress(0)

    try {
      if (exportOptions.zipArchive && filesToDownload.length > 1) {
        setDownloadProgress(50)
        const zipBlob = await createZipArchive(filesToDownload)
        setDownloadProgress(100)

        const zipFile: DownloadFile = {
          id: `zip-${Date.now()}`,
          name: `download-${new Date().toISOString().split("T")[0]}.zip`,
          blob: zipBlob,
          type: "application/zip",
          size: zipBlob.size,
          format: "zip",
          created: new Date(),
        }

        downloadSingleFile(zipFile)
      } else {
        // Download individual files with proper staggering
        for (let i = 0; i < filesToDownload.length; i++) {
          const file = filesToDownload[i]
          const fileName = generateFileName(file, i)

          setDownloadProgress(((i + 1) / filesToDownload.length) * 100)

          await new Promise((resolve) => {
            setTimeout(() => {
              downloadSingleFile(file, fileName)
              resolve(void 0)
            }, i * 300)
          })
        }
      }

      if (exportOptions.emailDelivery && emailAddress) {
        // Simulate email delivery
        await new Promise((resolve) => setTimeout(resolve, 1000))
        toast({
          title: "Email sent",
          description: `Files sent to ${emailAddress}`,
        })
      }

      if (exportOptions.cloudUpload) {
        // Simulate cloud upload
        await new Promise((resolve) => setTimeout(resolve, 1500))
        toast({
          title: "Cloud upload complete",
          description: "Files uploaded to cloud storage",
        })
      }

      if (onDownload) {
        await onDownload(filesToDownload, exportOptions)
      }

      toast({
        title: "Download complete",
        description: `${filesToDownload.length} file(s) processed successfully`,
      })
    } catch (error) {
      console.log("[v0] Download error:", error)
      toast({
        title: "Download failed",
        description: "An error occurred during download",
        variant: "destructive",
      })
    } finally {
      setIsDownloading(false)
      setDownloadProgress(0)
    }
  }, [files, selectedFiles, exportOptions, emailAddress, downloadSingleFile, onDownload])

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles((prev) => (prev.includes(fileId) ? prev.filter((id) => id !== fileId) : [...prev, fileId]))
  }

  const selectAllFiles = () => {
    setSelectedFiles(files.map((f) => f.id))
  }

  const clearSelection = () => {
    setSelectedFiles([])
  }

  const copyDownloadLink = async (file: DownloadFile) => {
    const url = URL.createObjectURL(file.blob)
    try {
      await navigator.clipboard.writeText(url)
      toast({
        title: "Link copied",
        description: "Download link copied to clipboard",
      })
    } catch {
      toast({
        title: "Copy failed",
        description: "Unable to copy link to clipboard",
        variant: "destructive",
      })
    }
  }

  const clearHistory = () => {
    setDownloadHistory([])
  }

  const totalSize = files.reduce((sum, file) => sum + file.size, 0)
  const selectedSize = files.filter((f) => selectedFiles.includes(f.id)).reduce((sum, file) => sum + file.size, 0)

  return (
    <div className="space-y-6">
      {/* Download Queue */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Download className="h-5 w-5" />
                <span>Download Queue ({files.length})</span>
              </CardTitle>
              <CardDescription>
                {formatFileSize(totalSize)} total
                {selectedFiles.length > 0 && ` • ${formatFileSize(selectedSize)} selected`}
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              {files.length > 1 && (
                <>
                  <Button variant="outline" size="sm" onClick={selectAllFiles}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={clearSelection}>
                    Clear
                  </Button>
                </>
              )}
              {onClear && (
                <Button variant="outline" size="sm" onClick={onClear}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear Queue
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No files ready for download</p>
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file, index) => {
                const FileIcon = getFileIcon(file.type)
                const isSelected = selectedFiles.includes(file.id)

                return (
                  <div
                    key={file.id}
                    className={`flex items-center gap-3 p-3 border rounded-lg transition-colors ${
                      isSelected ? "border-accent bg-accent/10" : "border-border"
                    }`}
                  >
                    {allowBatchDownload && (
                      <Checkbox checked={isSelected} onCheckedChange={() => toggleFileSelection(file.id)} />
                    )}

                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                        <FileIcon className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        <Badge variant="outline" className="text-xs">
                          {file.format.toUpperCase()}
                        </Badge>
                        {file.quality && <span>Quality: {file.quality}%</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => copyDownloadLink(file)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="default" size="sm" onClick={() => downloadSingleFile(file)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Options */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Export Options</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="format" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="format">Format</TabsTrigger>
                <TabsTrigger value="naming">Naming</TabsTrigger>
                <TabsTrigger value="delivery">Delivery</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>

              <TabsContent value="format" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="format">Output Format</Label>
                    <select
                      id="format"
                      value={exportOptions.format}
                      onChange={(e) => setExportOptions((prev) => ({ ...prev, format: e.target.value }))}
                      className="w-full p-2 border border-border rounded-md bg-background mt-2"
                    >
                      {supportedFormats.map((format) => (
                        <option key={format} value={format}>
                          {format.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="quality">Quality: {exportOptions.quality}%</Label>
                    <Slider
                      value={[exportOptions.quality]}
                      onValueChange={(value) => setExportOptions((prev) => ({ ...prev, quality: value[0] }))}
                      max={100}
                      min={1}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="compression"
                    checked={exportOptions.compression}
                    onCheckedChange={(checked) =>
                      setExportOptions((prev) => ({ ...prev, compression: checked as boolean }))
                    }
                  />
                  <Label htmlFor="compression">Enable compression</Label>
                </div>
              </TabsContent>

              <TabsContent value="naming" className="space-y-4">
                <div>
                  <Label htmlFor="batch-naming">Batch Naming</Label>
                  <select
                    id="batch-naming"
                    value={exportOptions.batchNaming}
                    onChange={(e) => setExportOptions((prev) => ({ ...prev, batchNaming: e.target.value as any }))}
                    className="w-full p-2 border border-border rounded-md bg-background mt-2"
                  >
                    <option value="original">Keep original names</option>
                    <option value="sequential">Sequential (file-1, file-2, ...)</option>
                    <option value="timestamp">Add timestamp</option>
                    <option value="custom">Custom prefix</option>
                  </select>
                </div>
                {exportOptions.batchNaming === "custom" && (
                  <div>
                    <Label htmlFor="custom-name">Custom Prefix</Label>
                    <Input
                      id="custom-name"
                      value={exportOptions.customName}
                      onChange={(e) => setExportOptions((prev) => ({ ...prev, customName: e.target.value }))}
                      placeholder="my-file"
                      className="mt-2"
                    />
                  </div>
                )}
              </TabsContent>

              <TabsContent value="delivery" className="space-y-4">
                {allowBatchDownload && files.length > 1 && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="zip-archive"
                      checked={exportOptions.zipArchive}
                      onCheckedChange={(checked) =>
                        setExportOptions((prev) => ({ ...prev, zipArchive: checked as boolean }))
                      }
                    />
                    <Label htmlFor="zip-archive">Create ZIP archive</Label>
                  </div>
                )}
                {allowEmailDelivery && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="email-delivery"
                        checked={exportOptions.emailDelivery}
                        onCheckedChange={(checked) =>
                          setExportOptions((prev) => ({ ...prev, emailDelivery: checked as boolean }))
                        }
                      />
                      <Label htmlFor="email-delivery">Email delivery</Label>
                    </div>
                    {exportOptions.emailDelivery && (
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={emailAddress}
                        onChange={(e) => setEmailAddress(e.target.value)}
                      />
                    )}
                  </div>
                )}
                {allowCloudUpload && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="cloud-upload"
                      checked={exportOptions.cloudUpload}
                      onCheckedChange={(checked) =>
                        setExportOptions((prev) => ({ ...prev, cloudUpload: checked as boolean }))
                      }
                    />
                    <Label htmlFor="cloud-upload">Upload to cloud storage</Label>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="advanced" className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="metadata"
                    checked={exportOptions.includeMetadata}
                    onCheckedChange={(checked) =>
                      setExportOptions((prev) => ({ ...prev, includeMetadata: checked as boolean }))
                    }
                  />
                  <Label htmlFor="metadata">Include metadata</Label>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">Export Summary</h4>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Format: {exportOptions.format.toUpperCase()}</p>
                    <p>Quality: {exportOptions.quality}%</p>
                    <p>Files: {selectedFiles.length > 0 ? selectedFiles.length : files.length}</p>
                    <p>Estimated size: {formatFileSize(selectedFiles.length > 0 ? selectedSize : totalSize)}</p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Download Actions */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-6">
            {isDownloading && (
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Preparing download...</span>
                  <span>{downloadProgress.toFixed(0)}%</span>
                </div>
                <Progress value={downloadProgress} />
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button onClick={downloadMultipleFiles} disabled={isDownloading} size="lg" className="flex-1">
                {isDownloading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {exportOptions.zipArchive && files.length > 1 ? (
                      <FileArchive className="h-4 w-4 mr-2" />
                    ) : (
                      <Download className="h-4 w-4 mr-2" />
                    )}
                    Download {selectedFiles.length > 0 ? `${selectedFiles.length} Selected` : "All"}
                  </>
                )}
              </Button>

              {exportOptions.emailDelivery && (
                <Button variant="outline" disabled={isDownloading || !emailAddress}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              )}

              {exportOptions.cloudUpload && (
                <Button variant="outline" disabled={isDownloading}>
                  <Cloud className="h-4 w-4 mr-2" />
                  Upload
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Download History */}
      {showHistory && downloadHistory.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Downloads</CardTitle>
              <Button variant="outline" size="sm" onClick={clearHistory}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear History
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {downloadHistory.slice(0, 5).map((file) => (
                <div key={`${file.id}-${file.created.getTime()}`} className="flex items-center gap-3 p-2 rounded">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {file.created.toLocaleString()} • {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden download link */}
      <a ref={downloadLinkRef} className="hidden" />
    </div>
  )
}
