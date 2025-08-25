import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Maximize, Crop, FileImage, ArrowUpDown, Edit3, Zap, ImageIcon, Download, Palette, Upload, Archive } from "lucide-react"
import Link from "next/link"


const featuredTools = [
  {
    title: "Compress IMAGE",
    description: "Compress JPG, PNG, SVG, and GIFs while saving space and maintaining quality.",
    href: "/image-compressor",
    icon: Archive,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    title: "Resize IMAGE",
    description: "Define your dimensions, by percent or pixel, and resize your JPG, PNG, SVG, and GIF images.",
    href: "/image-resizer",
    icon: Maximize,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    title: "Crop IMAGE",
    description: "Crop JPG, PNG, or GIFs with ease. Choose pixels to define your rectangle or use our visual editor.",
    href: "/image-cropper",
    icon: Crop,
    iconBg: "bg-cyan-100",
    iconColor: "text-cyan-600",
  },
  {
    title: "Convert to JPG",
    description: "Turn PNG, GIF, TIF, PSD, SVG, WEBP, HEIC, or RAW format images to JPG in bulk with ease.",
    href: "/image-converter",
    icon: FileImage,
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
  },
  {
    title: "Convert from JPG",
    description: "Turn JPG images to PNG and GIF. Choose several JPGs to create an animated GIF in seconds!",
    href: "/image-converter",
    icon: ArrowUpDown,
    iconBg: "bg-yellow-100",
    iconColor: "text-yellow-600",
  },
  {
    title: "Photo editor",
    description:
      "Spice up your pictures with text, effects, frames or stickers. Simple editing tools for your image needs.",
    href: "/image-watermark",
    icon: Edit3,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
  {
    title: "Upscale Image",
    description:
      "Enlarge your images with high resolution. Easily increase the size of your JPG and PNG images while maintaining visual quality.",
    href: "/image-resizer",
    icon: Zap,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    isNew: true,
  },
  {
    title: "Remove background",
    description:
      "Quickly remove image backgrounds with high accuracy. Instantly detect objects and cut out backgrounds with ease.",
    href: "/background-remover",
    icon: ImageIcon,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
  },
  {
    title: "Watermark IMAGE",
    description:
      "Stamp an image or text over your images in seconds. Choose from typography, transparency and position.",
    href: "/image-watermark",
    icon: Download,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
  },
  {
    title: "Meme generator",
    description:
      "Create your memes online with ease. Caption meme images or upload your pictures to make custom memes.",
    href: "/image-watermark",
    icon: Palette,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
  },
]

const categories = [
  { name: "All", active: true },
  { name: "Optimize", active: false },
  { name: "Create", active: false },
  { name: "Edit", active: false },
  { name: "Convert", active: false },
  { name: "Security", active: false },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <section className="bg-white py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-4">
            Every tool you could want to edit images in bulk
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-3xl mx-auto">
            Your online photo editor is here and forever free!
          </p>

          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map((category) => (
              <Button
                key={category.name}
                variant={category.active ? "default" : "outline"}
                className={`px-6 py-2 rounded-full ${
                  category.active
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {category.name}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {featuredTools.map((tool) => {
              const Icon = tool.icon
              return (
                <Link
                  key={tool.title}
                  href={tool.href}
                  className="block bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                >
                  {tool.isNew && <Badge className="mb-3 bg-blue-500 text-white text-xs">New!</Badge>}
                  <div className={`inline-flex p-3 rounded-lg ${tool.iconBg} mb-4`}>
                    <Icon className={`h-6 w-6 ${tool.iconColor}`} />
                  </div>
                  <h3 className="font-heading font-semibold text-gray-900 mb-2 text-left">{tool.title}</h3>
                  <p className="text-sm text-gray-600 text-left leading-relaxed">{tool.description}</p>
                </Link>
              )
            })}
          </div>
        </div>
      </section>

      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 text-center text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <Upload className="h-8 w-8" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-semibold">Cloud Hosting for Everyone</h3>
                  <p className="text-blue-100">Scale your applications with ease</p>
                </div>
              </div>
              <Button className="bg-gray-900 hover:bg-gray-800 text-white px-8">Learn More</Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-gray-200 py-6 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm text-gray-500">© PixoraTools 2025 ® - Your Online Tool Editor</p>
        </div>
      </footer>
    </div>
  )
}
