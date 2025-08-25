"use client"

import { useState, useEffect } from "react"

interface ConsentState {
  hasConsent: boolean | null
  isLoading: boolean
  showBanner: boolean
}

export function useAdConsent() {
  const [consentState, setConsentState] = useState<ConsentState>({
    hasConsent: null,
    isLoading: true,
    showBanner: false,
  })

  useEffect(() => {
    // Check for existing consent
    const savedConsent = localStorage.getItem("ad-consent")
    const consentTimestamp = localStorage.getItem("ad-consent-timestamp")

    // Consent expires after 13 months (GDPR requirement)
    const consentAge = consentTimestamp ? Date.now() - Number.parseInt(consentTimestamp) : 0
    const consentExpired = consentAge > 13 * 30 * 24 * 60 * 60 * 1000

    if (savedConsent && !consentExpired) {
      setConsentState({
        hasConsent: savedConsent === "true",
        isLoading: false,
        showBanner: false,
      })
    } else {
      // Show consent banner for new users or expired consent
      setConsentState({
        hasConsent: null,
        isLoading: false,
        showBanner: true,
      })
    }
  }, [])

  const giveConsent = (consent: boolean) => {
    localStorage.setItem("ad-consent", consent.toString())
    localStorage.setItem("ad-consent-timestamp", Date.now().toString())

    setConsentState({
      hasConsent: consent,
      isLoading: false,
      showBanner: false,
    })

    // Update ad manager
    if (typeof window !== "undefined") {
      import("@/lib/ads/ad-manager").then(({ adManager }) => {
        adManager.setConsent(consent)
      })
    }
  }

  const resetConsent = () => {
    localStorage.removeItem("ad-consent")
    localStorage.removeItem("ad-consent-timestamp")

    setConsentState({
      hasConsent: null,
      isLoading: false,
      showBanner: true,
    })
  }

  return {
    ...consentState,
    giveConsent,
    resetConsent,
  }
}
