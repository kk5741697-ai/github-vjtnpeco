"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  FlipHorizontal, 
  FlipVertical, 
  Move, 
  Crop,
  Maximize2,
  RotateCcw,
  RefreshCw
} from "lucide-react"

interface CanvasImageEditorProps {
  imageFile: {
    id: string
    preview: string
    dimensions: { width: number; height: number }
    name: string
  }
  toolType: "resize" | "compress" | "convert" | "crop" | "rotate" | "watermark" | "background"
  onTransformChange?: (transform: any) => void
  className?: string
}

export function CanvasImageEditor({ 
  imageFile, 
  toolType, 
  onTransformChange, 
  className 
}: CanvasImageEditorProps) {
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [cropMode, setCropMode] = useState(toolType === "crop")
  const [cropArea, setCropArea] = useState({ x: 10, y: 10, width: 80, height: 60 })
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const imageRef = useRef<HTMLImageElement>(null)

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const img = new Image()
    img.onload = () => {
      // Calculate canvas size to fit container
      const containerRect = container.getBoundingClientRect()
      const maxWidth = containerRect.width - 40
      const maxHeight = containerRect.height - 40
      
      const aspectRatio = img.naturalWidth / img.naturalHeight
      let canvasWidth = maxWidth
      let canvasHeight = maxWidth / aspectRatio
      
      if (canvasHeight > maxHeight) {
        canvasHeight = maxHeight
        canvasWidth = maxHeight * aspectRatio
      }
      
      canvas.width = canvasWidth
      canvas.height = canvasHeight
      
      drawImage()
    }
    
    img.src = imageFile.preview
    imageRef.current = img

    function drawImage() {
      if (!ctx || !imageRef.current) return
      
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // Apply transformations
      ctx.save()
      
      // Move to center for transformations
      ctx.translate(canvas.width / 2, canvas.height / 2)
      
      // Apply zoom
      const scale = zoom / 100
      ctx.scale(scale, scale)
      
      // Apply rotation
      ctx.rotate((rotation * Math.PI) / 180)
      
      // Apply flip
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)
      
      // Apply pan
      ctx.translate(pan.x, pan.y)
      
      // Draw image centered
      ctx.drawImage(
        imageRef.current,
        -canvas.width / 2,
        -canvas.height / 2,
        canvas.width,
        canvas.height
      )
      
      ctx.restore()
      
      // Draw crop overlay if in crop mode
      if (cropMode) {
        drawCropOverlay()
      }
    }

    function drawCropOverlay() {
      if (!ctx) return
      
      const cropX = (cropArea.x / 100) * canvas.width
      const cropY = (cropArea.y / 100) * canvas.height
      const cropWidth = (cropArea.width / 100) * canvas.width
      const cropHeight = (cropArea.height / 100) * canvas.height
      
      // Darken outside areas
      ctx.fillStyle = "rgba(0, 0, 0, 0.4)"
      ctx.fillRect(0, 0, canvas.width, cropY) // Top
      ctx.fillRect(0, cropY + cropHeight, canvas.width, canvas.height - cropY - cropHeight) // Bottom
      ctx.fillRect(0, cropY, cropX, cropHeight) // Left
      ctx.fillRect(cropX + cropWidth, cropY, canvas.width - cropX - cropWidth, cropHeight) // Right
      
      // Draw crop border
      ctx.strokeStyle = "#3b82f6"
      ctx.lineWidth = 2
      ctx.strokeRect(cropX, cropY, cropWidth, cropHeight)
      
      // Draw grid lines
      ctx.strokeStyle = "rgba(255, 255, 255, 0.5)"
      ctx.lineWidth = 1
      for (let i = 1; i < 3; i++) {
        // Vertical lines
        ctx.beginPath()
        ctx.moveTo(cropX + (cropWidth / 3) * i, cropY)
        ctx.lineTo(cropX + (cropWidth / 3) * i, cropY + cropHeight)
        ctx.stroke()
        
        // Horizontal lines
        ctx.beginPath()
        ctx.moveTo(cropX, cropY + (cropHeight / 3) * i)
        ctx.lineTo(cropX + cropWidth, cropY + (cropHeight / 3) * i)
        ctx.stroke()
      }
      
      // Draw resize handles
      const handleSize = 8
      const handles = [
        { x: cropX - handleSize/2, y: cropY - handleSize/2 }, // Top-left
        { x: cropX + cropWidth - handleSize/2, y: cropY - handleSize/2 }, // Top-right
        { x: cropX - handleSize/2, y: cropY + cropHeight - handleSize/2 }, // Bottom-left
        { x: cropX + cropWidth - handleSize/2, y: cropY + cropHeight - handleSize/2 }, // Bottom-right
      ]
      
      ctx.fillStyle = "#3b82f6"
      handles.forEach(handle => {
        ctx.fillRect(handle.x, handle.y, handleSize, handleSize)
      })
    }

    drawImage()
  }, [zoom, rotation, flipH, flipV, pan, cropMode, cropArea, imageFile.preview])

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (cropMode) {
      // Handle crop interaction
      const cropX = (cropArea.x / 100) * canvas.width
      const cropY = (cropArea.y / 100) * canvas.height
      const cropWidth = (cropArea.width / 100) * canvas.width
      const cropHeight = (cropArea.height / 100) * canvas.height

      if (x >= cropX && x <= cropX + cropWidth && y >= cropY && y <= cropY + cropHeight) {
        // Start dragging crop area
        setIsDragging(true)
        setDragStart({ x: x - cropX, y: y - cropY })
      }
    } else {
      // Handle pan
      setIsDragging(true)
      setDragStart({ x: x - pan.x, y: y - pan.y })
    }
  }

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging) return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (cropMode) {
      // Update crop position
      const newX = Math.max(0, Math.min(100 - cropArea.width, ((x - dragStart.x) / canvas.width) * 100))
      const newY = Math.max(0, Math.min(100 - cropArea.height, ((y - dragStart.y) / canvas.height) * 100))
      
      setCropArea(prev => ({ ...prev, x: newX, y: newY }))
    } else {
      // Update pan
      setPan({ x: x - dragStart.x, y: y - dragStart.y })
    }
  }

  const handleCanvasMouseUp = () => {
    setIsDragging(false)
  }

  const resetTransform = () => {
    setZoom(100)
    setRotation(0)
    setFlipH(false)
    setFlipV(false)
    setPan({ x: 0, y: 0 })
    setCropArea({ x: 10, y: 10, width: 80, height: 60 })
  }

  const fitToScreen = () => {
    setZoom(100)
    setPan({ x: 0, y: 0 })
  }

  // Notify parent of transform changes
  useEffect(() => {
    if (onTransformChange) {
      onTransformChange({
        zoom,
        rotation,
        flipH,
        flipV,
        pan,
        cropArea: cropMode ? cropArea : null
      })
    }
  }, [zoom, rotation, flipH, flipV, pan, cropArea, cropMode, onTransformChange])

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Canvas Container */}
      <div 
        ref={containerRef}
        className="flex-1 flex items-center justify-center bg-gray-100 relative overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          className="max-w-full max-h-full border border-gray-300 rounded-lg shadow-sm cursor-grab active:cursor-grabbing"
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
        />
        
        {/* Zoom Indicator */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
          {zoom}%
        </div>
        
        {/* Transform Info */}
        {(rotation !== 0 || flipH || flipV) && (
          <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
            {rotation !== 0 && `${rotation}°`}
            {flipH && " H"}
            {flipV && " V"}
          </div>
        )}
      </div>

      {/* Canvas Controls */}
      <div className="bg-white border-t p-4 space-y-4 flex-shrink-0">
        {/* Zoom Control */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Zoom: {zoom}%</Label>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setZoom(prev => Math.max(25, prev - 25))}>
              <ZoomOut className="h-3 w-3" />
            </Button>
            <Slider
              value={[zoom]}
              onValueChange={([value]) => setZoom(value)}
              min={25}
              max={400}
              step={25}
              className="flex-1"
            />
            <Button variant="outline" size="sm" onClick={() => setZoom(prev => Math.min(400, prev + 25))}>
              <ZoomIn className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Transform Controls */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-1">
            <Button variant="outline" size="sm" onClick={() => setRotation(prev => prev - 90)}>
              <RotateCcw className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setRotation(prev => prev + 90)}>
              <RotateCw className="h-3 w-3" />
            </Button>
            <Button 
              variant={flipH ? "default" : "outline"} 
              size="sm" 
              onClick={() => setFlipH(prev => !prev)}
            >
              <FlipHorizontal className="h-3 w-3" />
            </Button>
            <Button 
              variant={flipV ? "default" : "outline"} 
              size="sm" 
              onClick={() => setFlipV(prev => !prev)}
            >
              <FlipVertical className="h-3 w-3" />
            </Button>
          </div>
          
          <div className="flex space-x-1">
            <Button variant="outline" size="sm" onClick={fitToScreen}>
              <Maximize2 className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm" onClick={resetTransform}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Crop Mode Toggle */}
        {toolType === "crop" && (
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Crop Mode</Label>
            <Button 
              variant={cropMode ? "default" : "outline"} 
              size="sm"
              onClick={() => setCropMode(prev => !prev)}
            >
              <Crop className="h-3 w-3 mr-1" />
              {cropMode ? "Exit Crop" : "Enter Crop"}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}