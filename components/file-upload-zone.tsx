"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, File, ImageIcon, FileText, X, CheckCircle, AlertCircle, RefreshCw, Cloud, Link } from "lucide-react"
import { toast } from "@/hooks/use-toast"

export interface UploadFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  status: "pending" | "uploading" | "success" | "error"
  progress: number
  preview?: string
  error?: string
}

interface FileUploadZoneProps {
  accept?: string[]
  maxFiles?: number
  maxSize?: number // in MB
  multiple?: boolean
  onFilesChange: (files: UploadFile[]) => void
  onUpload?: (files: UploadFile[]) => Promise<void>
  disabled?: boolean
  className?: string
  title?: string
  description?: string
  showPreview?: boolean
  allowUrl?: boolean
  allowPaste?: boolean
}

export function FileUploadZone({
  accept = ["*/*"],
  maxFiles = 10,
  maxSize = 100,
  multiple = true,
  onFilesChange,
  onUpload,
  disabled = false,
  className = "",
  title = "Upload Files",
  description = "Drag and drop files here or click to browse",
  showPreview = true,
  allowUrl = false,
  allowPaste = false,
}: FileUploadZoneProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [urlInput, setUrlInput] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        return { valid: false, error: `File size exceeds ${maxSize}MB limit` }
      }

      // Check file type if specific types are required
      if (accept.length > 0 && !accept.includes("*/*")) {
        const fileType = file.type
        const fileExtension = `.${file.name.split(".").pop()?.toLowerCase()}`

        const isValidType = accept.some((acceptType) => {
          if (acceptType.startsWith(".")) {
            return acceptType === fileExtension
          }
          if (acceptType.includes("/*")) {
            return fileType.startsWith(acceptType.replace("/*", ""))
          }
          return fileType === acceptType
        })

        if (!isValidType) {
          return { valid: false, error: `File type not supported. Accepted: ${accept.join(", ")}` }
        }
      }

      return { valid: true }
    },
    [accept, maxSize],
  )

  const generatePreview = useCallback((file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.onerror = () => resolve(undefined)
        reader.readAsDataURL(file)
      } else {
        resolve(undefined)
      }
    })
  }, [])

  const processFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const newFiles: UploadFile[] = []
      const filesToProcess = Array.from(fileList)

      // Check total file count
      if (files.length + filesToProcess.length > maxFiles) {
        toast({
          title: "Too many files",
          description: `Maximum ${maxFiles} files allowed`,
          variant: "destructive",
        })
        return
      }

      for (const file of filesToProcess) {
        const validation = validateFile(file)
        const preview = showPreview ? await generatePreview(file) : undefined

        const uploadFile: UploadFile = {
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          status: validation.valid ? "pending" : "error",
          progress: 0,
          preview,
          error: validation.error,
        }

        newFiles.push(uploadFile)

        if (!validation.valid) {
          toast({
            title: "Invalid file",
            description: `${file.name}: ${validation.error}`,
            variant: "destructive",
          })
        }
      }

      const updatedFiles = [...files, ...newFiles]
      setFiles(updatedFiles)
      onFilesChange(updatedFiles)
    },
    [files, maxFiles, validateFile, generatePreview, showPreview, onFilesChange],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)

      if (disabled) return

      const droppedFiles = e.dataTransfer.files
      if (droppedFiles.length > 0) {
        processFiles(droppedFiles)
      }
    },
    [disabled, processFiles],
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (!disabled) {
        setIsDragging(true)
      }
    },
    [disabled],
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = e.target.files
      if (selectedFiles && selectedFiles.length > 0) {
        processFiles(selectedFiles)
      }
      // Reset input value to allow selecting the same file again
      e.target.value = ""
    },
    [processFiles],
  )

  const handleUrlUpload = useCallback(async () => {
    if (!urlInput.trim()) return

    try {
      const response = await fetch(urlInput)
      if (!response.ok) throw new Error("Failed to fetch file")

      const blob = await response.blob()
      const filename = urlInput.split("/").pop() || "downloaded-file"
      const file = new File([blob], filename, { type: blob.type })

      await processFiles([file])
      setUrlInput("")

      toast({
        title: "Success",
        description: "File loaded from URL",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load file from URL",
        variant: "destructive",
      })
    }
  }, [urlInput, processFiles])

  const handlePaste = useCallback(
    async (e: React.ClipboardEvent) => {
      if (!allowPaste) return

      const items = e.clipboardData.items
      const files: File[] = []

      for (const item of Array.from(items)) {
        if (item.kind === "file") {
          const file = item.getAsFile()
          if (file) files.push(file)
        }
      }

      if (files.length > 0) {
        await processFiles(files)
        toast({
          title: "Files pasted",
          description: `${files.length} file(s) added from clipboard`,
        })
      }
    },
    [allowPaste, processFiles],
  )

  const removeFile = useCallback(
    (fileId: string) => {
      const updatedFiles = files.filter((f) => f.id !== fileId)
      setFiles(updatedFiles)
      onFilesChange(updatedFiles)
    },
    [files, onFilesChange],
  )

  const retryFile = useCallback(
    async (fileId: string) => {
      const updatedFiles = files.map((f) =>
        f.id === fileId ? { ...f, status: "pending" as const, error: undefined, progress: 0 } : f,
      )
      setFiles(updatedFiles)
      onFilesChange(updatedFiles)
    },
    [files, onFilesChange],
  )

  const uploadFiles = useCallback(async () => {
    if (!onUpload || isUploading) return

    const pendingFiles = files.filter((f) => f.status === "pending")
    if (pendingFiles.length === 0) return

    setIsUploading(true)

    try {
      // Simulate upload progress
      for (const file of pendingFiles) {
        const updatedFiles = files.map((f) => (f.id === file.id ? { ...f, status: "uploading" as const } : f))
        setFiles(updatedFiles)

        // Simulate progress
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise((resolve) => setTimeout(resolve, 100))
          const progressFiles = files.map((f) => (f.id === file.id ? { ...f, progress } : f))
          setFiles(progressFiles)
        }

        // Mark as complete
        const completeFiles = files.map((f) =>
          f.id === file.id ? { ...f, status: "success" as const, progress: 100 } : f,
        )
        setFiles(completeFiles)
      }

      await onUpload(pendingFiles)

      toast({
        title: "Upload complete",
        description: `${pendingFiles.length} file(s) uploaded successfully`,
      })
    } catch (error) {
      // Mark failed files
      const errorFiles = files.map((f) =>
        pendingFiles.some((pf) => pf.id === f.id) ? { ...f, status: "error" as const, error: "Upload failed" } : f,
      )
      setFiles(errorFiles)

      toast({
        title: "Upload failed",
        description: "Some files failed to upload",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
    }
  }, [files, onUpload, isUploading])

  const clearAll = useCallback(() => {
    setFiles([])
    onFilesChange([])
  }, [onFilesChange])

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return ImageIcon
    if (type.startsWith("text/") || type.includes("json") || type.includes("xml")) return FileText
    return File
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  const pendingCount = files.filter((f) => f.status === "pending").length
  const successCount = files.filter((f) => f.status === "success").length
  const errorCount = files.filter((f) => f.status === "error").length

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Zone */}
      <Card>
        <CardContent className="p-6">
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer
              ${
                isDragging
                  ? "border-accent bg-accent/10"
                  : disabled
                    ? "border-muted bg-muted/50 cursor-not-allowed"
                    : "border-border hover:border-accent/50 hover:bg-accent/5"
              }
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onPaste={allowPaste ? handlePaste : undefined}
            onClick={() => !disabled && fileInputRef.current?.click()}
            tabIndex={0}
          >
            <Upload className={`h-12 w-12 mx-auto mb-4 ${disabled ? "text-muted-foreground" : "text-accent"}`} />
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className="text-muted-foreground mb-4">{description}</p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                disabled={disabled}
                onClick={(e) => {
                  e.stopPropagation()
                  fileInputRef.current?.click()
                }}
              >
                <Upload className="h-4 w-4 mr-2" />
                Choose Files
              </Button>

              {allowUrl && (
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    placeholder="Enter file URL..."
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="px-3 py-2 border border-border rounded-md bg-background text-sm"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleUrlUpload()
                    }}
                    disabled={!urlInput.trim()}
                  >
                    <Link className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              Maximum {maxFiles} files • {accept.join(", ")} • Up to {maxSize}MB per file
              {allowPaste && " • Paste files with Ctrl+V"}
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept={accept.join(",")}
            multiple={multiple}
            onChange={handleFileInput}
            className="hidden"
            disabled={disabled}
          />
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold">Files ({files.length})</h3>
                <p className="text-sm text-muted-foreground">
                  {successCount} uploaded • {pendingCount} pending • {errorCount} failed
                </p>
              </div>
              <div className="flex gap-2">
                {onUpload && pendingCount > 0 && (
                  <Button onClick={uploadFiles} disabled={isUploading} size="sm">
                    {isUploading ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Cloud className="h-4 w-4 mr-2" />
                        Upload All
                      </>
                    )}
                  </Button>
                )}
                <Button variant="outline" size="sm" onClick={clearAll}>
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {files.map((file) => {
                const FileIcon = getFileIcon(file.type)

                return (
                  <div key={file.id} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                    {/* File Preview/Icon */}
                    <div className="flex-shrink-0">
                      {file.preview ? (
                        <img
                          src={file.preview || "/placeholder.svg"}
                          alt={file.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                          <FileIcon className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.size)} • {file.type || "Unknown type"}
                      </p>

                      {/* Progress Bar */}
                      {file.status === "uploading" && <Progress value={file.progress} className="mt-2 h-2" />}

                      {/* Error Message */}
                      {file.error && <p className="text-sm text-destructive mt-1">{file.error}</p>}
                    </div>

                    {/* Status & Actions */}
                    <div className="flex items-center gap-2">
                      {file.status === "success" && <CheckCircle className="h-5 w-5 text-green-500" />}
                      {file.status === "error" && (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-destructive" />
                          <Button variant="outline" size="sm" onClick={() => retryFile(file.id)}>
                            Retry
                          </Button>
                        </div>
                      )}
                      {file.status === "uploading" && <RefreshCw className="h-5 w-5 text-accent animate-spin" />}

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
