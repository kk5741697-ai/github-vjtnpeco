import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ToolCard } from "@/components/tool-card"
import { FileType, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const pdfTools = [
  {
    title: "PDF Merger",
    description: "Combine multiple PDF files into one document with page selection and custom ordering.",
    href: "/pdf-merger",
    icon: FileType,
    category: "PDF Tools",
    isPremium: true,
  },
  {
    title: "PDF Splitter",
    description: "Split PDF files into separate documents by page ranges or extract specific pages.",
    href: "/pdf-splitter",
    icon: FileType,
    category: "PDF Tools",
  },
  {
    title: "PDF Compressor",
    description: "Reduce PDF file sizes while maintaining document quality and readability.",
    href: "/pdf-compressor",
    icon: FileType,
    category: "PDF Tools",
  },
  {
    title: "PDF to Image",
    description: "Convert PDF pages to high-quality images in various formats (PNG, JPEG, WebP).",
    href: "/pdf-to-image",
    icon: FileType,
    category: "PDF Tools",
  },
  {
    title: "PDF Password Protector",
    description: "Add password protection and encryption to PDF documents for security.",
    href: "/pdf-password-protector",
    icon: FileType,
    category: "PDF Tools",
  },
  {
    title: "Image to PDF",
    description: "Convert multiple images into a single PDF document with custom page layouts.",
    href: "/image-to-pdf",
    icon: FileType,
    category: "PDF Tools",
  },
]

export default function PDFToolsPage() {
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
            <div className="p-3 rounded-lg bg-red-500/10">
              <FileType className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">PDF Tools</h1>
              <p className="text-muted-foreground">
                34 professional tools for manipulating, converting, and optimizing PDFs
              </p>
            </div>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pdfTools.map((tool) => (
            <ToolCard key={tool.title} {...tool} />
          ))}
        </div>

        {/* Coming Soon */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">More PDF manipulation tools coming soon!</p>
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
