import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ToolCard } from "@/components/tool-card"
import { TrendingUp, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const seoTools = [
  {
    title: "SEO Meta Generator",
    description: "Generate optimized meta tags, Open Graph, and Twitter Card tags for better SEO.",
    href: "/seo-meta-generator",
    icon: TrendingUp,
    category: "SEO Tools",
  },
  {
    title: "Keyword Density Checker",
    description: "Analyze keyword density and frequency in your content for SEO optimization.",
    href: "/keyword-density-checker",
    icon: TrendingUp,
    category: "SEO Tools",
  },
  {
    title: "Robots.txt Generator",
    description: "Create and validate robots.txt files to control search engine crawling.",
    href: "/robots-txt-generator",
    icon: TrendingUp,
    category: "SEO Tools",
  },
  {
    title: "Sitemap Generator",
    description: "Generate XML sitemaps for better search engine indexing and crawling.",
    href: "/sitemap-generator",
    icon: TrendingUp,
    category: "SEO Tools",
  },
  {
    title: "Schema Markup Generator",
    description: "Create structured data markup for rich snippets and better search visibility.",
    href: "/schema-markup-generator",
    icon: TrendingUp,
    category: "SEO Tools",
  },
  {
    title: "Page Speed Analyzer",
    description: "Analyze website performance and get recommendations for speed optimization.",
    href: "/page-speed-analyzer",
    icon: TrendingUp,
    category: "SEO Tools",
  },
]

export default function SEOToolsPage() {
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
            <div className="p-3 rounded-lg bg-orange-500/10">
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">SEO Tools</h1>
              <p className="text-muted-foreground">
                38 professional tools for SEO analysis, optimization, and monitoring
              </p>
            </div>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {seoTools.map((tool) => (
            <ToolCard key={tool.title} {...tool} />
          ))}
        </div>

        {/* Coming Soon */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">More SEO analysis tools coming soon!</p>
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
