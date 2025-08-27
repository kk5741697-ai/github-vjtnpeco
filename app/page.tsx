import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ToolCard } from "@/components/tool-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { EnhancedAdBanner } from "@/components/ads/enhanced-ad-banner"
import { 
  Search, 
  Star, 
  Zap, 
  Shield, 
  Globe, 
  Heart,
  ImageIcon,
  FileText,
  QrCode,
  Code,
  TrendingUp,
  Wrench,
  ArrowRight
} from "lucide-react"
import Link from "next/link"

const featuredTools = [
  {
    title: "Image Compressor",
    description: "Reduce image file sizes without losing quality. Perfect for web optimization and storage.",
    href: "/image-compressor",
    icon: ImageIcon,
    category: "Image Tools",
  },
  {
    title: "PDF Merger",
    description: "Combine multiple PDF files into one document with page selection and custom ordering.",
    href: "/pdf-merger",
    icon: FileText,
    category: "PDF Tools",
    isPremium: true,
  },
  {
    title: "QR Code Generator",
    description: "Create custom QR codes with logos, colors, and multiple formats. Perfect for marketing.",
    href: "/qr-code-generator",
    icon: QrCode,
    category: "QR Tools",
    isNew: true,
  },
  {
    title: "JSON Formatter",
    description: "Beautify, validate, and minify JSON data with syntax highlighting and error detection.",
    href: "/json-formatter",
    icon: Code,
    category: "Text Tools",
  },
  {
    title: "Background Remover",
    description: "Remove backgrounds from images automatically using AI-powered detection.",
    href: "/background-remover",
    icon: ImageIcon,
    category: "Image Tools",
    isNew: true,
  },
  {
    title: "Password Generator",
    description: "Create secure passwords with customizable length, characters, and complexity options.",
    href: "/password-generator",
    icon: Shield,
    category: "Utilities",
  },
]

const toolCategories = [
  {
    title: "Image Tools",
    description: "41 professional tools for editing, converting, and optimizing images",
    href: "/image-tools",
    icon: ImageIcon,
    color: "bg-purple-500/10 text-purple-600",
    count: 41,
  },
  {
    title: "PDF Tools", 
    description: "34 professional tools for manipulating, converting, and optimizing PDFs",
    href: "/pdf-tools",
    icon: FileText,
    color: "bg-red-500/10 text-red-600",
    count: 34,
  },
  {
    title: "QR & Barcode Tools",
    description: "23 professional tools for generating and reading QR codes and barcodes",
    href: "/qr-tools", 
    icon: QrCode,
    color: "bg-blue-500/10 text-blue-600",
    count: 23,
  },
  {
    title: "Text & Code Tools",
    description: "52 professional tools for formatting, validating, and converting text and code",
    href: "/text-tools",
    icon: Code,
    color: "bg-green-500/10 text-green-600", 
    count: 52,
  },
  {
    title: "SEO Tools",
    description: "38 professional tools for SEO analysis, optimization, and monitoring",
    href: "/seo-tools",
    icon: TrendingUp,
    color: "bg-orange-500/10 text-orange-600",
    count: 38,
  },
  {
    title: "Utilities",
    description: "63 general purpose tools and calculators for everyday tasks",
    href: "/utilities",
    icon: Wrench,
    color: "bg-indigo-500/10 text-indigo-600",
    count: 63,
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-600 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-6xl mx-auto">
          <Badge variant="secondary" className="mb-6 bg-white/20 text-white border-white/30">
            300+ Professional Tools
          </Badge>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold mb-6 leading-tight">
            Every tool you could want to edit{" "}
            <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              images in bulk
            </span>
          </h1>
          <p className="text-xl md:text-2xl opacity-90 mb-8 max-w-3xl mx-auto leading-relaxed">
            Your online photo editor is here and forever free! Compress, resize, crop, convert images and more with 300+ professional tools.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/70 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search for any tool..."
                className="pl-12 pr-4 py-4 text-lg bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-white/70 focus:bg-white/20 focus:border-white/40"
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button size="lg" className="bg-white text-blue-600 hover:bg-white/90 px-8 py-4 text-lg font-semibold">
              Start Using Tools
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg">
              View All Categories
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-white/80">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>100% Secure</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="h-5 w-5" />
              <span>Lightning Fast</span>
            </div>
            <div className="flex items-center space-x-2">
              <Heart className="h-5 w-5" />
              <span>Always Free</span>
            </div>
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5" />
              <span>No Registration</span>
            </div>
          </div>
        </div>
      </section>

      {/* Ad Banner */}
      <div className="py-6 bg-gray-50">
        <div className="container mx-auto px-4">
          <EnhancedAdBanner position="header" showLabel />
        </div>
      </div>

      {/* Featured Tools */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              Featured Tools
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Our most popular and powerful tools used by millions of users worldwide
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTools.map((tool) => (
              <div key={tool.title} className="relative">
                <ToolCard {...tool} />
                {tool.isNew && (
                  <div className="absolute -top-2 -right-2">
                    <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
                      <Star className="w-3 h-3 mr-1" />
                      New
                    </Badge>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Tool Categories */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              Explore Tool Categories
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover specialized tools organized by category for your specific needs
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {toolCategories.map((category) => (
              <Link key={category.title} href={category.href}>
                <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 hover:border-accent/50">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <div className={`p-3 rounded-lg ${category.color}`}>
                        <category.icon className="h-8 w-8" />
                      </div>
                      <Badge variant="secondary" className="text-sm">
                        {category.count} tools
                      </Badge>
                    </div>
                    <CardTitle className="text-xl text-foreground">{category.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-muted-foreground text-base leading-relaxed">
                      {category.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
              Why Choose PixoraTools?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              The most comprehensive online tools platform with enterprise-grade features
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="p-4 rounded-full bg-blue-500/10 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Zap className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-muted-foreground">Process files instantly with our optimized algorithms and client-side processing</p>
            </div>
            
            <div className="text-center">
              <div className="p-4 rounded-full bg-green-500/10 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Shield className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">100% Secure</h3>
              <p className="text-muted-foreground">Your files are processed locally in your browser and never uploaded to our servers</p>
            </div>
            
            <div className="text-center">
              <div className="p-4 rounded-full bg-purple-500/10 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Globe className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Always Free</h3>
              <p className="text-muted-foreground">All core tools are completely free to use with no hidden costs or registration required</p>
            </div>
            
            <div className="text-center">
              <div className="p-4 rounded-full bg-orange-500/10 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Heart className="w-8 h-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">User Friendly</h3>
              <p className="text-muted-foreground">Intuitive interface designed for both beginners and professionals</p>
            </div>
          </div>
        </div>
      </section>

      {/* Inline Ad */}
      <div className="py-6 bg-gray-50">
        <div className="container mx-auto px-4">
          <EnhancedAdBanner position="inline" showLabel />
        </div>
      </div>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-heading font-bold mb-12">Trusted by Millions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-4xl font-bold mb-2">300+</div>
              <div className="text-white/80">Professional Tools</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">10M+</div>
              <div className="text-white/80">Files Processed</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">2M+</div>
              <div className="text-white/80">Happy Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-white/80">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}