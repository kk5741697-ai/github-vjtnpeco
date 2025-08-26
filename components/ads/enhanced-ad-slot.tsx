"use client"

import type React from "react"
import { useEffect, useRef, useState } from "react"
import { adManager, type AdSlot } from "@/lib/ads/enhanced-ad-manager"
import { cn } from "@/lib/utils"

interface EnhancedAdSlotProps {
  slot: AdSlot
  className?: string
  fallback?: React.ReactNode
  onLoad?: () => void
  onError?: (error: Error) => void
  showLabel?: boolean
}

export function EnhancedAdSlot({ 
  slot, 
  className, 
  fallback, 
  onLoad, 
  onError,
  showLabel = false 
}: EnhancedAdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isDevelopment] = useState(process.env.NODE_ENV === "development")

  useEffect(() => {
    if (!slot.isActive) return

    const loadAd = async () => {
      try {
        // In development, simulate ad loading
        if (isDevelopment) {
          setIsLoaded(true)
          onLoad?.()
          return
        }

        // Production ad loading
        await adManager.initialize({
          networkCode: "12345678",
          enableConsent: true,
          enableAutoRefresh: true,
          defaultRefreshInterval: 60,
          enableLazyLoading: true,
          enableSRA: true,
          collapseEmptyDivs: true,
          isDevelopment
        })
        
        if (!isDevelopment) {
          adManager.defineSlot(slot)
          adManager.displaySlot(slot.id)
        }

        setIsLoaded(true)
        onLoad?.()
      } catch (error) {
        if (!isDevelopment) {
          console.warn(`Failed to load ad slot ${slot.id}:`, error)
        }
        setHasError(true)
        onError?.(error as Error)
      }
    }

    loadAd()

    return () => {
      try {
        if (!isDevelopment) {
          adManager.destroySlot(slot.id)
        }
      } catch (error) {
        // Silent cleanup in development
      }
    }
  }, [slot, onLoad, onError, isDevelopment])

  // Don't render if slot is inactive or has error
  if (!slot.isActive || hasError) {
    return fallback ? <div className={className}>{fallback}</div> : null
  }

  // Development fallback
  if (isDevelopment) {
    const defaultFallback = (
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-sm p-4 min-h-[90px] opacity-50">
        {showLabel && <div className="text-xs">Advertisement</div>}
      </div>
    )

    return (
      <div className={className}>
        {fallback || defaultFallback}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "ad-slot",
        slot.type === "sticky" && "fixed bottom-0 left-0 right-0 z-50",
        slot.type === "banner" && "w-full",
        slot.type === "responsive" && "w-full",
        className,
      )}
    >
      {showLabel && (
        <div className="text-xs text-gray-400 text-center mb-1 opacity-70">Advertisement</div>
      )}
      
      <div
        id={slot.id}
        className={cn(
          "ad-container",
          slot.type === "banner" && "mx-auto",
          slot.type === "sticky" && "mx-auto bg-background border-t",
          slot.type === "responsive" && "w-full",
        )}
        style={{
          minHeight: slot.sizes[0] ? `${slot.sizes[0][1]}px` : "auto",
          minWidth: slot.sizes[0] ? `${slot.sizes[0][0]}px` : "auto",
        }}
      />
      
      {!isLoaded && !isDevelopment && (
        <div className="flex items-center justify-center h-full text-gray-300 text-xs">
          <div className="animate-pulse">Loading...</div>
        </div>
      )}
    </div>
  )
}