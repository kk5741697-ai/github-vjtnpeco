"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Search, Upload } from "lucide-react"
import Link from "next/link"

interface DomainTool {
  title: string
  description: string
  href: string
  icon: any
  iconBg: string
  iconColor: string
  isNew?: boolean
}

interface DomainHomepageProps {
  domain: string
  brandName: string
  primaryColor: string
  title: string
  subtitle: string
  tools: DomainTool[]
  categories?: Array<{ name: string; active?: boolean }>
}

export function DomainHomepage({ 
  domain, 
  brandName, 
  primaryColor, 
  title, 
  subtitle, 
  tools, 
  categories = [] 
}: DomainHomepageProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("All")

  const filteredTools = tools.filter(tool => 
    tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <section className="bg-white py-16 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-gray-900 mb-4">
            {title}
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            {subtitle}
          </p>

          {/* Search Section */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-4 text-lg border-2 border-gray-200 rounded-xl focus:border-blue-500 transition-colors"
              />
            </div>
            {searchQuery && (
              <p className="text-sm text-gray-500 mt-2">
                Found {filteredTools.length} tools matching "{searchQuery}"
              </p>
            )}
          </div>

          {/* Categories */}
          {categories.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 mb-12">
              {categories.map((category) => (
                <Button
                  key={category.name}
                  variant={activeCategory === category.name ? "default" : "outline"}
                  className={`px-6 py-2 rounded-full ${
                    activeCategory === category.name
                      ? "text-white"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                  style={activeCategory === category.name ? { backgroundColor: primaryColor } : {}}
                  onClick={() => setActiveCategory(category.name)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          )}

          {/* Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {filteredTools.map((tool) => {
              const Icon = tool.icon
              return (
                <Link
                  key={tool.title}
                  href={tool.href}
                  className="block bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg transition-all duration-200 cursor-pointer group"
                >
                  {tool.isNew && (
                    <Badge className="mb-3 text-white text-xs" style={{ backgroundColor: primaryColor }}>
                      New!
                    </Badge>
                  )}
                  <div className={`inline-flex p-3 rounded-lg ${tool.iconBg} mb-4`}>
                    <Icon className={`h-6 w-6 ${tool.iconColor}`} />
                  </div>
                  <h3 className="font-heading font-semibold text-gray-900 mb-2 text-left">{tool.title}</h3>
                  <p className="text-sm text-gray-600 text-left leading-relaxed">{tool.description}</p>
                </Link>
              )
            })}
          </div>

          {filteredTools.length === 0 && searchQuery && (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No tools found matching your search.</p>
              <Button 
                variant="outline" 
                onClick={() => setSearchQuery("")}
              >
                Clear Search
              </Button>
            </div>
          )}
        </div>
      </section>

      <section className="py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="rounded-lg p-8 text-center text-white" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}dd)` }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-white/20 p-3 rounded-lg">
                  <Upload className="h-8 w-8" />
                </div>
                <div className="text-left">
                  <h3 className="text-xl font-semibold">Professional Tools for Everyone</h3>
                  <p className="text-white/80">Fast, secure, and always free to use</p>
                </div>
              </div>
              <Button className="bg-gray-900 hover:bg-gray-800 text-white px-8">Learn More</Button>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-white border-t border-gray-200 py-6 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm text-gray-500">© {brandName} 2025 ® - Your Online Tool Editor</p>
        </div>
      </footer>
    </div>
  )
}