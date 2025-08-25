import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Star, Zap, Shield, Users, Crown } from "lucide-react"
import { SUBSCRIPTION_PLANS } from "@/lib/stripe/config"
import Link from "next/link"

const planIcons = {
  FREE: Shield,
  PRO: Zap,
  BUSINESS: Users,
  ENTERPRISE: Crown,
}

const planColors = {
  FREE: "text-gray-600",
  PRO: "text-blue-600",
  BUSINESS: "text-purple-600",
  ENTERPRISE: "text-yellow-600",
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-4">
            Pricing Plans
          </Badge>
          <h1 className="text-4xl md:text-6xl font-heading font-bold text-foreground mb-6">Choose Your Perfect Plan</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Start free and upgrade as you grow. All plans include access to our core tools with varying limits and
            features.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {Object.entries(SUBSCRIPTION_PLANS).map(([planId, plan]) => {
              const Icon = planIcons[planId as keyof typeof planIcons]
              const isPopular = planId === "PRO"

              return (
                <Card key={planId} className={`relative ${isPopular ? "border-primary shadow-lg scale-105" : ""}`}>
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary text-primary-foreground">
                        <Star className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}

                  <CardHeader className="text-center pb-8">
                    <div
                      className={`inline-flex p-3 rounded-lg bg-muted mb-4 ${planColors[planId as keyof typeof planColors]}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                    <CardDescription className="text-muted-foreground">{plan.description}</CardDescription>
                    <div className="mt-4">
                      <div className="text-4xl font-bold">{plan.price === 0 ? "Free" : `$${plan.price}`}</div>
                      {plan.interval && <div className="text-muted-foreground">per {plan.interval}</div>}
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-6">
                    <ul className="space-y-3">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start space-x-3">
                          <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="pt-4">
                      {planId === "FREE" ? (
                        <Button variant="outline" className="w-full bg-transparent" asChild>
                          <Link href="/auth/signup">Get Started Free</Link>
                        </Button>
                      ) : (
                        <Button
                          className={`w-full ${isPopular ? "bg-primary hover:bg-primary/90" : ""}`}
                          variant={isPopular ? "default" : "outline"}
                          asChild
                        >
                          <Link href={`/billing/checkout?plan=${planId.toLowerCase()}`}>Upgrade to {plan.name}</Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-heading font-bold text-foreground mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about our pricing and plans
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="space-y-4">
              <h3 className="font-semibold">Can I change plans anytime?</h3>
              <p className="text-muted-foreground text-sm">
                Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately for upgrades
                and at the end of your billing cycle for downgrades.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">What payment methods do you accept?</h3>
              <p className="text-muted-foreground text-sm">
                We accept all major credit cards (Visa, MasterCard, American Express) and PayPal through our secure
                Stripe integration.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Is there a free trial?</h3>
              <p className="text-muted-foreground text-sm">
                Our Free plan gives you access to core features with usage limits. You can upgrade anytime to unlock
                more features and higher limits.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Can I cancel anytime?</h3>
              <p className="text-muted-foreground text-sm">
                Yes, you can cancel your subscription at any time. You'll continue to have access to paid features until
                the end of your billing period.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
