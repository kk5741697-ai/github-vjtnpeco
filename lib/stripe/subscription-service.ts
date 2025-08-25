import { stripe, SUBSCRIPTION_PLANS, type PlanId } from "./config"
import { prisma } from "@/lib/prisma"
import type Stripe from "stripe"

export class SubscriptionService {
  static async createCheckoutSession(userId: string, planId: PlanId, successUrl?: string, cancelUrl?: string) {
    const plan = SUBSCRIPTION_PLANS[planId]

    if (!plan.stripePriceId) {
      throw new Error(`Plan ${planId} does not have a Stripe price ID`)
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new Error("User not found")
    }

    // Check if user already has a Stripe customer ID
    let customerId = user.stripeCustomerId

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: {
          userId: user.id,
        },
      })

      customerId = customer.id

      // Update user with Stripe customer ID
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customerId },
      })
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
      metadata: {
        userId,
        planId,
      },
    })

    return session
  }

  static async createBillingPortalSession(userId: string, returnUrl?: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user?.stripeCustomerId) {
      throw new Error("User does not have a Stripe customer ID")
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: returnUrl || `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    })

    return session
  }

  static async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case "checkout.session.completed":
        await this.handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case "customer.subscription.deleted":
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case "invoice.payment_succeeded":
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice)
        break

      case "invoice.payment_failed":
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  }

  private static async handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    const userId = session.metadata?.userId
    const planId = session.metadata?.planId as PlanId

    if (!userId || !planId) {
      console.error("Missing metadata in checkout session", session.id)
      return
    }

    // Update user's plan
    await prisma.user.update({
      where: { id: userId },
      data: { plan: planId.toUpperCase() as any },
    })

    console.log(`User ${userId} upgraded to ${planId}`)
  }

  private static async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string

    // Find user by Stripe customer ID
    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    })

    if (!user) {
      console.error("User not found for customer", customerId)
      return
    }

    // Determine plan from subscription
    const priceId = subscription.items.data[0]?.price.id
    const planId = Object.entries(SUBSCRIPTION_PLANS).find(([, plan]) => plan.stripePriceId === priceId)?.[0] as PlanId

    if (!planId) {
      console.error("Plan not found for price", priceId)
      return
    }

    // Update or create subscription record
    await prisma.subscription.upsert({
      where: { userId: user.id },
      update: {
        plan: planId.toUpperCase() as any,
        status: subscription.status.toUpperCase() as any,
        providerId: subscription.id,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
      create: {
        userId: user.id,
        plan: planId.toUpperCase() as any,
        status: subscription.status.toUpperCase() as any,
        provider: "stripe",
        providerId: subscription.id,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      },
    })

    // Update user's plan
    await prisma.user.update({
      where: { id: user.id },
      data: { plan: planId.toUpperCase() as any },
    })
  }

  private static async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    const customerId = subscription.customer as string

    const user = await prisma.user.findFirst({
      where: { stripeCustomerId: customerId },
    })

    if (!user) {
      console.error("User not found for customer", customerId)
      return
    }

    // Update subscription status
    await prisma.subscription.updateMany({
      where: { userId: user.id, providerId: subscription.id },
      data: { status: "CANCELLED" },
    })

    // Downgrade user to free plan
    await prisma.user.update({
      where: { id: user.id },
      data: { plan: "FREE" },
    })
  }

  private static async handlePaymentSucceeded(invoice: Stripe.Invoice) {
    console.log(`Payment succeeded for invoice ${invoice.id}`)
    // Add any additional logic for successful payments
  }

  private static async handlePaymentFailed(invoice: Stripe.Invoice) {
    console.log(`Payment failed for invoice ${invoice.id}`)
    // Add logic for failed payments (notifications, grace period, etc.)
  }

  static async getUserSubscription(userId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    })

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    const currentPlan = user?.plan || "FREE"
    const planConfig = SUBSCRIPTION_PLANS[currentPlan as PlanId]

    return {
      subscription,
      currentPlan,
      planConfig,
      isActive: subscription?.status === "ACTIVE",
      isExpired: subscription?.currentPeriodEnd ? new Date() > subscription.currentPeriodEnd : false,
    }
  }

  static async checkUsageLimits(userId: string, action: "toolRun" | "fileUpload", metadata?: any) {
    const userSubscription = await this.getUserSubscription(userId)
    const limits = userSubscription.planConfig.limits

    switch (action) {
      case "toolRun":
        if (limits.dailyToolRuns !== -1) {
          const today = new Date()
          today.setHours(0, 0, 0, 0)

          const usage = await prisma.usageDaily.findFirst({
            where: {
              userId,
              date: today,
            },
          })

          const currentRuns = usage?.runs || 0
          if (currentRuns >= limits.dailyToolRuns) {
            return { allowed: false, reason: "Daily tool run limit exceeded" }
          }
        }
        break

      case "fileUpload":
        if (limits.maxFileSize !== -1 && metadata?.fileSize > limits.maxFileSize) {
          return { allowed: false, reason: "File size exceeds plan limit" }
        }
        break
    }

    return { allowed: true }
  }
}
