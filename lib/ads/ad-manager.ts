// Google Ad Manager integration with consent management and performance tracking

export interface AdSlot {
  id: string
  name: string
  adUnitPath: string
  sizes: number[][]
  type: "banner" | "sticky" | "responsive" | "video" | "interstitial" | "rewarded"
  position: string
  autoRefresh?: boolean
  refreshInterval?: number
  frequencyCap?: number
  targeting?: Record<string, string | string[]>
  isActive: boolean
}

export interface AdConfig {
  networkCode: string
  enableConsent: boolean
  enableAutoRefresh: boolean
  defaultRefreshInterval: number
  enableLazyLoading: boolean
  enableSRA: boolean // Single Request Architecture
  collapseEmptyDivs: boolean
}

declare var googletag: any

class AdManager {
  private static instance: AdManager
  private isInitialized = false
  private config: AdConfig | null = null
  private consentGiven = false
  private slots: Map<string, any> = new Map()
  private refreshTimers: Map<string, NodeJS.Timeout> = new Map()
  private impressionCounts: Map<string, number> = new Map()

  static getInstance(): AdManager {
    if (!AdManager.instance) {
      AdManager.instance = new AdManager()
    }
    return AdManager.instance
  }

  async initialize(config: AdConfig): Promise<void> {
    if (this.isInitialized) return

    this.config = config

    // Load Google Publisher Tag
    await this.loadGPT()

    // Configure GPT
    window.googletag = window.googletag || { cmd: [] }

    googletag.cmd.push(() => {
      // Enable services
      googletag.pubads().enableSingleRequestMode()

      if (config.collapseEmptyDivs) {
        googletag.pubads().collapseEmptyDivs()
      }

      if (config.enableLazyLoading) {
        googletag.pubads().enableLazyLoad({
          fetchMarginPercent: 500,
          renderMarginPercent: 200,
          mobileScaling: 2.0,
        })
      }

      // Set up consent management
      if (config.enableConsent) {
        this.setupConsentManagement()
      }

      // Enable services
      googletag.enableServices()
    })

    this.isInitialized = true
  }

  private async loadGPT(): Promise<void> {
    return new Promise((resolve) => {
      if (window.googletag && window.googletag.apiReady) {
        resolve()
        return
      }

      const script = document.createElement("script")
      script.src = "https://securepubads.g.doubleclick.net/tag/js/gpt.js"
      script.async = true
      script.onload = () => resolve()
      document.head.appendChild(script)
    })
  }

  private setupConsentManagement(): void {
    // Basic consent management - integrate with your consent platform
    googletag.cmd.push(() => {
      googletag.pubads().setRequestNonPersonalizedAds(this.consentGiven ? 0 : 1)
    })
  }

  setConsent(hasConsent: boolean): void {
    this.consentGiven = hasConsent
    if (this.isInitialized) {
      googletag.cmd.push(() => {
        googletag.pubads().setRequestNonPersonalizedAds(hasConsent ? 0 : 1)
      })
    }
  }

  defineSlot(adSlot: AdSlot): void {
    if (!this.config) {
      console.error("AdManager not initialized")
      return
    }

    googletag.cmd.push(() => {
      const adUnitPath = `/${this.config!.networkCode}/${adSlot.adUnitPath}`

      let slot: any | null = null

      if (adSlot.type === "responsive") {
        slot = googletag.defineSlot(adUnitPath, adSlot.sizes, adSlot.id)
      } else {
        slot = googletag.defineSlot(adUnitPath, adSlot.sizes, adSlot.id)
      }

      if (slot) {
        // Add targeting
        if (adSlot.targeting) {
          Object.entries(adSlot.targeting).forEach(([key, value]) => {
            slot!.setTargeting(key, value)
          })
        }

        // Set collapse behavior
        slot.addService(googletag.pubads())

        this.slots.set(adSlot.id, slot)

        // Set up auto-refresh if enabled
        if (adSlot.autoRefresh && adSlot.refreshInterval) {
          this.setupAutoRefresh(adSlot.id, adSlot.refreshInterval, adSlot.frequencyCap)
        }
      }
    })
  }

  displaySlot(slotId: string): void {
    googletag.cmd.push(() => {
      googletag.display(slotId)
    })
  }

  refreshSlot(slotId: string): void {
    const slot = this.slots.get(slotId)
    if (slot) {
      googletag.cmd.push(() => {
        googletag.pubads().refresh([slot])
      })

      // Track impression count
      const count = this.impressionCounts.get(slotId) || 0
      this.impressionCounts.set(slotId, count + 1)
    }
  }

  private setupAutoRefresh(slotId: string, interval: number, frequencyCap?: number): void {
    const timer = setInterval(() => {
      const impressions = this.impressionCounts.get(slotId) || 0

      // Check frequency cap
      if (frequencyCap && impressions >= frequencyCap) {
        this.clearAutoRefresh(slotId)
        return
      }

      // Check if element is visible
      const element = document.getElementById(slotId)
      if (element && this.isElementVisible(element)) {
        this.refreshSlot(slotId)
      }
    }, interval * 1000)

    this.refreshTimers.set(slotId, timer)
  }

  clearAutoRefresh(slotId: string): void {
    const timer = this.refreshTimers.get(slotId)
    if (timer) {
      clearInterval(timer)
      this.refreshTimers.delete(slotId)
    }
  }

  private isElementVisible(element: HTMLElement): boolean {
    const rect = element.getBoundingClientRect()
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    )
  }

  destroySlot(slotId: string): void {
    const slot = this.slots.get(slotId)
    if (slot) {
      googletag.cmd.push(() => {
        googletag.destroySlots([slot])
      })
      this.slots.delete(slotId)
      this.clearAutoRefresh(slotId)
      this.impressionCounts.delete(slotId)
    }
  }

  // Analytics and reporting
  getSlotMetrics(slotId: string) {
    return {
      impressions: this.impressionCounts.get(slotId) || 0,
      isActive: this.slots.has(slotId),
      hasAutoRefresh: this.refreshTimers.has(slotId),
    }
  }
}

// Global type declarations
declare global {
  interface Window {
    googletag: any
  }
}

export const adManager = AdManager.getInstance()
