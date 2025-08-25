"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Play, Gift } from "lucide-react"
import { AdSlotComponent } from "./ad-slot"
import type { AdSlot } from "@/lib/ads/ad-manager"

interface RewardedAdProps {
  onRewardEarned: () => void
  rewardDescription: string
  trigger?: React.ReactNode
}

const REWARDED_AD_SLOT: AdSlot = {
  id: "ad-rewarded-video",
  name: "Rewarded Video",
  adUnitPath: "rewarded-video",
  sizes: [
    [640, 480],
    [320, 240],
  ],
  type: "rewarded",
  position: "modal",
  autoRefresh: false,
  targeting: {
    ad_type: "rewarded",
  },
  isActive: true,
}

export function RewardedAd({ onRewardEarned, rewardDescription, trigger }: RewardedAdProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [hasCompleted, setHasCompleted] = useState(false)

  const handleWatchAd = () => {
    setIsOpen(true)
    setIsLoading(true)

    // Simulate ad completion - in real implementation, this would be handled by GAM callbacks
    setTimeout(() => {
      setIsLoading(false)
      setHasCompleted(true)

      // Award the reward after a short delay
      setTimeout(() => {
        onRewardEarned()
        setIsOpen(false)
        setHasCompleted(false)
      }, 2000)
    }, 15000) // 15 second ad
  }

  return (
    <>
      {trigger ? (
        <div onClick={handleWatchAd}>{trigger}</div>
      ) : (
        <Button onClick={handleWatchAd} variant="outline" className="gap-2 bg-transparent">
          <Play className="h-4 w-4" />
          Watch Ad for Reward
        </Button>
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Earn Reward
            </DialogTitle>
            <DialogDescription>{rewardDescription}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {isLoading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Loading rewarded ad...</p>
              </div>
            )}

            {!isLoading && !hasCompleted && (
              <AdSlotComponent
                slot={REWARDED_AD_SLOT}
                className="min-h-[240px]"
                fallback={
                  <div className="bg-muted/30 border border-dashed border-muted-foreground/20 rounded-lg flex items-center justify-center text-muted-foreground text-sm p-8">
                    Rewarded Video Ad
                  </div>
                }
              />
            )}

            {hasCompleted && (
              <div className="text-center py-8">
                <div className="text-green-600 mb-4">
                  <Gift className="h-12 w-12 mx-auto" />
                </div>
                <p className="font-medium text-green-600">Reward Earned!</p>
                <p className="text-sm text-muted-foreground mt-2">{rewardDescription}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
