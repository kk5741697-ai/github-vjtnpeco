"use client"

import { AdSlotComponent } from "./ad-slot"
import type { AdSlot } from "@/lib/ads/ad-manager"

interface AdBannerProps {
  position: "header" | "footer" | "inline" | "sidebar"
  className?: string
  showLabel?: boolean
}

const AD_SLOTS: Record<string, AdSlot> = {
  header: {
    id: "ad-header-banner",
    name: "Header Banner",
    adUnitPath: "header-banner",
    sizes: [
      [728, 90],
      [970, 90],
      [320, 50],
    ],
    type: "banner",
    position: "header",
    autoRefresh: true,
    refreshInterval: 60,
    frequencyCap: 10,
    isActive: true,
  },
  footer: {
    id: "ad-footer-banner",
    name: "Footer Banner",
    adUnitPath: "footer-banner",
    sizes: [
      [728, 90],
      [970, 90],
      [320, 50],
    ],
    type: "banner",
    position: "footer",
    autoRefresh: true,
    refreshInterval: 90,
    frequencyCap: 8,
    isActive: true,
  },
  inline: {
    id: "ad-inline-banner",
    name: "Inline Banner",
    adUnitPath: "inline-banner",
    sizes: [
      [728, 90],
      [970, 250],
      [300, 250],
    ],
    type: "responsive",
    position: "inline",
    autoRefresh: false,
    isActive: true,
  },
  sidebar: {
    id: "ad-sidebar-banner",
    name: "Sidebar Banner",
    adUnitPath: "sidebar-banner",
    sizes: [
      [300, 250],
      [300, 600],
      [160, 600],
    ],
    type: "banner",
    position: "sidebar",
    autoRefresh: true,
    refreshInterval: 120,
    frequencyCap: 6,
    isActive: true,
  },
}

export function AdBanner({ position, className, showLabel = false }: AdBannerProps) {
  const slot = AD_SLOTS[position]

  if (!slot) {
    console.warn(`No ad slot configured for position: ${position}`)
    return null
  }

  return (
    <div className={className}>
      {showLabel && <div className="text-xs text-muted-foreground text-center mb-2">Advertisement</div>}
      <AdSlotComponent
        slot={slot}
        fallback={
          <div className="bg-muted/30 border border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center text-muted-foreground text-sm p-4">
            Ad Space
          </div>
        }
      />
    </div>
  )
}
