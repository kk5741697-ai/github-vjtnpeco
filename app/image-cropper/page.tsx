"use client"

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Download, RotateCcw, Crop, Move, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ImageCropper() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [aspectRatio, setAspectRatio] = useState('free');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState('');
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Update container size on window resize
  useEffect(() => {
    const updateContainerSize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    updateContainerSize();
    window.addEventListener('resize', updateContainerSize);
    return () => window.removeEventListener('resize', updateContainerSize);
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          setImageLoaded(true);
          
          // Calculate container dimensions
          if (containerRef.current) {
            const containerRect = containerRef.current.getBoundingClientRect();
            const containerWidth = containerRect.width - 32; // Account for padding
            const containerHeight = Math.min(containerRect.height - 100, window.innerHeight * 0.6); // Max 60vh
            
            // Calculate scale to fit image in container
            const scaleX = containerWidth / img.width;
            const scaleY = containerHeight / img.height;
            const scale = Math.min(scaleX, scaleY, 1); // Don't scale up
            
            const displayWidth = img.width * scale;
            const displayHeight = img.height * scale;
            
            // Set initial crop area to center of image (in original image coordinates)
            const cropSize = Math.min(img.width, img.height) * 0.6;
            setCropArea({
              x: (img.width - cropSize) / 2,
              y: (img.height - cropSize) / 2,
              width: cropSize,
              height: cropSize
            });
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }, []);

  // Recalculate crop area on window resize to maintain relative position
  useEffect(() => {
    if (image && imageLoaded) {
      // Crop area is maintained in original image coordinates, so no adjustment needed
    }
  }, [containerSize, image, imageLoaded]);

  const handleMouseDown = useCallback((e: React.MouseEvent, action: string, handle?: string) => {
    e.preventDefault();
    if (!image) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const containerWidth = rect.width - 32; // Account for padding
    const containerHeight = Math.min(rect.height - 100, window.innerHeight * 0.6);
    
    const scaleX = image.width / containerWidth;
    const scaleY = image.height / containerHeight;
    const scale = Math.min(scaleX, scaleY, 1);
    
    const displayWidth = image.width / scale;
    const displayHeight = image.height / scale;
    
    const imageOffsetX = (containerWidth - displayWidth) / 2;
    const imageOffsetY = (containerHeight - displayHeight) / 2;

    const x = ((e.clientX - rect.left - imageOffsetX) * scale);
    const y = ((e.clientY - rect.top - imageOffsetY) * scale);

    setDragStart({ x, y });

    if (action === 'drag') {
      setIsDragging(true);
    } else if (action === 'resize') {
      setIsResizing(true);
      setResizeHandle(handle || '');
    }
  }, [image]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging && !isResizing) return;
    if (!image) return;

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const containerWidth = rect.width - 32;
    const containerHeight = Math.min(rect.height - 100, window.innerHeight * 0.6);
    
    const scaleX = image.width / containerWidth;
    const scaleY = image.height / containerHeight;
    const scale = Math.min(scaleX, scaleY, 1);
    
    const displayWidth = image.width / scale;
    const displayHeight = image.height / scale;
    
    const imageOffsetX = (containerWidth - displayWidth) / 2;
    const imageOffsetY = (containerHeight - displayHeight) / 2;

    const x = ((e.clientX - rect.left - imageOffsetX) * scale);
    const y = ((e.clientY - rect.top - imageOffsetY) * scale);

    if (isDragging) {
      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;

      setCropArea(prev => ({
        ...prev,
        x: Math.max(0, Math.min(image.width - prev.width, prev.x + deltaX)),
        y: Math.max(0, Math.min(image.height - prev.height, prev.y + deltaY)),
      }));

      setDragStart({ x, y });
    } else if (isResizing) {
      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;

      setCropArea(prev => {
        let newArea = { ...prev };

        switch (resizeHandle) {
          case 'se':
            newArea.width = Math.max(10, Math.min(image.width - prev.x, prev.width + deltaX));
            newArea.height = Math.max(10, Math.min(image.height - prev.y, prev.height + deltaY));
            break;
          case 'sw':
            newArea.x = Math.max(0, Math.min(prev.x + prev.width - 10, prev.x + deltaX));
            newArea.width = prev.width - (newArea.x - prev.x);
            newArea.height = Math.max(10, Math.min(image.height - prev.y, prev.height + deltaY));
            break;
          case 'ne':
            newArea.width = Math.max(10, Math.min(image.width - prev.x, prev.width + deltaX));
            newArea.y = Math.max(0, Math.min(prev.y + prev.height - 10, prev.y + deltaY));
            newArea.height = prev.height - (newArea.y - prev.y);
            break;
          case 'nw':
            newArea.x = Math.max(0, Math.min(prev.x + prev.width - 10, prev.x + deltaX));
            newArea.y = Math.max(0, Math.min(prev.y + prev.height - 10, prev.y + deltaY));
            newArea.width = prev.width - (newArea.x - prev.x);
            newArea.height = prev.height - (newArea.y - prev.y);
            break;
        }

        return newArea;
      });

      setDragStart({ x, y });
    }
  }, [isDragging, isResizing, dragStart, resizeHandle, image]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle('');
  }, []);

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const downloadCroppedImage = () => {
    if (!image || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = cropArea.width;
    canvas.height = cropArea.height;

    ctx.drawImage(
      image,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height,
      0,
      0,
      cropArea.width,
      cropArea.height
    );

    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cropped-image.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    });
  };

  const resetCrop = () => {
    if (!image) return;
    const cropSize = Math.min(image.width, image.height) * 0.6;
    setCropArea({
      x: (image.width - cropSize) / 2,
      y: (image.height - cropSize) / 2,
      width: cropSize,
      height: cropSize
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-8rem)]">
          {/* Main Canvas Area */}
          <div className="lg:col-span-3 flex flex-col min-h-0">
            <Card className="h-full">
              <CardContent className="p-4 h-full flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <h1 className="text-2xl font-bold">Image Cropper</h1>
                  <div className="flex gap-2">
                    <Button onClick={handleFileUpload} variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                    <Button onClick={resetCrop} variant="outline" size="sm" disabled={!imageLoaded}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset
                    </Button>
                    <Button onClick={downloadCroppedImage} disabled={!imageLoaded}>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>

                <div 
                  ref={containerRef}
                  className="flex-1 flex items-center justify-center bg-gray-100 rounded-lg relative overflow-hidden"
                  style={{ minHeight: '60vh', maxHeight: '70vh' }}
                >
                  {!imageLoaded ? (
                    <div className="text-center">
                      <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 mb-4">Upload an image to start cropping</p>
                      <Button onClick={handleFileUpload}>
                        Choose Image
                      </Button>
                    </div>
                  ) : (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <div 
                        className="relative border border-gray-300 cursor-crosshair bg-white"
                        style={{
                          width: Math.min(containerSize.width - 32, image?.width || 0),
                          height: Math.min(containerSize.height - 100, image?.height || 0, window.innerHeight * 0.6),
                          backgroundImage: `url(${image?.src})`,
                          backgroundSize: 'contain',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center',
                        }}
                        onMouseDown={(e) => handleMouseDown(e, 'drag')}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                      >
                        {/* Crop overlay */}
                        {cropArea && (
                          <CropOverlay 
                            cropArea={cropArea}
                            imageWidth={image?.width || 0}
                            imageHeight={image?.height || 0}
                            containerWidth={Math.min(containerSize.width - 32, image?.width || 0)}
                            containerHeight={Math.min(containerSize.height - 100, image?.height || 0, window.innerHeight * 0.6)}
                            onMouseDown={handleMouseDown}
                          />
                        )}
                      </div>
                    </div>
                  )}
                  
                  <canvas
                    ref={canvasRef}
                    className="hidden"
                    width={image?.width || 0}
                    height={image?.height || 0}
                  />
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </CardContent>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="lg:col-span-1 flex flex-col min-h-0">
            <Card className="h-full">
              <CardContent className="p-4 flex flex-col h-full overflow-y-auto">
                <h2 className="text-lg font-semibold mb-4">Crop Settings</h2>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="aspect-ratio">Aspect Ratio</Label>
                    <Select value={aspectRatio} onValueChange={setAspectRatio}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="1:1">Square (1:1)</SelectItem>
                        <SelectItem value="4:3">Standard (4:3)</SelectItem>
                        <SelectItem value="16:9">Widescreen (16:9)</SelectItem>
                        <SelectItem value="3:2">Photo (3:2)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="crop-x">X Position</Label>
                      <Input
                        id="crop-x"
                        type="number"
                        value={Math.round(cropArea.x)}
                        onChange={(e) => setCropArea(prev => ({ ...prev, x: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="crop-y">Y Position</Label>
                      <Input
                        id="crop-y"
                        type="number"
                        value={Math.round(cropArea.y)}
                        onChange={(e) => setCropArea(prev => ({ ...prev, y: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label htmlFor="crop-width">Width</Label>
                      <Input
                        id="crop-width"
                        type="number"
                        value={Math.round(cropArea.width)}
                        onChange={(e) => setCropArea(prev => ({ ...prev, width: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="crop-height">Height</Label>
                      <Input
                        id="crop-height"
                        type="number"
                        value={Math.round(cropArea.height)}
                        onChange={(e) => setCropArea(prev => ({ ...prev, height: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <h3 className="font-medium mb-2">Quick Presets</h3>
                    <div className="grid grid-cols-1 gap-2">
                      <Button variant="outline" size="sm" onClick={() => setAspectRatio('1:1')}>
                        <Square className="w-4 h-4 mr-2" />
                        Instagram Post
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setAspectRatio('16:9')}>
                        YouTube Thumbnail
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setAspectRatio('4:3')}>
                        Standard Photo
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Crop overlay component
interface CropOverlayProps {
  cropArea: { x: number; y: number; width: number; height: number };
  imageWidth: number;
  imageHeight: number;
  containerWidth: number;
  containerHeight: number;
  onMouseDown: (e: React.MouseEvent, action: string, handle?: string) => void;
}

function CropOverlay({ cropArea, imageWidth, imageHeight, containerWidth, containerHeight, onMouseDown }: CropOverlayProps) {
  // Calculate scale
  const scaleX = containerWidth / imageWidth;
  const scaleY = containerHeight / imageHeight;
  const scale = Math.min(scaleX, scaleY, 1);
  
  const displayWidth = imageWidth * scale;
  const displayHeight = imageHeight * scale;
  
  const imageOffsetX = (containerWidth - displayWidth) / 2;
  const imageOffsetY = (containerHeight - displayHeight) / 2;
  
  // Convert crop area from image coordinates to display coordinates
  const displayCropArea = {
    x: (cropArea.x * scale) + imageOffsetX,
    y: (cropArea.y * scale) + imageOffsetY,
    width: cropArea.width * scale,
    height: cropArea.height * scale,
  };

  return (
    <>
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50 pointer-events-none">
        {/* Clear crop area */}
        <div
          className="absolute bg-transparent"
          style={{
            left: displayCropArea.x,
            top: displayCropArea.y,
            width: displayCropArea.width,
            height: displayCropArea.height,
            boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
          }}
        />
      </div>
      
      {/* Crop area border and handles */}
      <div
        className="absolute border-2 border-white cursor-move pointer-events-auto"
        style={{
          left: displayCropArea.x,
          top: displayCropArea.y,
          width: displayCropArea.width,
          height: displayCropArea.height,
        }}
        onMouseDown={(e) => onMouseDown(e, 'drag')}
      >
        {/* Resize handles */}
        <div className="absolute -top-1 -left-1 w-3 h-3 bg-white border border-gray-400 cursor-nw-resize" onMouseDown={(e) => onMouseDown(e, 'resize', 'nw')} />
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border border-gray-400 cursor-n-resize" onMouseDown={(e) => onMouseDown(e, 'resize', 'n')} />
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white border border-gray-400 cursor-ne-resize" onMouseDown={(e) => onMouseDown(e, 'resize', 'ne')} />
        <div className="absolute top-1/2 transform -translate-y-1/2 -right-1 w-3 h-3 bg-white border border-gray-400 cursor-e-resize" onMouseDown={(e) => onMouseDown(e, 'resize', 'e')} />
        <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-gray-400 cursor-se-resize" onMouseDown={(e) => onMouseDown(e, 'resize', 'se')} />
        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white border border-gray-400 cursor-s-resize" onMouseDown={(e) => onMouseDown(e, 'resize', 's')} />
        <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border border-gray-400 cursor-sw-resize" onMouseDown={(e) => onMouseDown(e, 'resize', 'sw')} />
        <div className="absolute top-1/2 transform -translate-y-1/2 -left-1 w-3 h-3 bg-white border border-gray-400 cursor-w-resize" onMouseDown={(e) => onMouseDown(e, 'resize', 'w')} />
      </div>
    </>
  );
}