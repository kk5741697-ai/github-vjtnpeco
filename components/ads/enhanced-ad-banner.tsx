"use client"

import { EnhancedAdSlot } from "./enhanced-ad-slot"
import type { AdSlot } from "@/lib/ads/enhanced-ad-manager"

interface EnhancedAdBannerProps {
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

export function EnhancedAdBanner({ position, className, showLabel = false }: EnhancedAdBannerProps) {
  const slot = AD_SLOTS[position]

  if (!slot) {
    console.warn(`No ad slot configured for position: ${position}`)
    return null
  }

  return (
    <div className={className}>
      <EnhancedAdSlot
        slot={slot}
        showLabel={showLabel}
        fallback={
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 border border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-sm p-4 min-h-[90px]">
            <div className="text-center">
              {showLabel && <div className="text-xs mb-1">Advertisement</div>}
              <div>Ad Space</div>
            </div>
          </div>
        }
      />
    </div>
  )
}