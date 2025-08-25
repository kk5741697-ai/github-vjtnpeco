import Link from "next/link"
import { Wrench } from "lucide-react"

const footerLinks = {
  "Tool Categories": [
    { name: "QR & Barcode Tools", href: "/qr-tools" },
    { name: "Text & Code Tools", href: "/text-tools" },
    { name: "Image Tools", href: "/image-tools" },
    { name: "PDF Tools", href: "/pdf-tools" },
    { name: "SEO Tools", href: "/seo-tools" },
    { name: "Converters", href: "/converters" },
    { name: "Utilities", href: "/utilities" },
  ],
  "Popular Tools": [
    { name: "QR Code Generator", href: "/qr-code-generator" },
    { name: "JSON Formatter", href: "/json-formatter" },
    { name: "Image Resizer", href: "/image-resizer" },
    { name: "PDF Merger", href: "/pdf-merger" },
    { name: "Password Generator", href: "/password-generator" },
  ],
  Company: [
    { name: "About Us", href: "/about" },
    { name: "Contact", href: "/contact" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
    { name: "API Documentation", href: "/api-docs" },
  ],
  Support: [
    { name: "Help Center", href: "/help" },
    { name: "Feature Requests", href: "/feature-requests" },
    { name: "Bug Reports", href: "/bug-reports" },
    { name: "Status Page", href: "/status" },
  ],
}

export function Footer() {
  return (
    <footer className="bg-sidebar border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Wrench className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-heading text-xl font-bold text-sidebar-foreground">WebTools Pro</span>
            </Link>
            <p className="text-sm text-muted-foreground mb-4">
              Professional online tools platform with 300+ utilities for developers, designers, and businesses.
            </p>
            <p className="text-xs text-muted-foreground">© 2024 WebTools Pro. All rights reserved.</p>
          </div>

          {/* Footer Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h3 className="font-heading font-semibold text-sidebar-foreground mb-4">{category}</h3>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-accent transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </footer>
  )
}
