"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Crop, RotateCw, FlipHorizontal, FlipVertical, Maximize2, Square, Circle } from "lucide-react"

interface CropArea {
  x: number
  y: number
  width: number
  height: number
}

interface AdvancedCropToolProps {
  imageFile: {
    id: string
    preview: string
    dimensions: { width: number; height: number }
    name: string
  }
  onCropChange: (cropArea: CropArea) => void
  onOptionsChange: (options: any) => void
  className?: string
}

export function AdvancedCropTool({ imageFile, onCropChange, onOptionsChange, className }: AdvancedCropToolProps) {
  const [cropArea, setCropArea] = useState<CropArea>({ x: 10, y: 10, width: 80, height: 60 })
  const [aspectRatio, setAspectRatio] = useState<string>("free")
  const [isDragging, setIsDragging] = useState(false)
  const [dragType, setDragType] = useState<"move" | "resize" | null>(null)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [presetSizes, setPresetSizes] = useState<string>("custom")
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  const aspectRatios = [
    { value: "free", label: "Free" },
    { value: "1:1", label: "Square (1:1)" },
    { value: "4:3", label: "Standard (4:3)" },
    { value: "16:9", label: "Widescreen (16:9)" },
    { value: "3:2", label: "Photo (3:2)" },
    { value: "5:4", label: "Large Format (5:4)" },
    { value: "2:3", label: "Portrait (2:3)" },
    { value: "9:16", label: "Mobile (9:16)" }
  ]

  const presetSizeOptions = [
    { value: "custom", label: "Custom" },
    { value: "instagram-square", label: "Instagram Square (1080×1080)" },
    { value: "instagram-story", label: "Instagram Story (1080×1920)" },
    { value: "facebook-cover", label: "Facebook Cover (1200×630)" },
    { value: "twitter-header", label: "Twitter Header (1500×500)" },
    { value: "youtube-thumbnail", label: "YouTube Thumbnail (1280×720)" },
    { value: "linkedin-banner", label: "LinkedIn Banner (1584×396)" }
  ]

  useEffect(() => {
    onCropChange(cropArea)
  }, [cropArea, onCropChange])

  const handleMouseDown = (e: React.MouseEvent, type: "move" | "resize") => {
    e.preventDefault()
    const container = containerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    setDragStart({ x, y })
    setIsDragging(true)
    setDragType(type)
  }

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragStart || !containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100

    const deltaX = x - dragStart.x
    const deltaY = y - dragStart.y

    setCropArea(prev => {
      if (dragType === "move") {
        return {
          ...prev,
          x: Math.max(0, Math.min(100 - prev.width, prev.x + deltaX)),
          y: Math.max(0, Math.min(100 - prev.height, prev.y + deltaY))
        }
      } else if (dragType === "resize") {
        let newWidth = Math.max(5, prev.width + deltaX)
        let newHeight = Math.max(5, prev.height + deltaY)

        // Apply aspect ratio constraint
        if (aspectRatio !== "free") {
          const [ratioW, ratioH] = aspectRatio.split(":").map(Number)
          const targetRatio = ratioW / ratioH
          const currentRatio = newWidth / newHeight

          if (currentRatio > targetRatio) {
            newWidth = newHeight * targetRatio
          } else {
            newHeight = newWidth / targetRatio
          }
        }

        // Ensure crop area stays within bounds
        newWidth = Math.min(newWidth, 100 - prev.x)
        newHeight = Math.min(newHeight, 100 - prev.y)

        return {
          ...prev,
          width: newWidth,
          height: newHeight
        }
      }
      return prev
    })

    setDragStart({ x, y })
  }, [isDragging, dragStart, dragType, aspectRatio])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    setDragType(null)
    setDragStart(null)
  }, [])

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      return () => {
        document.removeEventListener("mousemove", handleMouseMove)
        document.removeEventListener("mouseup", handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  const applyAspectRatio = (ratio: string) => {
    setAspectRatio(ratio)
    
    if (ratio === "free") return

    const [ratioW, ratioH] = ratio.split(":").map(Number)
    const targetRatio = ratioW / ratioH
    
    setCropArea(prev => {
      const currentRatio = prev.width / prev.height
      let newWidth = prev.width
      let newHeight = prev.height

      if (currentRatio > targetRatio) {
        newWidth = prev.height * targetRatio
      } else {
        newHeight = prev.width / targetRatio
      }

      // Ensure it fits within bounds
      newWidth = Math.min(newWidth, 100 - prev.x)
      newHeight = Math.min(newHeight, 100 - prev.y)

      return {
        ...prev,
        width: newWidth,
        height: newHeight
      }
    })
  }

  const applyPresetSize = (preset: string) => {
    setPresetSizes(preset)
    
    const presets: Record<string, { width: number; height: number }> = {
      "instagram-square": { width: 1080, height: 1080 },
      "instagram-story": { width: 1080, height: 1920 },
      "facebook-cover": { width: 1200, height: 630 },
      "twitter-header": { width: 1500, height: 500 },
      "youtube-thumbnail": { width: 1280, height: 720 },
      "linkedin-banner": { width: 1584, height: 396 }
    }

    const presetSize = presets[preset]
    if (presetSize) {
      const { width: imgWidth, height: imgHeight } = imageFile.dimensions
      const widthPercent = Math.min(80, (presetSize.width / imgWidth) * 100)
      const heightPercent = Math.min(80, (presetSize.height / imgHeight) * 100)
      
      setCropArea({
        x: 10,
        y: 10,
        width: widthPercent,
        height: heightPercent
      })

      // Update aspect ratio
      const ratio = presetSize.width / presetSize.height
      const ratioString = ratio > 1 ? `${Math.round(ratio * 10)}:10` : `10:${Math.round(10 / ratio)}`
      setAspectRatio(ratioString)
    }
  }

  const resetCrop = () => {
    setCropArea({ x: 10, y: 10, width: 80, height: 60 })
    setAspectRatio("free")
    setPresetSizes("custom")
  }

  const centerCrop = () => {
    setCropArea(prev => ({
      ...prev,
      x: (100 - prev.width) / 2,
      y: (100 - prev.height) / 2
    }))
  }

  return (
    <div className={className}>
      {/* Crop Preview */}
      <div className="space-y-4">
        <div className="relative" ref={containerRef}>
          <div className="relative w-full aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
            <img
              ref={imageRef}
              src={imageFile.preview}
              alt={imageFile.name}
              className="w-full h-full object-contain"
              draggable={false}
            />
            
            {/* Crop Overlay */}
            <div
              className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 cursor-move"
              style={{
                left: `${cropArea.x}%`,
                top: `${cropArea.y}%`,
                width: `${cropArea.width}%`,
                height: `${cropArea.height}%`
              }}
              onMouseDown={(e) => handleMouseDown(e, "move")}
            >
              {/* Crop Info */}
              <div className="absolute -top-8 left-0 bg-blue-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                {Math.round((cropArea.width * imageFile.dimensions.width) / 100)} × {Math.round((cropArea.height * imageFile.dimensions.height) / 100)}
              </div>
              
              {/* Resize Handle */}
              <div
                className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize"
                onMouseDown={(e) => {
                  e.stopPropagation()
                  handleMouseDown(e, "resize")
                }}
              />
              
              {/* Grid Lines */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-50">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="border border-white border-opacity-50" />
                ))}
              </div>
            </div>

            {/* Darkened Areas */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Top */}
              <div 
                className="absolute top-0 left-0 right-0 bg-black bg-opacity-40"
                style={{ height: `${cropArea.y}%` }}
              />
              {/* Bottom */}
              <div 
                className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-40"
                style={{ height: `${100 - cropArea.y - cropArea.height}%` }}
              />
              {/* Left */}
              <div 
                className="absolute left-0 bg-black bg-opacity-40"
                style={{ 
                  top: `${cropArea.y}%`,
                  width: `${cropArea.x}%`,
                  height: `${cropArea.height}%`
                }}
              />
              {/* Right */}
              <div 
                className="absolute right-0 bg-black bg-opacity-40"
                style={{ 
                  top: `${cropArea.y}%`,
                  width: `${100 - cropArea.x - cropArea.width}%`,
                  height: `${cropArea.height}%`
                }}
              />
            </div>
          </div>
        </div>

        {/* Crop Controls */}
        <div className="space-y-4">
          {/* Aspect Ratio */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Aspect Ratio</Label>
            <Select value={aspectRatio} onValueChange={applyAspectRatio}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {aspectRatios.map((ratio) => (
                  <SelectItem key={ratio.value} value={ratio.value}>
                    {ratio.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preset Sizes */}
          <div>
            <Label className="text-sm font-medium mb-2 block">Preset Sizes</Label>
            <Select value={presetSizes} onValueChange={applyPresetSize}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {presetSizeOptions.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Manual Position & Size */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-gray-500">Width (px)</Label>
              <Input
                type="number"
                value={Math.round((cropArea.width * imageFile.dimensions.width) / 100)}
                onChange={(e) => {
                  const width = parseInt(e.target.value) || 0
                  const widthPercent = (width / imageFile.dimensions.width) * 100
                  setCropArea(prev => ({ ...prev, width: Math.min(100 - prev.x, widthPercent) }))
                }}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Height (px)</Label>
              <Input
                type="number"
                value={Math.round((cropArea.height * imageFile.dimensions.height) / 100)}
                onChange={(e) => {
                  const height = parseInt(e.target.value) || 0
                  const heightPercent = (height / imageFile.dimensions.height) * 100
                  setCropArea(prev => ({ ...prev, height: Math.min(100 - prev.y, heightPercent) }))
                }}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Position X (px)</Label>
              <Input
                type="number"
                value={Math.round((cropArea.x * imageFile.dimensions.width) / 100)}
                onChange={(e) => {
                  const x = parseInt(e.target.value) || 0
                  const xPercent = (x / imageFile.dimensions.width) * 100
                  setCropArea(prev => ({ ...prev, x: Math.min(100 - prev.width, xPercent) }))
                }}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Position Y (px)</Label>
              <Input
                type="number"
                value={Math.round((cropArea.y * imageFile.dimensions.height) / 100)}
                onChange={(e) => {
                  const y = parseInt(e.target.value) || 0
                  const yPercent = (y / imageFile.dimensions.height) * 100
                  setCropArea(prev => ({ ...prev, y: Math.min(100 - prev.height, yPercent) }))
                }}
                className="text-sm"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={centerCrop} className="flex-1">
              <Maximize2 className="h-3 w-3 mr-1" />
              Center
            </Button>
            <Button variant="outline" size="sm" onClick={resetCrop} className="flex-1">
              <RotateCw className="h-3 w-3 mr-1" />
              Reset
            </Button>
          </div>

          {/* Crop Preview Info */}
          <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-600">
            <div className="grid grid-cols-2 gap-2">
              <div>Original: {imageFile.dimensions.width} × {imageFile.dimensions.height}</div>
              <div>Cropped: {Math.round((cropArea.width * imageFile.dimensions.width) / 100)} × {Math.round((cropArea.height * imageFile.dimensions.height) / 100)}</div>
              <div>Position: {Math.round((cropArea.x * imageFile.dimensions.width) / 100)}, {Math.round((cropArea.y * imageFile.dimensions.height) / 100)}</div>
              <div>Area: {Math.round(cropArea.width * cropArea.height / 100)}% of image</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}