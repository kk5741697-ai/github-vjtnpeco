import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ToolCard } from "@/components/tool-card"
import { QrCode, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const qrTools = [
  {
    title: "QR Code Generator",
    description:
      "Create custom QR codes with logos, colors, and multiple formats. Perfect for marketing and business use.",
    href: "/qr-code-generator",
    icon: QrCode,
    category: "QR Tools",
    isNew: true,
  },
  {
    title: "Barcode Generator",
    description: "Generate various barcode formats including UPC, EAN, Code 128, and more for retail and inventory.",
    href: "/barcode-generator",
    icon: QrCode,
    category: "QR Tools",
  },
  {
    title: "QR Code Reader",
    description: "Decode and read QR codes from images. Upload or drag and drop QR code images to extract data.",
    href: "/qr-code-reader",
    icon: QrCode,
    category: "QR Tools",
  },
  {
    title: "Batch QR Generator",
    description: "Generate multiple QR codes at once from CSV data or text lists. Perfect for bulk operations.",
    href: "/batch-qr-generator",
    icon: QrCode,
    category: "QR Tools",
  },
  {
    title: "WiFi QR Generator",
    description: "Create QR codes for WiFi networks. Users can scan to connect automatically without typing passwords.",
    href: "/wifi-qr-generator",
    icon: QrCode,
    category: "QR Tools",
  },
  {
    title: "vCard QR Generator",
    description: "Generate QR codes for contact information. Perfect for business cards and networking events.",
    href: "/vcard-qr-generator",
    icon: QrCode,
    category: "QR Tools",
  },
]

export default function QRToolsPage() {
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
            <div className="p-3 rounded-lg bg-blue-500/10">
              <QrCode className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-heading font-bold text-foreground">QR & Barcode Tools</h1>
              <p className="text-muted-foreground">
                23 professional tools for generating and reading QR codes and barcodes
              </p>
            </div>
          </div>
        </div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {qrTools.map((tool) => (
            <ToolCard key={tool.title} {...tool} />
          ))}
        </div>

        {/* Coming Soon */}
        <div className="mt-12 text-center">
          <p className="text-muted-foreground mb-4">More QR and barcode tools coming soon!</p>
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
