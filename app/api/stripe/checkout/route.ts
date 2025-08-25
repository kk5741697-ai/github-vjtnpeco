import { type NextRequest, NextResponse } from "next/server"
import { SubscriptionService } from "@/lib/stripe/subscription-service"
import { getServerSession } from "next-auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { planId, successUrl, cancelUrl } = await request.json()

    if (!planId) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 })
    }

    const checkoutSession = await SubscriptionService.createCheckoutSession(
      session.user.id,
      planId,
      successUrl,
      cancelUrl,
    )

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error("Checkout error:", error)
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 })
  }
}
