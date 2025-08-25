"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { adManager, type AdSlot } from "@/lib/ads/ad-manager"
import { cn } from "@/lib/utils"

interface AdSlotProps {
  slot: AdSlot
  className?: string
  fallback?: React.ReactNode
  onLoad?: () => void
  onError?: (error: Error) => void
}

export function AdSlotComponent({ slot, className, fallback, onLoad, onError }: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    if (!slot.isActive) return

    const loadAd = async () => {
      try {
        // Define the slot
        adManager.defineSlot(slot)

        // Display the ad
        adManager.displaySlot(slot.id)

        setIsLoaded(true)
        onLoad?.()
      } catch (error) {
        console.error(`Failed to load ad slot ${slot.id}:`, error)
        setHasError(true)
        onError?.(error as Error)
      }
    }

    loadAd()

    // Cleanup on unmount
    return () => {
      adManager.destroySlot(slot.id)
    }
  }, [slot, onLoad, onError])

  if (!slot.isActive || hasError) {
    return fallback ? <div className={className}>{fallback}</div> : null
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
      {!isLoaded && (
        <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Loading ad...</div>
      )}
    </div>
  )
}
