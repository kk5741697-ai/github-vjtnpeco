"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Heart, Menu, X, MoreHorizontal, ChevronDown, Search } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useRouter } from "next/navigation"
import { headers } from 'next/headers';

const allTools = [
  { name: 'Background Remover', href: '/background-remover', category: 'Image Tools' },
  { name: 'Image Compressor', href: '/image-compressor', category: 'Image Tools' },
  { name: 'Image Converter', href: '/image-converter', category: 'Image Tools' },
  { name: 'Image Cropper', href: '/image-cropper', category: 'Image Tools' },
  { name: 'Image Resizer', href: '/image-resizer', category: 'Image Tools' },
  { name: 'Image Rotator', href: '/image-rotator', category: 'Image Tools' },
  { name: 'Image Watermark', href: '/image-watermark', category: 'Image Tools' },
  { name: 'Image Filters', href: '/image-filters', category: 'Image Tools' },
  { name: 'PDF Merger', href: '/pdf-merger', category: 'PDF Tools' },
  { name: 'PDF Splitter', href: '/pdf-splitter', category: 'PDF Tools' },
  { name: 'PDF Compressor', href: '/pdf-compressor', category: 'PDF Tools' },
  { name: 'PDF Password Protector', href: '/pdf-password-protector', category: 'PDF Tools' },
  { name: 'PDF Unlock', href: '/pdf-unlock', category: 'PDF Tools' },
  { name: 'PDF to Image', href: '/pdf-to-image', category: 'PDF Tools' },
  { name: 'PDF Watermark', href: '/pdf-watermark', category: 'PDF Tools' },
  { name: 'QR Code Generator', href: '/qr-code-generator', category: 'QR Tools' },
  { name: 'QR Scanner', href: '/qr-scanner', category: 'QR Tools' },
  { name: 'Password Generator', href: '/password-generator', category: 'Utilities' },
  { name: 'URL Encoder', href: '/url-encoder', category: 'Network Tools' },
  { name: 'Base64 Encoder', href: '/base64-encoder', category: 'Network Tools' },
  { name: 'Hash Generator', href: '/hash-generator', category: 'Network Tools' },
  { name: 'SEO Meta Generator', href: '/seo-meta-generator', category: 'SEO Tools' },
  { name: 'JSON Formatter', href: '/json-formatter', category: 'Code Tools' },
  { name: 'Text Case Converter', href: '/text-case-converter', category: 'Code Tools' },
];

interface DomainHeaderProps {
  domain: string
  brandName: string
  primaryColor: string
  tools: Array<{ name: string; href: string }>
  moreTools?: Array<{ name: string; href: string }>
}

export function DomainHeader({ domain, brandName, primaryColor, tools, moreTools = [] }: DomainHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchOpen, setSearchOpen] = useState(false)
  const router = useRouter()

  const filteredTools = useMemo(() => {
    if (!searchQuery) return allTools.slice(0, 8); // Show top 8 tools when no search
    
    return allTools.filter(tool =>
      tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.category.toLowerCase().includes(searchQuery.toLowerCase())
    ).slice(0, 10); // Limit to 10 results
  }, [searchQuery]);

  const handleToolSelect = (href: string) => {
    setSearchOpen(false);
    setSearchQuery('');
    router.push(href);
  };

  return (
    <header className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-gray-900">I</span>
              <Heart className="h-6 w-6 fill-current mx-1" style={{ color: primaryColor }} />
              <span className="text-2xl font-bold text-gray-900">{brandName.replace('Pixora', '').toUpperCase()}</span>
            </div>
          </Link>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <Popover open={searchOpen} onOpenChange={setSearchOpen}>
              <PopoverTrigger asChild>
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Search tools..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onFocus={() => setSearchOpen(true)}
                    className="pl-10 pr-4 bg-gray-50 border-gray-200 focus:bg-white"
                  />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandList>
                    {filteredTools.length === 0 ? (
                      <CommandEmpty>No tools found.</CommandEmpty>
                    ) : (
                      <CommandGroup>
                        {filteredTools.map((tool) => (
                          <CommandItem
                            key={tool.href}
                            onSelect={() => handleToolSelect(tool.href)}
                            className="cursor-pointer"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{tool.name}</span>
                              <span className="text-sm text-gray-500">{tool.category}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <nav className="hidden lg:flex items-center space-x-6">
            {tools.slice(0, 4).map((tool) => (
              <Link
                key={tool.name}
                href={tool.href}
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                {tool.name}
              </Link>
            ))}
            
            {moreTools.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-sm font-medium text-gray-700 hover:text-blue-600">
                    MORE TOOLS
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  {moreTools.map((tool) => (
                    <DropdownMenuItem key={tool.name} asChild>
                      <Link href={tool.href} className="w-full">
                        {tool.name}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>

          <div className="hidden lg:flex items-center space-x-3">
            <Button variant="ghost" className="text-gray-700 hover:text-blue-600">
              Login
            </Button>
            <Button className="text-white px-6" style={{ backgroundColor: primaryColor }}>
              Sign up
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/pricing">Pricing</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/billing">Billing</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/admin">Admin</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2">
            {/* Mobile Search Button */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Search className="w-5 h-5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <Command>
                  <CommandInput placeholder="Search tools..." />
                  <CommandList>
                    {filteredTools.length === 0 ? (
                      <CommandEmpty>No tools found.</CommandEmpty>
                    ) : (
                      <CommandGroup>
                        {filteredTools.map((tool) => (
                          <CommandItem
                            key={tool.href}
                            onSelect={() => handleToolSelect(tool.href)}
                            className="cursor-pointer"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{tool.name}</span>
                              <span className="text-sm text-gray-500">{tool.category}</span>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            
            <Button variant="ghost" size="sm" className="lg:hidden ml-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden px-4 py-3 border-t">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search tools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4"
            />
          </div>
        </div>

        {isMenuOpen && (
          <div className="lg:hidden border-t bg-white">
            <div className="px-4 py-4 space-y-4">
              <nav className="space-y-2">
                {tools.map((tool) => (
                  <Link
                    key={tool.name}
                    href={tool.href}
                    className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {tool.name}
                  </Link>
                ))}
                {moreTools.map((tool) => (
                  <Link
                    key={tool.name}
                    href={tool.href}
                    className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50 rounded-md transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {tool.name}
                  </Link>
                ))}
              </nav>
              <div className="flex space-x-2 pt-4 border-t">
                <Button variant="outline" size="sm" className="flex-1 bg-transparent">
                  Login
                </Button>
                <Button size="sm" className="flex-1 text-white" style={{ backgroundColor: primaryColor }}>
                  Sign up
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}