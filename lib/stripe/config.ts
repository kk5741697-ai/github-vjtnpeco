import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not set")
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
  typescript: true,
})

export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`,
  cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
}

// Subscription plans configuration
export const SUBSCRIPTION_PLANS = {
  FREE: {
    id: "free",
    name: "Free",
    description: "Perfect for getting started",
    price: 0,
    interval: null,
    stripePriceId: null,
    features: [
      "100MB max file size",
      "10 tool runs per day",
      "Basic tools access",
      "Community support",
      "Ads supported",
    ],
    limits: {
      maxFileSize: 100 * 1024 * 1024, // 100MB
      dailyToolRuns: 10,
      concurrentJobs: 1,
      bulkProcessing: false,
      apiAccess: false,
      prioritySupport: false,
      customBranding: false,
    },
  },
  PRO: {
    id: "pro",
    name: "Pro",
    description: "For professionals and power users",
    price: 9.99,
    interval: "month",
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID,
    features: [
      "1GB max file size",
      "Unlimited tool runs",
      "All tools access",
      "Priority support",
      "Ad-free experience",
      "Bulk processing",
      "API access",
    ],
    limits: {
      maxFileSize: 1024 * 1024 * 1024, // 1GB
      dailyToolRuns: -1, // unlimited
      concurrentJobs: 3,
      bulkProcessing: true,
      apiAccess: true,
      prioritySupport: true,
      customBranding: false,
    },
  },
  BUSINESS: {
    id: "business",
    name: "Business",
    description: "For teams and growing businesses",
    price: 29.99,
    interval: "month",
    stripePriceId: process.env.STRIPE_BUSINESS_PRICE_ID,
    features: [
      "5GB max file size",
      "Unlimited tool runs",
      "All tools access",
      "Priority support",
      "Ad-free experience",
      "Advanced bulk processing",
      "Full API access",
      "Team management",
      "Usage analytics",
    ],
    limits: {
      maxFileSize: 5 * 1024 * 1024 * 1024, // 5GB
      dailyToolRuns: -1, // unlimited
      concurrentJobs: 10,
      bulkProcessing: true,
      apiAccess: true,
      prioritySupport: true,
      customBranding: true,
    },
  },
  ENTERPRISE: {
    id: "enterprise",
    name: "Enterprise",
    description: "For large organizations with custom needs",
    price: 99.99,
    interval: "month",
    stripePriceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    features: [
      "Unlimited file size",
      "Unlimited tool runs",
      "All tools access",
      "24/7 dedicated support",
      "Ad-free experience",
      "Advanced bulk processing",
      "Full API access",
      "Team management",
      "Advanced analytics",
      "Custom branding",
      "SLA guarantee",
      "On-premise deployment",
    ],
    limits: {
      maxFileSize: -1, // unlimited
      dailyToolRuns: -1, // unlimited
      concurrentJobs: -1, // unlimited
      bulkProcessing: true,
      apiAccess: true,
      prioritySupport: true,
      customBranding: true,
    },
  },
} as const

export type PlanId = keyof typeof SUBSCRIPTION_PLANS
export type PlanConfig = (typeof SUBSCRIPTION_PLANS)[PlanId]
