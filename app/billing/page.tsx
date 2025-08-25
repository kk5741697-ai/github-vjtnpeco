"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CreditCard, Calendar, TrendingUp, Settings } from "lucide-react"
import { SUBSCRIPTION_PLANS } from "@/lib/stripe/config"

// Mock user subscription data - in real app this would come from API
const mockSubscription = {
  currentPlan: "PRO",
  status: "ACTIVE",
  currentPeriodEnd: new Date("2024-02-15"),
  usage: {
    toolRuns: 45,
    dailyLimit: -1, // unlimited
    fileUploads: 23,
    storageUsed: 2.3, // GB
  },
}

export default function BillingPage() {
  const [isLoading, setIsLoading] = useState(false)
  const currentPlan = SUBSCRIPTION_PLANS[mockSubscription.currentPlan as keyof typeof SUBSCRIPTION_PLANS]

  const handleManageBilling = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnUrl: window.location.href }),
      })

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      console.error("Failed to open billing portal:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Billing & Subscription</h1>
          <p className="text-muted-foreground">Manage your subscription, billing, and usage</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Current Plan */}
          <Card className="md:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Current Plan
                  </CardTitle>
                  <CardDescription>Your active subscription details</CardDescription>
                </div>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  {mockSubscription.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold">{currentPlan.name}</h3>
                  <p className="text-muted-foreground">{currentPlan.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">${currentPlan.price}</div>
                  <div className="text-sm text-muted-foreground">per {currentPlan.interval}</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Next billing date</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {mockSubscription.currentPeriodEnd.toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleManageBilling} disabled={isLoading}>
                  <Settings className="h-4 w-4 mr-2" />
                  {isLoading ? "Loading..." : "Manage Billing"}
                </Button>
                <Button variant="outline" asChild>
                  <a href="/pricing">
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Change Plan
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Usage Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Usage This Month</CardTitle>
              <CardDescription>Your current usage statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Tool Runs</span>
                  <span>
                    {mockSubscription.usage.toolRuns}
                    {mockSubscription.usage.dailyLimit === -1 ? "" : ` / ${mockSubscription.usage.dailyLimit}`}
                  </span>
                </div>
                {mockSubscription.usage.dailyLimit !== -1 && (
                  <Progress
                    value={(mockSubscription.usage.toolRuns / mockSubscription.usage.dailyLimit) * 100}
                    className="h-2"
                  />
                )}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>File Uploads</span>
                  <span>{mockSubscription.usage.fileUploads}</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Storage Used</span>
                  <span>{mockSubscription.usage.storageUsed} GB</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Plan Features */}
          <Card className="md:col-span-2 lg:col-span-3">
            <CardHeader>
              <CardTitle>Plan Features</CardTitle>
              <CardDescription>What's included in your {currentPlan.name} plan</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentPlan.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="h-2 w-2 bg-green-600 rounded-full"></div>
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
