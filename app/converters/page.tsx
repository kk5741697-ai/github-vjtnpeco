import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ToolCard } from "@/components/tool-card"
import { Shuffle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const converterTools = [
  {
    title: "Unit Converter",
    description: "Convert between different units of measurement: length, weight, temperature, and more.",
    href: "/unit-converter",
    icon: Shuffle,
    category: "Converters",
  },
  {
    title: "Currency Converter",
    description: "Convert between world currencies with real-time exchange rates and historical data.",
    href: "/currency-converter",
    icon: Shuffle,
    category: "Converters",
  },
  {
    title: "Color Converter",
    description: "Convert colors between formats: HEX, RGB, HSL, CMYK, and more with live preview.",
    href: "/color-converter",
    icon: Shuffle,
    category: "Converters",
  },
  {
    title: "Number Base Converter",
    description: "Convert numbers between different bases: binary, decimal, hexadecimal, and octal.",
    href: "/number-base-converter",
    icon: Shuffle,
    category: "Converters",
  },
  {
    title: "Timestamp Converter",
    description: "Convert between Unix timestamps and human-readable dates with timezone support.",
    href: "/timestamp-converter",
    icon: Shuffle,
    category: "Converters",
  },
  {
    title: "Markdown to HTML",
    description: "Convert Markdown text to HTML with syntax highlighting and live preview.",
    href: "/markdown-to-html",
    icon: Shuffle,
    category: "Converters",
  },
]

export default function ConvertersPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>

          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 rounded-lg bg-cyan-500/10">
              <Shuffle className="h-8 w-8 text-cyan-600" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">Converters</h1>
              <p className="text-muted-foreground">
                47 professional tools for converting units, currencies, and formats
              </p>
            </div>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {converterTools.map((tool) => (
            <ToolCard key={tool.title} {...tool} />
          ))}
        </div>

        {/* Coming Soon */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">More conversion tools coming soon!</p>
          <p className="text-sm text-muted-foreground">
            Have a suggestion?{" "}
            <Link href="/contact" className="text-accent hover:underline">
              Let us know
            </Link>
          </p>
        </div>
      </div>

      <Footer />
    </div>
  )
}
