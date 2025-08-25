"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { Copy, Download, Globe, Eye } from "lucide-react"

interface MetaData {
  title: string
  description: string
  keywords: string
  author: string
  url: string
  image: string
  siteName: string
  twitterHandle: string
  locale: string
  type: string
}

export default function SEOMetaGeneratorPage() {
  const [metaData, setMetaData] = useState<MetaData>({
    title: "",
    description: "",
    keywords: "",
    author: "",
    url: "",
    image: "",
    siteName: "",
    twitterHandle: "",
    locale: "en_US",
    type: "website",
  })

  const generateMetaTags = () => {
    const tags = []

    if (metaData.title) {
      tags.push(`<title>${metaData.title}</title>`)
      tags.push(`<meta name="title" content="${metaData.title}">`)
    }
    if (metaData.description) {
      tags.push(`<meta name="description" content="${metaData.description}">`)
    }
    if (metaData.keywords) {
      tags.push(`<meta name="keywords" content="${metaData.keywords}">`)
    }
    if (metaData.author) {
      tags.push(`<meta name="author" content="${metaData.author}">`)
    }

    if (metaData.title) {
      tags.push(`<meta property="og:title" content="${metaData.title}">`)
    }
    if (metaData.description) {
      tags.push(`<meta property="og:description" content="${metaData.description}">`)
    }
    if (metaData.url) {
      tags.push(`<meta property="og:url" content="${metaData.url}">`)
    }
    if (metaData.image) {
      tags.push(`<meta property="og:image" content="${metaData.image}">`)
    }
    if (metaData.siteName) {
      tags.push(`<meta property="og:site_name" content="${metaData.siteName}">`)
    }
    tags.push(`<meta property="og:type" content="${metaData.type}">`)
    tags.push(`<meta property="og:locale" content="${metaData.locale}">`)

    tags.push(`<meta name="twitter:card" content="summary_large_image">`)
    if (metaData.title) {
      tags.push(`<meta name="twitter:title" content="${metaData.title}">`)
    }
    if (metaData.description) {
      tags.push(`<meta name="twitter:description" content="${metaData.description}">`)
    }
    if (metaData.image) {
      tags.push(`<meta name="twitter:image" content="${metaData.image}">`)
    }
    if (metaData.twitterHandle) {
      tags.push(`<meta name="twitter:site" content="@${metaData.twitterHandle}">`)
      tags.push(`<meta name="twitter:creator" content="@${metaData.twitterHandle}">`)
    }

    tags.push(`<meta name="robots" content="index, follow">`)
    tags.push(`<meta name="viewport" content="width=device-width, initial-scale=1.0">`)
    tags.push(`<meta charset="UTF-8">`)

    return tags.join("\n")
  }

  const output = generateMetaTags()

  const examples = [
    {
      name: "Blog Post",
      data: {
        title: "10 Best SEO Practices for 2024",
        description:
          "Discover the latest SEO strategies and techniques to boost your website's ranking in search engines.",
        keywords: "SEO, search engine optimization, digital marketing, website ranking",
        author: "John Smith",
        url: "https://example.com/blog/seo-practices-2024",
        image: "https://example.com/images/seo-blog-post.jpg",
        siteName: "Digital Marketing Blog",
        twitterHandle: "digitalmarketing",
        locale: "en_US",
        type: "article",
      },
    },
    {
      name: "Product Page",
      data: {
        title: "Premium Wireless Headphones - AudioTech Pro",
        description:
          "Experience crystal-clear sound with our premium wireless headphones. 30-hour battery life, noise cancellation.",
        keywords: "wireless headphones, audio, music, noise cancellation, bluetooth",
        author: "AudioTech",
        url: "https://audiotech.com/products/wireless-headphones-pro",
        image: "https://audiotech.com/images/headphones-pro.jpg",
        siteName: "AudioTech Store",
        twitterHandle: "audiotech",
        locale: "en_US",
        type: "product",
      },
    },
  ]

  const loadExample = (exampleData: MetaData) => {
    setMetaData(exampleData)
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(output)
    } catch {}
  }

  const downloadHTML = () => {
    const blob = new Blob([output], { type: "text/html" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "meta-tags.html"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Globe className="h-6 w-6 text-accent" />
          <h1 className="text-2xl font-bold">SEO Meta Generator</h1>
        </div>
        <p className="mb-8 text-muted-foreground">
          Generate optimized meta tags, Open Graph, and Twitter Card tags for better SEO and social media sharing.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="font-semibold mb-4">Meta Data Configuration</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Page Title *</Label>
                <Input
                  id="title"
                  value={metaData.title}
                  onChange={(e) => setMetaData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter page title (50-60 characters recommended)"
                  maxLength={60}
                />
                <div className="text-xs text-muted-foreground">{metaData.title.length}/60 characters</div>
              </div>
              <div>
                <Label htmlFor="description">Meta Description *</Label>
                <Textarea
                  id="description"
                  value={metaData.description}
                  onChange={(e) => setMetaData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter meta description (150-160 characters recommended)"
                  maxLength={160}
                  rows={3}
                />
                <div className="text-xs text-muted-foreground">{metaData.description.length}/160 characters</div>
              </div>
              <div>
                <Label htmlFor="keywords">Keywords</Label>
                <Input
                  id="keywords"
                  value={metaData.keywords}
                  onChange={(e) => setMetaData((prev) => ({ ...prev, keywords: e.target.value }))}
                  placeholder="keyword1, keyword2, keyword3"
                />
              </div>
              <div>
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={metaData.author}
                  onChange={(e) => setMetaData((prev) => ({ ...prev, author: e.target.value }))}
                  placeholder="Author name"
                />
              </div>
              <Separator />
              <div>
                <Label htmlFor="url">Canonical URL</Label>
                <Input
                  id="url"
                  value={metaData.url}
                  onChange={(e) => setMetaData((prev) => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com/page"
                />
              </div>
              <div>
                <Label htmlFor="image">Featured Image URL</Label>
                <Input
                  id="image"
                  value={metaData.image}
                  onChange={(e) => setMetaData((prev) => ({ ...prev, image: e.target.value }))}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  value={metaData.siteName}
                  onChange={(e) => setMetaData((prev) => ({ ...prev, siteName: e.target.value }))}
                  placeholder="Your Website Name"
                />
              </div>
              <div>
                <Label htmlFor="twitterHandle">Twitter Handle</Label>
                <Input
                  id="twitterHandle"
                  value={metaData.twitterHandle}
                  onChange={(e) =>
                    setMetaData((prev) => ({ ...prev, twitterHandle: e.target.value.replace("@", "") }))
                  }
                  placeholder="username (without @)"
                />
              </div>
              <Separator />
              <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Examples</h4>
              <div className="grid gap-2">
                {examples.map((example) => (
                  <Button
                    key={example.name}
                    variant="outline"
                    size="sm"
                    onClick={() => loadExample(example.data)}
                    className="justify-start h-auto p-3"
                  >
                    <div className="text-left">
                      <div className="font-medium">{example.name}</div>
                      <div className="text-xs text-muted-foreground">{example.data.title.substring(0, 40)}...</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <div>
            <h2 className="font-semibold mb-4">Generated Meta Tags</h2>
            <Textarea
              value={output}
              readOnly
              className="min-h-[400px] font-mono text-sm resize-none mb-4"
              placeholder="Meta tags will appear here..."
            />
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Tags
              </Button>
              <Button variant="outline" size="sm" onClick={downloadHTML}>
                <Download className="h-4 w-4 mr-2" />
                Download HTML
              </Button>
              <Button variant="outline" size="sm" onClick={() => window.open("about:blank", "_blank")}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              <div>Meta Tags: {output.split("\n").length}</div>
              <div>Title Length: {metaData.title.length}</div>
              <div>Description Length: {metaData.description.length}</div>
              <div>
                Keywords:{" "}
                {metaData.keywords
                  .split(",")
                  .filter((k) => k.trim())
                  .length}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
