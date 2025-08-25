"use client"

import { useState, useCallback } from "react"
import type { UploadFile } from "@/components/file-upload-zone"

interface UseFileUploadOptions {
  maxFiles?: number
  maxSize?: number
  accept?: string[]
  onUpload?: (files: File[]) => Promise<void>
  onError?: (error: string) => void
}

export function useFileUpload({
  maxFiles = 10,
  maxSize = 100,
  accept = ["*/*"],
  onUpload,
  onError,
}: UseFileUploadOptions = {}) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const validateFile = useCallback(
    (file: File): { valid: boolean; error?: string } => {
      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        return { valid: false, error: `File size exceeds ${maxSize}MB limit` }
      }

      // Check file type
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

  const addFiles = useCallback(
    async (newFiles: File[]) => {
      if (files.length + newFiles.length > maxFiles) {
        onError?.(`Maximum ${maxFiles} files allowed`)
        return
      }

      const processedFiles: UploadFile[] = []

      for (const file of newFiles) {
        const validation = validateFile(file)

        const uploadFile: UploadFile = {
          id: `${file.name}-${Date.now()}-${Math.random()}`,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          status: validation.valid ? "pending" : "error",
          progress: 0,
          error: validation.error,
        }

        // Generate preview for images
        if (file.type.startsWith("image/")) {
          try {
            const preview = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader()
              reader.onload = (e) => resolve(e.target?.result as string)
              reader.onerror = reject
              reader.readAsDataURL(file)
            })
            uploadFile.preview = preview
          } catch {
            // Preview generation failed, continue without preview
          }
        }

        processedFiles.push(uploadFile)

        if (!validation.valid) {
          onError?.(validation.error || "Invalid file")
        }
      }

      setFiles((prev) => [...prev, ...processedFiles])
    },
    [files.length, maxFiles, validateFile, onError],
  )

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== fileId))
  }, [])

  const clearFiles = useCallback(() => {
    setFiles([])
  }, [])

  const uploadFiles = useCallback(async () => {
    if (!onUpload || isUploading) return

    const pendingFiles = files.filter((f) => f.status === "pending")
    if (pendingFiles.length === 0) return

    setIsUploading(true)

    try {
      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) => (pendingFiles.some((pf) => pf.id === f.id) ? { ...f, status: "uploading" as const } : f)),
      )

      // Simulate progress updates
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise((resolve) => setTimeout(resolve, 200))
        setFiles((prev) => prev.map((f) => (pendingFiles.some((pf) => pf.id === f.id) ? { ...f, progress } : f)))
      }

      await onUpload(pendingFiles.map((f) => f.file))

      // Mark as successful
      setFiles((prev) =>
        prev.map((f) =>
          pendingFiles.some((pf) => pf.id === f.id) ? { ...f, status: "success" as const, progress: 100 } : f,
        ),
      )
    } catch (error) {
      // Mark as failed
      setFiles((prev) =>
        prev.map((f) =>
          pendingFiles.some((pf) => pf.id === f.id) ? { ...f, status: "error" as const, error: "Upload failed" } : f,
        ),
      )

      onError?.("Upload failed")
    } finally {
      setIsUploading(false)
    }
  }, [files, onUpload, isUploading, onError])

  const retryFile = useCallback((fileId: string) => {
    setFiles((prev) =>
      prev.map((f) => (f.id === fileId ? { ...f, status: "pending" as const, error: undefined, progress: 0 } : f)),
    )
  }, [])

  const getStats = useCallback(() => {
    const pending = files.filter((f) => f.status === "pending").length
    const uploading = files.filter((f) => f.status === "uploading").length
    const success = files.filter((f) => f.status === "success").length
    const error = files.filter((f) => f.status === "error").length
    const totalSize = files.reduce((sum, f) => sum + f.size, 0)

    return { pending, uploading, success, error, total: files.length, totalSize }
  }, [files])

  return {
    files,
    isUploading,
    addFiles,
    removeFile,
    clearFiles,
    uploadFiles,
    retryFile,
    getStats,
    setFiles,
  }
}
