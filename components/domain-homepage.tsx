'use client';

import { useState, useMemo } from 'react';
import { Search, Star, Zap, Shield, Globe, Code, Wrench, QrCode, FileText, Image, Network, Search as SearchIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface Tool {
  id: string;
  name: string;
  description: string;
  href: string;
  category: string;
  icon: React.ComponentType<any>;
  featured?: boolean;
}

interface DomainConfig {
  name: string;
  title: string;
  description: string;
  primaryColor: string;
  icon: React.ComponentType<any>;
  categories: string[];
  tools: Tool[];
}

const domainConfigs: Record<string, DomainConfig> = {
  'pixoratools.com': {
    name: 'PixoraTools',
    title: 'All-in-One Digital Tools Platform',
    description: 'Complete suite of professional tools for images, PDFs, QR codes, SEO, coding, and utilities.',
    primaryColor: 'blue',
    icon: Wrench,
    categories: ['All Tools', 'Image Tools', 'PDF Tools', 'QR Tools', 'SEO Tools', 'Code Tools', 'Utilities'],
    tools: [
      { id: 'image-compressor', name: 'Image Compressor', description: 'Reduce image file size without losing quality', href: '/image-compressor', category: 'Image Tools', icon: Image, featured: true },
      { id: 'pdf-merger', name: 'PDF Merger', description: 'Combine multiple PDF files into one', href: '/pdf-merger', category: 'PDF Tools', icon: FileText, featured: true },
      { id: 'qr-generator', name: 'QR Code Generator', description: 'Create custom QR codes with logos and colors', href: '/qr-code-generator', category: 'QR Tools', icon: QrCode, featured: true },
      { id: 'background-remover', name: 'Background Remover', description: 'Remove backgrounds from images automatically', href: '/background-remover', category: 'Image Tools', icon: Image },
      { id: 'image-converter', name: 'Image Converter', description: 'Convert between different image formats', href: '/image-converter', category: 'Image Tools', icon: Image },
      { id: 'pdf-compressor', name: 'PDF Compressor', description: 'Reduce PDF file size', href: '/pdf-compressor', category: 'PDF Tools', icon: FileText },
      { id: 'password-generator', name: 'Password Generator', description: 'Generate secure passwords', href: '/password-generator', category: 'Utilities', icon: Shield },
    ]
  },
  'pixorapdf.com': {
    name: 'PixoraPDF',
    title: 'Professional PDF Tools',
    description: 'Complete PDF toolkit for merging, splitting, compressing, and securing your documents.',
    primaryColor: 'red',
    icon: FileText,
    categories: ['All PDF Tools', 'Merge & Split', 'Compress & Optimize', 'Security', 'Convert'],
    tools: [
      { id: 'pdf-merger', name: 'Merge PDF', description: 'Combine multiple PDF files into one document', href: '/pdf-merger', category: 'Merge & Split', icon: FileText, featured: true },
      { id: 'pdf-splitter', name: 'Split PDF', description: 'Extract pages from PDF documents', href: '/pdf-splitter', category: 'Merge & Split', icon: FileText, featured: true },
      { id: 'pdf-compressor', name: 'Compress PDF', description: 'Reduce PDF file size without losing quality', href: '/pdf-compressor', category: 'Compress & Optimize', icon: FileText, featured: true },
      { id: 'pdf-password-protector', name: 'Protect PDF', description: 'Add password protection to PDF files', href: '/pdf-password-protector', category: 'Security', icon: Shield },
      { id: 'pdf-unlock', name: 'Unlock PDF', description: 'Remove password protection from PDF files', href: '/pdf-unlock', category: 'Security', icon: Shield },
      { id: 'pdf-to-image', name: 'PDF to Image', description: 'Convert PDF pages to image files', href: '/pdf-to-image', category: 'Convert', icon: Image },
      { id: 'pdf-watermark', name: 'Watermark PDF', description: 'Add text or image watermarks to PDF', href: '/pdf-watermark', category: 'Security', icon: FileText },
    ]
  },
  'pixoraimg.com': {
    name: 'PixoraIMG',
    title: 'Professional Image Tools',
    description: 'Complete image toolkit for editing, converting, compressing, and enhancing your photos.',
    primaryColor: 'green',
    icon: Image,
    categories: ['All Image Tools', 'Edit & Enhance', 'Convert & Compress', 'Effects & Filters'],
    tools: [
      { id: 'background-remover', name: 'Remove Background', description: 'Remove backgrounds from images automatically', href: '/background-remover', category: 'Edit & Enhance', icon: Image, featured: true },
      { id: 'image-compressor', name: 'Compress Images', description: 'Reduce image file size without losing quality', href: '/image-compressor', category: 'Convert & Compress', icon: Image, featured: true },
      { id: 'image-resizer', name: 'Resize Images', description: 'Change image dimensions with presets', href: '/image-resizer', category: 'Edit & Enhance', icon: Image, featured: true },
      { id: 'image-converter', name: 'Convert Images', description: 'Convert between JPG, PNG, WebP formats', href: '/image-converter', category: 'Convert & Compress', icon: Image },
      { id: 'image-cropper', name: 'Crop Images', description: 'Crop images with precision controls', href: '/image-cropper', category: 'Edit & Enhance', icon: Image },
      { id: 'image-rotator', name: 'Rotate Images', description: 'Rotate and flip images', href: '/image-rotator', category: 'Edit & Enhance', icon: Image },
      { id: 'image-watermark', name: 'Watermark Images', description: 'Add text or logo watermarks', href: '/image-watermark', category: 'Effects & Filters', icon: Image },
      { id: 'image-filters', name: 'Image Filters', description: 'Apply filters and effects to images', href: '/image-filters', category: 'Effects & Filters', icon: Image },
    ]
  },
  'pixoraqrcode.com': {
    name: 'PixoraQRCode',
    title: 'Advanced QR Code Generator',
    description: 'Create custom QR codes with logos, colors, and advanced features for any purpose.',
    primaryColor: 'purple',
    icon: QrCode,
    categories: ['All QR Tools', 'Generate', 'Scan & Read', 'Customize'],
    tools: [
      { id: 'qr-generator', name: 'QR Code Generator', description: 'Create custom QR codes with logos and colors', href: '/qr-code-generator', category: 'Generate', icon: QrCode, featured: true },
      { id: 'qr-scanner', name: 'QR Code Scanner', description: 'Scan and decode QR codes from images', href: '/qr-scanner', category: 'Scan & Read', icon: QrCode, featured: true },
    ]
  },
  'pixoranet.com': {
    name: 'PixoraNet',
    title: 'Network & Web Tools',
    description: 'Essential networking tools for developers and IT professionals.',
    primaryColor: 'cyan',
    icon: Network,
    categories: ['All Network Tools', 'Encoding', 'Analysis'],
    tools: [
      { id: 'url-encoder', name: 'URL Encoder/Decoder', description: 'Encode and decode URLs', href: '/url-encoder', category: 'Encoding', icon: Network, featured: true },
      { id: 'base64-encoder', name: 'Base64 Encoder', description: 'Encode and decode Base64 strings', href: '/base64-encoder', category: 'Encoding', icon: Code },
      { id: 'hash-generator', name: 'Hash Generator', description: 'Generate MD5, SHA1, SHA256 hashes', href: '/hash-generator', category: 'Analysis', icon: Shield },
    ]
  },
  'pixoraseo.com': {
    name: 'PixoraSEO',
    title: 'SEO & Marketing Tools',
    description: 'Comprehensive SEO tools to optimize your website and improve search rankings.',
    primaryColor: 'orange',
    icon: SearchIcon,
    categories: ['All SEO Tools', 'Meta Tags', 'Analysis'],
    tools: [
      { id: 'seo-meta-generator', name: 'Meta Tag Generator', description: 'Generate SEO meta tags for your website', href: '/seo-meta-generator', category: 'Meta Tags', icon: SearchIcon, featured: true },
    ]
  },
  'pixoracode.com': {
    name: 'PixoraCode',
    title: 'Developer Code Tools',
    description: 'Essential coding tools for developers - format, validate, and transform code.',
    primaryColor: 'indigo',
    icon: Code,
    categories: ['All Code Tools', 'Formatters', 'Converters'],
    tools: [
      { id: 'json-formatter', name: 'JSON Formatter', description: 'Format and validate JSON data', href: '/json-formatter', category: 'Formatters', icon: Code, featured: true },
      { id: 'text-case-converter', name: 'Text Case Converter', description: 'Convert text between different cases', href: '/text-case-converter', category: 'Converters', icon: Code },
    ]
  },
  'pixorautilities.com': {
    name: 'PixoraUtilities',
    title: 'Essential Utilities',
    description: 'Handy utility tools for everyday tasks and productivity.',
    primaryColor: 'gray',
    icon: Wrench,
    categories: ['All Utilities', 'Generators', 'Converters'],
    tools: [
      { id: 'password-generator', name: 'Password Generator', description: 'Generate secure passwords', href: '/password-generator', category: 'Generators', icon: Shield, featured: true },
      { id: 'text-case-converter', name: 'Text Case Converter', description: 'Convert text between different cases', href: '/text-case-converter', category: 'Converters', icon: Code },
    ]
  }
};

interface DomainHomepageProps {
  domain?: string;
}

export default function DomainHomepage({ domain = 'pixoratools.com' }: DomainHomepageProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Tools');

  const config = domainConfigs[domain.toLowerCase()] || domainConfigs['pixoratools.com'];

  const filteredTools = useMemo(() => {
    let tools = config.tools;

    // Filter by search query
    if (searchQuery) {
      tools = tools.filter(tool =>
        tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tool.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory && !selectedCategory.includes('All')) {
      tools = tools.filter(tool => tool.category === selectedCategory);
    }

    return tools;
  }, [config.tools, searchQuery, selectedCategory]);

  const featuredTools = config.tools.filter(tool => tool.featured);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Hero Section */}
      <section className="relative py-20 px-4 text-center bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <config.icon className="w-16 h-16 mr-4" />
            <h1 className="text-5xl font-bold">{config.name}</h1>
          </div>
          <h2 className="text-2xl font-light mb-6">{config.title}</h2>
          <p className="text-xl opacity-90 mb-8 max-w-2xl mx-auto">{config.description}</p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search tools..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-4 text-lg bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder-white/70 focus:bg-white/20"
              />
            </div>
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {config.categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "secondary" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={`${
                  selectedCategory === category
                    ? 'bg-white text-blue-600'
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Tools */}
      {featuredTools.length > 0 && !searchQuery && selectedCategory.includes('All') && (
        <section className="py-16 px-4">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Featured Tools</h2>
              <p className="text-gray-600">Our most popular and powerful tools</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredTools.map((tool) => (
                <Link key={tool.id} href={tool.href}>
                  <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-2 border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <tool.icon className="w-8 h-8 text-yellow-600" />
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          <Star className="w-3 h-3 mr-1" />
                          Featured
                        </Badge>
                      </div>
                      <CardTitle className="text-xl text-gray-900">{tool.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-gray-600 text-base">
                        {tool.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Tools */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {searchQuery ? `Search Results (${filteredTools.length})` : 
               selectedCategory.includes('All') ? 'All Tools' : selectedCategory}
            </h2>
            {!searchQuery && (
              <p className="text-gray-600">Professional tools for all your needs</p>
            )}
          </div>

          {filteredTools.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No tools found</h3>
              <p className="text-gray-500">Try adjusting your search or category filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTools.map((tool) => (
                <Link key={tool.id} href={tool.href}>
                  <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <tool.icon className={`w-8 h-8 text-${config.primaryColor}-600`} />
                        <Badge variant="outline" className="text-xs">
                          {tool.category}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg text-gray-900">{tool.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <CardDescription className="text-gray-600">
                        {tool.description}
                      </CardDescription>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-12">Why Choose {config.name}?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
              <Zap className="w-12 h-12 text-blue-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
              <p className="text-gray-600">Process your files instantly with our optimized tools</p>
            </div>
            <div className="flex flex-col items-center">
              <Shield className="w-12 h-12 text-green-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">100% Secure</h3>
              <p className="text-gray-600">Your files are processed locally and never stored on our servers</p>
            </div>
            <div className="flex flex-col items-center">
              <Globe className="w-12 h-12 text-purple-600 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Always Free</h3>
              <p className="text-gray-600">All tools are completely free to use with no hidden costs</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}