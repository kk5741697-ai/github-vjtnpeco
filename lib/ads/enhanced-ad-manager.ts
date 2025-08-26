// Enhanced Ad Manager with graceful fallbacks for development
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
  enableSRA: boolean
  collapseEmptyDivs: boolean
  isDevelopment?: boolean
}

declare var googletag: any

class EnhancedAdManager {
  private static instance: EnhancedAdManager
  private isInitialized = false
  private config: AdConfig | null = null
  private consentGiven = false
  private slots: Map<string, any> = new Map()
  private refreshTimers: Map<string, NodeJS.Timeout> = new Map()
  private impressionCounts: Map<string, number> = new Map()
  private isDevelopment = process.env.NODE_ENV === "development"

  static getInstance(): EnhancedAdManager {
    if (!EnhancedAdManager.instance) {
      EnhancedAdManager.instance = new EnhancedAdManager()
    }
    return EnhancedAdManager.instance
  }

  async initialize(config: AdConfig): Promise<void> {
    if (this.isInitialized) return

    this.config = { ...config, isDevelopment: this.isDevelopment }

    // In development, skip actual GPT loading
    if (this.isDevelopment) {
      this.isInitialized = true
      return
    }

    try {
      await this.loadGPT()
      await this.configureGPT()
      this.isInitialized = true
    } catch (error) {
      console.warn("Ad Manager initialization failed, ads disabled:", error)
      this.isInitialized = true // Still mark as initialized to prevent retries
    }
  }

  private async loadGPT(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(new Error("Window not available"))
        return
      }

      if (window.googletag && window.googletag.apiReady) {
        resolve()
        return
      }

      const script = document.createElement("script")
      script.src = "https://securepubads.g.doubleclick.net/tag/js/gpt.js"
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => reject(new Error("Failed to load GPT"))
      
      const timeout = setTimeout(() => {
        reject(new Error("GPT loading timeout"))
      }, 10000)

      script.onload = () => {
        clearTimeout(timeout)
        resolve()
      }

      document.head.appendChild(script)
    })
  }

  private async configureGPT(): Promise<void> {
    if (!this.config || typeof window === "undefined") return

    window.googletag = window.googletag || { cmd: [] }

    googletag.cmd.push(() => {
      try {
        if (this.config!.enableSRA) {
          googletag.pubads().enableSingleRequestMode()
        }

        if (this.config!.collapseEmptyDivs) {
          googletag.pubads().collapseEmptyDivs()
        }

        if (this.config!.enableLazyLoading) {
          googletag.pubads().enableLazyLoad({
            fetchMarginPercent: 500,
            renderMarginPercent: 200,
            mobileScaling: 2.0,
          })
        }

        if (this.config!.enableConsent) {
          this.setupConsentManagement()
        }

        googletag.enableServices()
      } catch (error) {
        console.warn("GPT configuration failed:", error)
      }
    })
  }

  private setupConsentManagement(): void {
    try {
      googletag.cmd.push(() => {
        googletag.pubads().setRequestNonPersonalizedAds(this.consentGiven ? 0 : 1)
      })
    } catch (error) {
      console.warn("Consent management setup failed:", error)
    }
  }

  setConsent(hasConsent: boolean): void {
    this.consentGiven = hasConsent
    
    if (this.isDevelopment) {
      return
    }

    if (this.isInitialized && typeof window !== "undefined" && window.googletag) {
      try {
        googletag.cmd.push(() => {
          googletag.pubads().setRequestNonPersonalizedAds(hasConsent ? 0 : 1)
        })
      } catch (error) {
        console.warn("Failed to set consent:", error)
      }
    }
  }

  defineSlot(adSlot: AdSlot): void {
    if (!this.config) {
      return
    }

    // In development, just store the slot definition
    if (this.isDevelopment) {
      this.slots.set(adSlot.id, { ...adSlot, isDevelopment: true })
      return
    }

    if (typeof window === "undefined" || !window.googletag) {
      return
    }

    try {
      googletag.cmd.push(() => {
        const adUnitPath = `/${this.config!.networkCode}/${adSlot.adUnitPath}`
        let slot: any | null = null

        try {
          slot = googletag.defineSlot(adUnitPath, adSlot.sizes, adSlot.id)

          if (slot) {
            if (adSlot.targeting) {
              Object.entries(adSlot.targeting).forEach(([key, value]) => {
                slot!.setTargeting(key, value)
              })
            }

            slot.addService(googletag.pubads())
            this.slots.set(adSlot.id, slot)

            if (adSlot.autoRefresh && adSlot.refreshInterval) {
              this.setupAutoRefresh(adSlot.id, adSlot.refreshInterval, adSlot.frequencyCap)
            }
          }
        } catch (error) {
          console.warn(`Failed to define slot ${adSlot.id}:`, error)
        }
      })
    } catch (error) {
      console.warn(`Failed to queue slot definition for ${adSlot.id}:`, error)
    }
  }

  displaySlot(slotId: string): void {
    // In development, just log
    if (this.isDevelopment) {
      return
    }

    if (typeof window === "undefined" || !window.googletag) {
      return
    }

    try {
      googletag.cmd.push(() => {
        googletag.display(slotId)
      })
    } catch (error) {
      console.warn(`Failed to display slot ${slotId}:`, error)
    }
  }

  refreshSlot(slotId: string): void {
    const slot = this.slots.get(slotId)
    if (!slot) return

    if (this.isDevelopment) {
      return
    }

    if (typeof window === "undefined" || !window.googletag) {
      return
    }

    try {
      googletag.cmd.push(() => {
        googletag.pubads().refresh([slot])
      })

      const count = this.impressionCounts.get(slotId) || 0
      this.impressionCounts.set(slotId, count + 1)
    } catch (error) {
      console.warn(`Failed to refresh slot ${slotId}:`, error)
    }
  }

  private setupAutoRefresh(slotId: string, interval: number, frequencyCap?: number): void {
    const timer = setInterval(() => {
      const impressions = this.impressionCounts.get(slotId) || 0

      if (frequencyCap && impressions >= frequencyCap) {
        this.clearAutoRefresh(slotId)
        return
      }

      if (typeof document !== "undefined") {
        const element = document.getElementById(slotId)
        if (element && this.isElementVisible(element)) {
          this.refreshSlot(slotId)
        }
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
    try {
      const rect = element.getBoundingClientRect()
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      )
    } catch {
      return false
    }
  }

  destroySlot(slotId: string): void {
    const slot = this.slots.get(slotId)
    if (!slot) return

    if (this.isDevelopment) {
      this.slots.delete(slotId)
      this.clearAutoRefresh(slotId)
      this.impressionCounts.delete(slotId)
      return
    }

    if (typeof window === "undefined" || !window.googletag) {
      this.slots.delete(slotId)
      this.clearAutoRefresh(slotId)
      this.impressionCounts.delete(slotId)
      return
    }

    try {
      googletag.cmd.push(() => {
        googletag.destroySlots([slot])
      })
    } catch (error) {
      console.warn(`Failed to destroy slot ${slotId}:`, error)
    } finally {
      this.slots.delete(slotId)
      this.clearAutoRefresh(slotId)
      this.impressionCounts.delete(slotId)
    }
  }

  getSlotMetrics(slotId: string) {
    return {
      impressions: this.impressionCounts.get(slotId) || 0,
      isActive: this.slots.has(slotId),
      hasAutoRefresh: this.refreshTimers.has(slotId),
      isDevelopment: this.isDevelopment,
    }
  }
}

// Global type declarations
declare global {
  interface Window {
    googletag: any
  }
}

export const adManager = EnhancedAdManager.getInstance()