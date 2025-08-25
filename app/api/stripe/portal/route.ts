import { type NextRequest, NextResponse } from "next/server"
import { SubscriptionService } from "@/lib/stripe/subscription-service"
import { getServerSession } from "next-auth"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { returnUrl } = await request.json()

    const portalSession = await SubscriptionService.createBillingPortalSession(session.user.id, returnUrl)

    return NextResponse.json({ url: portalSession.url })
  } catch (error) {
    console.error("Portal error:", error)
    return NextResponse.json({ error: "Failed to create portal session" }, { status: 500 })
  }
}
