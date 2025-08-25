"use client"

import { useState } from "react"
import { FileUploadZone, type UploadFile } from "@/components/file-upload-zone"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, Square, Download, FileCheck, AlertTriangle, Clock } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface BatchProcessorProps {
  title: string
  description: string
  accept?: string[]
  maxFiles?: number
  maxSize?: number
  processFunction: (
    files: File[],
    options: any,
  ) => Promise<{
    success: boolean
    processedFiles?: Blob[]
    errors?: string[]
  }>
  options?: Record<string, any>
  onComplete?: (results: any) => void
}

export function BatchFileProcessor({
  title,
  description,
  accept,
  maxFiles,
  maxSize,
  processFunction,
  options = {},
  onComplete,
}: BatchProcessorProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [processedCount, setProcessedCount] = useState(0)
  const [currentFile, setCurrentFile] = useState<string | null>(null)
  const [results, setResults] = useState<Blob[]>([])
  const [errors, setErrors] = useState<string[]>([])

  const handleFilesChange = (newFiles: UploadFile[]) => {
    setFiles(newFiles)
    // Reset processing state when files change
    setProcessedCount(0)
    setCurrentFile(null)
    setResults([])
    setErrors([])
  }

  const startProcessing = async () => {
    const validFiles = files.filter((f) => f.status !== "error")
    if (validFiles.length === 0) {
      toast({
        title: "No valid files",
        description: "Please upload valid files to process",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)
    setIsPaused(false)
    setProcessedCount(0)
    setResults([])
    setErrors([])

    try {
      for (let i = 0; i < validFiles.length; i++) {
        if (isPaused) break

        const file = validFiles[i]
        setCurrentFile(file.name)

        // Update file status to processing
        setFiles((prev) =>
          prev.map((f) => (f.id === file.id ? { ...f, status: "uploading" as const, progress: 0 } : f)),
        )

        try {
          // Simulate processing progress
          for (let progress = 0; progress <= 100; progress += 10) {
            if (isPaused) break

            await new Promise((resolve) => setTimeout(resolve, 100))
            setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, progress } : f)))
          }

          // Process single file
          const result = await processFunction([file.file], options)

          if (result.success && result.processedFiles) {
            setResults((prev) => [...prev, ...result.processedFiles!])
            setFiles((prev) =>
              prev.map((f) => (f.id === file.id ? { ...f, status: "success" as const, progress: 100 } : f)),
            )
          } else {
            const error = result.errors?.[0] || "Processing failed"
            setErrors((prev) => [...prev, `${file.name}: ${error}`])
            setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, status: "error" as const, error } : f)))
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : "Unknown error"
          setErrors((prev) => [...prev, `${file.name}: ${errorMsg}`])
          setFiles((prev) =>
            prev.map((f) => (f.id === file.id ? { ...f, status: "error" as const, error: errorMsg } : f)),
          )
        }

        setProcessedCount(i + 1)
      }

      if (!isPaused) {
        toast({
          title: "Processing complete",
          description: `Processed ${processedCount} files`,
        })

        onComplete?.({
          processed: processedCount,
          results,
          errors,
        })
      }
    } catch (error) {
      toast({
        title: "Processing failed",
        description: "An error occurred during batch processing",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
      setCurrentFile(null)
    }
  }

  const pauseProcessing = () => {
    setIsPaused(true)
  }

  const stopProcessing = () => {
    setIsProcessing(false)
    setIsPaused(false)
    setCurrentFile(null)
  }

  const downloadResults = () => {
    results.forEach((blob, index) => {
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = `processed-file-${index + 1}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    })
  }

  const validFiles = files.filter((f) => f.status !== "error")
  const successFiles = files.filter((f) => f.status === "success")
  const errorFiles = files.filter((f) => f.status === "error")
  const processingProgress = validFiles.length > 0 ? (processedCount / validFiles.length) * 100 : 0

  return (
    <div className="space-y-6">
      {/* Upload Zone */}
      <FileUploadZone
        title={title}
        description={description}
        accept={accept}
        maxFiles={maxFiles}
        maxSize={maxSize}
        onFilesChange={handleFilesChange}
        showPreview={true}
        allowUrl={true}
        allowPaste={true}
      />

      {/* Processing Controls */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Batch Processing</span>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{validFiles.length} files</Badge>
                {successFiles.length > 0 && (
                  <Badge variant="default" className="bg-green-500">
                    {successFiles.length} processed
                  </Badge>
                )}
                {errorFiles.length > 0 && <Badge variant="destructive">{errorFiles.length} failed</Badge>}
              </div>
            </CardTitle>
            <CardDescription>Process all uploaded files with the selected options</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress */}
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Processing: {currentFile}</span>
                  <span>
                    {processedCount} / {validFiles.length}
                  </span>
                </div>
                <Progress value={processingProgress} />
              </div>
            )}

            {/* Controls */}
            <div className="flex items-center gap-3">
              {!isProcessing ? (
                <Button onClick={startProcessing} disabled={validFiles.length === 0} size="lg">
                  <Play className="h-4 w-4 mr-2" />
                  Start Processing
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={isPaused ? startProcessing : pauseProcessing}>
                    {isPaused ? (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Resume
                      </>
                    ) : (
                      <>
                        <Pause className="h-4 w-4 mr-2" />
                        Pause
                      </>
                    )}
                  </Button>
                  <Button variant="destructive" onClick={stopProcessing}>
                    <Square className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                </div>
              )}

              {results.length > 0 && (
                <Button variant="outline" onClick={downloadResults}>
                  <Download className="h-4 w-4 mr-2" />
                  Download All ({results.length})
                </Button>
              )}
            </div>

            {/* Status Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div className="flex items-center gap-2">
                <FileCheck className="h-5 w-5 text-green-500" />
                <div>
                  <p className="font-medium">{successFiles.length}</p>
                  <p className="text-sm text-muted-foreground">Processed</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <div>
                  <p className="font-medium">{validFiles.length - processedCount}</p>
                  <p className="text-sm text-muted-foreground">Remaining</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="font-medium">{errorFiles.length}</p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
              </div>
            </div>

            {/* Error List */}
            {errors.length > 0 && (
              <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <h4 className="font-medium text-destructive mb-2">Processing Errors:</h4>
                <ul className="text-sm text-destructive space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
