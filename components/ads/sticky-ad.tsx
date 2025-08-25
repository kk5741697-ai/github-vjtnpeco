"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AdSlotComponent } from "./ad-slot"
import type { AdSlot } from "@/lib/ads/ad-manager"

const STICKY_AD_SLOT: AdSlot = {
  id: "ad-sticky-mobile",
  name: "Sticky Mobile Banner",
  adUnitPath: "sticky-mobile",
  sizes: [
    [320, 50],
    [728, 90],
  ],
  type: "sticky",
  position: "sticky",
  autoRefresh: true,
  refreshInterval: 90,
  frequencyCap: 12,
  targeting: {
    device: "mobile",
  },
  isActive: true,
}

export function StickyAd() {
  const [isVisible, setIsVisible] = useState(true)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)

    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  if (!isVisible || !isMobile) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg">
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 h-6 w-6 z-10"
          onClick={() => setIsVisible(false)}
        >
          <X className="h-3 w-3" />
        </Button>
        <AdSlotComponent
          slot={STICKY_AD_SLOT}
          className="pb-safe"
          fallback={
            <div className="h-12 bg-muted/30 flex items-center justify-center text-muted-foreground text-sm">
              Mobile Ad Space
            </div>
          }
        />
      </div>
    </div>
  )
}
