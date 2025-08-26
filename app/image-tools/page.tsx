import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ToolCard } from "@/components/tool-card"
import { ImageIcon, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const imageTools = [
  {
    title: "Image Resizer",
    description: "Resize, compress, and optimize images while maintaining quality. Supports batch processing.",
    href: "/image-resizer",
    icon: ImageIcon,
    category: "Image Tools",
  },
  {
    title: "Image Compressor",
    description: "Reduce image file sizes without losing quality. Perfect for web optimization and storage.",
    href: "/image-compressor",
    icon: ImageIcon,
    category: "Image Tools",
  },
  {
    title: "Image Converter",
    description: "Convert images between formats: JPEG, PNG, WebP, GIF, and more with quality controls.",
    href: "/image-converter",
    icon: ImageIcon,
    category: "Image Tools",
  },
  {
    title: "Image Cropper",
    description: "Crop images to specific dimensions or aspect ratios with precise pixel control.",
    href: "/image-cropper",
    icon: ImageIcon,
    category: "Image Tools",
  },
  {
    title: "Image Rotator",
    description: "Rotate and flip images in any direction with batch processing capabilities.",
    href: "/image-rotator",
    icon: ImageIcon,
    category: "Image Tools",
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
    title: "Image Flipper",
    description: "Flip images horizontally, vertically, or both directions with batch processing.",
    href: "/image-flipper",
    icon: ImageIcon,
    category: "Image Tools",
  },
  {
    title: "Image Filters",
    description: "Apply professional filters and adjustments: brightness, contrast, saturation, and effects.",
    href: "/image-filters",
    icon: ImageIcon,
    category: "Image Tools",
  },
  {
    title: "Image Upscaler",
    description: "Enlarge images with AI-enhanced quality. Increase resolution while preserving details.",
    href: "/image-upscaler",
    icon: ImageIcon,
    category: "Image Tools",
    isNew: true,
  },
]

export default function ImageToolsPage() {
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
            <div className="p-3 rounded-lg bg-purple-500/10">
              <ImageIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">Image Tools</h1>
              <p className="text-muted-foreground">
                41 professional tools for editing, converting, and optimizing images
              </p>
            </div>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {imageTools.map((tool) => (
            <ToolCard key={tool.title} {...tool} />
          ))}
        </div>

        {/* Coming Soon */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">More image editing tools coming soon!</p>
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
