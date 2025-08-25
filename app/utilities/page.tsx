import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ToolCard } from "@/components/tool-card"
import { Wrench, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const utilityTools = [
  {
    title: "Password Generator",
    description: "Create secure passwords with customizable length, characters, and complexity options.",
    href: "/password-generator",
    icon: Wrench,
    category: "Utilities",
  },
  {
    title: "Lorem Ipsum Generator",
    description: "Generate placeholder text in various formats and lengths for design and development.",
    href: "/lorem-ipsum-generator",
    icon: Wrench,
    category: "Utilities",
  },
  {
    title: "UUID Generator",
    description: "Generate unique identifiers (UUIDs) in various formats for applications and databases.",
    href: "/uuid-generator",
    icon: Wrench,
    category: "Utilities",
  },
  {
    title: "Random Number Generator",
    description: "Generate random numbers with customizable ranges and distribution options.",
    href: "/random-number-generator",
    icon: Wrench,
    category: "Utilities",
  },
  {
    title: "Text Diff Checker",
    description: "Compare two texts and highlight differences with side-by-side or inline view.",
    href: "/text-diff-checker",
    icon: Wrench,
    category: "Utilities",
  },
  {
    title: "Word Counter",
    description: "Count words, characters, paragraphs, and reading time for any text content.",
    href: "/word-counter",
    icon: Wrench,
    category: "Utilities",
  },
]

export default function UtilitiesPage() {
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
            <div className="p-3 rounded-lg bg-indigo-500/10">
              <Wrench className="h-8 w-8 text-indigo-600" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">Utilities</h1>
              <p className="text-muted-foreground">63 general purpose tools and calculators for everyday tasks</p>
            </div>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {utilityTools.map((tool) => (
            <ToolCard key={tool.title} {...tool} />
          ))}
        </div>

        {/* Coming Soon */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">More utility tools coming soon!</p>
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
